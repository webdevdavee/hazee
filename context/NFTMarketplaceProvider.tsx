"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { ethers } from "ethers";
import { marketplaceContractABI } from "@/backend/abi/NFTMarketplaceABI";
import {
  NFTAuctionContractAddress,
  NFTCollectionsContractAddress,
  NFTMarketplaceContractAddress,
} from "@/backend/constants";
import { useToast } from "./ToastProvider";
import { useWallet } from "./WalletProvider";
import {
  getActiveListings,
  getListingDetails,
  getCreatorListings,
  getCollectionListings,
} from "@/server-scripts/actions/marketplace.contract.actions";
import { useNFT } from "./NFTProvider";

enum ListingType {
  NONE,
  SALE,
  AUCTION,
  BOTH,
}

interface ListingParams {
  tokenId: number;
  price: string;
  listingType: ListingType;
  startingPrice?: string;
  reservePrice?: string;
  duration?: number;
}

interface NFTMarketplaceContextType {
  contract: ethers.Contract | null;
  listings: NFTListing[];
  isLoading: boolean;
  isContractReady: boolean;
  getActiveListings: (offset: number, limit: number) => Promise<void>;
  getListingDetails: (
    listingId: number
  ) => Promise<NFTListing | null | undefined>;
  getCreatorListings: (creatorAddress: string) => Promise<NFTListing[]>;
  getCollectionListings: (
    collectionId: number
  ) => Promise<NFTListing[] | undefined>;
  refreshListings: () => Promise<void>;
  listNFT: (params: ListingParams) => Promise<boolean>;
  cancelListing: (listingId: number) => Promise<void>;
  updateListingPrice: (listingId: number, newPrice: string) => Promise<void>;
  buyNFT: (listingId: number, price: string) => Promise<void>;
  isNFTListed: (tokenId: number) => Promise<NFTListingStatus>;
  endAuction: (listingId: number) => Promise<void>;
  acceptCollectionOfferAndDelist: (
    collectionId: number,
    tokenIds: number[],
    offerer: string
  ) => Promise<
    | {
        collectionId: number;
        success: boolean;
      }
    | undefined
  >;
}

const NFTMarketplaceContext = createContext<
  NFTMarketplaceContextType | undefined
>(undefined);

export const useNFTMarketplace = () => {
  const context = useContext(NFTMarketplaceContext);
  if (!context) {
    throw new Error(
      "useNFTMarketplace must be used within an NFTMarketplaceProvider"
    );
  }
  return context;
};

