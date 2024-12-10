import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../ui/Button";
import NftCard from "../cards/NftCard";
import CollectionsCard from "../cards/CollectionsCard";
import CollectionBids from "../collection/CollectionOffers";
import { useWallet } from "@/context/WalletProvider";

type Props = {
  userDetails: CreatorPageData;
  offers: CollectionOffer[] | undefined;
};

const CreatorItemsTab: React.FC<Props> = ({ userDetails, offers }) => {
  const { walletAddress } = useWallet();

  const [tab, setTab] = React.useState("Created");

  const tabs = [
    "Created",
    "Owned",
    "Collections",
    `${
      walletAddress === userDetails.user.walletAddress ? "My offers" : "Offers"
    }`,
  ];

  function handleSelectTabs(tab: string) {
    // if (tab.includes("Sold:")) return;
    setTab(tab);
  }

  function renderTabContent() {
    switch (tab) {
      case "Created":
        return (
          <div>
            <div className="mt-4 grid grid-cols-4 gap-6 m:grid-cols-2 m:gap-4 xl:grid-cols-3">
              {userDetails.tokens.created.length > 0 ? (
                userDetails.tokens.created.map((token, index) => (
                  <NftCard
                    key={`${token.tokenId}-${index}`}
                    status={token.status}
                    token={token}
                    nftStatus={
                      userDetails.nftStatuses[token.tokenId.toString()]
                    }
                  />
                ))
              ) : (
                <h3 className="mt-3 m:text-sm m:text-center m:mt-4 xl:text-[1rem]">
                  No data to show
                </h3>
              )}
            </div>
          </div>
        );
      case "Owned":
        return (
          <div>
            <div className="mt-4 grid grid-cols-4 gap-6 m:grid-cols-2 m:gap-4 xl:grid-cols-3">
              {userDetails.tokens.owned.length > 0 ? (
                userDetails.tokens.owned.map((token, index) => (
                  <NftCard
                    key={`${token.tokenId}-${index}`}
                    status={token.status}
                    token={token}
                    nftStatus={
                      userDetails.nftStatuses[token.tokenId.toString()]
                    }
                  />
                ))
              ) : (
                <h3 className="mt-3 m:text-sm m:text-center m:mt-4 xl:text-[1rem]">
                  No data to show
                </h3>
              )}
            </div>
          </div>
        );
      case "Collections":
        return (
          <div>
            <div className="mt-4 grid grid-cols-4 gap-6 m:grid-cols-2 m:gap-4 xl:grid-cols-3">
              {userDetails?.collections &&
              userDetails.collections.length > 0 ? (
                userDetails?.collections?.map((collection, index) => (
                  <CollectionsCard
                    key={`${collection.collectionId}-${index}`}
                    collection={collection}
                  />
                ))
              ) : (
                <h3 className="mt-3 m:text-sm m:text-center m:mt-4 xl:text-[1rem]">
                  No data to show
                </h3>
              )}
            </div>
          </div>
        );
      case "My offers":
        return (
          <div
            className={
              walletAddress === userDetails.user.walletAddress
                ? "block"
                : "hidden"
            }
          >
            <div className="w-full">
              {offers && offers.length > 0 ? (
                <CollectionBids collectionOffers={offers} />
              ) : (
                <h3 className="mt-3 m:text-sm m:text-center m:mt-4">
                  No data to show
                </h3>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  }

  const tabVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  return (
    <section className="mt-8">
      <div className="flex items-center gap-6 overflow-x-auto">
        {tabs.map((tabName) => (
          <div
            key={tabName}
            className={`relative ${tabName !== "Offers" ? "block" : "hidden"}`}
          >
            <Button
              text={tabName}
              onclick={() => handleSelectTabs(tabName)}
              style="pb-2 w-max"
            />
            {tab === tabName && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
                layoutId="underline"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                }}
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-5 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default CreatorItemsTab;
