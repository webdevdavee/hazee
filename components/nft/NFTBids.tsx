import NFTBidsTable from "./NFTBidsTable";

type Props = {
  nft: TokenInfo;
};

const NFTBids: React.FC<Props> = ({ nft }) => {
  return (
    <>
      <div className="bg-secondary h-fit bg-opacity-30 p-5 rounded-lg overflow-y-auto col-span-2 border border-secondary">
        <h2 className="font-medium text-2xl mb-5 m:text-lg">Bids</h2>
        <NFTBidsTable nft={nft} />
      </div>
    </>
  );
};

export default NFTBids;
