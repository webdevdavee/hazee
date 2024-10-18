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

interface NFTMarketplaceContextType {
  contract: ethers.Contract | null;
  listings: NFTListing[];
  isLoading: boolean;
  isContractReady: boolean;
  getActiveListings: (offset: number, limit: number) => Promise<void>;
  getListingDetails: (listingId: number) => Promise<NFTListing | null>;
  getUserListings: (userAddress: string) => Promise<NFTListing[]>;
  refreshListings: () => Promise<void>;
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

          setContract(marketplaceContract);

          const nftContractInstance = new ethers.Contract(
            NFTContractAddress,
            nftContractABI,
            signer
          );

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
          return await getListingDetails(listingId);
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

  const getUserListings = async (
    userAddress: string
  ): Promise<NFTListing[]> => {
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return [];
    }

    try {
      const listingCounter = await contract.listingCounter();
      const userListings: NFTListing[] = [];

      for (let i = 1; i <= listingCounter; i++) {
        const listing = await getListingDetails(i);
        if (
          listing &&
          listing.seller.toLowerCase() === userAddress.toLowerCase()
        ) {
          userListings.push(listing);
        }
      }

      return userListings;
    } catch (error) {
      console.error("Error fetching user listings:", error);
      showToast("Failed to fetch user listings", "error");
      return [];
    }
  };

  const refreshListings = async () => {
    if (listings.length > 0) {
      await getActiveListings(0, listings.length);
    }
  };

  const value = {
    contract,
    listings,
    isLoading,
    isContractReady,
    getActiveListings,
    getListingDetails,
    getUserListings,
    refreshListings,
  };

  return (
    <NFTMarketplaceContext.Provider value={value}>
      {children}
    </NFTMarketplaceContext.Provider>
  );
};
