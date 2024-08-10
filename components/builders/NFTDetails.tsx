import Image from "next/image";
import Link from "next/link";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { IoMdHeartEmpty } from "react-icons/io";
import NFTPurchaseCard from "../cards/NFTPurchaseCard";
import { FaRegShareFromSquare } from "react-icons/fa6";
import TabsForNFT from "./TabsForNFT";
import NFTInfo from "./NFTInfo";

type Props = {
  nft: sampleNft | undefined;
};

const NFTDetails: React.FC<Props> = ({ nft }) => {
  return (
    <section>
      {nft && (
        <div>
          <div className="flex items-center gap-16">
            <div className="w-[40%] aspect-square">
              <Image
                src={nft.src}
                width={1000}
                height={1000}
                alt={nft.name}
                quality={100}
                priority
                className="w-full object-cover rounded-lg h-[530px]"
              />
            </div>
            <NFTInfo nft={nft} />
          </div>
          <TabsForNFT />
        </div>
      )}
    </section>
  );
};

export default NFTDetails;
