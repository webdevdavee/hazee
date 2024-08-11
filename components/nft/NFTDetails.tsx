"use client";

import Image from "next/image";
import TabsForNFT from "./TabsForNFT";
import NFTInfo from "./NFTInfo";
import NFTOffers from "./NFTOffers";

type Props = {
  nft: sampleNft | undefined;
};

const NFTDetails: React.FC<Props> = ({ nft }) => {
  return (
    <>
      {nft && (
        <div>
          <div className="flex gap-16">
            <div className="w-[40%] overflow-y-auto custom-scrollbar pr-4">
              <div className="aspect-square">
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
            </div>
            <NFTInfo nft={nft} />
          </div>
          <div className="w-full mt-16 grid grid-cols-3 gap-4">
            <TabsForNFT />
            <NFTOffers />
          </div>
        </div>
      )}
    </>
  );
};

export default NFTDetails;
