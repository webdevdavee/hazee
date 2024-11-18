import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { formatNumber, truncateAddress } from "@/libs/utils";

type Props = {
  collection: CollectionInfo;
};

const CollectionsCard: React.FC<Props> = ({ collection }) => {
  return (
    <motion.div
      whileHover={{ y: -10 }}
      initial={{ y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full rounded-2xl overflow-hidden"
    >
      <div>
        <section className="bg-secondary p-1 relative">
          <div className="relative rounded-xl overflow-hidden">
            <Link href={`/collection/${collection?.collectionId}`}>
              <Image
                src={collection?.imageUrl || "/default-avatar.svg"}
                width={300}
                height={300}
                quality={100}
                priority
                alt="collection"
                className="w-full object-cover h-[286px] rounded-md"
              />
            </Link>

            <div className="flex flex-col gap-3 bg-secondary p-3">
              <div className="flex flex-col justify-between gap-1">
                <div className="flex flex-col">
                  <div className="text-sm mb-2">
                    Created by{" "}
                    <Link
                      href={`/creator/${collection.creator}`}
                      className="text-gray-400 transition hover:transition hover:underline hover:underline-offset-2"
                    >
                      @{truncateAddress(collection?.creator)}
                    </Link>
                  </div>
                  <p className="font-medium text-lg">
                    {collection?.name || "Unmamed"}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-gray-400 font-medium">
                    Floor:{" "}
                    <span className="text-white">
                      {formatNumber(collection?.floorPrice as string)} ETH
                    </span>
                  </p>
                  <p className="text-gray-400 font-medium">
                    Max supply:{" "}
                    <span className="text-white">{collection?.maxSupply}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
};

export default CollectionsCard;
