"use client";

import React from "react";
import { motion } from "framer-motion";

const ThirdLoader: React.FC = () => {
  return (
    <div className="flex items-center justify-center">
      <motion.h1
        className="text-4xl font-bold bg-gradient-to-r from-[#ff6b6b] via-[#ffd700] to-[#87ceeb] bg-clip-text text-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      >
        <motion.span
          className="bg-clip-text text-transparent bg-gradient-to-r"
          style={{
            backgroundImage:
              "linear-gradient(270deg, #ff6b6b, #ffd700, #87ceeb, #ff6b6b)",
            backgroundSize: "400% 400%",
          }}
          animate={{ backgroundPosition: ["0% 50%", "100% 50%"] }}
          transition={{
            backgroundPosition: {
              repeat: Infinity,
              duration: 8,
              ease: "linear",
            },
          }}
        >
          HAZEE
        </motion.span>
      </motion.h1>
    </div>
  );
};

export default ThirdLoader;
