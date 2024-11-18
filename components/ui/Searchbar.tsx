import React, { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";

type SearchableItem = {
  name?: string;
  [key: string]: any;
};

type SearchbarProps<T extends SearchableItem> = {
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
}: SearchbarProps<T>) => {
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmedSearch = searchTerm.toLowerCase().trim();

      if (trimmedSearch.length < minChars) {
        onSearch(data);
        return;
      }

      const filtered = data.filter((item) =>
        searchKeys.some((key) => {
          const value = item[key];
          return value?.toString().toLowerCase().includes(trimmedSearch);
        })
      );

      onSearch(filtered);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <div className="relative w-fit m:w-full">
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
