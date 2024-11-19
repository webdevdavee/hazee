import React from "react";
import Link from "next/link";
import IPFSImage from "../ui/IPFSImage";
import { truncateAddress } from "@/libs/utils";
import { usePathname } from "next/navigation";
import AuctionTimer2 from "../builders/AuctionTimer2";

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
  const pathname = usePathname();

  const isAuction = status === 2 || status === 3;
  const isSale = status === 1 || status === 3;

  return (
    <section className="relative group">
      {/* Rainbow border */}
      <div className="absolute inset-1 bg-gradient-to-r from-pink-600 to-purple-600 via-blue-600 rounded-2xl opacity-0 group-hover:opacity-100 blur transition duration-1000 group-hover:duration-200 animate-gradient-xy" />

      {/* Card content */}
      <div className="relative rounded-3xl overflow-hidden m:rounded-2xl">
        <Link href={`/nft/${token.tokenId}`} className="relative">
          <IPFSImage
            ipfsUrl={token.metadata?.image as string}
            alt="nft-image"
            width={300}
            height={300}
            className="w-full object-cover h-[286px] m:h-[180px]"
            priority
            quality={100}
          />
          <div
            className="absolute top-5 right-5 m:top-3 m:right-3"
            style={{
              display: pathname.startsWith("/creator/") ? "block" : "none",
            }}
          >
            {nftStatus?.isListed ? (
              <p className="bg-green-600 font-medium py-1 px-4 rounded-sm m:text-xs">
                Listed
              </p>
            ) : (
              <p className="bg-abstract font-medium py-1 px-4 rounded-sm m:text-xs">
                Not listed
              </p>
            )}
          </div>
        </Link>

        <div className="flex flex-col gap-3 bg-secondary p-4 sm:p-3 m:p-2 xl:p-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <Link
                href={`/creator/${token.owner}`}
                className="text-sm text-gray-400 transition hover:transition hover:underline hover:underline-offset-2 m:text-xs"
              >
                @{truncateAddress(token.owner)}
              </Link>
              <Link
                href={`/nft/${token.tokenId}`}
                className="capitalize font-medium text-lg sm:text-xs m:text-sm"
              >
                {token.metadata?.name || `NFT #${token.tokenId}`}
              </Link>
            </div>
            <Link
              href={`/nft/${token.tokenId}`}
              className="bg-abstract font-medium border border-base p-2 rounded-full hover:bg-opacity-80 transition-colors m:hidden"
            >
              View NFT
            </Link>
          </div>

          {isAuction && nftStatus?.auctionDetails ? (
            <div className="flex items-center justify-between m:flex-col m:items-start m:gap-3">
              <div className="flex flex-col justify-start">
                <p className="text-sm text-gray-400">
                  {nftStatus.auctionDetails.ended ? "Ended" : "Ending in"}
                </p>
                <AuctionTimer2 endTime={nftStatus.auctionDetails.endTime} />
              </div>

              <div className="flex flex-col">
                <p className="text-sm text-gray-400">Current bid</p>
                <p className="m:text-sm">
                  {nftStatus.auctionDetails.highestBid ||
                    nftStatus.auctionDetails.startingPrice}{" "}
                  ETH
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              <p className="text-sm text-gray-400">Price</p>
              <p className="m:text-sm">{token.price} ETH</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default NftCard;
