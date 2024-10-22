import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useNFTMarketplace } from "@/context/NFTMarketplaceProvider";
import { getSingleCollection } from "@/database/actions/collection.action";

type Props = {
  collection: CollectionInfo;
};

const CollectionsCard: React.FC<Props> = ({ collection }) => {
  const { getCollectionListings, isContractReady } = useNFTMarketplace();
  const [extentedCollection, setExtentedCollection] =
    React.useState<CollectionInfo | null>();
  const [listedTokens, setListedTokens] = React.useState<NFTListing[]>([]);

  React.useEffect(() => {
    if (!isContractReady) return;

    const fetchCollectionDetails = async () => {
      try {
        const extraMetadata = await getSingleCollection(
          collection.collectionId
        );
        if (collection && extraMetadata) {
          setExtentedCollection({
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
        const tokens = await getCollectionListings(collection.collectionId);
        if (!tokens) return;

        // Filter out any null values before updating state
        setListedTokens(tokens.filter((token) => token !== null));
      } catch (error) {
        console.error("Error fetching listed token details:", error);
      }
    };

    // Clear previous data before fetching new one if collectionId changes
    setListedTokens([]);
    setExtentedCollection(null);

    fetchCollectionDetails();
    fetchListedTokenDetails();
  }, [isContractReady, collection.collectionId]);

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
