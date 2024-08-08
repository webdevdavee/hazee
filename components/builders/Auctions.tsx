"use client";

import { IoIosArrowDown } from "react-icons/io";
import Button from "../ui/Button";
import NftCard from "../cards/NftCard";
import { sampleNfts } from "@/constants";
import React from "react";
import Dropdown from "../ui/Dropdown";
import useDropdown from "@/hooks/useDropdown";

const Auctions = () => {
  const auctionDropdown = useDropdown([{ id: 1, label: "New", link: "/" }]);

  return (
    <section className="w-full">
      <div>
        <div className="flex items-center gap-8">
          <h1>Auctions</h1>
          <div
            onMouseOver={auctionDropdown.toggle}
            onMouseOut={auctionDropdown.toggle}
          >
            <div className="flex items-center gap-3 border border-secondary text-sm py-2 px-3 rounded-full">
              <p>Popular</p>
              <IoIosArrowDown />
            </div>
            <div className="relative">
              <Dropdown
                items={auctionDropdown.items}
                isOpen={auctionDropdown.isOpen}
              />
            </div>
          </div>

          <ul className="flex items-center gap-4">
            <Button text="All" style="bg-primary text-sm px-4" />
            <Button
              text="Art"
              style="border border-secondary text-sm px-4 hover:bg-secondary hover:transition"
            />
            <Button
              text="Gaming"
              style="border border-secondary text-sm px-4 hover:bg-secondary hover:transition"
            />
            <Button
              text="Music"
              style="border border-secondary text-sm px-4 hover:bg-secondary hover:transition"
            />
          </ul>
        </div>
        <div className="w-full grid grid-cols-4 justify-center gap-6 mt-6">
          {sampleNfts.slice(0, 4).map((nft) => (
            <NftCard key={nft.id} nft={nft} type="auction" />
          ))}
        </div>
        <div className="w-full flex items-center justify-center mt-8">
          <Button
            text="Load more"
            style="border border-secondary rounded-full hover:bg-secondary hover:transition"
          />
        </div>
      </div>
    </section>
  );
};

export default Auctions;
