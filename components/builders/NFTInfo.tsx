import Link from "next/link";
import { FaRegShareFromSquare } from "react-icons/fa6";
import { IoMdHeartEmpty } from "react-icons/io";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import NFTPurchaseCard from "../cards/NFTPurchaseCard";

type Props = {
  nft: sampleNft;
};

const NFTInfo: React.FC<Props> = ({ nft }) => {
  return (
    <div className="flex flex-col gap-4 w-[60%]">
      <div className="flex flex-col gap-5">
        <Link
          href="#"
          className="font-medium text-[gray] text-lg underline underline-offset-4"
        >
          {nft.collection}
        </Link>
        <h1 className="text-5xl">{nft.name}</h1>
        <p className="font-medium">
          Owned by{" "}
          <Link href="#" className="text-[gray] underline underline-offset-4">
            @Hazee
          </Link>
        </p>
      </div>
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <MdOutlineRemoveRedEye size={25} />
          <p>23 views</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button">
            <IoMdHeartEmpty size={25} />
          </button>
          <p>4 favourites</p>
        </div>
        <button type="button" className="flex items-center gap-2">
          <FaRegShareFromSquare size={25} />
          <p>Share</p>
        </button>
      </div>
      <NFTPurchaseCard nft={nft} />
    </div>
  );
};

export default NFTInfo;
