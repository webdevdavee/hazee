"use client";

import Button from "@/components/ui/Button";
import { IoArrowBackCircle } from "react-icons/io5";
import { useRouter } from "next/navigation";
import { useWallet } from "@/context/WalletProvider";
import { useOverlayStore } from "@/libs/zustand/overlayStore";
import React from "react";
import Modal from "@/components/layout/Modal";
import ConnectWallet from "@/components/layout/ConnectWallet";
import { GoHome } from "react-icons/go";
import Link from "next/link";

const Navbar = () => {
  const router = useRouter();

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

      <section className="sticky top-0 z-40 border-b border-b-secondary bg-base">
        <nav className="px-8 flex items-center justify-between py-4 m:px-4">
          <div className="flex items-center gap-10 m:gap-0">
            <Link href="/" type="button">
              <GoHome size={35} />
            </Link>
            <button
              type="button"
              className="m:hidden"
              onClick={() => router.back()}
            >
              <IoArrowBackCircle size={35} />
            </button>
          </div>
          <>
            {!walletConnection ? (
              <Button
                text={truncatedAddress as string}
                style="bg-primary font-medium"
                onclick={handleOpenModal}
              />
            ) : (
              <div className="flex items-center gap-3">
                <Link href={`/creator/${walletAddress}`}>
                  <Button
                    text={truncatedAddress as string}
                    style="bg-primary font-medium m:text-sm"
                  />
                </Link>
                <p
                  className="bg-secondary font-medium p-[0.6rem] rounded-full m:text-sm"
                  style={{ display: balance ? "block" : "none" }}
                >
                  {parseFloat(balance as string).toFixed(3)} ETH
                </p>
              </div>
            )}
          </>
        </nav>
      </section>
    </>
  );
};

export default Navbar;
