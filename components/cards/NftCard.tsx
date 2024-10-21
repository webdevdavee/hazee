import Image from "next/image";
import { LuHeart } from "react-icons/lu";
import Link from "next/link";
import React from "react";
import { useNFTAuction } from "@/context/NFTAuctionProvider";
import { truncateAddress } from "@/libs/utils";

type Props = {
  type: "list" | "all";
  token: TokenInfo | NFTListing;
};

const NftCard: React.FC<Props> = ({ type, token }) => {
  const [auctionDetails, setAuctionDetails] =
    React.useState<AuctionDetails | null>(null);
  const { getAuctionDetails, isNFTOnAuction, isContractReady } =
    useNFTAuction();

  React.useEffect(() => {
    const checkAuctionStatus = async () => {
      if (!isContractReady) return;

      const status = await isNFTOnAuction(token.tokenId);
      if (status.isOnAuction) {
        const details = await getAuctionDetails(status.auctionId);
        setAuctionDetails(details);
      }
    };

    checkAuctionStatus();
  }, [isContractReady, token.tokenId, getAuctionDetails, isNFTOnAuction]);

  const renderCardContent = () => {
    if (type === "list" && "saleType" in token) {
      return (
        <div className="flex flex-col gap-3 bg-secondary p-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <p className="text-sm text-gray-400">
                @{truncateAddress(token.seller)}
              </p>
              <Link href="#" className="font-medium">
                {token.name}
              </Link>
            </div>
            {(token.saleType === 2 || token.saleType === 3) && (
              <Link
                href="#"
                className="bg-abstract font-medium border border-base p-[0.6rem] rounded-full"
              >
                Place bid
              </Link>
            )}
          </div>
          {(token.saleType === 2 || token.saleType === 3) && auctionDetails && (
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <p className="text-sm text-gray-400">Current bid</p>
                <p>{auctionDetails.highestBid}</p>
              </div>
              <div className="flex flex-col">
                <p className="text-sm text-gray-400">Ending in</p>
                <p>{auctionDetails.endTime}</p>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (type === "all" && "metadata" in token) {
      return (
        <div className="flex flex-col gap-3 bg-secondary p-3">
          <div className="flex flex-col">
            <p className="text-sm text-gray-400">
              @{truncateAddress(token.owner)}
            </p>
            <Link href="#" className="font-medium">
              {token.metadata?.name}
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <p className="text-sm text-gray-400">Price</p>
              <p>{token.price}</p>
            </div>
            <Link
              href="#"
              className="bg-abstract font-medium border border-base p-[0.6rem] rounded-full"
            >
              Buy now
            </Link>
          </div>
        </div>
      );
    }
  };

  const imageUrl = "metadata" in token ? token.metadata?.image : token.imageUrl;

  return (
    <section className="relative group">
      {/* Rainbow border */}
      <div className="absolute inset-1 bg-gradient-to-r from-pink-600 to-purple-600 via-blue-600 rounded-2xl opacity-0 group-hover:opacity-100 blur transition duration-1000 group-hover:duration-200 animate-gradient-xy" />

      <div className="relative rounded-3xl overflow-hidden">
        <Link href={`/nft/${token.tokenId}`} className="relative">
          <Image
            src={imageUrl as string}
            width={300}
            height={300}
            quality={100}
            priority
            alt="nft"
            className="w-full object-cover h-[286px]"
          />
          <span className="bg-secondary p-2 rounded-full absolute top-5 right-5">
            <LuHeart color="white" />
          </span>
        </Link>
        {renderCardContent()}
      </div>
    </section>
  );
};

export default NftCard;
