import React from "react";
import Link from "next/link";
import Image from "next/image";
import { FaEthereum } from "react-icons/fa";
import { BsFillCollectionFill } from "react-icons/bs";
import { formatNumber, truncateAddress } from "@/libs/utils";
import Tooltip from "../ui/Tooltip";

type Props = {
  collection: CollectionInfo;
};

const CollectionCard: React.FC<Props> = ({ collection }) => {
  return (
    // <GradientBorder>
    <div className="w-full bg-secondary rounded-2xl overflow-hidden">
      <div className="relative">
        <Link href={`/collection/${collection?.collectionId}`}>
          <div className="relative h-48 m:h-36">
            <Image
              src={collection?.coverPhoto || "/default-cover.jpg"}
              layout="fill"
              objectFit="cover"
              quality={100}
              priority
              alt="collection cover"
            />
          </div>
          <div className="absolute -bottom-10 left-4 w-20 h-20 rounded-xl overflow-hidden border-4 border-secondary">
            <Image
              src={collection?.imageUrl || "/default-avatar.svg"}
              layout="fill"
              objectFit="cover"
              quality={100}
              alt="collection avatar"
            />
          </div>
        </Link>
      </div>

      <div className="p-4 pt-12">
        <div className="flex justify-between items-start mb-2">
          <div className="flex flex-col">
            <Link
              href={`/collection/${collection?.collectionId}`}
              className="font-bold text-lg mb-1 hover:underline hover:underline-offset-2"
            >
              {collection?.name || "Unnamed"}
            </Link>
            <Tooltip content={collection.creator}>
              <Link
                href={`/creator/${collection.creator}`}
                className="text-sm text-gray-400 hover:text-primary transition"
              >
                @{truncateAddress(collection?.creator)}
              </Link>
            </Tooltip>
          </div>
          {collection.isActive && (
            <span className="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded m:hidden">
              Active
            </span>
          )}
          {collection.isActive && (
            <span className="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded hidden m:block m:rounded-full m:p-1" />
          )}
        </div>

        <div className="flex justify-between items-center mt-4 text-sm">
          <div className="flex items-center">
            <FaEthereum className="mr-1 text-primary" />
            <span className="font-medium">
              {formatNumber(collection?.floorPrice as string)} ETH
            </span>
          </div>
          <div className="flex items-center">
            <BsFillCollectionFill className="mr-1 text-primary" />
            <span>
              {collection?.mintedSupply} / {collection?.maxSupply}
            </span>
          </div>
        </div>
      </div>
    </div>
    // </GradientBorder>
  );
};

export default CollectionCard;
