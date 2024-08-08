import Image from "next/image";
import Link from "next/link";
import React from "react";

type Props = {
  collection: Collection;
};

const CollectionMiniCard: React.FC<Props> = ({ collection }) => {
  return (
    <Link
      href="/"
      className="flex items-center gap-3 justify-between p-2 rounded-sm hover:bg-secondary"
    >
      <div>
        <Image
          src={collection.src}
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
          Floor: <span className="text-[gray]">{collection.floor}</span>
        </p>
        <p className="font-medium text-sm">
          Volume: <span className="text-[gray]">{collection.volume}</span>
        </p>
      </div>
    </Link>
  );
};

export default CollectionMiniCard;
