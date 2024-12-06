"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { truncateAddress } from "@/libs/utils";
import IPFSImage from "../ui/IPFSImage";
import AuctionTimer2 from "../builders/AuctionTimer2";
import { useAuctionTimer } from "@/hooks/useAuctionTimer";

interface Props {
  token: EnrichedNFTListing;
}

const NFTCard2: React.FC<Props> = ({ token }) => {
  const { isEnded } = useAuctionTimer(token.endTime);

  return (
    <motion.div
      className="group relative overflow-hidden rounded-2xl bg-secondarydarker p-1 transition-all duration-300 hover:bg-secondaryhover"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative overflow-hidden rounded-xl bg-base">
        <Link
          href={`/nft/${token.tokenId}`}
          className="block relative aspect-square"
        >
          <IPFSImage
            ipfsUrl={token.imageUrl as string}
            alt={token.name || `NFT #${token.tokenId}`}
            width={1000}
            height={1000}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            priority
            quality={100}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-base/60 via-transparent to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-80" />
        </Link>

        <div className="absolute top-0 left-0 w-full p-4 text-white m:p-2">
          <div className="flex items-end justify-between">
            <div className="space-y-1 m:space-y-0">
              <Link
                href={`/creator/${token.seller}`}
                className="text-sm text-accent hover:text-white transition m:text-xs"
              >
                @{truncateAddress(token.seller)}
              </Link>
              <h3 className="text-xl font-bold leading-tight m:text-sm">
                <Link
                  href={`/nft/${token.tokenId}`}
                  className="hover:underline"
                >
                  {token.name || `NFT #${token.tokenId}`}
                </Link>
              </h3>
            </div>
          </div>
        </div>
        {(token.listingType === 2 || token.listingType === 3) && (
          <AuctionTimer2 endTime={token.endTime!} />
        )}
      </div>

      <div className="p-4 space-y-4 bg-secondarydarker m:p-2">
        {token.listingType === 2 || token.listingType === 3 ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Current bid</p>
                <p className="text-lg font-bold text-accent m:text-sm">
                  {token.highestBid || token.startingPrice} ETH
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">
                  {isEnded ? "Ended on" : "Ending on"}
                </p>
                <p className="text-sm font-medium text-white m:text-xs">
                  {new Date(token.endTime! * 1000).toLocaleDateString("en-GB")}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Price</p>
              <p className="text-lg font-bold text-accent m:text-sm">
                {token.price} ETH
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default NFTCard2;
