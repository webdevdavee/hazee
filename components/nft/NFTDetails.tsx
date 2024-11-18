"use client";

import TabsForNFT from "./TabsForNFT";
import NFTInfo from "./NFTInfo";
import NFTBids from "./NFTBids";
import IPFSImage from "../ui/IPFSImage";

type Props = {
  nft: TokenInfo;
  collection: CollectionInfo | undefined;
  nftViewCount: ViewStats;
  userDetails: User | null;
  listingStatus: NFTListingStatus;
  auctionDetails: AuctionDetails | undefined;
  listingDetails: NFTListing | undefined;
};

const NFTDetails: React.FC<Props> = ({
  nft,
  collection,
  nftViewCount,
  userDetails,
  listingStatus,
  auctionDetails,
  listingDetails,
}) => {
  return (
    <div className="flex gap-8 m:flex-col m:gap-6 xl:flex-col xl:gap-4">
      <div className="w-[40%] pr-4 flex flex-col gap-10 m:w-full m:pr-0 xl:w-full xl:pr-0 xl:gap-6">
        <div className="aspect-square xl:h-fit xl:aspect-auto">
          <IPFSImage
            ipfsUrl={nft?.metadata?.image as string}
            alt="nft-image"
            width={1000}
            height={1000}
            className="w-full object-cover rounded-lg h-[530px] m:h-[350px]"
            priority
            quality={100}
          />
        </div>
        <div className="m:hidden xl:hidden">
          <TabsForNFT nft={nft} />
        </div>
      </div>
      <div className="w-[60%] flex flex-col gap-10 m:w-full xl:w-full">
        <NFTInfo
          nft={nft}
          collection={collection}
          nftViewCount={nftViewCount}
          userDetails={userDetails}
          listingStatus={listingStatus}
          auctionDetails={auctionDetails}
          listingDetails={listingDetails}
        />
        <div className="hidden m:block xl:block">
          <TabsForNFT nft={nft} />
        </div>
        <NFTBids nft={nft} />
      </div>
    </div>
  );
};

export default NFTDetails;
