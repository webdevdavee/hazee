import React from "react";
import { useAuctionTimer } from "@/hooks/useAuctionTimer";

interface AuctionTimer2Props {
  endTime: number;
}

const AuctionTimer2: React.FC<AuctionTimer2Props> = ({ endTime }) => {
  const { timeLeft, isEnded } = useAuctionTimer(endTime);

  const formatNumber = (num: number): string => num.toString().padStart(2, "0");

  if (isEnded) {
    return <p>Auction Ended</p>;
  }

  return (
    <div className="flex flex-col justify-center">
      <div className="flex items-center gap-2">
        <div>
          <p>{formatNumber(timeLeft.days)}D</p>
        </div>
        <div>
          <p>{formatNumber(timeLeft.hours)}H</p>
        </div>
        <div>
          <p>{formatNumber(timeLeft.minutes)}M</p>
        </div>
        <div>
          <p>{formatNumber(timeLeft.seconds)}S</p>
        </div>
      </div>
    </div>
  );
};

export default AuctionTimer2;
