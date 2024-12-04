"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaUserCircle, FaWallet, FaEllipsisH } from "react-icons/fa";
import { getUserByWalletAddress } from "@/server-scripts/database/actions/user.action";
import { truncateAddress } from "@/libs/utils";

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
  const [creatorDetails, setCreatorDetails] = useState<User | null>(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      const user = await getUserByWalletAddress(creator.walletAddress);
      if (user) setCreatorDetails(user);
    };
    fetchUserDetails();
  }, [creator.walletAddress]);

  if (!creatorDetails) return null;

  return (
    <motion.div
      className="max-w-sm w-full bg-secondary rounded-lg overflow-hidden shadow-lg"
      whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.2)" }}
      transition={{ duration: 0.3 }}
    >
      <Link href={`/creator/${creator.walletAddress}`} className="block">
        <div className="relative h-32 bg-gradient-to-r from-purple-500 to-pink-500">
          <Image
            src={creatorDetails.coverPhoto || "/images/default-cover.webp"}
            alt="Cover"
            layout="fill"
            objectFit="cover"
          />
        </div>
        <div className="px-6 py-4 relative">
          <div className="absolute -top-16 left-4 w-24 h-24 rounded-full border-4 border-white overflow-hidden">
            <Image
              src={creatorDetails.photo || "/images/default-avatar.svg"}
              alt={creatorDetails.username}
              layout="fill"
              objectFit="cover"
            />
          </div>
          <div className="mt-8">
            <h2 className="text-xl font-bold m:text-lg">
              {creatorDetails.username}
            </h2>
            <div className="flex items-center mt-2">
              <FaWallet className="mr-2" />
              <span className="text-sm">
                {truncateAddress(creatorDetails.walletAddress)}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default CreatorsCard;
