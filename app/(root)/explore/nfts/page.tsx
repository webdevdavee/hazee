import ExploreNFts from "@/components/builders/ExploreNFts";
import { fetchFilteredListingsData } from "@/server-scripts/actions/handlers.actions";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Explore NFts - Hazee",
  };
}

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

const page = async () => {
  const listingData = await fetchFilteredListingsData({
    listingType: ListingType.NONE,
    collectionId: 0,
    minPrice: 0,
    maxPrice: 0,
    sortOrder: SortOrder.NONE,
    offset: 0,
    limit: 40,
  });

  return (
    <section>
      <ExploreNFts listingData={listingData.data} />
    </section>
  );
};

export default page;
