import { getUserByWalletAddress } from "@/server-scripts/database/actions/user.action";
import { truncateAddress } from "@/libs/utils";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import React from "react";

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
      whileHover={{ y: -10 }}
      initial={{ y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full rounded-2xl overflow-hidden"
    >
      <Link href={`/creator/${creator.walletAddress}`} className="block">
        <section className="bg-secondary p-4 relative">
          <div className="relative rounded-xl overflow-hidden">
            <div className="w-full flex items-center justify-center">
              <Image
                src={creatorDetails?.photo || "/images/default-avatar.svg"}
                width={200}
                height={200}
                quality={100}
                priority
                alt="creator"
                className="rounded-full"
              />
            </div>
            <div className="flex flex-col gap-3 bg-secondary p-3">
              <div className="flex flex-col items-center justify-center">
                <p className="font-medium text-lg m:text-sm">
                  {truncateAddress(creator.walletAddress)}
                </p>
                <p className="text-gray-400 text-sm m:text-xs">
                  @{creatorDetails?.username || "Unnamed"}
                </p>
              </div>
              <button
                type="button"
                className="bg-primary rounded-full p-2 text-center m:text-sm"
              >
                View profile
              </button>
            </div>
          </div>
        </section>
      </Link>
    </motion.div>
  );
};

export default CreatorsCard;
