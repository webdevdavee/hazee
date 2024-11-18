"use client";

import React from "react";
import Link from "next/link";
import IPFSImage from "../ui/IPFSImage";
import { truncateAddress } from "@/libs/utils";
import AuctionTimer2 from "../builders/AuctionTimer2";

interface Props {
  token: EnrichedNFTListing;
}

const NftCard2: React.FC<Props> = ({ token }) => {
  return (
    <section className="relative group w-full m:w-1/2 xl:w-1/2 xxl:w-1/3 xxxl:w-1/4 p-2">
      {/* Rainbow border */}
      <div className="absolute inset-1 bg-gradient-to-r from-pink-600 to-purple-600 via-blue-600 rounded-2xl opacity-0 group-hover:opacity-100 blur transition duration-1000 group-hover:duration-200 animate-gradient-xy" />

      {/* Card content */}
      <div className="relative rounded-3xl overflow-hidden m:rounded-2xl">
        <Link href={`/nft/${token.tokenId}`} className="relative">
          <IPFSImage
            ipfsUrl={token.imageUrl as string}
            alt="nft-image"
            width={300}
            height={300}
            className="w-full object-cover h-[200px] m:h-[240px] xl:h-[260px] xxl:h-[280px]"
            priority
            quality={100}
          />
        </Link>

        <div className="flex flex-col gap-2 m:gap-3 bg-secondary p-2 m:p-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <Link
                href={`/creator/${token.seller}`}
                className="text-xs m:text-sm text-gray-400 transition hover:transition hover:underline hover:underline-offset-2"
              >
                @{truncateAddress(token.seller)}
              </Link>
              <Link
                href={`/nft/${token.tokenId}`}
                className="capitalize font-medium text-sm m:text-base"
              >
                {token.name || `NFT #${token.tokenId}`}
              </Link>
            </div>
            <Link
              href={`/nft/${token.tokenId}`}
              className="bg-abstract font-medium border border-base p-1 m:p-2 rounded-full hover:bg-opacity-80 transition-colors text-xs m:text-sm"
            >
              View NFT
            </Link>
          </div>

          {token.listingType === 2 || token.listingType === 3 ? (
            <div className="flex items-center justify-between">
              <div className="flex flex-col justify-start">
                <p className="text-xs m:text-sm text-gray-400">
                  {token.ended ? "Ended" : "Ending in"}
                </p>
                <AuctionTimer2 endTime={token.endTime!} />
              </div>

              <div className="flex flex-col">
                <p className="text-xs m:text-sm text-gray-400">Current bid</p>
                <p className="text-sm m:text-base">{token.highestBid || token.startingPrice} ETH</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              <p className="text-xs m:text-sm text-gray-400">Price</p>
              <p className="text-sm m:text-base">{token.price} ETH</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default NftCard2;