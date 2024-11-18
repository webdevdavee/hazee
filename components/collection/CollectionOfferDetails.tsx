"use client";

import { truncateAddress } from "@/libs/utils";
import Link from "next/link";
import React from "react";
import { FiClock, FiUser, FiDollarSign } from "react-icons/fi";
import NFTSlider from "../nft/NFTSlider";
import Modal from "../layout/Modal";
import SecondaryLoader from "../ui/SecondaryLoader";
import { useOverlayStore } from "@/libs/zustand/overlayStore";
import { useNFTMarketplace } from "@/context/NFTMarketplaceProvider";

type Props = {
  offerDetails: CollectionOffer;
  collectionListings: EnrichedNFTListing[];
};

const CollectionOfferDetails: React.FC<Props> = ({
  offerDetails,
  collectionListings,
}) => {
  const { acceptCollectionOfferAndDelist, isContractReady } =
    useNFTMarketplace();
  const showOverlay = useOverlayStore((state) => state.showOverlay);
  const hideOverlay = useOverlayStore((state) => state.hideOverlay);

  const [selectedNFTs, setSelectedNFTs] = React.useState<Set<number>>(
    new Set()
  );
  const [sliderIndex, setSliderIndex] = React.useState(0);

  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingMessage, setLoadingMessage] = React.useState("");

  const itemsPerPage = 3;
  const maxPages = Math.ceil(
    (collectionListings && collectionListings.length / itemsPerPage) || 0
  );

  const formatTimeLeft = (expirationTime: number) => {
    const now = Date.now();
    const timeLeft = expirationTime - now;
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const handleNFTSelect = (tokenId: number) => {
    const newSelected = new Set(selectedNFTs);
    if (newSelected.has(tokenId)) {
      newSelected.delete(tokenId);
    } else if (newSelected.size < offerDetails.nftCount) {
      newSelected.add(tokenId);
    }
    setSelectedNFTs(newSelected);
  };

  const handleAcceptOffer = async () => {
    if (!isContractReady) return;

    showOverlay();
    setIsLoading(true);
    setLoadingMessage("Accepting offer...");

    // Convert selectedNFTs set to an array
    const selectedTokenIds = [...selectedNFTs];

    try {
      const response = await acceptCollectionOfferAndDelist(
        offerDetails.collectionId,
        selectedTokenIds,
        offerDetails.offerer
      );

      if (response?.success) {
        window.location.reload();
      }
    } catch (error: any) {
      console.error(error.message);
    } finally {
      hideOverlay();
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const nextSlide = () => {
    if (sliderIndex < maxPages - 1) {
      setSliderIndex((prev) => prev + 1);
    }
  };

  const prevSlide = () => {
    if (sliderIndex > 0) {
      setSliderIndex((prev) => prev - 1);
    }
  };

  return (
    <>
      {isLoading && (
        <Modal
          setIsModalOpen={setIsLoading}
          isLoading={isLoading}
          loadingMessage={loadingMessage}
        >
          <div className="flex items-center justify-center backdrop-blur-[2px]">
            <SecondaryLoader message={loadingMessage} size="md" />
          </div>
        </Modal>
      )}

      <div className="bg-secondary rounded-lg p-6 max-w-4xl mx-auto shadow-xl">
        {/* Offer Details Section */}
        <div className="mb-6 border-b border-gray-700 pb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">
              Collection Offer #{offerDetails.offerId}
            </h2>
            <span
              className={`px-3 py-1 rounded-full text-sm ${
                offerDetails.isActive
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {offerDetails.isActive ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center space-x-2 text-gray-300">
              <FiUser className="text-gray-400" />
              <span>
                Offerer:{" "}
                <Link
                  href={`/creator/${offerDetails.offerer}`}
                  className="text-accent underline underline-offset-2"
                >
                  {truncateAddress(offerDetails.offerer)}
                </Link>
              </span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <FiDollarSign className="text-gray-400" />
              <span>{offerDetails.amount} ETH</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <FiClock className="text-gray-400" />
              <span>
                Expires in: {formatTimeLeft(offerDetails.expirationTime)}
              </span>
            </div>
          </div>
        </div>

        {/* NFT Selection Slider */}
        <NFTSlider
          collectionListings={collectionListings}
          selectedNFTs={selectedNFTs}
          handleNFTSelect={handleNFTSelect}
          offerDetails={offerDetails}
          sliderIndex={sliderIndex}
          itemsPerPage={itemsPerPage}
          prevSlide={prevSlide}
          nextSlide={nextSlide}
          maxPages={maxPages}
        />

        {/* Action Button */}
        <div className="mt-6 flex justify-end space-x-4">
          <button
            className="px-6 py-2 bg-primary text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={
              selectedNFTs.size !== offerDetails.nftCount ||
              !offerDetails.isActive
            }
            onClick={handleAcceptOffer}
          >
            {!offerDetails.isActive ? "Offer inactive" : "Accept Offer"}
          </button>
        </div>
      </div>
    </>
  );
};

export default CollectionOfferDetails;
