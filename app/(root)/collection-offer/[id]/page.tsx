import CollectionOfferDetails from "@/components/collection/CollectionOfferDetails";
import { getOfferById } from "@/server-scripts/actions/collection.contract.actions";
import { fetchFilteredListingsData } from "@/server-scripts/actions/handlers.actions";
import { getOwnedTokens } from "@/server-scripts/actions/nft.contract.actions";
import { Metadata } from "next";
import React from "react";

type Params = Promise<{ id: string }>;

export async function generateMetadata(props: {
  params: Params;
}): Promise<Metadata> {
  return {
    title: "View Collection Offer - Hazee",
  };
}

const page = async (props: { params: Params }) => {
  const params = await props.params;
  const id = params.id;

  const offerDetails = await getOfferById(Number(id));

  const collectionListings = await fetchFilteredListingsData({
    listingType: 0,
    collectionId: Number(id),
    minPrice: 0,
    maxPrice: 0,
    sortOrder: 0,
    offset: 0,
    limit: 10,
  });

  if (!offerDetails.data || !collectionListings.data) {
    return null;
  }

  return (
    <>
      <h1 className="font-medium mb-4 text-center">Offer details</h1>
      <CollectionOfferDetails
        offerDetails={offerDetails.data}
        collectionListings={collectionListings.data}
      />
    </>
  );
};

export default page;
