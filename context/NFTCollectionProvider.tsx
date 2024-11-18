"use client";

import React, { createContext, useContext, useState } from "react";
import { ethers } from "ethers";
import { collectionsContractABI } from "@/backend/abi/NFTCollectionsABI";
import { NFTCollectionsContractAddress } from "@/backend/constants";
import { useToast } from "./ToastProvider";
import { useWallet } from "./WalletProvider";
import {
  getCollections,
  getCollectionDetails,
  getMintedNFTs,
  getUserCreatedCollections,
  getUserCollectionOffers,
  getCollectionOffers,
  verifyCollectionCreator,
  getOfferById,
} from "@/server-scripts/actions/collection.contract.actions";
import { useNFT } from "./NFTProvider";

interface NFTCollectionsContextType {
  contract: ethers.Contract | null;
  isLoading: boolean;
  isContractReady: boolean;
  createCollection: (
    maxSupply: number,
    royaltyPercentage: number,
    floorPrice: string
  ) => Promise<number | null>;
  mintNFT: (
    collectionId: number,
    price: string,
    tokenURI: string
  ) => Promise<{ tokenId: number; collectionId: number } | null>;
  updateFloorPrice: (
    collectionId: number,
    newFloorPrice: string
  ) => Promise<{ collectionId: number; success: boolean }>;
  updateRoyaltyPercentage: (
    collectionId: number,
    newPercentage: number
  ) => Promise<{ collectionId: number; success: boolean }>;
  placeCollectionOffer: (
    collectionId: number,
    nftCount: number,
    duration: number,
    amount: string
  ) => Promise<{ collectionId: number; success: boolean }>;
  withdrawCollectionOffer: (
    collectionId: number
  ) => Promise<{ collectionId: number; success: boolean }>;
  acceptCollectionOffer: (
    collectionId: number,
    tokenIds: number[],
    offerer: string
  ) => Promise<{ collectionId: number; success: boolean }>;
  getCollections: (
    offset: number,
    limit: number
  ) => Promise<{
    collections: CollectionInfo[];
    totalCollectionsCount: number;
  } | null>;
  getCollectionDetails: (
    collectionId: number
  ) => Promise<CollectionInfo | null>;
  getMintedNFTs: (collectionId: number) => Promise<number[] | null>;
  getUserCreatedCollections: (user: string) => Promise<CollectionInfo[] | null>;
  getUserCollectionOffers: (user: string) => Promise<CollectionOffer[] | null>;
  getCollectionOffers: (
    collectionId: number
  ) => Promise<CollectionOffer[] | null>;
  verifyCollectionCreator: (
    collection: any,
    walletAddress: string
  ) => Promise<CollectionContractResponse>;
  getOfferById: (offerId: number) => Promise<CollectionOffer | null>;
}

const NFTCollectionsContext = createContext<
  NFTCollectionsContextType | undefined
>(undefined);

export const useNFTCollections = () => {
  const context = useContext(NFTCollectionsContext);
  if (!context) {
    throw new Error(
      "useNFTCollections must be used within an NFTCollectionsProvider"
    );
  }
  return context;
};

