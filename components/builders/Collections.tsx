"use client";

import React, { useState } from "react";
import { IoIosArrowDropright, IoIosArrowDropleft } from "react-icons/io";
import { motion, AnimatePresence } from "framer-motion";
import { collections } from "@/constants";
import CollectionsCard from "../cards/CollectionsCard";

const Collections = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const itemsPerSlide = 4;
  const totalSlides = Math.ceil(collections.length / itemsPerSlide);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const startIndex = currentSlide * itemsPerSlide;
  const visibleCollections = collections.slice(
    startIndex,
    startIndex + itemsPerSlide
  );

  return (
    <section className="container w-full overflow-hidden">
      <div className="flex items-center justify-between gap-8">
        <h1>Remarkable collections</h1>
        <div className="flex items-center gap-3">
          <IoIosArrowDropleft
            size={35}
            color="gray"
            className="cursor-pointer"
            onClick={prevSlide}
          />
          <IoIosArrowDropright
            size={35}
            color="gray"
            className="cursor-pointer"
            onClick={nextSlide}
          />
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          className="flex items-center justify-between gap-3 mt-6"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          {visibleCollections.map((collection) => (
            <CollectionsCard key={collection.name} collection={collection} />
          ))}
        </motion.div>
      </AnimatePresence>
    </section>
  );
};

export default Collections;
