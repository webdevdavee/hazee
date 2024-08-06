import Image from "next/image";
import { LuHeart } from "react-icons/lu";
import Link from "next/link";
import Button from "../ui/Button";

type Props = {
  type: string;
  nft: sampleNft;
};

const NftCard: React.FC<Props> = ({ type, nft }) => {
  return (
    <Link href="#" className="relative group">
      {/* Rainbow border */}
      <div className="absolute inset-1 bg-gradient-to-r from-pink-600 to-purple-600 via-blue-600 rounded-2xl opacity-0 group-hover:opacity-100 blur transition duration-1000 group-hover:duration-200 animate-gradient-xy"></div>

      {/* Card content */}
      <div className="relative rounded-3xl overflow-hidden">
        <div className="relative">
          <Image
            src={nft.src}
            width={300}
            height={300}
            quality={100}
            priority
            alt="nft"
            className="object-cover"
          />
          <span className="bg-secondary p-2 rounded-full absolute top-5 right-5">
            <LuHeart color="white" />
          </span>
        </div>
        {type === "auction" && (
          <div className="flex flex-col gap-3 bg-secondary p-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <p className="text-sm text-gray-400">@Hazee</p>
                <p className="font-medium">{nft.name}</p>
              </div>
              <Button
                text="Place bid"
                style="bg-abstract font-medium border border-base"
              />
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
        )}
      </div>
    </Link>
  );
};

export default NftCard;
