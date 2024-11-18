import React from "react";
import { IoIosArrowDown } from "react-icons/io";
import Dropdown from "../ui/Dropdown";
import useDropdown from "@/hooks/useDropdown";
import Searchbar from "../ui/Searchbar";
import { fetchFilteredListingsData } from "@/server-scripts/actions/handlers.actions";

enum ListingType {
  NONE,
  SALE,
  AUCTION,
  BOTH,
}

type Props = {
  initialListings: EnrichedNFTListing[];
  setInitialListings: React.Dispatch<
    React.SetStateAction<EnrichedNFTListing[]>
  >;
  listings: EnrichedNFTListing[] | undefined;
  setListings: React.Dispatch<
    React.SetStateAction<EnrichedNFTListing[] | undefined>
  >;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  collectionId: number;
};

const CollectionItemsFilters: React.FC<Props> = ({
  initialListings,
  setInitialListings,
  listings,
  setListings,
  setIsLoading,
  collectionId,
}) => {
  const filterDropdown = useDropdown(
    [
      {
        id: 1,
        label: "All",
        isButton: true,
        onclick: () => handleListType(ListingType.NONE),
      },
      {
        id: 2,
        label: "Buy now",
        isButton: true,
        onclick: () => handleListType(ListingType.SALE),
      },
      {
        id: 3,
        label: "Auction",
        isButton: true,
        onclick: () => handleListType(ListingType.AUCTION),
      },
    ],
    "All"
  );

  const handleListType = async (filters: ListingType) => {
    setIsLoading(true);

    try {
      const newListingData = await fetchFilteredListingsData({
        listingType: filters,
        collectionId: collectionId,
        minPrice: 0,
        maxPrice: 0,
        sortOrder: 0,
        offset: 0,
        limit: 10,
      });

      if (newListingData.success) {
        setListings(() => newListingData.data);
        setInitialListings(() => newListingData.data || []);
      } else {
        setListings([]);
      }
    } catch (error: any) {
      console.error("Failed to fetch filtered data: ", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (results: EnrichedNFTListing[]) => {
    // If search results are empty and there's no search term, restore initial data
    if (results.length === 0 && results === initialListings) {
      setListings(initialListings);
    } else {
      setListings(results);
    }
  };

  return (
    <section className="flex items-center gap-3">
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
      <Searchbar<EnrichedNFTListing>
        placeholder="Search NFTs..."
        data={listings && listings.length > 0 ? listings : initialListings}
        onSearch={handleSearch}
        searchKeys={["name"]}
      />
    </section>
  );
};

export default CollectionItemsFilters;
