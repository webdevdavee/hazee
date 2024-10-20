import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useNFTCollections } from "@/context/NFTCollectionProvider";
import { useNFTMarketplace } from "@/context/NFTMarketplaceProvider";

type Props = {
  collectionId: number;
};

const CollectionsCard: React.FC<Props> = ({ collectionId }) => {
  const { getListingDetails } = useNFTMarketplace();
  const { getCollectionDetails, getMintedNFTs, isContractReady } =
    useNFTCollections();
  const [collection, setCollection] = React.useState<CollectionInfo | null>();
  const [mintedTokens, setMintedTokens] = React.useState<NFTListing[]>([]);

  React.useEffect(() => {
    if (!isContractReady) return;

    const fetchCollectionDetails = async () => {
      try {
        const collection = await getCollectionDetails(collectionId);
        setCollection(collection);
      } catch (error) {
        console.error("Error fetching collection details:", error);
      }
    };

    const fetchMintedTokenDetails = async () => {
      try {
        const tokens = await getMintedNFTs(collectionId);
        if (!tokens) return;

        const mintedTokensDetails = await Promise.all(
          tokens.map(async (id) => {
            const tokenWithDetail = await getListingDetails(id);
            return tokenWithDetail; // This may include nulls
          })
        );

        // Filter out any null values before updating state
        setMintedTokens(mintedTokensDetails.filter((token) => token !== null));
      } catch (error) {
        console.error("Error fetching minted token details:", error);
      }
    };

    // Clear previous data before fetching new one if collectionId changes
    setMintedTokens([]);
    setCollection(null);

    fetchCollectionDetails();
    fetchMintedTokenDetails();
  }, [isContractReady, collectionId]);

  return (
    <motion.div
      whileHover={{ y: -10 }}
      initial={{ y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full rounded-2xl overflow-hidden"
    >
      <Link href={`collection/${collection?.collectionId}`} className="block">
        <section className="bg-secondary p-1 relative">
          <div className="relative rounded-xl overflow-hidden">
            <div className="grid grid-cols-2 gap-2">
              {mintedTokens?.map((token) => (
                <div
                  key={token.tokenId}
                  className="w-full aspect-square relative"
                >
                  <Image
                    src={token.imageUrl as string}
                    fill
                    quality={100}
                    priority
                    alt="collection"
                    className="object-cover rounded-md"
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 bg-secondary p-3">
              <div className="flex flex-col justify-between gap-1">
                <div className="flex flex-col">
                  <p className="text-sm text-gray-400">@Hazee</p>
                  <p className="font-medium">{collection?.name}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-gray-400 font-medium">
                    Floor:{" "}
                    <span className="text-white">{collection?.floorPrice}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Link>
    </motion.div>
  );
};

export default CollectionsCard;
