import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { FaEthereum } from "react-icons/fa";
import { MdVerified } from "react-icons/md";
import { truncateAddress } from "@/libs/utils";
import { getUserByWalletAddress } from "@/server-scripts/database/actions/user.action";
import HexagonalAvatar from "./HexagonalAvatar";
import GlowingBorder from "./GlowingBorder";

type User = {
  _id: string;
  email: string;
  walletAddress: string;
  username: string;
  photo: string;
  coverPhoto: string;
};

type Props = {
  creator: User;
};

const CreatorsCard: React.FC<Props> = ({ creator }) => {
  const [creatorDetails, setCreatorDetails] = useState<User>();

  useEffect(() => {
    const fetchUserDetails = async () => {
      const user = await getUserByWalletAddress(creator.walletAddress);
      if (user) setCreatorDetails(user);
    };
    fetchUserDetails();
  }, [creator.walletAddress]);

  return (
    <GlowingBorder>
      <motion.div
        whileHover={{ y: -10 }}
        initial={{ y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full bg-secondary rounded-2xl overflow-hidden"
      >
        <Link href={`/creator/${creator.walletAddress}`} className="block">
          <div className="relative h-24 m:h-20">
            <Image
              src={creatorDetails?.coverPhoto || "/images/default-cover.jpg"}
              layout="fill"
              objectFit="cover"
              quality={100}
              priority
              alt="creator cover"
            />
          </div>
          <div className="p-4 relative">
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
              <HexagonalAvatar
                src={creatorDetails?.photo || "/images/default-avatar.svg"}
                alt={creatorDetails?.username || "Creator"}
                size={80}
              />
            </div>
            <div className="mt-12 text-center">
              <h3 className="font-bold text-lg mb-1 flex items-center justify-center">
                {creatorDetails?.username || "Unnamed"}
                <MdVerified className="ml-1 text-primary" />
              </h3>
              <p className="text-sm text-gray-400 mb-3">
                {truncateAddress(creator.walletAddress)}
              </p>
              <div className="flex justify-center items-center mb-4">
                <FaEthereum className="text-primary mr-1" />
                <span className="font-medium">1.2K</span>
                <span className="text-sm text-gray-400 ml-1">Volume</span>
              </div>
              <button
                type="button"
                className="bg-primary hover:bg-primary/80 transition-colors duration-200 rounded-full py-2 px-4 text-center w-full"
              >
                View Profile
              </button>
            </div>
          </div>
        </Link>
      </motion.div>
    </GlowingBorder>
  );
};

export default CreatorsCard;
