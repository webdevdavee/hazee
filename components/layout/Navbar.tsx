"use client";

import Link from "next/link";
import Button from "../ui/Button";
import React from "react";
import Dropdown from "../ui/Dropdown";
import useDropdown from "@/hooks/useDropdown";
import { useWallet } from "@/context/WalletProvider";
import { useOverlayStore } from "@/libs/zustand/overlayStore";
import Modal from "./Modal";
import ConnectWallet from "./ConnectWallet";
import NavbarSearch from "../builders/NavbarSearch";

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
  const [walletConnection, setWalletConnection] = React.useState<boolean>();

  React.useEffect(() => {
    const checkWalletConnection = async () => {
      const isConnected = await isWalletConnected();
      setWalletConnection(isConnected);
    };
    checkWalletConnection();
  }, [isWalletConnected]);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
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

  return (
    <>
      {isModalOpen && (
        <Modal title="Connect to Hazee" setIsModalOpen={setIsModalOpen}>
          <ConnectWallet connectWallet={handleConnectWallet} />
        </Modal>
      )}
      <section className="sticky top-0 z-[45]">
        <div className="backdrop-blur-md bg-base/70 border-b border-b-secondary">
          <nav className="mx-8 flex items-center justify-between py-4">
            <div className="flex gap-10 items-center">
              <Link href="/" className="text-white text-2xl">
                Hazee.
              </Link>
              <NavbarSearch />
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
                      {parseInt(balance as string)} ETH
                    </p>
                  </div>
                )}
              </>
            </ul>
          </nav>
        </div>
      </section>
    </>
  );
};

export default Navbar;
