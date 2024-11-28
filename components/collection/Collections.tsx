"use client";

import React, { useState } from "react";
import { IoIosArrowDropright, IoIosArrowDropleft } from "react-icons/io";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import CollectionsCard from "../cards/CollectionsCard";
import SecondaryLoader from "../ui/SecondaryLoader";
import { getCollections } from "@/server-scripts/actions/collection.contract.actions";

interface CollectionsResponse {
  success: boolean;
  data?: {
    collections: CollectionInfo[];
    totalCollectionsCount: number;
  };
  error?: string;
}

type Props = {
  initialCollections: CollectionInfo[];
  totalCollectionsCount: number;
};

const Collections: React.FC<Props> = ({
  initialCollections,
  totalCollectionsCount,
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const LIMIT = 4;

  // Fetch collections data
  const fetchCollections = async (page: number) => {
    const offset = page * LIMIT;
    const response = await getCollections(offset, LIMIT);
    if (!response.success) throw new Error("Failed to fetch collections");
    return response;
  };

  const {
    data: collectionsData,
    isLoading,
    isFetching,
    isPlaceholderData,
  } = useQuery<CollectionsResponse, Error>({
    queryKey: ["collections", currentPage],
    queryFn: () => fetchCollections(currentPage),
    placeholderData: () => ({
      success: true,
      data: {
        collections: initialCollections,
        totalCollectionsCount: totalCollectionsCount,
      },
    }),
    staleTime: 30 * 60 * 1000,
  });

  const totalPages = Math.ceil((totalCollectionsCount ?? 0) / LIMIT) - 1;

  const loadNextPage = () => {
    if (!isPlaceholderData && currentPage < totalPages) {
      setCurrentPage((old) => old + 1);
    }
  };

  const loadPreviousPage = () => {
    setCurrentPage((old) => Math.max(0, old - 1));
  };

  const visibleCollections =
    collectionsData?.data?.collections ?? initialCollections;

  return (
    <section className="w-full overflow-hidden">
      <div className="flex items-center justify-between gap-8">
        <h1 className="m:text-2xl">Remarkable collections</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="disabled:opacity-50 transition-opacity"
            disabled={currentPage === 0 || isLoading}
            onClick={loadPreviousPage}
          >
            <IoIosArrowDropleft
              size={35}
              className={currentPage === 0 ? "text-gray-300" : "text-gray-600"}
            />
          </button>

          <button
            type="button"
            className="disabled:opacity-50 transition-opacity"
            disabled={
              currentPage >= totalPages || isLoading || isPlaceholderData
            }
            onClick={loadNextPage}
          >
            <IoIosArrowDropright
              size={35}
              className={
                currentPage >= totalPages ? "text-gray-300" : "text-gray-600"
              }
            />
          </button>
        </div>
      </div>

      {isLoading || isFetching ? (
        <div className="my-12">
          <SecondaryLoader />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            className={`${
              visibleCollections.length > 0
                ? "grid grid-cols-4 m:grid-cols-2 xl:grid-cols-2"
                : "flex items-center justify-center"
            } gap-3 mt-6`}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            {visibleCollections.length > 0 ? (
              visibleCollections.map((collection) => (
                <CollectionsCard
                  key={collection.collectionId}
                  collection={collection}
                />
              ))
            ) : (
              <h3 className="my-16 text-center m:text-[1rem]">
                No collections available
              </h3>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </section>
  );
};

export default Collections;
