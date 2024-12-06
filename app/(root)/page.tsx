import FeaturedNFTs from "@/components/builders/FeaturedNFTs";
import Collections from "@/components/collection/Collections";
import Hero from "@/components/builders/Hero";
import Marquee from "@/components/builders/Marquee";
import Newsletter from "@/components/builders/Newsletter";
import TopCreators from "@/components/builders/TopCreators";
import { fetchFilteredListingsData } from "@/server-scripts/actions/handlers.actions";
import { getCollections } from "@/server-scripts/actions/collection.contract.actions";
import { getUsers } from "@/server-scripts/database/actions/user.action";
import PopupReminder from "@/components/builders/PopupReminder";

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
    limit: 8,
  });

  const collectionsData = await getCollections(0, 4);

  // Extract only the necessary data for the client component
  const { collections = [], totalCollectionsCount = 0 } =
    collectionsData.data || {};

  const creatorsData = await getUsers(0, 4);
  const { users = [], totalPages = 0 } = creatorsData || {};

  return (
    <section className="flex flex-col gap-6">
      <PopupReminder
        delayMs={3000} // customize delay
        persistKey="nft_reminder_shown"
      />
      <Hero />
      <Marquee />
      <div className="flex flex-col gap-16 mt-6">
        <FeaturedNFTs listingData={listingData.data} />
        <Collections
          initialCollections={collections}
          totalCollectionsCount={totalCollectionsCount}
        />
        <TopCreators creators={users} />
      </div>
      <div className="mt-12">
        <Newsletter />
      </div>
    </section>
  );
};

export default page;
