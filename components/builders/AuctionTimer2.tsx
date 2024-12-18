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
      <div className="w-[17rem] absolute bottom-0 right-0 left-0 text-center mx-auto mb-3 p-3 bg-abstract backdrop-blur-md shadow-lg bg-opacity-40 rounded-lg m:text-xs m:w-36 xl:w-44">
        <p className="text-white font-bold">Auction Ended</p>
      </div>
    );
  }

  return (
    <div className="min-w-fit absolute bottom-0 right-0 left-0 p-3 mb-1 mx-auto">
      <div className="backdrop-blur-md bg-white/30 rounded-xl px-4 py-2 flex justify-center gap-4 shadow-lg m:gap-2 m:px-2 xl:px-2 xl:gap-2">
        {Object.entries(timeLeft).map(([unit, value]) => (
          <div key={unit} className="text-center flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <span className="font-bold flex items-center gap-1">
                <span className="text-xl m:text-xs">{formatNumber(value)}</span>
                <span className="text-sm text-gray-200 opacity-70 m:text-xs">
                  {unit.charAt(0).toUpperCase()}
                </span>
              </span>
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AuctionTimer2;
