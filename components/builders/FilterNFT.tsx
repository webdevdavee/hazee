import useDropdown from "@/hooks/useDropdown";
import Dropdown from "../ui/Dropdown";
import { categories } from "@/constants";
import React, { useRef } from "react";
import PriceRangeDialog from "../ui/PriceRangeDialog";
import useClickOutside from "@/hooks/useClickOutside";
import { collections } from "@/constants";
import CollectionMiniCard from "../cards/CollectionMiniCard";

const FilterNFT = () => {
  const saleFormatDropdown = useDropdown(
    [
      { id: 1, label: "All", isButton: true },
      { id: 2, label: "Buy now", isButton: true },
      { id: 3, label: "Auction", isButton: true },
    ],
    "Choose format"
  );
  const priceRangeRef = useRef<HTMLDivElement>(null);
  const collectionRef = useRef<HTMLDivElement>(null);

  const categoryDropdown = useDropdown(
    categories.map((category) => {
      return { ...category, isButton: true };
    }),
    "Choose category"
  );

  const [isCollectionDialogOpen, setIsCollectionDialogOpen] =
    React.useState(false);
  const toggleCollectionDialog = () => {
    setIsCollectionDialogOpen((prev) => !prev);
  };

  const [isPriceDialogOpen, setIsPriceDialogOpen] = React.useState(false);
  const togglePriceDialog = () => {
    setIsPriceDialogOpen((prev) => !prev);
  };

  useClickOutside(priceRangeRef, () => {
    setIsPriceDialogOpen(false);
  });

  useClickOutside(collectionRef, () => {
    setIsCollectionDialogOpen(false);
  });

  return (
    <section className="mt-6 w-full bg-secondary rounded-full">
      <div className="flex items-center justify-between">
        <div
          onMouseOver={saleFormatDropdown.toggle}
          onMouseOut={saleFormatDropdown.toggle}
        >
          <button
            type="button"
            className="flex flex-col py-4 px-10 group hover:transition hover:bg-secondaryhover hover:rounded-full "
          >
            <p>Sale format</p>
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
        <span className="w-[0.05rem] h-[40px] border border-zinc-600" />
        <div ref={priceRangeRef}>
          <button
            type="button"
            className="flex flex-col py-4 px-10 group hover:transition hover:bg-secondaryhover hover:rounded-full"
            onClick={togglePriceDialog}
          >
            <p>Price</p>
            <p className="text-gray-400 text-sm group-hover:text-white group-hover:transition">
              Select price range
            </p>
          </button>
          <PriceRangeDialog
            isOpen={isPriceDialogOpen}
            setIsOpen={setIsPriceDialogOpen}
          />
        </div>
        <span className="w-[0.05rem] h-[40px] border border-zinc-600" />
        <div ref={collectionRef}>
          <button
            type="button"
            className="flex flex-col py-4 px-10 group hover:transition hover:bg-secondaryhover hover:rounded-full"
            onClick={toggleCollectionDialog}
          >
            <p>Collection</p>
            <p className="text-gray-400 text-sm group-hover:text-white group-hover:transition">
              Choose collection
            </p>
          </button>
          <div className="absolute">
            <div
              className={`relative flex flex-col gap-4 h-60 overflow-y-auto custom-scrollbar p-1 rounded-md bg-base border border-secondary shadow-md z-[45] ${
                isCollectionDialogOpen ? "block" : "hidden"
              } mt-2`}
            >
              {collections.map((collection) => (
                <CollectionMiniCard
                  key={collection.name}
                  collection={collection}
                />
              ))}
            </div>
          </div>
        </div>
        <span className="w-[0.05rem] h-[40px] border border-zinc-600" />
        <div
          onMouseOver={categoryDropdown.toggle}
          onMouseOut={categoryDropdown.toggle}
        >
          <button
            type="button"
            className="flex flex-col py-4 px-10 group hover:transition hover:bg-secondaryhover hover:rounded-full "
          >
            <p>Category</p>
            <p className="text-gray-400 text-sm group-hover:text-white group-hover:transition">
              {categoryDropdown.selectedItem}
            </p>
          </button>
          <Dropdown
            items={categoryDropdown.items}
            isOpen={categoryDropdown.isOpen}
            selectItem={categoryDropdown.selectItem}
          />
        </div>
      </div>
    </section>
  );
};

export default FilterNFT;
