import React from "react";
import { BsChevronLeft, BsChevronRight } from "react-icons/bs";
import { RiCheckDoubleLine } from "react-icons/ri";
import IPFSImage from "../ui/IPFSImage";

type Props = {
  collectionListings: EnrichedNFTListing[];
  selectedNFTs: Set<number>;
  handleNFTSelect: (tokenId: number) => void;
  offerDetails: CollectionOffer;
  sliderIndex: number;
  itemsPerPage: number;
  prevSlide: () => void;
  nextSlide: () => void;
  maxPages: number;
};

const NFTSlider: React.FC<Props> = ({
  collectionListings,
  selectedNFTs,
  handleNFTSelect,
  offerDetails,
  sliderIndex,
  itemsPerPage,
  prevSlide,
  nextSlide,
  maxPages,
}) => {
  return (
    <div className="relative px-12">
      <h3 className="font-semibold text-white mb-4">
        Select NFTs ({selectedNFTs.size}/{offerDetails.nftCount})
      </h3>

      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-300 gap-4"
          style={{ transform: `translateX(-${sliderIndex * 100}%)` }}
        >
          {collectionListings
            .slice(sliderIndex * itemsPerPage, (sliderIndex + 1) * itemsPerPage)
            .map((nft) => (
              <div
                key={nft.tokenId}
                onClick={() => handleNFTSelect(nft.tokenId)}
                className="relative flex-shrink-0 w-64 group cursor-pointer"
              >
                <div className="bg-[#2A2A2A] rounded-lg overflow-hidden">
                  {/* Selection Indicator */}
                  <div
                    className={`absolute top-3 right-3 z-10 transition-all duration-300 ${
                      selectedNFTs.has(nft.tokenId)
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 -translate-y-2"
                    }`}
                  >
                    <div className="bg-gradient-to-r from-primary to-blue-600 rounded-md px-2 py-1 shadow-lg">
                      <RiCheckDoubleLine className="text-white w-5 h-5" />
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="relative">
                    <IPFSImage
                      width={200}
                      height={200}
                      ipfsUrl={nft.imageUrl || "/placeholder.png"}
                      alt={nft.name || ""}
                      className={`w-full h-48 object-cover transition-all duration-300 ${
                        selectedNFTs.has(nft.tokenId)
                          ? "brightness-110"
                          : "group-hover:brightness-105"
                      }`}
                      priority
                      quality={100}
                    />

                    {/* Gradient Overlay on Hover/Selection */}
                    <div
                      className={`absolute inset-0 transition-opacity duration-300 pointer-events-none ${
                        selectedNFTs.has(nft.tokenId)
                          ? "opacity-100 bg-gradient-to-t from-blue-500/10 to-transparent"
                          : "opacity-0 group-hover:opacity-100 bg-gradient-to-t from-white/10 to-transparent"
                      }`}
                    />
                  </div>

                  <div
                    className={`p-4 transition-colors duration-300 ${
                      selectedNFTs.has(nft.tokenId)
                        ? "bg-blue-500/5"
                        : "group-hover:bg-white/5"
                    }`}
                  >
                    <h4 className="text-white font-medium truncate">
                      {nft.name || `NFT #${nft.tokenId}`}
                    </h4>
                    <p className="text-gray-400 text-sm truncate">
                      {nft.price || "0.0"} ETH
                    </p>
                  </div>

                  {/* Border Effect */}
                  <div
                    className={`absolute inset-0 transition-all duration-300 rounded-lg pointer-events-none ${
                      selectedNFTs.has(nft.tokenId)
                        ? "border-2 border-blue-500/50"
                        : "border border-transparent group-hover:border-white/10"
                    }`}
                  />
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={prevSlide}
        disabled={sliderIndex === 0}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-[#2A2A2A] p-2 rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3A3A3A] transition-colors"
      >
        <BsChevronLeft size={24} />
      </button>
      <button
        onClick={nextSlide}
        disabled={sliderIndex >= maxPages - 1}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-[#2A2A2A] p-2 rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3A3A3A] transition-colors"
      >
        <BsChevronRight size={24} />
      </button>
    </div>
  );
};

export default NFTSlider;
