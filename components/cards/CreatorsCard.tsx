import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { FaUserCircle, FaWallet } from "react-icons/fa";
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
  const [creatorDetails, setCreatorDetails] = React.useState<User>();

  React.useEffect(() => {
    const fetchUserDetails = async () => {
      const user = await getUserByWalletAddress(creator.walletAddress);
      if (user) setCreatorDetails(user);
    };
    fetchUserDetails();
  }, [creator.walletAddress]);

  return (
    <motion.div
      className="group"
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
        <div className="bg-secondary rounded-2xl overflow-hidden border border-base/10">
          {/* Background Subtle */}
          <div className="h-20 bg-base/5 relative">
            {/* Profile Image */}
            <div
              className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 
                            border-4 border-secondary rounded-full
                            shadow-md"
            >
              <Image
                src={creatorDetails?.photo || "/images/default-avatar.svg"}
                width={110}
                height={110}
                quality={100}
                priority
                alt="Creator Profile"
                className="rounded-full object-cover"
              />
            </div>
          </div>

          {/* Creator Details */}
          <div className="pt-16 pb-6 px-6 text-center">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 text-primary">
                <FaWallet color="white" />
                <p className="font-medium text-sm text-white">
                  {truncateAddress(creator.walletAddress)}
                </p>
              </div>

              <div className="flex items-center gap-2 mt-1 text-secondary">
                <FaUserCircle color="white" />
                <p className="text-sm text-white">
                  @{creatorDetails?.username || "Unnamed"}
                </p>
              </div>
            </div>

            {/* View Profile Button */}
            <motion.button
              whileHover={{
                backgroundColor: "#334FEF",
                color: "white",
              }}
              whileTap={{ scale: 0.95 }}
              className="mt-4 w-full px-4 py-2 rounded-full transition duration-300 ease-in-out bg-primary text-white m:text-sm"
            >
              View Profile
            </motion.button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default CreatorsCard;
