"use client";

import Link from "next/link";
import Searchbar from "../ui/Searchbar";
import Button from "../ui/Button";
import React from "react";
import Dropdown from "../ui/Dropdown";
import { RiShoppingBag4Line } from "react-icons/ri";
import useDropdown from "@/hooks/useDropdown";

const Navbar = () => {
  const exploreDropdown = useDropdown([
    { id: 1, label: "NFTs", link: "/explore/nfts" },
    { id: 2, label: "Collections", link: "/explore/collections" },
    { id: 3, label: "Creators", link: "/explore/creators" },
  ]);

  const createDropdown = useDropdown([
    { id: 1, label: "NFT", link: "/studio/nft" },
    { id: 2, label: "Collection", link: "/studio/collection" },
  ]);

  return (
    <section className="sticky top-0 z-50">
      <div className="backdrop-blur-md bg-base/70">
        <nav className="mx-8 flex items-center justify-between py-4">
          <div className="flex gap-10 items-center">
            <Link href="/" className="text-white text-2xl">
              Hazee.
            </Link>
            <Searchbar placeholder="search..." />
          </div>
          <ul className="flex gap-5 items-center">
            <div
              onMouseOver={exploreDropdown.toggle}
              onMouseOut={exploreDropdown.toggle}
            >
              <Button
                text="Explore"
                style="text-[gray] font-medium hover:text-white transition-colors"
              />
              <div className="relative">
                <Dropdown
                  items={exploreDropdown.items}
                  isOpen={exploreDropdown.isOpen}
                />
              </div>
            </div>
            <div
              onMouseOver={createDropdown.toggle}
              onMouseOut={createDropdown.toggle}
            >
              <Button
                text="Create"
                style="text-[gray] font-medium hover:text-white transition-colors"
              />
              <div className="relative">
                <Dropdown
                  items={createDropdown.items}
                  isOpen={createDropdown.isOpen}
                />
              </div>
            </div>
            <Button text="Connect wallet" style="bg-primary font-medium" />
            <button type="button">
              <RiShoppingBag4Line size={30} />
            </button>
          </ul>
        </nav>
      </div>
    </section>
  );
};

export default Navbar;
