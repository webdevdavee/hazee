"use client";

import React, { useState, useEffect } from "react";
import { IoIosArrowDropright, IoIosArrowDropleft } from "react-icons/io";
import { motion, AnimatePresence } from "framer-motion";
import CollectionsCard from "../cards/CollectionsCard";
import { useNFTCollections } from "@/context/NFTCollectionProvider";

const Collections = () => {
  const { getCollections, isContractReady } = useNFTCollections();
  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 4;
  const [totalSlides, setTotalSlides] = useState(0);

  useEffect(() => {
    if (!isContractReady) return;

    const fetchCollectionDetails = async () => {
      try {
        const fetchedCollections = await getCollections(offset, limit);
        setCollections(fetchedCollections?.collections || []);
        setTotalSlides(
          Math.ceil(fetchedCollections?.totalCollectionsCount || limit / limit)
        );
      } catch (error) {
        console.error("Error fetching collection details:", error);
      }
    };

    fetchCollectionDetails();
  }, [isContractReady, limit, offset]);

  const loadNextTokens = () => {
    if (currentSlide < totalSlides) {
      setCurrentSlide((prev) => prev + 1);
      setOffset((prev) => prev + limit);
    }
  };

  const loadPreviousTokens = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
      setOffset((prev) => Math.max(0, prev - limit));
    }
  };

  const startIndex = currentSlide * limit;
  const visibleCollections = collections.slice(startIndex, startIndex + limit);

  return (
    <section className="w-full overflow-hidden">
      <div className="flex items-center justify-between gap-8">
        <h1>Remarkable collections</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={currentSlide === 0}
            onClick={loadPreviousTokens}
          >
            <IoIosArrowDropleft size={35} color="gray" />
          </button>

          <button
            type="button"
            disabled={currentSlide === totalSlides}
            onClick={loadNextTokens}
          >
            <IoIosArrowDropright size={35} color="gray" />
          </button>
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={startIndex}
          className={`${
            visibleCollections.length > 0
              ? "grid grid-cols-4"
              : "flex items-center justify-between"
          }  gap-3 mt-6`}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          {visibleCollections && visibleCollections.length > 0 ? (
            visibleCollections.map((collection) => (
              <CollectionsCard
                key={collection.collectionId}
                collection={collection}
              />
            ))
          ) : (
            <h3 className="my-16 text-center w-full">No data to show yet</h3>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
};

export default Collections;
