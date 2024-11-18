"use server";

import { ethers } from "ethers";
import { marketplaceContractABI } from "@/backend/abi/NFTMarketplaceABI";
import { NFTMarketplaceContractAddress } from "@/backend/constants";

export interface MarketplaceResponse {
  success: boolean;
  data?: any;
  error?: string;
}

const getProvider = () => {
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  // const rpcUrl = "http://127.0.0.1:8545"; // Change later
  if (!rpcUrl) throw new Error("Missing RPC URL configuration");
  return new ethers.JsonRpcProvider(rpcUrl);
};

// Initialize contract (read-only)
const getContract = async () => {
  const provider = getProvider();
  return new ethers.Contract(
    NFTMarketplaceContractAddress,
    marketplaceContractABI,
    provider
  );
};

// Get listing details
export const getListingDetails = async (
  listingId: number
): Promise<{ success: boolean; data?: NFTListing; error?: string }> => {
  try {
    const contract = await getContract();
    const listing = await contract.getListingDetails(listingId);

    const formattedListing = {
      listingId,
      seller: listing.seller,
      tokenId: Number(listing.tokenId),
      price: ethers.formatEther(listing.price),
      collectionId: Number(listing.collectionId),
      isActive: listing.isActive,
      listingType: Number(listing.listingType),
      auctionId: Number(listing.auctionId),
    };

    return { success: true, data: formattedListing };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Get active listings
export const getActiveListings = async (
  offset: number,
  limit: number
): Promise<{ success: boolean; data?: NFTListing[]; error?: string }> => {
  try {
    const contract = await getContract();
    const activeListingIds = await contract.getActiveListings(offset, limit);

    const listingPromises = activeListingIds.map((listingId: number) =>
      getListingDetails(listingId)
    );

    const listings = await Promise.all(listingPromises);
    const validListings = listings
      .filter((response) => response.success)
      .map((response) => response.data);

    return { success: true, data: validListings };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Get creator listings
export const getCreatorListings = async (
  creatorAddress: string
): Promise<MarketplaceResponse> => {
  try {
    const contract = await getContract();
    const listingIds = await contract.getCreatorListings(creatorAddress);

    const listingPromises = listingIds.map((listingId: number) =>
      getListingDetails(listingId)
    );

    const listings = await Promise.all(listingPromises);
    const validListings = listings
      .filter((response) => response.success)
      .map((response) => response.data);

    return { success: true, data: validListings };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Get collection listings
export const getCollectionListings = async (
  collectionId: number
): Promise<{ success: boolean; data?: NFTListing[]; error?: string }> => {
  try {
    const contract = await getContract();
    const listingIds = await contract.getCollectionListings(collectionId);

    const listingPromises = listingIds.map((listingId: number) =>
      getListingDetails(listingId)
    );

    const listings = await Promise.all(listingPromises);
    const validListings = listings
      .filter((response) => response.success)
      .map((response) => response.data);

    return { success: true, data: validListings };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Check if NFT is listed
export const checkNFTListing = async (
  tokenId: number
): Promise<MarketplaceResponse> => {
  try {
    const contract = await getContract();
    const [isListed, listingId] = await contract.isNFTListed(tokenId);
    return {
      success: true,
      data: {
        isListed,
        listingId: Number(listingId), // Convert BigNumber to regular number if needed
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

enum ListingType {
  NONE,
  SALE,
  AUCTION,
  BOTH,
}

enum SortOrder {
  NONE,
  PRICE_HIGH_TO_LOW,
  PRICE_LOW_TO_HIGH,
}

interface FilterParams {
  listingType: ListingType;
  collectionId: number;
  minPrice: number;
  maxPrice: number;
  sortOrder: SortOrder;
  offset: number;
  limit: number;
}

// Get filtered listings
export const fetchFilteredListings = async (
  params: FilterParams
): Promise<{
  success: boolean;
  data?: { formattedListing: NFTListing[]; totalCount: number };
  error?: string;
}> => {
  try {
    const contract = await getContract();
    const [listings, totalCount] = await contract.getFilteredListings(params);

    const formattedListing: NFTListing[] = listings.map(
      (listing: NFTListing) => {
        return {
          listing: Number(listing.listingId),
          seller: listing.seller,
          tokenId: Number(listing.tokenId),
          price: ethers.formatEther(listing.price),
          collectionId: Number(listing.collectionId),
          isActive: listing.isActive,
          listingType: Number(listing.listingType),
          auctionId: Number(listing.auctionId),
        };
      }
    );

    return {
      success: true,
      data: {
        formattedListing,
        totalCount,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
