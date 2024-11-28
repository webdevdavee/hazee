import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { FaEthereum } from "react-icons/fa";
import { BsFillCollectionFill } from "react-icons/bs";
import { formatNumber, truncateAddress } from "@/libs/utils";
import Tooltip from "../ui/Tooltip";
import GradientBorder from "../ui/GradientBorder";

type Props = {
  collection: CollectionInfo;
};

const CollectionCard: React.FC<Props> = ({ collection }) => {
  return (
    <GradientBorder>
      <motion.div
        whileHover={{ y: -10 }}
        initial={{ y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full bg-secondary rounded-2xl overflow-hidden"
      >
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
            <div>
              <h3 className="font-bold text-lg mb-1">
                {collection?.name || "Unnamed"}
              </h3>
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
      </motion.div>
    </GradientBorder>
  );
};

export default CollectionCard;
