import Link from "next/link";
import { FaRegShareFromSquare } from "react-icons/fa6";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import NFTPurchaseCard from "../cards/NFTPurchaseCard";
import useCopyToClipboard from "@/hooks/useCopyToClipboard";
import React from "react";
import { usePathname } from "next/navigation";
import { collections } from "@/constants";

type Props = {
  nft: sampleNft;
};

const NFTInfo: React.FC<Props> = ({ nft }) => {
  const { copyToClipboard, copyStatus } = useCopyToClipboard();
  const [fullURL, setFullURL] = React.useState<string>("");
  const pathname = usePathname();
  const [collection, setCollection] = React.useState<Collection>();

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const protocol = window.location.protocol;
      const host = window.location.host;

      setFullURL(`${protocol}//${host}${pathname}`);
    }
  }, [pathname]);

  React.useEffect(() => {
    const getNFTCollection = () => {
      const collection = collections.find(
        (collection) => collection.name === nft.collection
      );
      setCollection(collection);
    };
    getNFTCollection();
  }, [nft.collection]);

  return (
    <section className="w-[60%]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-5">
          <Link
            href={`/collection/${collection?.id}`}
            className="w-fit font-medium text-[gray] text-lg underline underline-offset-4"
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
          <button
            type="button"
            className="flex items-center gap-2"
            onClick={() => copyToClipboard(fullURL)}
          >
            <FaRegShareFromSquare size={25} />
            <p>{copyStatus === "copied" ? "Copied" : "Share"}</p>
          </button>
        </div>
        <NFTPurchaseCard nft={nft} />
      </div>
    </section>
  );
};

export default NFTInfo;
