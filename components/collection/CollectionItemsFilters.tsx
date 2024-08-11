import React from "react";
import { IoIosArrowDown } from "react-icons/io";
import Dropdown from "../ui/Dropdown";
import useDropdown from "@/hooks/useDropdown";
import Searchbar from "../ui/Searchbar";

const CollectionItemsFilters = () => {
  const filterDropdown = useDropdown(
    [
      { id: 1, label: "All", isButton: true },
      { id: 2, label: "Buy now", isButton: true },
      { id: 3, label: "Auction", isButton: true },
    ],
    "All"
  );

  const filter2Dropdown = useDropdown(
    [
      { id: 1, label: "Recently listed", isButton: true },
      { id: 2, label: "Price: low to high", isButton: true },
      { id: 3, label: "Price: high to low", isButton: true },
    ],
    "Recently listed"
  );

  return (
    <section className="flex items-center gap-3">
      <div
        onMouseOver={filterDropdown.toggle}
        onMouseOut={filterDropdown.toggle}
      >
        <div
          tabIndex={0}
          className="flex items-center gap-3 border border-secondary text-sm py-2 px-3 rounded-full cursor-pointer"
        >
          <p>{filterDropdown.selectedItem}</p>
          <IoIosArrowDown />
        </div>
        <Dropdown
          items={filterDropdown.items}
          isOpen={filterDropdown.isOpen}
          selectItem={filterDropdown.selectItem}
        />
      </div>
      <Searchbar placeholder="search NFTs..." />
      <div
        onMouseOver={filter2Dropdown.toggle}
        onMouseOut={filter2Dropdown.toggle}
      >
        <div
          tabIndex={0}
          className="flex items-center gap-3 border border-secondary text-sm py-2 px-3 rounded-full cursor-pointer"
        >
          <p>{filter2Dropdown.selectedItem}</p>
          <IoIosArrowDown />
        </div>
        <Dropdown
          items={filter2Dropdown.items}
          isOpen={filter2Dropdown.isOpen}
          selectItem={filter2Dropdown.selectItem}
        />
      </div>
    </section>
  );
};

export default CollectionItemsFilters;
