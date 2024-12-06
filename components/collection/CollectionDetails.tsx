"use client";

import Image from "next/image";
import React from "react";
import CollectionInfo from "./CollectionInfo";
import CollectionCTA from "./CollectionCTA";
import CollectionItemsTabs from "./CollectionItemsTabs";

type Props = {
  collection: CollectionInfo;
  creator: User | null;
  collectionListings: EnrichedNFTListing[] | undefined;
  collectionId: number;
  collectionOffers: CollectionOffer[] | undefined;
};

const CollectionDetails: React.FC<Props> = ({
  collection,
  creator,
  collectionListings,
  collectionId,
  collectionOffers,
}) => {
  return (
    <section>
      <div>
        <div className="flex items-center justify-center rounded-xl overflow-hidden h-80 object-cover m:h-40">
          {!collection.coverPhoto ? (
            <div className="w-full h-full object-cover bg-secondary" />
          ) : (
            <Image
              src={collection.coverPhoto as string}
              width={1000}
              height={1000}
              quality={100}
              alt={collection.name || "Unnamed"}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div className="w-fit rounded-full overflow-hidden -mt-20 ml-6">
          <Image
            src={collection.imageUrl as string}
            width={1000}
            height={1000}
            quality={100}
            alt={collection?.name as string}
            className="object-cover w-[9.5rem] h-[9.5rem] m:w-[8rem] m:h-[8rem]"
          />
        </div>
      </div>
      <CollectionInfo collection={collection} creator={creator} />
      <CollectionCTA
        collection={collection}
        collectionOffers={collectionOffers}
      />
      <CollectionItemsTabs
        collectionListings={collectionListings}
        collectionId={collectionId}
      />
    </section>
  );
};

export default CollectionDetails;
