import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

type Props = {
  collection: Collection;
};

const CollectionsCard: React.FC<Props> = ({ collection }) => {
  return (
    <motion.div
      whileHover={{ y: -10 }}
      initial={{ y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full rounded-2xl overflow-hidden"
    >
      <Link href={`collection/${collection.id}`} className="block">
        <section className="bg-secondary p-1 relative">
          <div className="relative rounded-xl overflow-hidden">
            <div className="grid grid-cols-2 gap-2">
              {collection.src.map((src) => (
                <div key={src} className="w-full aspect-square relative">
                  <Image
                    src={src}
                    fill
                    quality={100}
                    priority
                    alt="collection"
                    className="object-cover rounded-md"
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 bg-secondary p-3">
              <div className="flex flex-col justify-between gap-1">
                <div className="flex flex-col">
                  <p className="text-sm text-gray-400">@Hazee</p>
                  <p className="font-medium">{collection.name}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-gray-400 font-medium">
                    Floor:{" "}
                    <span className="text-white">{collection.floor}</span>
                  </p>
                  <p className="text-gray-400 font-medium">
                    Volume:{" "}
                    <span className="text-white">{collection.volume}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Link>
    </motion.div>
  );
};

export default CollectionsCard;
