"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { ethers } from "ethers";
import { collectionsContractABI } from "@/backend/abi/NFTCollectionsABI";
import { NFTCollectionsContractAddress } from "../backend/constants";
import { useToast } from "./ToastProvider";
import { useWallet } from "./WalletProvider";

interface NFTCollectionsContextType {
  contract: ethers.Contract | null;
  collections: CollectionInfo[];
  isLoading: boolean;
  isContractReady: boolean;
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
    duration: number
  ) => Promise<{ collectionId: number; success: boolean }>;
  withdrawCollectionOffer: (
    collectionId: number
  ) => Promise<{ collectionId: number; success: boolean }>;
  acceptCollectionOffer: (
    collectionId: number,
    tokenIds: number[],
    offerer: string
  ) => Promise<{ collectionId: number; success: boolean }>;
  getUserCreatedCollections: (user: string) => Promise<CollectionInfo[] | null>;
  getUserCollectionOffers: (user: string) => Promise<CollectionOffer[] | null>;
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

interface NFTCollectionsProviderProps {
  children: ReactNode;
}

export const NFTCollectionsProvider: React.FC<NFTCollectionsProviderProps> = ({
  children,
}) => {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isContractReady, setIsContractReady] = useState(false);
  const { showToast } = useToast();
  const { walletAddress, isWalletConnected } = useWallet();

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
        console.log("Failed to initialize the contract");
        console.error(err);
        showToast("Failed to initialize the contract", "error");
        setIsContractReady(false);
      }
    };

    initContract();
  }, [walletAddress, isWalletConnected]);

  const getCollections = async (
    offset: number,
    limit: number
  ): Promise<{
    collections: CollectionInfo[];
    totalCollectionsCount: number;
  } | null> => {
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return null;
    }

    setIsLoading(true);
    try {
      // First get the total count to handle offset appropriately
      const totalCollectionCount = await contract.collectionCounter();
      const totalCount = Number(totalCollectionCount);

      // If there are no collections, return early
      if (totalCount === 0) {
        return {
          collections: [],
          totalCollectionsCount: 0,
        };
      }

      // Adjust offset if needed
      const adjustedOffset = offset >= totalCount ? totalCount - 1 : offset;

      const collectionsData = await contract.getCollections(
        adjustedOffset,
        limit
      );
      const formattedCollections = collectionsData.map((collection: any) => ({
        ...collection,
        floorPrice: ethers.formatEther(collection.floorPrice),
      }));
      setCollections(formattedCollections);

      return {
        collections: formattedCollections,
        totalCollectionsCount: totalCount,
      };
    } catch (error) {
      console.error("Error fetching collections:", error);
      showToast("Failed to fetch collections", "error");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getCollectionDetails = async (
    collectionId: number
  ): Promise<CollectionInfo | null> => {
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return null;
    }

    try {
      const collection = await contract.getCollectionInfo(collectionId);
      return {
        ...collection,
        floorPrice: ethers.formatEther(collection.floorPrice),
      };
    } catch (error) {
      console.error("Error fetching collection details:", error);
      showToast("Failed to fetch collection details", "error");
      return null;
    }
  };

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

      showToast("Collection created successfully!", "success");
      return collectionId;
    } catch (error) {
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
      showToast("NFT minted successfully!", "success");
      return { tokenId, collectionId };
    } catch (error) {
      console.error("Error minting NFT:", error);
      showToast("Failed to mint NFT", "error");
      return null;
    }
  };

  const getMintedNFTs = async (
    collectionId: number
  ): Promise<number[] | null> => {
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return null;
    }

    try {
      const mintedTokens = await contract.getMintedNFTs(collectionId);
      return mintedTokens.map((id: bigint) => Number(id));
    } catch (error) {
      console.error("Error fetching minted NFTs:", error);
      showToast("Failed to fetch minted NFTs", "error");
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
    } catch (error) {
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
    } catch (error) {
      console.error("Error updating royalty percentage:", error);
      showToast("Failed to update royalty percentage", "error");
      return { collectionId, success: false };
    }
  };

  const placeCollectionOffer = async (
    collectionId: number,
    nftCount: number,
    duration: number
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
        { value: ethers.parseEther("0.1") } // You may want to adjust this value or make it dynamic
      );
      await tx.wait();
      showToast("Collection offer placed successfully!", "success");
      return { collectionId, success: true };
    } catch (error) {
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
    } catch (error) {
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
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return { collectionId, success: false };
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
    } catch (error) {
      console.error("Error accepting collection offer:", error);
      showToast("Failed to accept collection offer", "error");
      return { collectionId, success: false };
    }
  };

  const getUserCreatedCollections = async (
    user: string
  ): Promise<CollectionInfo[] | null> => {
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return null;
    }

    try {
      // Get all collection IDs created by the user
      const collectionIds = await contract.getUserCreatedCollections(user);

      if (collectionIds.length === 0) {
        return [];
      }

      const collections = await Promise.all(
        collectionIds.map(async (id: bigint) => {
          const collection = await contract.getCollectionInfo(Number(id));
          return {
            collectionId: Number(collection.collectionId),
            creator: collection.creator,
            nftContract: collection.nftContract,
            maxSupply: Number(collection.maxSupply),
            mintedSupply: Number(collection.mintedSupply),
            royaltyPercentage: Number(collection.royaltyPercentage),
            floorPrice: ethers.formatEther(collection.floorPrice),
            isActive: collection.isActive,
          };
        })
      );

      return collections;
    } catch (error) {
      console.error("Error fetching user created collections:", error);
      showToast("Failed to fetch user created collections", "error");
      return null;
    }
  };

  const getUserCollectionOffers = async (
    user: string
  ): Promise<CollectionOffer[] | null> => {
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return null;
    }

    try {
      // Get all collection IDs where the user has placed offers
      const offerCollectionIds = await contract.getUserCollectionOffers(user);

      if (offerCollectionIds.length === 0) {
        return [];
      }

      const offers = await Promise.all(
        offerCollectionIds.map(async (id: bigint) => {
          // Get the collection offer for this specific collection and user
          const collectionId = Number(id);
          const offer = await contract.collectionOffers(collectionId, user);

          return {
            offerer: offer.offerer,
            amount: ethers.formatEther(offer.amount),
            nftCount: Number(offer.nftCount),
            timestamp: Number(offer.timestamp),
            expirationTime: Number(offer.expirationTime),
            isActive: offer.isActive,
            collectionId,
          };
        })
      );

      // Filter out inactive offers
      return offers.filter((offer) => offer.isActive);
    } catch (error) {
      console.error("Error fetching user collection offers:", error);
      showToast("Failed to fetch user collection offers", "error");
      return null;
    }
  };

  const value = {
    contract,
    collections,
    isLoading,
    isContractReady,
    getCollections,
    getCollectionDetails,
    createCollection,
    mintNFT,
    getMintedNFTs,
    updateFloorPrice,
    updateRoyaltyPercentage,
    placeCollectionOffer,
    withdrawCollectionOffer,
    acceptCollectionOffer,
    getUserCreatedCollections,
    getUserCollectionOffers,
  };

  return (
    <NFTCollectionsContext.Provider value={value}>
      {children}
    </NFTCollectionsContext.Provider>
  );
};
