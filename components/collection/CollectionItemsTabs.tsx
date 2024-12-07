import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../ui/Button";
import CollectionItemsFilters from "./CollectionItemsFilters";
import SecondaryLoader from "../ui/SecondaryLoader";
import NFTCard from "../cards/NftCard";

type Props = {
  collectionListings: EnrichedNFTListing[] | undefined;
  collectionId: number;
};

const CollectionItemsTabs: React.FC<Props> = ({
  collectionListings,
  collectionId,
}) => {
  const [initialListings, setInitialListings] = React.useState<
    EnrichedNFTListing[]
  >(collectionListings as EnrichedNFTListing[]);

  const [listings, setListings] = React.useState<
    EnrichedNFTListing[] | undefined
  >(collectionListings);

  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const [tab, setTab] = React.useState("Items");
  const tabs = ["Items"];

  const handleSelectTabs = (tab: string) => {
    setTab(tab);

    if (tab === "Items") {
      setListings(initialListings);
    } else {
      setListings([]);
    }
  };

  const tabVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  const renderTabContent = () => {
    switch (tab) {
      case "Items":
        return (
          <div>
            <CollectionItemsFilters
              initialListings={initialListings}
              setInitialListings={setInitialListings}
              listings={listings}
              setListings={setListings}
              setIsLoading={setIsLoading}
              collectionId={collectionId}
            />
            <div>
              {isLoading ? (
                <div className="my-12 flex items-center justify-center">
                  <SecondaryLoader />
                </div>
              ) : listings && listings.length > 0 ? (
                <div className="my-12 grid grid-cols-4 gap-6 m:grid-cols-2 xl:grid-cols-2">
                  {listings.map((token) => (
                    <NFTCard key={token.listingId} token={token} />
                  ))}
                </div>
              ) : (
                <h3 className="my-16 text-center w-full m:text-[1rem] xl:text-[1rem]">
                  No data to show yet
                </h3>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section className="mt-4">
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

export default CollectionItemsTabs;
