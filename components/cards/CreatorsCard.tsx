import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { FaUserCircle, FaWallet } from "react-icons/fa";
import { getUserByWalletAddress } from "@/server-scripts/database/actions/user.action";
import { truncateAddress } from "@/libs/utils";
import { FaCrown } from "react-icons/fa";

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
  const [creatorDetails, setCreatorDetails] = React.useState<User>();

  React.useEffect(() => {
    const fetchUserDetails = async () => {
      const user = await getUserByWalletAddress(creator.walletAddress);
      if (user) setCreatorDetails(user);
    };
    fetchUserDetails();
  }, [creator.walletAddress]);

  if (!creatorDetails) return;

  return (
    <motion.div
      className="group overflow-hidden"
      whileHover={{
        y: -10,
        boxShadow:
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      }}
      transition={{
        type: "tween",
        duration: 0.3,
      }}
    >
      <Link href={`/creator/${creator.walletAddress}`} className="block">
        <div className="max-w-2xl">
          <div className="flex items-center bg-secondary rounded-xl p-4 shadow-lg hover:bg-zinc-700 transition-colors duration-300 m:bg-transparent m:rounded-none m:p-0 m:hover:bg-transparent m:border-b m:border-b-secondary m:pb-2">
            <div className="relative mr-6">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-zinc-700">
                <Image
                  src={creatorDetails?.photo || "/images/default-avatar.svg"}
                  alt={creatorDetails.username}
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                />
              </div>
            </div>

            <div className="flex-grow flex flex-col">
              <span className="text-xl font-semibold text-zinc-100">
                {creatorDetails?.username}
              </span>
              <span className="text-zinc-400 text-sm">
                {truncateAddress(creatorDetails?.walletAddress)}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default CreatorsCard;
