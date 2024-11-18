import NFTBidsTableBodyRow from "./NFTBidsTableBodyRow";

type Props = {
  bids: Bid[];
};

const NFTBidsTableBody: React.FC<Props> = ({ bids }) => {
  return (
    <tbody>
      {bids.map((bid, index) => (
        <NFTBidsTableBodyRow key={`${bid.bidder} - ${index}`} bid={bid} />
      ))}
    </tbody>
  );
};

export default NFTBidsTableBody;
