"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { RiMenu3Line, RiCloseLine } from "react-icons/ri";
import useClickOutside from "@/hooks/useClickOutside";
import Button from "../ui/Button";
import Modal from "./Modal";
import ConnectWallet from "./ConnectWallet";
import NavbarSearch from "../builders/NavbarSearch";
import MobileNav from "./MobileNav";
import { useWallet } from "@/context/WalletProvider";
import { useOverlayStore } from "@/libs/zustand/overlayStore";
import useDropdown from "@/hooks/useDropdown";
import Dropdown from "../ui/Dropdown";

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

  const {
    walletAddress,
    connectWallet,
    truncatedAddress,
    balance,
    isWalletConnected,
  } = useWallet();

  const [walletConnection, setWalletConnection] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    const checkWalletConnection = async () => {
      const isConnected = await isWalletConnected();
      setWalletConnection(isConnected);
    };
    checkWalletConnection();
  }, [isWalletConnected]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const showOverlay = useOverlayStore((state) => state.showOverlay);
  const hideOverlay = useOverlayStore((state) => state.hideOverlay);

  const handleOpenModal = () => {
    setIsModalOpen(true);
    showOverlay();
  };

  const handleConnectWallet = () => {
    setIsModalOpen(false);
    hideOverlay();
    connectWallet();
  };

  // Close menu when clicking outside
  useClickOutside(mobileMenuRef, () => setShowMobileMenu(false));

  return (
    <>
      {isModalOpen && (
        <Modal title="Connect to Hazee" setIsModalOpen={setIsModalOpen}>
          <ConnectWallet connectWallet={handleConnectWallet} />
        </Modal>
      )}
      <section className="sticky top-0 z-[45]">
        <div className="relative backdrop-blur-md bg-base/70 border-b border-b-secondary m:bg-base xl:bg-base">
          <nav className="px-8 flex items-center justify-between py-4 m:px-4 xl:px-6">
            <div className="flex gap-10 items-center">
              <Link href="/" className="text-white text-2xl">
                Hazee.
              </Link>
              <div className="m:hidden xl:hidden">
                <NavbarSearch />
              </div>
            </div>

            {showMobileMenu ? (
              <RiCloseLine
                size={24}
                className="hidden m:block cursor-pointer xl:block"
                onClick={() => setShowMobileMenu(false)}
              />
            ) : (
              <RiMenu3Line
                size={24}
                className="hidden m:block cursor-pointer xl:block"
                onClick={() => setShowMobileMenu(true)}
              />
            )}

            <div className="flex gap-5 items-center m:hidden xl:hidden">
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
              {!walletConnection ? (
                <Button
                  text="Create"
                  style="text-[gray] font-medium hover:text-white transition-colors"
                  onclick={handleOpenModal}
                />
              ) : (
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
              )}
              <>
                {!walletConnection ? (
                  <Button
                    text="Connect wallet"
                    style="bg-primary font-medium"
                    onclick={handleOpenModal}
                  />
                ) : (
                  <div className="flex items-center gap-3">
                    <Link href={`/creator/${walletAddress}`}>
                      <Button
                        text={truncatedAddress as string}
                        style="bg-primary font-medium"
                      />
                    </Link>
                    <p
                      className="bg-secondary font-medium p-[0.6rem] rounded-full"
                      style={{ display: balance ? "block" : "none" }}
                    >
                      {parseFloat(balance as string).toFixed(3)} ETH
                    </p>
                  </div>
                )}
              </>
            </div>
          </nav>

          {showMobileMenu && (
            <div
              ref={mobileMenuRef}
              className={`transition-opacity duration-300 ease-in-out ${
                showMobileMenu ? "opacity-100" : "opacity-0"
              }`}
              style={{ display: showMobileMenu ? "block" : "none" }}
            >
              <MobileNav
                walletConnection={walletConnection}
                handleOpenModal={handleOpenModal}
                setShowMobileMenu={setShowMobileMenu}
              />
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default Navbar;
