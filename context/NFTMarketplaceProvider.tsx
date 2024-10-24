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
import { nftContractABI } from "@/backend/abi/NFTABI";
import {
  NFTMarketplaceContractAddress,
  NFTContractAddress,
} from "../backend/constants";
import { useToast } from "./ToastProvider";
import { useWallet } from "./WalletProvider";

export enum SortDirection {
  ASCENDING = "asc",
  DESCENDING = "desc",
}

export enum NFTStatus {
  NONE = 0,
  SALE = 1,
  AUCTION = 2,
  BOTH = 3,
}

interface FilterOptions {
  priceSort?: SortDirection;
  collectionId?: number;
  saleType?: NFTStatus;
}

interface NFTMarketplaceContextType {
  contract: ethers.Contract | null;
  listings: NFTListing[];
  filteredListings: NFTListing[];
  isLoading: boolean;
  isContractReady: boolean;
  filters: FilterOptions;
  getActiveListings: (offset: number, limit: number) => Promise<void>;
  getListingDetails: (listingId: number) => Promise<NFTListing | null>;
  getCreatorListings: (creatorAddress: string) => Promise<NFTListing[]>;
  getCollectionListings: (collectionId: number) => Promise<NFTListing[]>;
  refreshListings: () => Promise<void>;
  listNFT: (
    nftContract: string,
    tokenId: number,
    price: string
  ) => Promise<void>;
  cancelListing: (listingId: number) => Promise<void>;
  updateListingPrice: (listingId: number, newPrice: string) => Promise<void>;
  buyNFT: (listingId: number, price: string) => Promise<void>;
  isNFTListed: (nftContract: string, tokenId: number) => Promise<boolean>;
  setFilters: (filters: FilterOptions) => void;
  clearFilters: () => void;
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

interface NFTMarketplaceProviderProps {
  children: ReactNode;
}

export const NFTMarketplaceProvider: React.FC<NFTMarketplaceProviderProps> = ({
  children,
}) => {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [nftContract, setNftContract] = useState<ethers.Contract | null>(null);
  const [listings, setListings] = useState<NFTListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isContractReady, setIsContractReady] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [filteredListings, setFilteredListings] = useState<NFTListing[]>([]);
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

          const marketplaceContract = new ethers.Contract(
            NFTMarketplaceContractAddress,
            marketplaceContractABI,
            signer
          );

          const nftContractInstance = new ethers.Contract(
            NFTContractAddress,
            nftContractABI,
            signer
          );

          // Batch state updates
          setContract(marketplaceContract);
          setNftContract(nftContractInstance);
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

  useEffect(() => {
    const applyFilters = () => {
      let result = [...listings];

      // Apply collection filter
      if (filters.collectionId !== undefined) {
        result = result.filter(
          (listing) => listing.collectionId === filters.collectionId
        );
      }

      // Apply sale type filter
      if (filters.saleType !== undefined) {
        result = result.filter(
          (listing) => listing.saleType === filters.saleType
        );
      }

      // Apply price sorting
      if (filters.priceSort) {
        result.sort((a, b) => {
          const priceA = parseFloat(a.price);
          const priceB = parseFloat(b.price);
          return filters.priceSort === SortDirection.ASCENDING
            ? priceA - priceB
            : priceB - priceA;
        });
      }

      setFilteredListings(result);
    };

    applyFilters();
  }, [listings, filters]);

  const updateFilters = (newFilters: FilterOptions) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      ...newFilters,
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const getNFTMetadata = async (tokenId: number) => {
    if (!nftContract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return;
    }

    try {
      const tokenURI = await nftContract.tokenURI(tokenId);
      const response = await fetch(tokenURI);
      const metadata = await response.json();

      return {
        name: metadata.name,
        description: metadata.description,
        imageUrl: metadata.image,
      };
    } catch (error) {
      console.error("Error fetching NFT metadata:", error);
      return {
        name: `NFT #${tokenId}`,
        description: "Metadata unavailable",
        imageUrl: "",
      };
    }
  };

  const getListingDetails = async (
    listingId: number
  ): Promise<NFTListing | null> => {
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return null;
    }

