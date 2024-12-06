"use client";

import { motion, AnimatePresence } from "framer-motion";
import CreatorsCard from "../cards/CreatorsCard";
import React from "react";
import Link from "next/link";

type Props = {
  creators: User[];
};

const TopCreators = ({ creators }: Props) => {
  return (
    <section className="w-full text-white overflow-hidden">
      <div className="bg-base rounded-lg">
        <div className="flex items-center justify-between w-full mb-6">
          <h2 className="m:text-lg">Top creators</h2>
          <Link
            href="/explore/creators"
            className="text-lg text-accent m:text-sm"
          >
            See more
          </Link>
        </div>
        <AnimatePresence mode="wait">
          {creators && creators.length > 0 ? (
            <motion.div
              className={
                creators && creators.length > 0
                  ? "grid grid-cols-4 gap-3 m:grid-cols-2 m:gap-4"
                  : "w-full"
              }
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              {creators.map((creator) => (
                <CreatorsCard key={creator._id} creator={creator} />
              ))}
            </motion.div>
          ) : (
            <h4 className="w-full my-16 text-center m:text-sm">
              No creators available
            </h4>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default TopCreators;
