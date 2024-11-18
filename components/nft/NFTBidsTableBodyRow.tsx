import { useEthConverter } from "@/hooks/useEthConverter";
import { formatTimestampWithTimeAMPM, truncateAddress } from "@/libs/utils";
import Link from "next/link";
import React from "react";

type Props = { bid: Bid };

const NFTBidsTableBodyRow: React.FC<Props> = ({ bid }) => {
  const { usdAmount, isLoading, error } = useEthConverter(bid.amount);

  return (
    <tr>
      <td className="text-sm p-3">{bid.amount} ETH</td>
      <td>
        {isLoading
          ? "Converting..."
          : error
          ? "USD amount unavailable"
          : `$${usdAmount}`}
      </td>
      <td className="text-sm p-3">
        {formatTimestampWithTimeAMPM(bid.timestamp)}
      </td>
      <td>
        <Link
          href={`/creator/${bid.bidder}`}
          className="text-sm p-3 pl-0 text-accent underline underline-offset-auto"
        >
          {truncateAddress(bid.bidder)}
        </Link>
      </td>
    </tr>
  );
};

export default NFTBidsTableBodyRow;
