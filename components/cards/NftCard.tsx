import Image from "next/image";
import { LuHeart } from "react-icons/lu";
import Link from "next/link";
import { useNFTMarketplace } from "@/context/NFTMarketplaceProvider";
import React from "react";
import { useNFTAuction } from "@/context/NFTAuctionProvider";

type Props = {
  type: string;
  data: number;
};

const NftCard: React.FC<Props> = ({ type, data }) => {
  const { getListingDetails, isContractReady } = useNFTMarketplace();
  const [token, setToken] = React.useState<NFTListing | null>();
  const [auctionDetails, setAuctionDetails] =
    React.useState<AuctionDetails | null>(null);
  const [bidAmount, setBidAmount] = React.useState("");
  const { getAuctionDetails, placeBid, isNFTOnAuction, endAuction } =
    useNFTAuction();

  React.useEffect(() => {
    if (isContractReady) {
      const fetchtokens = async () => {
        setToken(await getListingDetails(data));
        const isOnAuction = await isNFTOnAuction(data);
        if (isOnAuction) {
          const details = await getAuctionDetails(data);
          setAuctionDetails(details);
        }
      };
      fetchtokens();
    }
  }, [isContractReady, data]);

  return (
    <section className="relative group">
      {/* Rainbow border */}
      <div className="absolute inset-1 bg-gradient-to-r from-pink-600 to-purple-600 via-blue-600 rounded-2xl opacity-0 group-hover:opacity-100 blur transition duration-1000 group-hover:duration-200 animate-gradient-xy"></div>

      {/* Card content */}
      <div className="relative rounded-3xl overflow-hidden">
        <Link href={`/nft/${token?.listingId}`} className="relative">
          <Image
            src={token?.imageUrl as string}
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
        {type === "auction" ? (
          <div className="flex flex-col gap-3 bg-secondary p-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <p className="text-sm text-gray-400">@Hazee</p>
                <Link href="#" className="font-medium">
                  {token?.name}
                </Link>
              </div>
              {token?.saleType === 2 ||
                (token?.saleType === 3 && (
                  <Link
                    href="#"
                    className="bg-abstract font-medium
                border border-base p-[0.6rem] rounded-full"
                  >
                    Place bid
                  </Link>
                ))}
            </div>
            {token?.saleType === 2 ||
              (token?.saleType === 3 && (
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <p className="text-sm text-gray-400">Current bid</p>
                    <p>{auctionDetails?.highestBid}</p>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm text-gray-400">Ending in</p>
                    <p>{auctionDetails?.endTime}</p>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3 bg-secondary p-3">
            <div className="flex flex-col">
              <p className="text-sm text-gray-400">@Hazee</p>
              <Link href="#" className="font-medium">
                {token?.name}
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <p className="text-sm text-gray-400">Price</p>
                <p>{token?.price}</p>
              </div>
              <Link
                href="#"
                className="bg-abstract font-medium
                border border-base p-[0.6rem] rounded-full"
              >
                Buy now
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default NftCard;
