"use client";

import Button from "@/components/ui/Button";
import { IoArrowBackCircle } from "react-icons/io5";
import { useRouter } from "next/navigation";
import { useWallet } from "@/context/WalletProvider";
import { useOverlayStore } from "@/libs/zustand/overlayStore";
import React from "react";
import Modal from "@/components/layout/Modal";
import ConnectWallet from "@/components/layout/ConnectWallet";

const Navbar = () => {
  const router = useRouter();

  const { connectWallet, truncatedAddress, balance, isWalletConnected } =
    useWallet();
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

  const handleOpenModal = () => {
    setIsModalOpen(true);
    showOverlay();
  };

  return (
    <>
      {isModalOpen && (
        <Modal title="Connect to Hazee" setIsModalOpen={setIsModalOpen}>
          <ConnectWallet connectWallet={connectWallet} />
        </Modal>
      )}

      <section className="sticky top-0 z-40 border-b border-b-secondary bg-base">
        <nav className="mx-8 flex items-center justify-between py-4">
          <button type="button" onClick={() => router.back()}>
            <IoArrowBackCircle size={35} className="cursor-pointer" />
          </button>
          <>
            {!walletConnection ? (
              <Button
                text={truncatedAddress as string}
                style="bg-primary font-medium"
                onclick={handleOpenModal}
              />
            ) : (
              <div className="flex items-center gap-3">
                <Button
                  text={truncatedAddress as string}
                  style="bg-primary font-medium"
                />
                <p
                  className="bg-secondary font-medium p-[0.6rem] rounded-full"
                  style={{ display: balance ? "block" : "none" }}
                >
                  {balance as string} ETH
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
