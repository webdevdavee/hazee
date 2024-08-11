import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../ui/Button";
import { collections, sampleNfts } from "@/constants";
import NftCard from "../cards/NftCard";
import CollectionsCard from "../cards/CollectionsCard";

type Props = {
  creator: Creator | undefined;
};

const CreatorItemsTab: React.FC<Props> = ({ creator }) => {
  const [tab, setTab] = React.useState("Created");
  const tabs = ["Created", "Owned", "Collections", `Sold: ${creator?.sold}K`];

  const handleSelectTabs = (tab: string) => {
    if (tab.includes("Sold:")) return;
    setTab(tab);
  };

  const tabVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  const renderTabContent = () => {
    switch (tab) {
      case "Created":
        return (
          <div>
            <div className="mt-4 grid grid-cols-4 gap-6">
              {sampleNfts.map((nft) => (
                <NftCard key={nft.id} type="list" nft={nft} />
              ))}
            </div>
          </div>
        );
      case "Owned":
        return (
          <div>
            <div className="mt-4 grid grid-cols-4 gap-6">
              {sampleNfts.map((nft) => (
                <NftCard key={nft.id} type="list" nft={nft} />
              ))}
            </div>
          </div>
        );
      case "Collections":
        return (
          <div>
            <div className="mt-4 grid grid-cols-4 gap-6">
              {collections.map((collection) => (
                <CollectionsCard key={collection.id} collection={collection} />
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section className="mt-8">
      <div className="flex items-center gap-6">
        {tabs.map((tabName) => (
          <div key={tabName} className="relative">
            <Button
              text={tabName}
              onclick={() => handleSelectTabs(tabName)}
              style="pb-2"
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
