"use client";

import { IoIosArrowDropright, IoIosArrowDropleft } from "react-icons/io";
import { motion, AnimatePresence } from "framer-motion";
import CreatorsCard from "../cards/CreatorsCard";
import React from "react";
import { getUsers } from "@/server-scripts/database/actions/user.action";
import SecondaryLoader from "../ui/SecondaryLoader";
import { useQuery } from "@tanstack/react-query";

interface UsersResponse {
  users: User[];
  totalPages: number;
}

type Props = {
  initialCreators: User[];
  totalPages: number;
};

const TopCreators = ({
  initialCreators,
  totalPages: initialTotalPages,
}: Props) => {
  const [currentPage, setCurrentPage] = React.useState(0);
  const LIMIT = 4;

  const fetchCreators = async (page: number) => {
    const offset = page * LIMIT;
    const response = await getUsers(offset, LIMIT);
    if (!response.users) throw new Error("Failed to fetch creators");
    return response;
  };

  const {
    data: creatorsData,
    isLoading,
    isFetching,
    isPlaceholderData,
  } = useQuery<UsersResponse>({
    queryKey: ["creators", currentPage],
    queryFn: () => fetchCreators(currentPage),
    placeholderData: () => ({
      users: initialCreators,
      totalPages: initialTotalPages,
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const totalPages = creatorsData?.totalPages ?? initialTotalPages;
  const visibleCreators = creatorsData?.users ?? initialCreators;

  const loadNextPage = () => {
    if (!isPlaceholderData && currentPage < totalPages - 1) {
      setCurrentPage((old) => old + 1);
    }
  };

  const loadPreviousPage = () => {
    setCurrentPage((old) => Math.max(0, old - 1));
  };

  return (
    <section className="w-full overflow-hidden">
      <div className="flex items-center justify-between gap-8">
        <h1 className="m:text-2xl">Top creators</h1>
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
              currentPage >= totalPages - 1 || isLoading || isPlaceholderData
            }
            onClick={loadNextPage}
          >
            <IoIosArrowDropright
              size={35}
              className={
                currentPage >= totalPages - 1
                  ? "text-gray-300"
                  : "text-gray-600"
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
              visibleCreators.length > 0
                ? "grid grid-cols-4 m:grid-cols-2 xl:grid-cols-2"
                : "flex items-center justify-center"
            } gap-3 mt-6`}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            {visibleCreators.length > 0 ? (
              visibleCreators.map((creator) => (
                <CreatorsCard key={creator._id} creator={creator} />
              ))
            ) : (
              <h3 className="my-16 text-center m:text-[1rem]">
                No creators available
              </h3>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </section>
  );
};

export default TopCreators;
