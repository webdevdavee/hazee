"use client";

import { IoIosArrowDropright, IoIosArrowDropleft } from "react-icons/io";
import { motion, AnimatePresence } from "framer-motion";
import CreatorsCard from "../cards/CreatorsCard";
import React from "react";
import { getUsers } from "@/database/actions/user.action";

const TopCreators = () => {
  const [creators, setCreators] = React.useState<User[]>([]);
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [offset, setOffset] = React.useState(0);
  const limit = 4;
  const [totalSlides, setTotalSlides] = React.useState(0);

  React.useEffect(() => {
    const fetchCreators = async () => {
      try {
        const fetchedCreators = await getUsers(offset, limit);
        setCreators(fetchedCreators.users || []);
        setTotalSlides(Math.ceil(fetchedCreators.totalPages || limit / limit));
      } catch (error) {
        console.error("Error fetching creators details:", error);
      }
    };

    fetchCreators();
  }, [limit, offset]);

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
          className={`${
            visibleCreators.length > 0
              ? "grid grid-cols-4"
              : "flex items-center justify-between"
          }  gap-3 mt-6`}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          {visibleCreators && visibleCreators.length > 0 ? (
            visibleCreators.map((creator) => (
              <CreatorsCard key={creator._id} creator={creator} />
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
