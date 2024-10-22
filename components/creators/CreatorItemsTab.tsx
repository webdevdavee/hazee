import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../ui/Button";
import NftCard from "../cards/NftCard";
import CollectionsCard from "../cards/CollectionsCard";
import { useNFT } from "@/context/NFTProvider";
import { useNFTCollections } from "@/context/NFTCollectionProvider";

type Props = {
  urlWalletAddress: string;
};

const CreatorItemsTab: React.FC<Props> = ({ urlWalletAddress }) => {
  const { getOwnedTokens, getCreatedTokens, getItemsSold, isContractReady } =
    useNFT();
  const {
    getUserCreatedCollections,
    isContractReady: isCollectionContractReady,
  } = useNFTCollections();
  const [createdTokens, setCreatedTokens] = React.useState<
    TokenInfo[] | null
  >();
  const [ownedTokens, setOwnedTokens] = React.useState<TokenInfo[] | null>();
  const [sold, setSold] = React.useState<number | null>(0);
  const [createdCollections, setCreatedCollections] = React.useState<
    CollectionInfo[] | null
  >([]);

  React.useEffect(() => {
    if (isContractReady && isCollectionContractReady && urlWalletAddress) {
      const fetchTokens = async () => {
        const fetchedCreatedTokens = await getCreatedTokens(urlWalletAddress);
        const fetchedOwnedTokens = await getOwnedTokens(urlWalletAddress);
        const fetchedItemsSold = await getItemsSold(urlWalletAddress);
        const fetchedCreatedCollections = await getUserCreatedCollections(
          urlWalletAddress
        );

        if (fetchedCreatedTokens) setCreatedTokens(fetchedCreatedTokens);
        if (fetchedOwnedTokens) setOwnedTokens(fetchedOwnedTokens);
        if (fetchedItemsSold) setSold(fetchedItemsSold);
        if (fetchedCreatedCollections)
          setCreatedCollections(fetchedCreatedCollections);
      };

      fetchTokens();
    }
  }, [urlWalletAddress, isContractReady, isCollectionContractReady]);

  const [tab, setTab] = React.useState("Created");
  const tabs = ["Created", "Owned", "Collections", `Sold: ${sold}`];

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
              {createdTokens && createdTokens.length > 0 ? (
                createdTokens.map((token, index) => (
                  <NftCard
                    key={`${token.tokenId}-${index}`}
                    type="all"
                    token={token}
                  />
                ))
              ) : (
                <h3 className="mt-3">No data to show</h3>
              )}
            </div>
          </div>
        );
      case "Owned":
        return (
          <div>
            <div className="mt-4 grid grid-cols-4 gap-6">
              {ownedTokens && ownedTokens.length > 0 ? (
                ownedTokens.map((token, index) => (
                  <NftCard
                    key={`${token.tokenId}-${index}`}
                    type="all"
                    token={token}
                  />
                ))
              ) : (
                <h3 className="mt-3">No data to show</h3>
              )}
            </div>
          </div>
        );
      case "Collections":
        return (
          <div>
            <div className="mt-4 grid grid-cols-4 gap-6">
              {createdCollections && createdCollections.length > 0 ? (
                createdCollections.map((collection, index) => (
                  <CollectionsCard
                    key={`${collection.collectionId}-${index}`}
                    collection={collection}
                  />
                ))
              ) : (
                <h3 className="mt-3">No data to show</h3>
              )}
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
