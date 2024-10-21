"use client";

import Button from "../ui/Button";
import NftCard from "../cards/NftCard";
import React from "react";
import { useWallet } from "@/context/WalletProvider";
import { useNFTMarketplace } from "@/context/NFTMarketplaceProvider";

const Auctions = () => {
  const { walletAddress } = useWallet();
  const { getActiveListings, listings, isContractReady } = useNFTMarketplace();

  const [offset, setOffset] = React.useState(0);
  const [limit] = React.useState(4);

  React.useEffect(() => {
    if (isContractReady && walletAddress) {
      const fetchTokens = async () => {
        await getActiveListings(offset, limit);
      };
      fetchTokens();
    }
  }, [walletAddress, isContractReady, limit, offset]);

  const loadMoreTokens = () => {
    setOffset((prev) => prev + limit);
  };

  return (
    <section className="w-full">
      <div>
        <div className="flex items-center gap-8">
          <h1>Auctions</h1>
        </div>
        {listings && listings.length > 0 ? (
          listings.map(
            (listing, index) =>
              listing.saleType === 2 ||
              (listing.saleType === 3 && (
                <div className="w-full grid grid-cols-4 justify-center gap-6 mt-6">
                  <NftCard
                    key={`${listing.listingId}-${index}`}
                    type="list"
                    token={listing}
                  />
                </div>
              ))
          )
        ) : (
          <h3 className="my-16 text-center w-full">No data to show yet</h3>
        )}
        <div className="w-full flex items-center justify-center mt-8">
          <Button
            text="Fetch next"
            style="border border-secondary rounded-full hover:bg-secondary hover:transition"
            onclick={loadMoreTokens}
          />
        </div>
      </div>
    </section>
  );
};

export default Auctions;
