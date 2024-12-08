import React from "react";
import NFTCard from "../cards/NftCard";

type Props = {
  listingData: EnrichedNFTListing[] | undefined;
};

const FeaturedNFTs: React.FC<Props> = ({ listingData }) => {
  return (
    <section className="w-full">
      <div>
        <h2 className="m:text-lg">Latest drops</h2>
        {listingData && listingData.length > 0 ? (
          <div className="w-full grid grid-cols-4 gap-3 mt-6 m:grid-cols-2 xl:grid-cols-2">
            {listingData.map((listing, index) => (
              <NFTCard key={`${listing.tokenId}-${index}`} token={listing} />
            ))}
          </div>
        ) : (
          <h4 className="my-16 text-center w-full m:text-sm">
            No data to show yet
          </h4>
        )}
      </div>
    </section>
  );
};

export default FeaturedNFTs;
