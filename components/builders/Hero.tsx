"use client";

import React from "react";
import { motion } from "framer-motion";
import { FaRocket, FaWallet } from "react-icons/fa";
import Link from "next/link";
import ConnectWallet from "../layout/ConnectWallet";
import Modal from "../layout/Modal";
import { useOverlayStore } from "@/libs/zustand/overlayStore";
import { useWallet } from "@/context/WalletProvider";

const renderAdvancedParticles = () => {
  if (typeof window === "undefined") return null; // Ensure code runs only in the browser

  return [...Array(60)].map((_, i) => {
    const delay = Math.random() * 3;
    const duration = Math.random() * 5 + 3;
    const size = Math.random() * 20 + 5;
    const opacity = Math.random() * 0.6 + 0.2;

    return (
      <motion.div
        key={i}
        initial={{
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          scale: 0,
          opacity: 0,
        }}
        animate={{
          x: [
            Math.random() * window.innerWidth,
            Math.random() * window.innerWidth,
            Math.random() * window.innerWidth,
          ],
          y: [
            Math.random() * window.innerHeight,
            Math.random() * window.innerHeight,
            Math.random() * window.innerHeight,
          ],
          scale: [0, 1, 0],
          opacity: [0, opacity, 0],
        }}
        transition={{
          duration: duration,
          delay: delay,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute rounded-full bg-gradient-to-r from-primary/50 to-accent/50"
        style={{
          width: `${size}px`,
          height: `${size}px`,
        }}
      />
    );
  });
};

const Hero = () => {
  const { connectWallet } = useWallet();
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

  const ctaButtons = [
    {
      href: "/explore/collections",
      icon: <FaRocket />,
      text: "Explore Collections",
      variant: "primary",
      onClick: null,
    },
    {
      href: "#",
      icon: <FaWallet />,
      text: "Connect Wallet",
      variant: "outline",
      onClick: handleOpenModal,
    },
  ];

  return (
    <section className="relative bg-base overflow-hidden min-h-screen flex items-center justify-center text-white rounded-2xl">
      {isModalOpen && (
        <Modal title="Connect to Hazee" setIsModalOpen={setIsModalOpen}>
          <ConnectWallet connectWallet={handleConnectWallet} />
        </Modal>
      )}

      {/* Advanced Particle Background */}
      <div className="absolute inset-0 opacity-50 z-0 pointer-events-none">
        {renderAdvancedParticles()}
      </div>

      {/* Content Container */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 text-center max-w-4xl px-6"
      >
        <h1 className="text-[4rem] md:text-[6rem] lg:text-[8rem] font-black bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent tracking-tighter leading-[0.8] mb-6 uppercase">
          HAZEE
        </h1>

        <p className="text-white/80 max-w-2xl mx-auto mb-12 tracking-wide leading-relaxed m:text-sm">
          Revolutionize digital ownership with our cutting-edge NFT marketplace.
          Empower creators, engage communities, and unlock new dimensions of
          digital expression.
        </p>

        <div className="flex justify-center gap-6 m:flex-col m:gap-4 m:items-center">
          {ctaButtons.map(({ href, icon, text, variant, onClick }) => (
            <motion.div
              key={href}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {onClick ? (
                <button
                  onClick={onClick}
                  className={`flex items-center gap-3 px-6 py-3 rounded-full tracking-wide transition-all duration-300 m:text-sm m:w-fit ${
                    variant === "primary"
                      ? "bg-primary text-white hover:opacity-90"
                      : "border border-accent text-accent hover:bg-accent hover:text-base"
                  }`}
                >
                  {icon}
                  {text}
                </button>
              ) : (
                <Link
                  href={href}
                  className={`flex items-center gap-3 px-6 py-3 rounded-full tracking-wide transition-all duration-300 m:text-sm ${
                    variant === "primary"
                      ? "bg-primary text-white hover:opacity-90"
                      : "border border-accent text-accent hover:bg-accent hover:text-base"
                  }`}
                >
                  {icon}
                  {text}
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;
