import Image from "next/image";
import Link from "next/link";
import React from "react";

type Props = {
  collection: CollectionInfo;
  isLink?: boolean;
  setSearchTerm?: React.Dispatch<React.SetStateAction<string>>;
  setShowMobileMenu?: React.Dispatch<React.SetStateAction<boolean>> | undefined;
};

const CollectionMiniCard: React.FC<Props> = ({
  collection,
  isLink = true,
  setSearchTerm,
  setShowMobileMenu,
}) => {
  return isLink ? (
    <Link
      href={`/collection/${collection.collectionId}`}
      className="flex items-center gap-5 p-2 rounded-sm hover:bg-secondary"
      onClick={() => {
        setSearchTerm?.("");
        setShowMobileMenu?.(false);
      }}
    >
      <div>
        <Image
          src={collection.imageUrl as string}
          width={70}
          height={70}
          quality={100}
          priority
          alt="collection"
          className="object-cover rounded-sm h-16"
        />
      </div>
      <div className="flex flex-col items-start">
        <p className="font-medium">{collection.name}</p>
        <p className="font-medium text-sm">
          Floor: <span className="text-[gray]">{collection.floorPrice}</span>
        </p>
        <p className="font-medium text-sm">
          Minted Supply:{" "}
          <span className="text-[gray]">{collection.mintedSupply}</span>
        </p>
      </div>
    </Link>
  ) : (
    <button className="flex items-center gap-5 p-2 rounded-sm hover:bg-secondary">
      <div>
        <Image
          src={collection.imageUrl as string}
          width={70}
          height={70}
          quality={100}
          priority
          alt="collection"
          className="object-cover rounded-sm h-16"
        />
      </div>
      <div className="flex flex-col items-start">
        <p className="font-medium">{collection.name}</p>
        <p className="font-medium text-sm">
          Floor: <span className="text-[gray]">{collection.floorPrice}</span>
        </p>
        <p className="font-medium text-sm">
          Minted Supply:{" "}
          <span className="text-[gray]">{collection.mintedSupply}</span>
        </p>
      </div>
    </button>
  );
};

export default CollectionMiniCard;
