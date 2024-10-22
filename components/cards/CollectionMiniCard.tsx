import Image from "next/image";
import Link from "next/link";
import React from "react";

type Props = {
  collection: CollectionInfo;
};

const CollectionMiniCard: React.FC<Props> = ({ collection }) => {
  return (
    <Link
      href={`/collection/${collection.collectionId}`}
      className="flex items-center gap-3 justify-between p-2 rounded-sm hover:bg-secondary"
    >
      <div>
        <Image
          src={collection.imageUrl as string}
          width={70}
          height={90}
          quality={100}
          priority
          alt="collection"
          className="object-cover rounded-sm h-16"
        />
      </div>
      <div className="flex flex-col">
        <p className="font-medium text-sm">{collection.name}</p>
        <p className="font-medium text-sm">
          Floor: <span className="text-[gray]">{collection.floorPrice}</span>
        </p>
        <p className="font-medium text-sm">
          Minted Supply:{" "}
          <span className="text-[gray]">{collection.mintedSupply}</span>
        </p>
      </div>
    </Link>
  );
};

export default CollectionMiniCard;
