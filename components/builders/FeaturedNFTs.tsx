import React from "react";
import NftCard2 from "../cards/NFTCard2";

type Props = {
  listingData: {
    success: boolean;
    data?: EnrichedNFTListing[];
    error?: string;
  };
};

const FeaturedNFTs: React.FC<Props> = ({ listingData }) => {
  return (
    <section className="w-full m:mt-8">
      <div>
        <h1 className="m:text-2xl">Featured NFTs</h1>
        {listingData?.data && listingData?.data.length > 0 ? (
          <div className="w-full grid grid-cols-4 gap-3 mt-6 m:grid-cols-2 xl:grid-cols-2">
            {listingData?.data.map((listing, index) => (
              <div key={`${listing.tokenId}-${index}`}>
                <NftCard2 token={listing} />
              </div>
            ))}
          </div>
        ) : (
          <h3 className="my-16 text-center w-full m:text-[1rem]">
            No data to show yet
          </h3>
        )}
      </div>
    </section>
  );
};

export default FeaturedNFTs;