    try {
      const listing = await contract.getListingDetails(listingId);
      const metadata = await getNFTMetadata(listing.tokenId);

      return {
        listingId,
        seller: listing.seller,
        nftContract: listing.nftContract,
        tokenId: Number(listing.tokenId),
        price: ethers.formatEther(listing.price),
        collectionId: Number(listing.collectionId),
        isActive: listing.isActive,
        saleType: Number(listing.saleType),
        ...metadata,
      };
    } catch (error) {
      console.error("Error fetching listing details:", error);
      showToast("Failed to fetch listing details", "error");
      return null;
    }
  };

  const getActiveListings = async (offset: number, limit: number) => {
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return;
    }

    setIsLoading(true);
    try {
      const activeListingIds = await contract.getActiveListings(offset, limit);

      const listingPromises = activeListingIds.map(
        async (listingId: number) => {
          const listing = await getListingDetails(listingId);
          if (listing) {
            // Get NFT status from the NFT contract
            const status = await nftContract?.getTokenStatus(listing.tokenId);
            return {
              ...listing,
              saleType: status,
            };
          }
          return null;
        }
      );

      const listingsData = (await Promise.all(listingPromises)).filter(
        (listing): listing is NFTListing => listing !== null
      );

      setListings(listingsData);
    } catch (error) {
      console.error("Error fetching active listings:", error);
      showToast("Failed to fetch active listings", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const getCreatorListings = async (
    creatorAddress: string
  ): Promise<NFTListing[]> => {
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return [];
    }

    try {
      const creatorListingIds = await contract.getCreatorListings(
        creatorAddress
      );

      const listingPromises = creatorListingIds.map(
        async (listingId: number) => {
          return await getListingDetails(listingId);
        }
      );

      const listingsData = (await Promise.all(listingPromises)).filter(
        (listing): listing is NFTListing => listing !== null
      );

      return listingsData;
    } catch (error) {
      console.error("Error fetching creator listings:", error);
      showToast("Failed to fetch creator listings", "error");
      return [];
    }
  };

  const getCollectionListings = async (
    collectionId: number
  ): Promise<NFTListing[]> => {
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return [];
    }

    try {
      const collectionListingIds = await contract.getCollectionListings(
        collectionId
      );

      const listingPromises = collectionListingIds.map(
        async (listingId: number) => {
          return await getListingDetails(listingId);
        }
      );

      const listingsData = (await Promise.all(listingPromises)).filter(
        (listing): listing is NFTListing => listing !== null
      );

      return listingsData;
    } catch (error) {
      console.error("Error fetching collection listings:", error);
      showToast("Failed to fetch collection listings", "error");
      return [];
    }
  };

  const refreshListings = async () => {
    if (listings.length > 0) {
      await getActiveListings(0, listings.length);
    }
  };

  const listNFT = async (
    nftContract: string,
    tokenId: number,
    price: string
  ) => {
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return;
    }

    try {
      const tx = await contract.listNFT(
        nftContract,
        tokenId,
        ethers.parseEther(price)
      );
      await tx.wait();
      showToast("NFT listed successfully", "success");
      await refreshListings();
    } catch (error) {
      console.error("Error listing NFT:", error);
      showToast("Failed to list NFT", "error");
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
      showToast("Listing cancelled successfully", "success");
      await refreshListings();
    } catch (error) {
      console.error("Error cancelling listing:", error);
      showToast("Failed to cancel listing", "error");
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
      showToast("Listing price updated successfully", "success");
      await refreshListings();
    } catch (error) {
      console.error("Error updating listing price:", error);
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
      await refreshListings();
    } catch (error) {
      console.error("Error buying NFT:", error);
      showToast("Failed to buy NFT", "error");
    }
  };

  const isNFTListed = async (
    nftContract: string,
    tokenId: number
  ): Promise<boolean> => {
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return false;
    }

    try {
      return await contract.isNFTListed(nftContract, tokenId);
    } catch (error) {
      console.error("Error checking if NFT is listed:", error);
      showToast("Failed to check if NFT is listed", "error");
      return false;
    }
  };

  const value = {
    contract,
    listings,
    filteredListings,
    isLoading,
    isContractReady,
    filters,
    getActiveListings,
    getListingDetails,
    getCreatorListings,
    getCollectionListings,
    refreshListings,
    listNFT,
    cancelListing,
    updateListingPrice,
    buyNFT,
    isNFTListed,
    setFilters: updateFilters,
    clearFilters,
  };

  return (
    <NFTMarketplaceContext.Provider value={value}>
      {children}
    </NFTMarketplaceContext.Provider>
  );
};
