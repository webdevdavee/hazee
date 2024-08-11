"use client";

import Image from "next/image";
import React from "react";
import CollectionInfo from "./CollectionInfo";
import CollectionCTA from "./CollectionCTA";
import CollectionItemsTabs from "./CollectionItemsTabs";

type Props = {
  collection: Collection | undefined;
};

const CollectionDetails: React.FC<Props> = ({ collection }) => {
  return (
    <section>
      <div>
        <div className="flex items-center justify-center rounded-xl overflow-hidden h-80">
          <Image
            src={collection?.src[1] as string}
            width={1000}
            height={1000}
            quality={100}
            alt={collection?.name as string}
            className="w-full object-cover"
          />
        </div>
        <div className="w-fit rounded-full overflow-hidden -mt-20 ml-6">
          <Image
            src={collection?.src[0] as string}
            width={150}
            height={150}
            quality={100}
            alt={collection?.name as string}
            className="object-cover h-[9.5rem]"
          />
        </div>
      </div>
      <CollectionInfo collection={collection} />
      <CollectionCTA />
      <CollectionItemsTabs />
    </section>
  );
};

export default CollectionDetails;
