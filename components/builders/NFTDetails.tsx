import Image from "next/image";
import Link from "next/link";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { IoMdHeartEmpty } from "react-icons/io";
import NFTPurchaseCard from "../cards/NFTPurchaseCard";
import { FaRegShareFromSquare } from "react-icons/fa6";

type Props = {
  nft: sampleNft | undefined;
};

const NFTDetails: React.FC<Props> = ({ nft }) => {
  return (
    <section>
      {nft && (
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
                <Link
                  href="#"
                  className="text-[gray] underline underline-offset-4"
                >
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
            <NFTPurchaseCard />
          </div>
        </div>
      )}
    </section>
  );
};

export default NFTDetails;
