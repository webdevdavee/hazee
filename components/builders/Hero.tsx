"use client";

import React from "react";
import { motion } from "framer-motion";
import { FaWallet, FaRocket } from "react-icons/fa";
import Link from "next/link";
import Image from "next/image";
import { useWallet } from "@/context/WalletProvider";
import { useOverlayStore } from "@/libs/zustand/overlayStore";
import Modal from "../layout/Modal";
import ConnectWallet from "../layout/ConnectWallet";

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

  return (
    <div className="min-h-screen bg-background_light text-white overflow-hidden relative m:min-h-32">
      {isModalOpen && (
        <Modal title="Connect to Hazee" setIsModalOpen={setIsModalOpen}>
          <ConnectWallet connectWallet={handleConnectWallet} />
        </Modal>
      )}

      {/* Layered Background with Artistic Elements */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 810"
          preserveAspectRatio="xMinYMin slice"
          className="absolute w-full h-full"
        >
          <defs>
            <linearGradient
              id="artBackground"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="rgba(39, 39, 42, 0.3)" />
              <stop offset="100%" stopColor="rgba(24, 24, 27, 0.6)" />
            </linearGradient>
          </defs>
          <path
            d="M0,288L48,272C96,256,192,224,288,197.3C384,171,480,149,576,165.3C672,181,768,235,864,261.3C960,288,1056,288,1152,266.7C1248,245,1344,203,1392,181.3L1440,160L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
            fill="url(#artBackground)"
          />
        </svg>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-16 relative z-10 grid grid-cols-2 gap-12 min-h-screen items-center m:grid-cols-1">
        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="space-y-8"
        >
          <div className="overflow-hidden">
            <motion.h1
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-6xl font-bold mb-4 text-zinc-100 leading-tight m:text-4xl"
            >
              Unleash the Power
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-400 to-zinc-600">
                of Digital Ownership
              </span>
            </motion.h1>
          </div>

          <p className="text-zinc-400 text-lg mb-8 leading-relaxed m:text-base">
            Discover, collect, and trade unique digital assets. Our platform
            brings together artists, collectors, and innovators in the
            cutting-edge world of NFT marketplaces.
          </p>

          <div className="flex space-x-6 m:space-x-0 m:flex-col">
            <Link
              href="/explore/collections"
              className="group flex items-center gap-3 px-8 py-3 bg-zinc-700 hover:bg-accent rounded-full text-white hover:text-background_light transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <FaRocket className="text-zinc-300 transition-colors duration-300 group-hover:text-background_light" />
              <span>Explore Collection</span>
            </Link>
            <button
              type="button"
              className="group flex items-center gap-3 px-8 py-3 border border-zinc-700 hover:bg-zinc-700 rounded-full text-white transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
              onClick={handleOpenModal}
            >
              <FaWallet className="text-zinc-300 transition-colors duration-300 group-hover:text-zinc-100" />
              <span>Connect Wallet</span>
            </button>
          </div>
        </motion.div>

        {/* Right Content - Artistic NFT Representation */}
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="flex items-center justify-center m:hidden"
        >
          <motion.div
            className="w-full max-w-md aspect-square relative"
            animate={{
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              repeatType: "loop",
              ease: "easeInOut",
            }}
          >
            {/* Staggered Image Layout with Parallax and Depth Effects */}
            <motion.div
              className="absolute inset-0"
              initial={{ rotate: -8, scale: 0.9 }}
              animate={{
                rotate: [-8, -6, -9],
                y: [0, 10, -10, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
            >
              <Image
                className="absolute top-0 left-0 w-full h-full object-cover rounded-3xl shadow-2xl"
                src="/images/marquee (3).webp"
                fill
                alt="NFT Showcase 3"
              />
            </motion.div>

            <motion.div
              className="absolute inset-0"
              initial={{ rotate: 6, scale: 0.95 }}
              animate={{
                rotate: [6, 4, 7],
                y: [0, -10, 10, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
                delay: 0.2,
              }}
            >
              <Image
                className="absolute top-0 left-0 w-full h-full object-cover rounded-3xl shadow-xl opacity-90"
                src="/images/marquee (2).webp"
                fill
                alt="NFT Showcase 2"
              />
            </motion.div>

            <motion.div
              className="absolute inset-0"
              initial={{ rotate: -2, scale: 1 }}
              animate={{
                rotate: [-2, 0, -3],
                y: [0, 5, -5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
                delay: 0.4,
              }}
            >
              <Image
                className="absolute top-0 left-0 w-full h-full object-cover rounded-3xl shadow-lg opacity-100"
                src="/images/marquee (1).webp"
                fill
                alt="NFT Showcase 1"
              />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;
