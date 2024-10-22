"use client";

import useDropdown from "@/hooks/useDropdown";
import { IoIosArrowDown } from "react-icons/io";
import Dropdown from "../ui/Dropdown";
import React from "react";
import FilterNFT from "./FilterNFT";
import NftCard from "../cards/NftCard";
import { useWallet } from "@/context/WalletProvider";
import { useNFTMarketplace } from "@/context/NFTMarketplaceProvider";
import { SortDirection } from "@/context/NFTMarketplaceProvider";

const ExploreNFTs = () => {
  const { walletAddress } = useWallet();
  const { getActiveListings, setFilters, filteredListings, isContractReady } =
    useNFTMarketplace();

  const [offset, setOffset] = React.useState(0);
  const [limit] = React.useState(4);

  React.useEffect(() => {
    if (isContractReady && walletAddress) {
      const fetchTokens = async () => {
        await getActiveListings(offset, limit);
      };
      fetchTokens();
    }
  }, [walletAddress, isContractReady, limit, offset]);

  const handlePriceSort = (direction: SortDirection) => {
    setFilters({ priceSort: direction });
  };

  const filterDropdown = useDropdown(
    [
      {
        id: 2,
        label: "Price: low to high",
        isButton: true,
        onclick: () => handlePriceSort(SortDirection.ASCENDING),
      },
      {
        id: 3,
        label: "Price: high to low",
        isButton: true,
        onclick: () => handlePriceSort(SortDirection.DESCENDING),
      },
    ],
    "Price: low to high"
  );

  return (
    <section>
      <div className="flex items-center justify-between gap-8">
        <h1>Explore NFTs</h1>
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
      <FilterNFT />
      <div
        className={`${
          filteredListings.length > 0
            ? "grid grid-cols-4 justify-center gap-6"
            : "flex items-center justify-center"
        } w-full mt-6`}
      >
        {filteredListings && filteredListings.length > 0 ? (
          filteredListings.map((token) => (
            <NftCard key={token.listingId} token={token} type="list" />
          ))
        ) : (
          <h3 className="my-16 text-center w-full">No data to show yet</h3>
        )}
      </div>
    </section>
  );
};

export default ExploreNFTs;
