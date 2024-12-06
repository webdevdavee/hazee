import React from "react";
import Button from "../ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import NFTPropertiesTab from "./NFTPropertiesTab";

type Props = { nft: TokenInfo };

const TabsForNFT: React.FC<Props> = ({ nft }) => {
  const [tab, setTab] = React.useState("Details");
  const tabs = ["Details", "Properties"];

  const handleSelectTabs = (tab: string) => {
    setTab(tab);
  };

  const tabVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  const renderTabContent = () => {
    switch (tab) {
      case "Details":
        return (
          <div>
            <h2 className="font-medium text-2xl mb-5 m:text-lg">Description</h2>
            <p className="m:text-sm m:font-light">
              {nft.metadata?.description || "Nothing to display"}
            </p>
            <div className="mt-8">
              <h2 className="font-medium text-2xl mb-5 m:text-lg">Details</h2>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="m:text-sm m:font-light">Token standard: </p>
                  <p className="m:text-sm m:font-light">Ethereum (ERC-721)</p>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="m:text-sm m:font-light">Token ID: </p>
                  <p className="m:text-sm m:font-light">{nft.tokenId}</p>
                </div>
              </div>
            </div>
          </div>
        );
      case "Properties":
        return <NFTPropertiesTab nft={nft} />;

      default:
        return null;
    }
  };

  return (
    <section className="bg-secondary border border-secondary bg-opacity-30 rounded-lg">
      <div className="flex items-center justify-center gap-6 mt-3 mb-4 border-b border-b-secondary">
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
      <div className="w-full p-8 pt-4 h-[300px] custom-scrollbar overflow-y-auto m:h-full">
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

export default TabsForNFT;
