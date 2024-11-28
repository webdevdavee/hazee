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
      <div className="text-center py-2 px-4 bg-abstract bg-opacity-10 rounded-lg m:text-xs">
        <p className="text-abstract font-bold">Auction Ended</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center space-x-2">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} className="text-center">
          <motion.div
            className="w-14 h-14 bg-base rounded-lg flex items-center justify-center m:w-8 m:h-8"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-2xl font-bold text-primary m:text-[1rem]">
              {formatNumber(value)}
            </span>
          </motion.div>
          <p className="text-xs text-gray-400 mt-1">
            {unit.charAt(0).toUpperCase()}
          </p>
        </div>
      ))}
    </div>
  );
};

export default AuctionTimer2;
