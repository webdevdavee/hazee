"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { truncateAddress } from "@/libs/utils";
import IPFSImage from "../ui/IPFSImage";
import AuctionTimer2 from "../builders/AuctionTimer2";
import { useAuctionTimer } from "@/hooks/useAuctionTimer";

interface NFTStatus {
  isOnAuction: boolean;
  auctionDetails?: AuctionDetails;
  isListed: boolean;
  isOwner: boolean;
}

interface Props {
  status: number;
  token: TokenInfo;
  nftStatus?: NFTStatus;
}

const NftCard: React.FC<Props> = ({ status, token, nftStatus }) => {
  const { isEnded } = useAuctionTimer(nftStatus?.auctionDetails?.endTime);
  const pathname = usePathname();

  const isAuction = status === 2 || status === 3;
  const isSale = status === 1 || status === 3;

  return (
    <motion.div
      className="group relative overflow-hidden rounded-2xl bg-secondary p-1 transition-all duration-300 hover:bg-secondaryhover"
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
            ipfsUrl={token.metadata?.image as string}
            alt={token.metadata?.name || `NFT #${token.tokenId}`}
            width={1000}
            height={1000}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            priority
            quality={100}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-base/60 via-transparent to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-80" />
        </Link>

        {pathname.startsWith("/creator/") && (
          <div className="absolute top-4 right-4">
            {nftStatus?.isListed ? (
              <>
                <span className="bg-green-600 text-white font-medium py-1 px-3 rounded-full text-sm m:hidden">
                  Listed
                </span>
                <span className="bg-green-600 text-white font-medium py-1 px-3 rounded-full text-sm hidden m:block m:rounded-full m:p-1" />
              </>
            ) : (
              <span className="bg-abstract text-white font-medium py-1 px-3 rounded-full text-sm hidden m:block m:rounded-full m:p-1">
                Not listed
              </span>
            )}
          </div>
        )}

        <div className="absolute top-0 left-0 w-full p-4 text-white m:p-2">
          <div className="flex flex-col">
            <Link
              href={`/creator/${token.owner}`}
              className="text-sm text-accent font-medium hover:text-white transition m:text-xs"
            >
              @{truncateAddress(token.owner)}
            </Link>
            <h3 className="text-xl font-bold leading-tight m:text-sm">
              <Link href={`/nft/${token.tokenId}`} className="hover:underline">
                {token.metadata?.name || `NFT #${token.tokenId}`}
              </Link>
            </h3>
          </div>
        </div>
        {isAuction && nftStatus?.auctionDetails && (
          <AuctionTimer2 endTime={nftStatus.auctionDetails.endTime} />
        )}
      </div>

      <div className="p-4 space-y-4 bg-secondary m:p-2">
        {isAuction && nftStatus?.auctionDetails ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Current bid</p>
                <p className="text-lg font-bold text-accent m:text-sm">
                  {nftStatus.auctionDetails.highestBid ||
                    nftStatus.auctionDetails.startingPrice}{" "}
                  ETH
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">
                  {isEnded ? "Ended on" : "Ending on"}
                </p>
                <p className="text-sm font-medium text-white m:text-xs">
                  {new Date(
                    nftStatus.auctionDetails.endTime * 1000
                  ).toLocaleDateString("en-GB")}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div>
            <p className="text-xs text-gray-400">Price</p>
            <p className="text-lg font-bold text-accent m:text-sm">
              {token.price} ETH
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default NftCard;
