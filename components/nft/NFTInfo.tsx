import Link from "next/link";
import { FaRegShareFromSquare } from "react-icons/fa6";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import NFTPurchaseCard from "../cards/NFTPurchaseCard";
import useCopyToClipboard from "@/hooks/useCopyToClipboard";
import React from "react";
import { usePathname } from "next/navigation";
import { useWallet } from "@/context/WalletProvider";

type Props = {
  nft: TokenInfo;
  collection: CollectionInfo | undefined;
  nftViewCount: ViewStats;
  userDetails: User | null;
  listingStatus: NFTListingStatus;
  auctionDetails: AuctionDetails | undefined;
  listingDetails: NFTListing | undefined;
};

const NFTInfo: React.FC<Props> = ({
  nft,
  collection,
  nftViewCount,
  userDetails,
  listingStatus,
  auctionDetails,
  listingDetails,
}) => {
  const { walletAddress } = useWallet();

  const { copyToClipboard, copyStatus } = useCopyToClipboard();
  const [fullURL, setFullURL] = React.useState<string>("");
  const pathname = usePathname();

  const [tokenOwnerName, setTokenOwnerName] = React.useState("");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const protocol = window.location.protocol;
      const host = window.location.host;

      setFullURL(`${protocol}//${host}${pathname}`);
    }
  }, [pathname]);

  React.useEffect(() => {
    const getUsername = async () => {
      if (userDetails) {
        if (userDetails.walletAddress === walletAddress) {
          setTokenOwnerName("You");
        } else {
          setTokenOwnerName(userDetails.username);
        }
      }
    };

    getUsername();
  }, [nft.tokenId, walletAddress, nft.owner]);

  return (
    <section>
      {nft.status === 1 && nft.owner !== walletAddress && (
        <div className="bg-green-600 p-4 rounded-md mb-4">
          <p>
            🎉 This exclusive NFT is available for direct purchase! Don&apos;t
            miss your chance to own this unique digital collectible.
          </p>
        </div>
      )}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-5">
          <Link
            href={`/collection/${collection?.collectionId}`}
            className="w-fit font-medium text-[gray] text-lg underline underline-offset-4"
          >
            {collection?.name}
          </Link>
          <h1 className="text-5xl capitalize m:text-4xl">
            {nft.metadata?.name}
          </h1>
          <p className="font-medium">
            Owned by{" "}
            <Link
              href={`/creator/${nft.owner}`}
              className="text-abstract underline underline-offset-4"
            >
              {tokenOwnerName}
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <MdOutlineRemoveRedEye size={25} />
            <p>
              {nftViewCount?.uniqueViews}{" "}
              {nftViewCount?.uniqueViews === 1 ? "view" : "views"}
            </p>
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
        <NFTPurchaseCard
          nft={nft}
          collection={collection}
          listingStatus={listingStatus}
          auctionDetails={auctionDetails}
          listingDetails={listingDetails}
        />
      </div>
    </section>
  );
};

export default NFTInfo;
