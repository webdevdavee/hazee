"use client";

import { IoIosArrowDropright, IoIosArrowDropleft } from "react-icons/io";
import { motion, AnimatePresence } from "framer-motion";
import { creators } from "@/constants";
import CreatorsCard from "../cards/CreatorsCard";
import { useNFTCreators } from "@/context/NFTCreatorProvider";
import React from "react";

const TopCreators = () => {
  const { getAllCreators, getCreatorCount, isContractReady } = useNFTCreators();
  const [creators, setCreators] = React.useState<Creator[]>([]);
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [offset, setOffset] = React.useState(0);
  const limit = 4;
  const [totalSlides, setTotalSlides] = React.useState(0);

  React.useEffect(() => {
    if (!isContractReady) return;

    const fetchCreatorsDetails = async () => {
      try {
        const fetchedCreators = await getAllCreators();
        console.log(fetchedCreators);
        setCreators(fetchedCreators || []);
        const totalCreatorsCount = await getCreatorCount();
        setTotalSlides(Math.ceil(totalCreatorsCount || limit / limit));
      } catch (error) {
        console.error("Error fetching creators details:", error);
      }
    };

    fetchCreatorsDetails();
  }, [isContractReady, limit, offset]);

  const loadNextCreators = () => {
    if (currentSlide < totalSlides) {
      setCurrentSlide((prev) => prev + 1);
      setOffset((prev) => prev + limit);
    }
  };

  const loadPreviousCreators = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
      setOffset((prev) => Math.max(0, prev - limit));
    }
  };

  const startIndex = currentSlide * limit;
  const visibleCreators = creators.slice(startIndex, startIndex + limit);

  return (
    <section className="w-full overflow-hidden">
      <div className="flex items-center justify-between gap-8">
        <h1>Top creators this week by sales</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={currentSlide === 0}
            onClick={loadPreviousCreators}
          >
            <IoIosArrowDropleft size={35} color="gray" />
          </button>
          <button
            type="button"
            disabled={currentSlide === totalSlides}
            onClick={loadNextCreators}
          >
            <IoIosArrowDropright size={35} color="gray" />
          </button>
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          className="grid grid-cols-4 items-center justify-between gap-3 mt-6"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          {visibleCreators && visibleCreators.length > 0 ? (
            visibleCreators.map((creator) => (
              <CreatorsCard key={creator.creatorId} creator={creator} />
            ))
          ) : (
            <h3 className="my-16 text-center w-full">No data to show yet</h3>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
};

export default TopCreators;
