import Image from "next/image";
import { LuHeart } from "react-icons/lu";
import Link from "next/link";
import { BsCartPlus } from "react-icons/bs";

type Props = {
  type: string;
  nft: sampleNft;
};

const NftCard: React.FC<Props> = ({ type, nft }) => {
  return (
    <section className="relative group">
      {/* Rainbow border */}
      <div className="absolute inset-1 bg-gradient-to-r from-pink-600 to-purple-600 via-blue-600 rounded-2xl opacity-0 group-hover:opacity-100 blur transition duration-1000 group-hover:duration-200 animate-gradient-xy"></div>

      {/* Card content */}
      <div className="relative rounded-3xl overflow-hidden">
        <Link href="#" className="relative">
          <Image
            src={nft.src}
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
                  {nft.name}
                </Link>
              </div>
              <Link
                href="#"
                className="bg-abstract font-medium
                border border-base p-[0.6rem] rounded-full"
              >
                Place bid
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <p className="text-sm text-gray-400">Current bid</p>
                <p>{nft.bid}</p>
              </div>
              <div className="flex flex-col">
                <p className="text-sm text-gray-400">Ending in</p>
                <p>{nft.ends}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 bg-secondary p-3">
            <div className="flex flex-col">
              <p className="text-sm text-gray-400">@Hazee</p>
              <Link href="#" className="font-medium">
                {nft.name}
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <p className="text-sm text-gray-400">Price</p>
                <p>{nft.price}</p>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href="#"
                  className="bg-abstract font-medium
                border border-base p-[0.6rem] rounded-full"
                >
                  Buy now
                </Link>
                <BsCartPlus
                  color="white"
                  size={40}
                  className="cursor-pointer p-1"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default NftCard;
