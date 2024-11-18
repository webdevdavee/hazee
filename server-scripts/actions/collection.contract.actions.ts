"use server";

import { ethers } from "ethers";
import { collectionsContractABI } from "@/backend/abi/NFTCollectionsABI";
import { NFTCollectionsContractAddress } from "@/backend/constants";
import {
  getBatchCollections,
  getSingleCollection,
} from "@/server-scripts/database/actions/collection.action";

const getProvider = () => {
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  // const rpcUrl = "http://127.0.0.1:8545"; // Update with your production RPC URL
  if (!rpcUrl) throw new Error("Missing RPC URL configuration");
  return new ethers.JsonRpcProvider(rpcUrl);
};

// Initialize contract
const getContract = async () => {
  const provider = getProvider();
  return new ethers.Contract(
    NFTCollectionsContractAddress,
    collectionsContractABI,
    provider
  );
};

// Get paginated collections
export const getCollections = async (
  offset: number,
  limit: number
): Promise<{
  success: boolean;
  data?: { collections: CollectionInfo[]; totalCollectionsCount: number };
  error?: string;
}> => {
  try {
    const contract = await getContract();
    const totalCount = Number(await contract.collectionCounter());

    if (totalCount === 0) {
      return {
        success: true,
        data: {
          collections: [],
          totalCollectionsCount: 0,
        },
      };
    }

    const collectionsData = await contract.getCollections(offset, limit);

    // Format blockchain data
    const formattedCollections: CollectionInfo[] = collectionsData.map(
      (collection: any) => ({
        collectionId: Number(collection.collectionId),
        creator: collection.creator,
        nftContract: collection.nftContract,
        maxSupply: Number(collection.maxSupply),
        mintedSupply: Number(collection.mintedSupply),
        royaltyPercentage: Number(collection.royaltyPercentage),
        floorPrice: ethers.formatEther(collection.floorPrice),
        isActive: collection.isActive,
      })
    );

    // Get MongoDB metadata
    const collectionIds = formattedCollections.map((c) => c.collectionId);
    const metadataCollections = await getBatchCollections(collectionIds);

    // Merge data
    const completeCollections = formattedCollections.map((collection) => {
      const metadata = metadataCollections.find(
        (meta) => meta.collectionId === collection.collectionId
      );
      return {
        ...collection,
        name: metadata?.name || "",
        imageUrl: metadata?.imageUrl || "",
        coverPhoto: metadata?.coverPhoto || "",
        description: metadata?.description || "",
      };
    });

    return {
      success: true,
      data: {
        collections: completeCollections,
        totalCollectionsCount: totalCount,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Get collection details
export const getCollectionDetails = async (
  collectionId: number
): Promise<{ success: boolean; data?: CollectionInfo; error?: string }> => {
  try {
    // Get blockchain data
    const contract = await getContract();
    const collection = await contract.getCollectionInfo(collectionId);

    // Format blockchain data
    const formattedCollection: CollectionInfo = {
      collectionId: Number(collection.collectionId),
      creator: collection.creator,
      nftContract: collection.nftContract,
      maxSupply: Number(collection.maxSupply),
      mintedSupply: Number(collection.mintedSupply),
      royaltyPercentage: Number(collection.royaltyPercentage),
      floorPrice: ethers.formatEther(collection.floorPrice),
      isActive: collection.isActive,
    };

    // Get MongoDB metadata
    const metadata = await getSingleCollection(collectionId);

    // Merge blockchain data with metadata
    const completeCollection = {
      ...formattedCollection,
      name: metadata?.name || "",
      imageUrl: metadata?.imageUrl || "",
      coverPhoto: metadata?.coverPhoto || "",
      description: metadata?.description || "",
    };

    return {
      success: true,
      data: completeCollection,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Get minted NFTs for a collection
export const getMintedNFTs = async (
  collectionId: number
): Promise<CollectionContractResponse> => {
  try {
    const contract = await getContract();
    const mintedTokens = await contract.getMintedNFTs(collectionId);
    return {
      success: true,
      data: mintedTokens.map((id: bigint) => Number(id)),
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Get user created collections
export const getUserCreatedCollections = async (
  user: string
): Promise<{ success: boolean; data?: CollectionInfo[]; error?: string }> => {
  try {
    const contract = await getContract();
    const collectionIds = await contract.getUserCreatedCollections(user);

    if (collectionIds.length === 0) {
      return { success: true, data: [] };
    }

    const numericCollectionIds = collectionIds.map((id: bigint) => Number(id));

    // Get blockchain data
    const collections = await Promise.all(
      numericCollectionIds.map(async (id: number) => {
        const collection = await contract.getCollectionInfo(id);
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

    // Get MongoDB metadata
    const metadataCollections = await getBatchCollections(numericCollectionIds);

    // Merge data
    const completeCollections = collections.map((collection) => {
      const metadata = metadataCollections.find(
        (meta) => meta.collectionId === collection.collectionId
      );
      return {
        ...collection,
        name: metadata?.name || "",
        imageUrl: metadata?.imageUrl || "",
        coverPhoto: metadata?.coverPhoto || "",
        description: metadata?.description || "",
      };
    });

    return { success: true, data: completeCollections };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Get user collection offers
export const getUserCollectionOffers = async (
  user: string
): Promise<{ success: boolean; data?: CollectionOffer[]; error?: string }> => {
  try {
    const contract = await getContract();
    const offers = await contract.getUserCollectionOffers(user);

    if (!offers || offers.length === 0) {
      return { success: true, data: [] };
    }

    const formattedOffers: CollectionOffer[] = offers
      .filter((offer: any) => offer.isActive)
      .map((offer: any) => ({
        offer: Number(offer.offerId),
        collectionId: Number(offer.collectionId),
        offerer: offer.offerer,
        amount: ethers.formatEther(offer.amount),
        nftCount: Number(offer.nftCount),
        timestamp: Number(offer.timestamp),
        expirationTime: Number(offer.expirationTime),
        isActive: offer.isActive,
        status: Number(offer.status),
      }));

    return {
      success: true,
      data: formattedOffers,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getCollectionOffers = async (
  collectionId: number
): Promise<{ success: boolean; data?: CollectionOffer[]; error?: string }> => {
  try {
    const contract = await getContract();
    const offers = await contract.getCollectionOffers(collectionId);

    const formattedOffers: CollectionOffer[] = offers.map((offer: any) => ({
      offerId: Number(offer.offerId),
      collectionId: Number(offer.collectionId),
      offerer: offer.offerer,
      amount: ethers.formatEther(offer.amount),
      nftCount: Number(offer.nftCount),
      timestamp: Number(offer.timestamp),
      expirationTime: Number(offer.expirationTime),
      isActive: offer.isActive,
      status: Number(offer.status),
    }));

    return {
      success: true,
      data: formattedOffers,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getOfferById = async (
  offerId: number
): Promise<{ success: boolean; data?: CollectionOffer; error?: string }> => {
  try {
    const contract = await getContract();
    const offer = await contract.getOfferById(offerId);

    if (!offer) {
      return { success: false, error: "Offer not found" };
    }

    const formattedOffer: CollectionOffer = {
      offerId: Number(offer.offerId),
      collectionId: Number(offer.collectionId),
      offerer: offer.offerer,
      amount: ethers.formatEther(offer.amount),
      nftCount: Number(offer.nftCount),
      timestamp: Number(offer.timestamp),
      expirationTime: Number(offer.expirationTime),
      isActive: offer.isActive,
      status: Number(offer.status),
    };

    return {
      success: true,
      data: formattedOffer,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Verify collection creator
export const verifyCollectionCreator = async (
  collection: any,
  walletAddress: string
): Promise<CollectionContractResponse> => {
  try {
    if (!collection) {
      return { success: false, error: "Collection not found" };
    }

    const isOwner =
      collection.creator.toLowerCase() === walletAddress.toLowerCase();

    return { success: true, data: isOwner };
  } catch (error: any) {
    console.error(error.message);
    return { success: false, error: "You do not own this collection" };
  }
};
