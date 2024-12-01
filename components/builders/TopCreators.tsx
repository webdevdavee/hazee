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
          <h1 className="m:text-2xl">Top Creators</h1>
          <Link href="/explore/creators" className="text-lg text-accent">
            See more
          </Link>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            className="grid grid-cols-4 gap-3 m:grid-cols-1 m:gap-6"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            {creators && creators.length > 0 ? (
              creators.map((creator) => (
                <CreatorsCard key={creator._id} creator={creator} />
              ))
            ) : (
              <h3 className="my-16 text-center m:text-[1rem]">
                No creators available
              </h3>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default TopCreators;
