import React, { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";

type SearchableItem = {
  name?: string;
  [key: string]: any;
};

type Props<T extends SearchableItem> = {
  placeholder: string;
  data: T[];
  onSearch?: (results: T[]) => void;
  searchKeys?: (keyof T)[];
  minChars?: number;
};

const Searchbar = <T extends SearchableItem>({
  placeholder,
  data,
  onSearch = () => {},
  searchKeys = ["name"],
  minChars = 2,
}: Props<T>) => {
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const search = () => {
      const trimmedSearch = searchTerm.toLowerCase().trim();

      if (trimmedSearch.length < minChars) {
        onSearch(data);
        return;
      }

      const filtered = data.filter((item) =>
        searchKeys.some((key) => {
          const value = item[key];
          return (
            value && value.toString().toLowerCase().includes(trimmedSearch)
          );
        })
      );

      onSearch(filtered);
    };

    const debounceTimer = setTimeout(search, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, data, searchKeys, onSearch, minChars]);

  return (
    <div className="relative w-fit">
      <div className="bg-secondary py-2 pl-4 pr-3 rounded-full flex items-center gap-3">
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full placeholder:font-medium bg-transparent placeholder:text-sm text-white focus:outline-none"
          placeholder={placeholder}
        />
        <FaSearch className="text-gray-400" />
      </div>
    </div>
  );
};

export default Searchbar;
