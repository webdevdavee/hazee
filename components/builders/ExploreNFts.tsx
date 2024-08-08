"use client";

import useDropdown from "@/hooks/useDropdown";
import { IoIosArrowDown } from "react-icons/io";
import Dropdown from "../ui/Dropdown";
import React from "react";
import FilterNFT from "./FilterNFT";
import { sampleNfts } from "@/constants";
import NftCard from "../cards/NftCard";

const ExploreNFts = () => {
  const filterDropdown = useDropdown(
    [
      { id: 1, label: "Recently added", isButton: true },
      { id: 2, label: "Price: low to high", isButton: true },
      { id: 3, label: "Price: high to low", isButton: true },
    ],
    "Recently added"
  );

  return (
    <section>
      <div className="flex items-center justify-between gap-8">
        <h1>Explore NFTs</h1>
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
      </div>
      <FilterNFT />
      <div className="w-full grid grid-cols-4 justify-center gap-6 mt-6">
        {sampleNfts.map((nft) => (
          <NftCard key={nft.id} nft={nft} type="buy-now" />
        ))}
      </div>
    </section>
  );
};

export default ExploreNFts;
