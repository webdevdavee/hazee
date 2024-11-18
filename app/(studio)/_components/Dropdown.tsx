import React, { useState, useRef, useEffect } from "react";
import { FaChevronDown } from "react-icons/fa";

interface DropdownProps<T> {
  items: T[];
  defaultText?: string;
  renderItem: (item: T) => string;
  onSelect?: (item: T) => void;
  className?: string;
  altText?: string;
}

export default function Dropdown<T>({
  items,
  defaultText = "Select an option",
  renderItem,
  onSelect,
  className = "",
  altText = "No data to display",
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item: T) => {
    setSelectedItem(item);
    setIsOpen(false);
    onSelect?.(item);
  };

  return (
    <div
      ref={dropdownRef}
      className={`w-full relative inline-block ${className}`}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-4 text-left bg-base border border-secondary rounded-lg shadow-sm transition-colors duration-200"
      >
        <span className="block truncate">
          {selectedItem ? renderItem(selectedItem) : defaultText}
        </span>
        <FaChevronDown
          className={`ml-2 h-4 w-4 transition-transform duration-200 ${
            isOpen ? "transform rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`absolute z-10 py-2 px-3 w-full mt-1 bg-base border rounded-md shadow-lg transition-all duration-200 ease-in-out ${
          isOpen
            ? "opacity-100 transform scale-100"
            : "opacity-0 transform scale-95 pointer-events-none"
        }`}
      >
        <ul className="py-1 max-h-60 overflow-auto flex flex-col gap-2">
          {items && items.length > 0 ? (
            items.map((item, index) => (
              <li
                key={index}
                onClick={() => handleSelect(item)}
                className="p-2 text-sm hover:bg-secondary cursor-pointer transition-colors rounded-sm duration-150"
              >
                {renderItem(item)}
              </li>
            ))
          ) : (
            <p className="text-center p-3">{altText}</p>
          )}
        </ul>
      </div>
    </div>
  );
}
