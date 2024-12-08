"use client";

import useDropdown from "@/hooks/useDropdown";
import { IoIosArrowDown } from "react-icons/io";
import Dropdown from "../ui/Dropdown";
import React from "react";
import FilterNFT from "./FilterNFT";
import SecondaryLoader from "../ui/SecondaryLoader";
import { fetchFilteredListingsData } from "@/server-scripts/actions/handlers.actions";
import NFTCard from "../cards/NftCard";
import { createPublicClient, http, Block } from "viem";
import { sepolia } from "viem/chains";

enum ListingType {
  NONE,
  SALE,
  AUCTION,
  BOTH,
}

enum SortOrder {
  NONE,
  PRICE_HIGH_TO_LOW,
  PRICE_LOW_TO_HIGH,
}

interface NFTState {
  listings: EnrichedNFTListing[] | undefined;
  isLoading: boolean;
  error: string | null;
}

type NFTFilters = {
  listType: ListingType;
  collection: number;
  priceSort: SortOrder;
};

type Props = {
  listingData: EnrichedNFTListing[] | undefined;
};

const ExploreNFTs: React.FC<Props> = ({ listingData }) => {
  React.useEffect(() => {
    const test = async () => {
      const client = createPublicClient({
        chain: sepolia,
        transport: http(
          "https://eth-sepolia.g.alchemy.com/v2/vWrJTnFjaB38-OeSAH7bMYAzM0-BcafG"
        ),
      });

      const block: Block = await client.getBlock({
        blockNumber: BigInt(123456),
      });

      console.log(block);
    };
  }, []);

  const [tokenData, setTokenData] = React.useState<NFTState>({
    listings: listingData,
    isLoading: false,
    error: null,
  });

  // Track current filters
  const [currentFilters, setCurrentFilters] = React.useState<NFTFilters>({
    listType: ListingType.NONE,
    collection: 0,
    priceSort: SortOrder.NONE,
  });

  const handleFilters = async (filters: Partial<NFTFilters>) => {
    // Update only the changed filters while preserving others
    const newFilters = {
      ...currentFilters,
      ...filters,
    };

    setCurrentFilters(newFilters);
    setTokenData((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    const newListingData = await fetchFilteredListingsData({
      listingType: newFilters.listType,
      collectionId: newFilters.collection,
      minPrice: 0,
      maxPrice: 0,
      sortOrder: newFilters.priceSort,
      offset: 0,
      limit: 10,
    });

    setTokenData({
      listings: newListingData.data,
      isLoading: false,
      error: null,
    });
  };

  const filterDropdown = useDropdown(
    [
      {
        id: 2,
        label: "Price: low to high",
        isButton: true,
        onclick: () =>
          handleFilters({ priceSort: SortOrder.PRICE_LOW_TO_HIGH }),
      },
      {
        id: 3,
        label: "Price: high to low",
        isButton: true,
        onclick: () =>
          handleFilters({ priceSort: SortOrder.PRICE_HIGH_TO_LOW }),
      },
    ],
    "Price: low to high"
  );

  return (
    <section>
      <div className="flex items-center justify-between gap-8 m:flex-col m:items-start m:gap-5">
        <h1 className="m:text-2xl">Explore NFTs</h1>
        <div
          onMouseOver={filterDropdown.toggle}
          onMouseOut={filterDropdown.toggle}
        >
          <div
            tabIndex={0}
            className="flex items-center gap-3 border border-secondary text-sm py-2 px-3 rounded-full cursor-pointer"
          >
            <p>{filterDropdown.selectedItem}</p>
            <IoIosArrowDown />
          </div>
          <Dropdown
            items={filterDropdown.items}
            isOpen={filterDropdown.isOpen}
            selectItem={filterDropdown.selectItem}
          />
        </div>
      </div>
      <FilterNFT handleFilters={handleFilters} />
      <div>
        {tokenData.isLoading ? (
          <div className="my-12 flex items-center justify-center">
            <SecondaryLoader />
          </div>
        ) : tokenData.listings && tokenData.listings.length > 0 ? (
          <div className="grid grid-cols-4 justify-center gap-6 my-12 m:grid-cols-2 m:gap-4 xl:grid-cols-2 xl:gap-4">
            {tokenData.listings.map((token, index) => (
              <NFTCard key={`${token.listingId} - ${index}`} token={token} />
            ))}
          </div>
        ) : (
          <h3 className="my-16 text-center w-full m:text-sm">
            No data to show yet
          </h3>
        )}
      </div>
    </section>
  );
};

export default ExploreNFTs;
