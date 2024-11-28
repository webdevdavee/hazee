"use client";

import React from "react";
import { motion } from "framer-motion";
import { useAuctionTimer } from "@/hooks/useAuctionTimer";

interface AuctionTimer2Props {
  endTime: number;
}

const AuctionTimer2: React.FC<AuctionTimer2Props> = ({ endTime }) => {
  const { timeLeft, isEnded } = useAuctionTimer(endTime);

  const formatNumber = (num: number): string => num.toString().padStart(2, "0");

  if (isEnded) {
    return (
      <div className="absolute top-4 left-4 z-10 bg-abstract/80 text-white py-1 px-3 rounded-full text-xs font-medium">
        Auction Ended
      </div>
    );
  }

  return (
    <div className="absolute top-4 left-4 z-10 bg-base/60 backdrop-blur-sm rounded-xl p-2 shadow-lg">
      <div className="flex space-x-1.5">
        {Object.entries(timeLeft).map(([unit, value]) => (
          <motion.div
            key={unit}
            className="flex flex-col items-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-10 h-10 bg-primary/20 rounded-md flex items-center justify-center">
              <span className="text-xl font-bold text-white">
                {formatNumber(value)}
              </span>
            </div>
            <p className="text-[10px] text-white/70 mt-0.5 uppercase">
              {unit.charAt(0)}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AuctionTimer2;
