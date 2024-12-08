import CollectionDetails from "@/components/collection/CollectionDetails";
import { capitalizeFirstCharacter } from "@/libs/utils";
import {
  getCollectionDetails,
  getCollectionOffers,
} from "@/server-scripts/actions/collection.contract.actions";
import { fetchFilteredListingsData } from "@/server-scripts/actions/handlers.actions";
import { getUserByWalletAddress } from "@/server-scripts/database/actions/user.action";
import { Metadata } from "next";

type Params = Promise<{ id: string }>;

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

export async function generateMetadata(props: {
  params: Params;
}): Promise<Metadata> {
  const params = await props.params;
  const id = params.id;

  const collection = await getCollectionDetails(Number(id));

  let collectionData: CollectionInfo;

  if (collection.data) {
    collectionData = collection.data;
    return {
      title: `${capitalizeFirstCharacter(
        collectionData.name || "Null"
      )} - Hazee`,
    };
  } else {
    return {
      title: "Error Fetching Collection Data - Hazee",
    };
  }
}

const Page = async (props: { params: Params }) => {
  const params = await props.params;
  const id = params.id;

  const collection = await getCollectionDetails(Number(id));

  const collectionListings = await fetchFilteredListingsData({
    listingType: ListingType.NONE,
    collectionId: Number(id),
    minPrice: 0,
    maxPrice: 0,
    sortOrder: SortOrder.NONE,
    offset: 0,
    limit: 40,
  });

  const collectionOffers = await getCollectionOffers(Number(id));

  if (!collection.data) {
    return null;
  }

  const collectionData = collection.data;
  const creator = await getUserByWalletAddress(collectionData.creator);

  return (
    <>
      <CollectionDetails
        collection={collectionData}
        creator={creator}
        collectionListings={collectionListings.data}
        collectionId={Number(id)}
        collectionOffers={collectionOffers.data}
      />
    </>
  );
};

export default Page;
