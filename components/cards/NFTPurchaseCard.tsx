"use client";

import Button from "../ui/Button";
import Modal from "@/components/layout/Modal";
import { useOverlayStore } from "@/libs/zustand/overlayStore";
import React from "react";
import MakeOffer from "./MakeOffer";
import { useEthConverter } from "@/hooks/useEthConverter";
import { useWallet } from "@/context/WalletProvider";
import ListNFT from "../layout/ListNFT";
import { useNFTMarketplace } from "@/context/NFTMarketplaceProvider";
import AuctionTimer from "../builders/AuctionTimer";
import { truncateAddress } from "@/libs/utils";
import Link from "next/link";
import SecondaryLoader from "../ui/SecondaryLoader";

type Props = {
  nft: TokenInfo;
  collection: CollectionInfo | undefined;
  listingStatus: NFTListingStatus;
  auctionDetails: AuctionDetails | undefined;
  listingDetails: NFTListing | undefined;
};

const NFTPurchaseCard: React.FC<Props> = ({
  nft,
  collection,
  listingStatus,
  auctionDetails,
  listingDetails,
}) => {
  const { walletAddress, connectWallet } = useWallet();
  const { cancelListing, buyNFT } = useNFTMarketplace();

  const { usdAmount, isLoading, error } = useEthConverter(
    nft.status === 2 || nft.status === 3
      ? auctionDetails?.highestBid
      : nft.status === 1
      ? listingDetails?.price
      : nft.status === 0
      ? nft.price
      : "0"
  );
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isListModalOpen, setIsListModalOpen] = React.useState(false);

  const showOverlay = useOverlayStore((state) => state.showOverlay);
  const hideOverlay = useOverlayStore((state) => state.hideOverlay);

  const [isPurchaseLoading, setIsPurchaseLoading] = React.useState(false);
  const [loadingMessage, setLoadingMessage] = React.useState("");

  const handleBuyNFT = async () => {
    setIsPurchaseLoading(true);
    showOverlay();

    setLoadingMessage("Processing purchase...");
    if (listingDetails) {
      try {
        await buyNFT(listingStatus.listingId, listingDetails.price);
      } catch (error: any) {
        console.error(error.message);
      } finally {
        setIsPurchaseLoading(false);
        hideOverlay();
        setLoadingMessage("");
      }
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    showOverlay();
  };

  const handleOpenListModal = () => {
    setIsListModalOpen(true);
    showOverlay();
  };

  const PriceDisplay = () => (
    <div className="bg-secondary bg-opacity-30 rounded-md flex flex-col p-4">
      <p className="text-[gray] text-lg font-medium">
        {nft.status === 2 || nft.status === 3 ? "Highest bid" : "Price"}
      </p>
      <p className="font-medium text-3xl m:text-2xl">
        {nft.status === 2 || nft.status === 3
          ? auctionDetails?.highestBid
          : nft.status === 1
          ? listingDetails?.price
          : nft.status === 0
          ? nft.price
          : 0.0}{" "}
        ETH
      </p>
      <p className="text-[gray] text-lg font-medium">
        {isLoading
          ? "Converting..."
          : error
          ? "USD amount unavailable. You can proceed with the ETH amount shown."
          : `$${usdAmount}`}
      </p>
    </div>
  );

  // Determine the button configuration based on NFT status
  const getButtonConfig = () => {
    if (walletAddress) {
      if (nft.status === 0) {
        const isOwner = nft.owner === walletAddress;
        return {
          primary: {
            text: isOwner ? "List NFT" : "Not yet available for purchase!",
            disabled: !isOwner,
            onClick: isOwner ? handleOpenListModal : undefined,
            className:
              "bg-primary font-medium rounded-md w-full disabled:cursor-not-allowed disabled:bg-secondary",
          },
        };
      }

      if (nft.status === 1) {
        const isOwner = nft.owner === walletAddress;

        return {
          primary: {
            text: isOwner ? "Cancel listing" : "Buy now",
            onClick: isOwner
              ? () => cancelListing(listingStatus.listingId)
              : () => handleBuyNFT(),
            className: `${
              isOwner ? "bg-abstract" : "bg-primary"
            } font-medium rounded-md w-full disabled:cursor-not-allowed disabled:bg-secondary`,
          },
        };
      }

      if (nft.status === 2) {
        const isOwner = nft.owner === walletAddress;

        return {
          primary: {
            text: isOwner ? "Cancel listing" : "Place a bid",
            onClick: isOwner
              ? () => cancelListing(listingStatus.listingId)
              : handleOpenModal,
            className: `${
              isOwner ? "bg-abstract" : "bg-white text-base"
            } font-medium rounded-md w-full disabled:cursor-not-allowed disabled:bg-secondary`,
          },
        };
      }

      if (nft.status === 3) {
        const isOwner = nft.owner === walletAddress;

        return {
          primary: {
            text: isOwner ? "Cancel listing" : "Buy now",
            onClick: isOwner
              ? () => cancelListing(listingStatus.listingId)
              : () => handleBuyNFT(),
            className: `${
              isOwner ? "bg-abstract" : "bg-primary"
            } font-medium rounded-md w-full disabled:cursor-not-allowed disabled:bg-secondary`,
          },
          secondary: {
            text: "Place a bid",
            disabled: false,
            onClick: handleOpenModal,
            className: `${
              isOwner && "hidden"
            } bg-white text-base font-medium w-full rounded-md`,
          },
        };
      }

      return null;
    } else {
      return {
        primary: {
          text: "Connect wallet",
          onClick: connectWallet,
          className: "bg-abstract bg-primary font-medium rounded-md w-full",
        },
      };
    }
  };

  const buttonConfig = getButtonConfig();

  return (
    <section className="border border-secondary rounded-lg p-4">
      {isModalOpen && (
        <Modal title="Place a bid" setIsModalOpen={setIsModalOpen}>
          <MakeOffer
            nft={nft}
            collection={collection}
            auctionDetails={auctionDetails}
          />
        </Modal>
      )}

      {isListModalOpen && (
        <Modal title="List Your NFT" setIsModalOpen={setIsListModalOpen}>
          <ListNFT nft={nft} collection={collection} />
        </Modal>
      )}

      {(nft.status === 2 || nft.status === 3) && auctionDetails?.endTime && (
        <AuctionTimer
          endTime={auctionDetails.endTime}
          listingId={listingStatus.listingId}
        />
      )}

      {isPurchaseLoading && (
        <Modal
          setIsModalOpen={setIsPurchaseLoading}
          isLoading={isPurchaseLoading}
          loadingMessage={loadingMessage}
        >
          <div className="flex items-center justify-center backdrop-blur-[2px]">
            <SecondaryLoader message={loadingMessage} size="md" />
          </div>
        </Modal>
      )}

      <PriceDisplay />

      {buttonConfig && (
        <div className="mt-5 flex gap-4">
          {buttonConfig.secondary && (
            <Button
              text={buttonConfig.secondary.text}
              style={buttonConfig.secondary.className}
              onclick={buttonConfig.secondary.onClick}
              disabled={buttonConfig.secondary.disabled}
            />
          )}
          <Button
            text={buttonConfig.primary.text}
            style={buttonConfig.primary.className}
            onclick={buttonConfig.primary.onClick}
            disabled={buttonConfig.primary.disabled}
          />
        </div>
      )}
      {(nft.status === 2 || nft.status === 3) &&
        auctionDetails?.bids &&
        auctionDetails.bids.length > 0 && (
          <div className="p-3 rounded-md bg-secondary bg-opacity-30 mt-4 w-fit">
            <p>
              Highest bidder:{" "}
              <Link
                href={`/creator/${auctionDetails.highestBidder}`}
                className="text-accent"
              >
                {truncateAddress(auctionDetails?.highestBidder)}
              </Link>
            </p>
          </div>
        )}
    </section>
  );
};

export default NFTPurchaseCard;
