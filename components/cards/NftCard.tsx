"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { truncateAddress } from "@/libs/utils";
import IPFSImage from "../ui/IPFSImage";
import AuctionTimer2 from "../builders/AuctionTimer2";
import { useAuctionTimer } from "@/hooks/useAuctionTimer";

// Type guard to check if the token is a TokenInfo
function isTokenInfo(
  token: TokenInfo | NFTListing | EnrichedNFTListing
): token is TokenInfo {
  return (token as TokenInfo).metadata !== undefined;
}

// Type guard to check if the token is an EnrichedNFTListing
function isEnrichedNFTListing(
  token: TokenInfo | NFTListing | EnrichedNFTListing
): token is EnrichedNFTListing {
  return (token as EnrichedNFTListing).endTime !== undefined;
}

interface NFTCardProps {
  token: TokenInfo | NFTListing | EnrichedNFTListing;
  status?: number;
  nftStatus?: {
    isListed?: boolean;
    auctionDetails?: {
      endTime: number;
      startingPrice?: string;
      highestBid?: string;
    };
  };
}

const NFTCard: React.FC<NFTCardProps> = ({ token, status, nftStatus }) => {
  const pathname = usePathname();

  // Normalize token properties
  const tokenId = isTokenInfo(token) ? token.tokenId : token.tokenId;
  const name = isTokenInfo(token)
    ? token.metadata?.name
    : "name" in token
    ? token.name
    : `NFT #${token.tokenId}`;
  const imageUrl = isTokenInfo(token) ? token.metadata?.image : token.imageUrl;
  const owner = isTokenInfo(token) ? token.owner : token.seller;
  const price = isTokenInfo(token) ? token.price : token.price;

  // Determine listing type
  const listingType =
    status ??
    (isEnrichedNFTListing(token)
      ? token.listingType
      : isTokenInfo(token)
      ? token.status
      : 1);
  const isAuction = listingType === 2 || listingType === 3;

  // Get auction details
  const auctionDetails =
    nftStatus?.auctionDetails ??
    (isEnrichedNFTListing(token) && isAuction
      ? {
          endTime: token.endTime! || 0,
          startingPrice: token.startingPrice || "0",
          highestBid: token.highestBid || "0",
        }
      : undefined);

  const { isEnded } = useAuctionTimer(auctionDetails?.endTime);

  return (
    <motion.div
      className="group relative overflow-hidden rounded-2xl bg-secondary p-1 transition-all duration-300 hover:bg-secondaryhover"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative overflow-hidden rounded-xl bg-base">
        <Link href={`/nft/${tokenId}`} className="block relative aspect-square">
          <IPFSImage
            ipfsUrl={imageUrl as string}
            alt={name || `NFT #${tokenId}`}
            width={1000}
            height={1000}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            priority
            quality={100}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-base/60 via-transparent to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-80" />
        </Link>

        {pathname?.startsWith("/creator/") &&
          nftStatus?.isListed !== undefined && (
            <div className="absolute top-4 right-4">
              {nftStatus.isListed ? (
                <>
                  <span className="bg-green-600 text-white font-medium py-1 px-3 rounded-full text-sm m:hidden">
                    Listed
                  </span>
                  <span className="bg-green-600 text-white font-medium py-1 px-3 rounded-full text-sm hidden m:block m:rounded-full m:p-1" />
                </>
              ) : (
                <>
                  <span className="bg-abstract text-white font-medium py-1 px-3 rounded-full text-sm m:hidden">
                    Not listed
                  </span>
                  <span className="bg-abstract text-white font-medium py-1 px-3 rounded-full text-sm hidden m:block m:rounded-full m:p-1" />
                </>
              )}
            </div>
          )}

        <div className="absolute top-0 left-0 w-full p-4 text-white m:p-2">
          <div className="flex items-end justify-between">
            <div className="space-y-1 m:space-y-0">
              <Link
                href={`/creator/${owner}`}
                className="text-sm text-accent hover:text-white transition m:text-xs"
              >
                @{truncateAddress(owner)}
              </Link>
              <h3 className="text-xl font-bold leading-tight m:text-sm">
                <Link href={`/nft/${tokenId}`} className="hover:underline">
                  {name || `NFT #${tokenId}`}
                </Link>
              </h3>
            </div>
          </div>
        </div>

        {isAuction && auctionDetails?.endTime && (
          <AuctionTimer2 endTime={auctionDetails.endTime} />
        )}
      </div>

      <div className="p-4 space-y-4 bg-secondary m:p-2">
        {isAuction && auctionDetails ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Current bid</p>
              <p className="text-lg font-bold text-accent m:text-xs">
                {auctionDetails.highestBid ||
                  auctionDetails.startingPrice ||
                  "0"}{" "}
                ETH
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">
                {isEnded ? "Ended on" : "Ending on"}
              </p>
              <p className="text-sm font-medium text-white m:text-xs">
                {new Date(auctionDetails.endTime * 1000).toLocaleDateString(
                  "en-GB"
                )}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Price</p>
              <p className="text-lg font-bold text-accent m:text-sm">
                {price} ETH
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default NFTCard;
