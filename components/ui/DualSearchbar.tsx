"use client";

import React from "react";
import { FaSearch } from "react-icons/fa";
import { IoClose } from "react-icons/io5";

type DualSearchbarProps = {
  placeholder?: string;
  creators: User[];
  collections: CollectionInfo[];
  onSearch: (results: SearchResults) => void;
  minChars?: number;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
};

const DualSearchbar = ({
  placeholder = "Search creators and collections...",
  creators,
  collections,
  onSearch,
  minChars = 2,
  searchTerm,
  setSearchTerm,
}: DualSearchbarProps) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const trimmedSearch = searchTerm.toLowerCase().trim();

      if (trimmedSearch.length < minChars) {
        onSearch({ creators, collections });
        return;
      }

      const filteredCreators = creators.filter((creator) =>
        creator.username.toLowerCase().includes(trimmedSearch)
      );

      const filteredCollections = collections.filter((collection) =>
        collection.name?.toLowerCase().includes(trimmedSearch)
      );

      onSearch({
        creators: filteredCreators,
        collections: filteredCollections,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, creators, collections, onSearch, minChars]);

  return (
    <div className="relative w-[25rem] m:w-full xl:w-full">
      <div className="bg-secondary py-2 pl-4 pr-3 rounded-full flex items-center gap-3">
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full placeholder:font-medium bg-transparent placeholder:text-sm text-white focus:outline-none"
          placeholder={placeholder}
        />
        {searchTerm ? (
          <button type="button" onClick={() => setSearchTerm("")}>
            <IoClose className="text-gray-400" />
          </button>
        ) : (
          <FaSearch className="text-gray-400" />
        )}
      </div>
    </div>
  );
};

export default DualSearchbar;
