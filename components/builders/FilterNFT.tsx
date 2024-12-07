"use client";

import useDropdown from "@/hooks/useDropdown";
import Dropdown from "../ui/Dropdown";
import React, { useRef } from "react";
import useClickOutside from "@/hooks/useClickOutside";
import CollectionMiniCard from "../cards/CollectionMiniCard";
import { getCollections } from "@/server-scripts/actions/collection.contract.actions";

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

type NFTFilters = {
  listType: ListingType;
  collection: number;
  priceSort: SortOrder;
};

type Props = {
  handleFilters: (filters: Partial<NFTFilters>) => Promise<void>;
};

const FilterNFT: React.FC<Props> = ({ handleFilters }) => {
  const [collections, setCollections] = React.useState<CollectionInfo[]>([]);
  const [selectedcollection, setSelectedCollection] =
    React.useState<string>("Choose collection");

  React.useEffect(() => {
    const fetchCollectionDetails = async () => {
      try {
        const fetchedCollections = await getCollections(0, 10);
        if (fetchedCollections.success && fetchedCollections.data) {
          setCollections(fetchedCollections?.data.collections || []);
        }
      } catch (error) {
        console.error("Error fetching collection details:", error);
      }
    };

    fetchCollectionDetails();
  }, []);

  const handleSaleTypeChange = (listType: ListingType) => {
    handleFilters({ listType });
  };

  const saleFormatDropdown = useDropdown(
    [
      {
        id: 1,
        label: "All",
        isButton: true,
        onclick: () => handleSaleTypeChange(ListingType.NONE),
      },
      {
        id: 2,
        label: "Buy now",
        isButton: true,
        onclick: () => handleSaleTypeChange(ListingType.SALE),
      },
      {
        id: 3,
        label: "Auction",
        isButton: true,
        onclick: () => handleSaleTypeChange(ListingType.AUCTION),
      },
    ],
    "Choose format"
  );

  const collectionRef = useRef<HTMLDivElement>(null);
  const [isCollectionDialogOpen, setIsCollectionDialogOpen] =
    React.useState(false);

  const toggleCollectionDialog = () => {
    setIsCollectionDialogOpen((prev) => !prev);
  };

  useClickOutside(collectionRef, () => {
    setIsCollectionDialogOpen(false);
  });

  return (
    <section className="mt-6 w-fit bg-secondary rounded-md m:w-full">
      <div className="flex items-center gap-4 m:flex-col m:items-start m:gap-0">
        <div
          onMouseOver={saleFormatDropdown.toggle}
          onMouseOut={saleFormatDropdown.toggle}
          className="m:w-full"
        >
          <button
            type="button"
            className="flex flex-col py-4 px-10 group hover:transition hover:bg-secondaryhover hover:rounded-l-md m:p-4 m:w-full m:rounded-md"
          >
            <p className="m:text-sm">Sale format</p>
            <p className="text-gray-400 text-sm group-hover:text-white group-hover:transition">
              {saleFormatDropdown.selectedItem}
            </p>
          </button>
          <Dropdown
            items={saleFormatDropdown.items}
            isOpen={saleFormatDropdown.isOpen}
            selectItem={saleFormatDropdown.selectItem}
          />
        </div>
        <span className="w-[0.05rem] h-[40px] border border-zinc-600 m:hidden" />
        <div ref={collectionRef} className="m:w-full">
          <button
            type="button"
            className="flex flex-col py-4 px-10 group hover:transition hover:bg-secondaryhover hover:rounded-r-md m:p-4 m:w-full m:rounded-md"
            onClick={toggleCollectionDialog}
          >
            <p className="m:text-sm">Collection</p>
            <p className="text-gray-400 text-sm group-hover:text-white group-hover:transition">
              {selectedcollection}
            </p>
          </button>
          {collections && collections.length > 0 && (
            <div className="absolute">
              <div
                className={`relative flex flex-col gap-4 h-60 overflow-y-auto custom-scrollbar p-1 rounded-md bg-base border border-secondary shadow-md z-10 ${
                  isCollectionDialogOpen ? "block" : "hidden"
                } mt-2`}
              >
                {collections.map((collection) => (
                  <div
                    key={collection.collectionId}
                    onClick={() => {
                      setSelectedCollection(
                        collection.name || "Choose collection"
                      );
                      handleFilters({ collection: collection.collectionId });
                    }}
                  >
                    <CollectionMiniCard
                      collection={collection}
                      isLink={false}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FilterNFT;