export const NFTCollectionsProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isContractReady, setIsContractReady] = useState(false);
  const { showToast } = useToast();
  const { walletAddress, isWalletConnected } = useWallet();
  const { contract: nftContract } = useNFT();

  // Initialize contract for write operations
  React.useEffect(() => {
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

          const collectionsContract = new ethers.Contract(
            NFTCollectionsContractAddress,
            collectionsContractABI,
            signer
          );

          setContract(collectionsContract);
          setIsContractReady(true);
        } else {
          console.log("Ethereum object not found");
          showToast(
            "We couldn't find an Ethereum provider. Do you have MetaMask installed?",
            "error"
          );
          setIsContractReady(false);
        }
      } catch (err) {
        console.error("Failed to initialize the contract:", err);
        showToast("Failed to initialize the contract", "error");
        setIsContractReady(false);
      }
    };

    initContract();
  }, [walletAddress, isWalletConnected]);

  // Contract write operations
  const createCollection = async (
    maxSupply: number,
    royaltyPercentage: number,
    floorPrice: string
  ): Promise<number | null> => {
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return null;
    }

    try {
      const tx = await contract.createCollection(
        maxSupply,
        royaltyPercentage,
        ethers.parseEther(floorPrice)
      );
      const receipt = await tx.wait();

      const event = receipt.logs.find(
        (log: any) => log.eventName === "CollectionAdded"
      );
      const collectionId = event ? Number(event.args[0]) : null;

      console.log("Collection created successfully!");
      return collectionId;
    } catch (error: any) {
      console.error("Error creating collection:", error);
      showToast("Failed to create collection", "error");
      return null;
    }
  };

  const mintNFT = async (
    collectionId: number,
    price: string,
    tokenURI: string
  ): Promise<{ tokenId: number; collectionId: number } | null> => {
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return null;
    }

    try {
      const tx = await contract.mintNFT(
        collectionId,
        ethers.parseEther(price),
        tokenURI
      );
      const receipt = await tx.wait();

      const event = receipt.logs.find(
        (log: any) => log.eventName === "NFTMinted"
      );
      const tokenId = event ? Number(event.args[1]) : 0;
      const actualCollectionId = event ? Number(event.args[0]) : collectionId;

      showToast(`NFT minted successfully! Token ID: ${tokenId}`, "success");
      return { tokenId, collectionId: actualCollectionId };
    } catch (error: any) {
      console.error("Error minting NFT:", error);
      showToast("Failed to mint NFT", "error");
      return null;
    }
  };

  const updateFloorPrice = async (
    collectionId: number,
    newFloorPrice: string
  ): Promise<{ collectionId: number; success: boolean }> => {
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return { collectionId, success: false };
    }

    try {
      const tx = await contract.updateFloorPrice(
        collectionId,
        ethers.parseEther(newFloorPrice)
      );
      await tx.wait();
      showToast("Floor price updated successfully!", "success");
      return { collectionId, success: true };
    } catch (error: any) {
      console.error("Error updating floor price:", error);
      showToast("Failed to update floor price", "error");
      return { collectionId, success: false };
    }
  };

  const updateRoyaltyPercentage = async (
    collectionId: number,
    newPercentage: number
  ): Promise<{ collectionId: number; success: boolean }> => {
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return { collectionId, success: false };
    }

    try {
      const tx = await contract.updateRoyaltyPercentage(
        collectionId,
        newPercentage
      );
      await tx.wait();
      showToast("Royalty percentage updated successfully!", "success");
      return { collectionId, success: true };
    } catch (error: any) {
      console.error("Error updating royalty percentage:", error);
      showToast("Failed to update royalty percentage", "error");
      return { collectionId, success: false };
    }
  };

  const placeCollectionOffer = async (
    collectionId: number,
    nftCount: number,
    duration: number,
    amount: string
  ): Promise<{ collectionId: number; success: boolean }> => {
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return { collectionId, success: false };
    }

    try {
      const tx = await contract.placeCollectionOffer(
        collectionId,
        nftCount,
        duration,
        {
          value: ethers.parseEther(amount),
        }
      );
      await tx.wait();
      showToast("Collection offer placed successfully!", "success");
      return { collectionId, success: true };
    } catch (error: any) {
      console.error("Error placing collection offer:", error);
      showToast("Failed to place collection offer", "error");
      return { collectionId, success: false };
    }
  };

  const withdrawCollectionOffer = async (
    collectionId: number
  ): Promise<{ collectionId: number; success: boolean }> => {
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return { collectionId, success: false };
    }

    try {
      const tx = await contract.withdrawCollectionOffer(collectionId);
      await tx.wait();
      showToast("Collection offer withdrawn successfully!", "success");
      return { collectionId, success: true };
    } catch (error: any) {
      console.error("Error withdrawing collection offer:", error);
      showToast("Failed to withdraw collection offer", "error");
      return { collectionId, success: false };
    }
  };

  const acceptCollectionOffer = async (
    collectionId: number,
    tokenIds: number[],
    offerer: string
  ): Promise<{ collectionId: number; success: boolean }> => {
    if (!contract || !isContractReady || !nftContract) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return { collectionId, success: false };
    }

    // Approve collection contract to handle NFTs if not already approved
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
      const tx = await contract.acceptCollectionOffer(
        collectionId,
        tokenIds,
        offerer
      );
      await tx.wait();
      showToast("Collection offer accepted successfully!", "success");
      return { collectionId, success: true };
    } catch (error: any) {
      console.error("Error accepting collection offer:", error);
      showToast("Failed to accept collection offer", "error");
      return { collectionId, success: false };
    }
  };

  const fetchCollectionOffers = async (collectionId: number) => {
    try {
      setIsLoading(true);
      const result = await getCollectionOffers(collectionId);
      return result.data || null;
    } catch (error: any) {
      console.error("Error fetching collection offers:", error);
      showToast("Failed to fetch collection offers", "error");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCollections = async (offset: number, limit: number) => {
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return null;
    }

    try {
      setIsLoading(true);
      const result = await getCollections(offset, limit);
      return result.data || null;
    } catch (error: any) {
      console.error("Error fetching collections:", error);
      showToast("Failed to fetch collections", "error");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCollectionDetails = async (collectionId: number) => {
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return null;
    }

    try {
      setIsLoading(true);
      const result = await getCollectionDetails(collectionId);
      return result.data || null;
    } catch (error: any) {
      console.error("Error fetching collection details:", error);
      showToast("Failed to fetch collection details", "error");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMintedNFTs = async (collectionId: number) => {
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return null;
    }

    try {
      setIsLoading(true);
      const result = await getMintedNFTs(collectionId);
      return result.data || null;
    } catch (error: any) {
      console.error("Error fetching minted NFTs:", error);
      showToast("Failed to fetch minted NFTs", "error");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserCreatedCollections = async (user: string) => {
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return null;
    }

    try {
      setIsLoading(true);
      const result = await getUserCreatedCollections(user);
      return result.data || null;
    } catch (error: any) {
      console.error("Error fetching user created collections:", error);
      showToast("Failed to fetch user created collections", "error");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserCollectionOffers = async (user: string) => {
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return null;
    }

    try {
      setIsLoading(true);
      const result = await getUserCollectionOffers(user);
      return result.data || null;
    } catch (error: any) {
      console.error("Error fetching user collection offers:", error);
      showToast("Failed to fetch user collection offers", "error");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOfferById = async (offerId: number) => {
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return null;
    }

    try {
      setIsLoading(true);
      const result = await getOfferById(offerId);
      return result.data || null;
    } catch (error: any) {
      console.error("Error fetching offer:", error);
      showToast("Failed to fetch offer details", "error");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    contract,
    isLoading,
    isContractReady,
    createCollection,
    mintNFT,
    updateFloorPrice,
    updateRoyaltyPercentage,
    placeCollectionOffer,
    withdrawCollectionOffer,
    acceptCollectionOffer,
    getCollectionOffers: fetchCollectionOffers,
    getCollections: fetchCollections,
    getCollectionDetails: fetchCollectionDetails,
    getMintedNFTs: fetchMintedNFTs,
    getUserCreatedCollections: fetchUserCreatedCollections,
    getUserCollectionOffers: fetchUserCollectionOffers,
    verifyCollectionCreator,
    getOfferById: fetchOfferById,
  };

  return (
    <NFTCollectionsContext.Provider value={value}>
      {children}
    </NFTCollectionsContext.Provider>
  );
};