export const NFTMarketplaceProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [listings, setListings] = useState<NFTListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isContractReady, setIsContractReady] = useState(false);
  const { showToast } = useToast();
  const { walletAddress, isWalletConnected } = useWallet();
  const { contract: nftContract, isContractReady: isNFTContractReady } =
    useNFT();

  // Initialize contract for write operations
  useEffect(() => {
    const initContract = async () => {
      if (!(await isWalletConnected())) {
        setIsContractReady(false);
        setContract(null);
        return;
      }

      try {
        if (typeof window.ethereum !== "undefined") {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();

          const marketplaceContract = new ethers.Contract(
            NFTMarketplaceContractAddress,
            marketplaceContractABI,
            signer
          );

          setContract(marketplaceContract);
          setIsContractReady(true);
        } else {
          console.log("Ethereum object not found");
          showToast(
            "We couldn't find an Ethereum provider. Do you have MetaMask installed?",
            "error"
          );
          setIsContractReady(false);
        }
      } catch (error) {
        console.error("Failed to initialize contract:", error);
        showToast("Failed to initialize contract", "error");
        setIsContractReady(false);
      }
    };

    initContract();
  }, [walletAddress, isWalletConnected]);

  // Get active listings using server action
  const fetchActiveListings = async (offset: number, limit: number) => {
    setIsLoading(true);
    try {
      const response = await getActiveListings(offset, limit);
      if (response.success && response.data) {
        setListings(response.data);
      } else {
        showToast("Failed to fetch active listings", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Get listing details using server action
  const fetchListingDetails = async (listingId: number) => {
    try {
      const response = await getListingDetails(listingId);
      return response.success ? response.data : null;
    } catch (error) {
      showToast("Failed to fetch listing details", "error");
      return null;
    }
  };

  // Get creator listings using server action
  const fetchCreatorListings = async (creatorAddress: string) => {
    try {
      const response = await getCreatorListings(creatorAddress);
      return response.success ? response.data : [];
    } catch (error) {
      showToast("Failed to fetch creator listings", "error");
      return [];
    }
  };

  // Get collection listings using server action
  const fetchCollectionListings = async (collectionId: number) => {
    try {
      const response = await getCollectionListings(collectionId);
      return response.success ? response.data : [];
    } catch (error) {
      showToast("Failed to fetch collection listings", "error");
      return [];
    }
  };

  // Write operations
  const listNFT = async (params: ListingParams): Promise<boolean> => {
    if (!contract || !isContractReady || !nftContract || !isNFTContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return false;
    }

    try {
      // Approve marketplace contract to handle NFTs if not already approved
      const isApproved = await nftContract.isApprovedForAll(
        walletAddress,
        NFTMarketplaceContractAddress
      );

      if (!isApproved) {
        const approveTx = await nftContract.setApprovalForAll(
          NFTMarketplaceContractAddress,
          true
        );
        await approveTx.wait();
      }

      // Approve auction contract to handle NFTs if not already approved
      const isAuctionContractApproved = await nftContract.isApprovedForAll(
        walletAddress,
        NFTAuctionContractAddress
      );

      if (!isAuctionContractApproved) {
        const approveTx = await nftContract.setApprovalForAll(
          NFTAuctionContractAddress,
          true
        );
        await approveTx.wait();
      }

      // Prepare parameters for the contract call
      const listingParams = {
        _tokenId: params.tokenId,
        _price: params.price && ethers.parseEther(params.price),
        _listingType: params.listingType,
        _startingPrice: params.startingPrice
          ? ethers.parseEther(params.startingPrice)
          : 0,
        _reservePrice: params.reservePrice
          ? ethers.parseEther(params.reservePrice)
          : 0,
        _duration: params.duration || 0,
      };

      const tx = await contract.listNFT(
        listingParams._tokenId,
        listingParams._price,
        listingParams._listingType,
        listingParams._startingPrice,
        listingParams._reservePrice,
        listingParams._duration
      );

      await tx.wait();

      showToast("NFT listed successfully", "success");
      await fetchActiveListings(0, listings.length); // Refresh listings
      return true;
    } catch (error: any) {
      console.error("Error listing NFT:", error);
      showToast("Failed to list NFT. Please try again.", "error");
      return false;
    }
  };

  const cancelListing = async (listingId: number) => {
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return;
    }

    try {
      const tx = await contract.cancelListing(listingId);
      await tx.wait();
      await fetchActiveListings(0, listings.length); // Refresh listings
      showToast("Listing cancelled successfully", "success");
      window.location.reload();
    } catch (error: any) {
      console.error(error.message);
      showToast("Failed to cancel listing", "error");
    }
  };

  const endAuction = async (listingId: number) => {
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return;
    }

    try {
      // Check if auction can be ended at this time
      const canEnd = await contract.canEndAuction(listingId);

      if (canEnd) {
        const tx = await contract.finalizeAuctionAndDelist(listingId);
        await tx.wait();
      } else {
        showToast("Failed to end auction", "error");
      }

      await fetchActiveListings(0, listings.length); // Refresh listings
      window.location.reload();
    } catch (error: any) {
      console.error("Failed to end auction", error.message);
      showToast("Failed to end auction", "error");
    }
  };

  const updateListingPrice = async (listingId: number, newPrice: string) => {
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return;
    }

    try {
      const tx = await contract.updateListingPrice(
        listingId,
        ethers.parseEther(newPrice)
      );
      await tx.wait();
      await fetchActiveListings(0, listings.length); // Refresh listings
      showToast("Listing price updated successfully", "success");
    } catch (error: any) {
      showToast("Failed to update listing price", "error");
    }
  };

  const buyNFT = async (listingId: number, price: string) => {
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return;
    }

    try {
      const tx = await contract.buyNFT(listingId, {
        value: ethers.parseEther(price),
      });
      await tx.wait();
      showToast("NFT purchased successfully", "success");
      await fetchActiveListings(0, listings.length);
      window.location.reload();
    } catch (error: any) {
      showToast("Failed to purchase NFT", "error");
    }
  };

  const checkNFTListing = async (
    tokenId: number
  ): Promise<NFTListingStatus> => {
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return { isListed: false, listingId: 0 };
    }

    try {
      const [isListed, listingId] = await contract.isNFTListed(tokenId);
      return {
        isListed,
        listingId: Number(listingId), // Convert BigNumber to number if needed
      };
    } catch (error: any) {
      showToast("Failed to check NFT listing status", "error");
      return { isListed: false, listingId: 0 };
    }
  };

  const acceptCollectionOfferAndDelist = async (
    collectionId: number,
    tokenIds: number[],
    offerer: string
  ) => {
    if (!contract || !isContractReady || !nftContract) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return;
    }

    // Approve marketplace contract to handle NFTs if not already approved
    const isApproved = await nftContract.isApprovedForAll(
      walletAddress,
      NFTCollectionsContractAddress
    );

    if (!isApproved) {
      const approveTx = await nftContract.setApprovalForAll(
        NFTCollectionsContractAddress,
        true
      );
      await approveTx.wait();
    }

    try {
      const tx = await contract.acceptCollectionOfferAndDelist(
        collectionId,
        tokenIds,
        offerer
      );
      await tx.wait();

      showToast("Collection offer accepted successfully", "success");
      await fetchActiveListings(0, listings.length); // Refresh listings
      return { collectionId, success: true };
    } catch (error: any) {
      console.error("Error accepting collection offer:", error);
      showToast("Failed to accept collection offer and delist", "error");
      return { collectionId, success: true };
    }
  };

  const value = {
    contract,
    listings,
    isLoading,
    isContractReady,
    getActiveListings: fetchActiveListings,
    getListingDetails: fetchListingDetails,
    getCreatorListings: fetchCreatorListings,
    getCollectionListings: fetchCollectionListings,
    refreshListings: () => fetchActiveListings(0, listings.length),
    listNFT,
    cancelListing,
    updateListingPrice,
    buyNFT,
    isNFTListed: checkNFTListing,
    endAuction,
    acceptCollectionOfferAndDelist,
  };

  return (
    <NFTMarketplaceContext.Provider value={value}>
      {children}
    </NFTMarketplaceContext.Provider>
  );
};
