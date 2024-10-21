import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useNFTCollections } from "@/context/NFTCollectionProvider";
import { useNFTMarketplace } from "@/context/NFTMarketplaceProvider";
import { getSingleCollection } from "@/database/actions/collection.action";

type Props = {
  collectionId: number;
};

const CollectionsCard: React.FC<Props> = ({ collectionId }) => {
  const { getCollectionListings } = useNFTMarketplace();
  const { getCollectionDetails, isContractReady } = useNFTCollections();
  const [collection, setCollection] = React.useState<CollectionInfo | null>();
  const [listedTokens, setListedTokens] = React.useState<NFTListing[]>([]);

  React.useEffect(() => {
    if (!isContractReady) return;

    const fetchCollectionDetails = async () => {
      try {
        const collection = await getCollectionDetails(collectionId);
        const extraMetadata = await getSingleCollection(collectionId);
        if (collection && extraMetadata) {
          setCollection({
            ...collection,
            name: extraMetadata.name,
            imageUrl: extraMetadata.imageUrl,
            coverPhoto: extraMetadata.coverPhoto,
          });
        }
      } catch (error) {
        console.error("Error fetching collection details:", error);
      }
    };

    const fetchListedTokenDetails = async () => {
      try {
        const tokens = await getCollectionListings(collectionId);
        if (!tokens) return;

        // Filter out any null values before updating state
        setListedTokens(tokens.filter((token) => token !== null));
      } catch (error) {
        console.error("Error fetching listed token details:", error);
      }
    };

    // Clear previous data before fetching new one if collectionId changes
    setListedTokens([]);
    setCollection(null);

    fetchCollectionDetails();
    fetchListedTokenDetails();
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
              {listedTokens?.map((token) => (
                <div
                  key={token.tokenId}
                  className="w-full aspect-square relative"
                >
                  <Image
                    src={token.imageUrl || "/default-avatar.webp"}
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
                  <p className="text-sm text-gray-400">{collection?.creator}</p>
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
