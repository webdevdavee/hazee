import useDropdown from "@/hooks/useDropdown";
import Dropdown from "../ui/Dropdown";
import React, { useRef } from "react";
import useClickOutside from "@/hooks/useClickOutside";
import CollectionMiniCard from "../cards/CollectionMiniCard";
import { NFTStatus, useNFTMarketplace } from "@/context/NFTMarketplaceProvider";
import { useNFTCollections } from "@/context/NFTCollectionProvider";

const FilterNFT = () => {
  const { setFilters, isContractReady: marketplaceContractReady } =
    useNFTMarketplace();
  const { getCollections, isContractReady } = useNFTCollections();
  const [collections, setCollections] = React.useState<CollectionInfo[]>([]);

  React.useEffect(() => {
    if (!isContractReady && !marketplaceContractReady) return;

    const fetchCollectionDetails = async () => {
      try {
        const fetchedCollections = await getCollections(0, 10);
        setCollections(fetchedCollections?.collections || []);
      } catch (error) {
        console.error("Error fetching collection details:", error);
      }
    };

    fetchCollectionDetails();
  }, [isContractReady, marketplaceContractReady]);

  const handleSaleTypeChange = (saleType: NFTStatus) => {
    setFilters({ saleType });
  };

  const saleFormatDropdown = useDropdown(
    [
      {
        id: 1,
        label: "All",
        isButton: true,
        onclick: () => handleSaleTypeChange(NFTStatus.BOTH),
      },
      {
        id: 2,
        label: "Buy now",
        isButton: true,
        onclick: () => handleSaleTypeChange(NFTStatus.SALE),
      },
      {
        id: 3,
        label: "Auction",
        isButton: true,
        onclick: () => handleSaleTypeChange(NFTStatus.AUCTION),
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
    <section className="mt-6 w-fit bg-secondary rounded-md">
      <div className="flex items-center gap-4">
        <div
          onMouseOver={saleFormatDropdown.toggle}
          onMouseOut={saleFormatDropdown.toggle}
        >
          <button
            type="button"
            className="flex flex-col py-4 px-10 group hover:transition hover:bg-secondaryhover hover:rounded-l-md"
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
        <div ref={collectionRef}>
          <button
            type="button"
            className="flex flex-col py-4 px-10 group hover:transition hover:bg-secondaryhover hover:rounded-r-md"
            onClick={toggleCollectionDialog}
          >
            <p>Collection</p>
            <p className="text-gray-400 text-sm group-hover:text-white group-hover:transition">
              Choose collection
            </p>
          </button>
          {collections && collections.length > 0 && (
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
          )}
        </div>
      </div>
    </section>
  );
};

export default FilterNFT;
