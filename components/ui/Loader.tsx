"use client";

import React from "react";
import { motion } from "framer-motion";

const LoadingComponent: React.FC = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#181818]">
      <motion.h1
        className="text-6xl font-bold"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      >
        <motion.span
          animate={{
            color: [
              "rgb(230, 230, 250)", // Light purple
              "rgb(173, 216, 230)", // Light blue
              "rgb(255, 255, 255)", // White
              "rgb(230, 230, 250)", // Back to light purple
            ],
          }}
          transition={{
            color: {
              repeat: Infinity,
              duration: 3,
              ease: "easeInOut",
            },
          }}
        >
          HAZEE
        </motion.span>
      </motion.h1>
    </div>
  );
};

export default LoadingComponent;
