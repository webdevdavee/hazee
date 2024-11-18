import NFTBidsTableHead from "./NFTBidsTableHead";
import NFTBidsTableBody from "./NFTBidsTableBody";
import { useNFTAuction } from "@/context/NFTAuctionProvider";
import React from "react";

type Props = {
  nft: TokenInfo;
};

const NFTBidsTable: React.FC<Props> = ({ nft }) => {
  const { getTokenBids, isContractReady } = useNFTAuction();

  const [bids, setBids] = React.useState<Bid[]>([]);

  React.useEffect(() => {
    const fetchTokenBids = async () => {
      const tokenBids = await getTokenBids(nft.tokenId);
      if (tokenBids) {
        // Sort bids by timestamp in descending order (recent to old)
        const sortedBids = tokenBids.sort((a, b) => b.timestamp - a.timestamp);
        setBids(sortedBids);
      }
    };

    fetchTokenBids();
  }, [isContractReady, nft.tokenId]);

  return (
    <section className="w-full overflow-x-auto mt-4 custom-scrollbar max-h-[370px] border-y border-y-secondary">
      <table className="w-full">
        <NFTBidsTableHead />
        {bids && bids.length > 0 && <NFTBidsTableBody bids={bids} />}
      </table>
      {!bids ? (
        <p className="w-full my-10 text-center">No available bids for token</p>
      ) : (
        bids &&
        bids?.length <= 0 && (
          <p className="w-full my-10 text-center">
            No available bids for token
          </p>
        )
      )}
    </section>
  );
};

export default NFTBidsTable;
