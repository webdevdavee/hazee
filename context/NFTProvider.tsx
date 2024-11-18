"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import { NFTContractAddress } from "@/backend/constants";
import { nftContractABI } from "@/backend/abi/NFTABI";
import { useToast } from "./ToastProvider";
import { useWallet } from "./WalletProvider";
import {
  getFullTokenInfo,
  getCreatedTokens,
  getOwnedTokens,
  verifyNFTOwnership,
  getItemsSold,
  getCurrentNFTOwner,
} from "@/server-scripts/actions/nft.contract.actions";

interface NFTContextType {
  contract: ethers.Contract | null;
  isLoading: boolean;
  isContractReady: boolean;
  mint: (
    to: string,
    tokenURI: string,
    price: string,
    collectionId: number
  ) => Promise<number | null>;
  setNFTStatus: (
    tokenId: number,
    status: number
  ) => Promise<{ tokenId: number; success: boolean }>;
  setPrice: (
    tokenId: number,
    price: string
  ) => Promise<{ tokenId: number; success: boolean }>;
  updatePrice: (
    tokenId: number,
    newPrice: string
  ) => Promise<{ tokenId: number; success: boolean }>;
  getTokenInfo: (tokenId: number) => Promise<TokenInfo | null>;
  getCreatorTokens: (creator: string) => Promise<TokenInfo[] | null>;
  getUserTokens: (owner: string) => Promise<TokenInfo[] | null>;
  getItemsSold: (seller: string) => Promise<number | null>;
  checkOwnership: (tokenId: number) => Promise<boolean>;
  getCurrentOwner: (tokenId: number) => Promise<string | null>;
}

const NFTContext = createContext<NFTContextType | undefined>(undefined);

export const useNFT = () => {
  const context = useContext(NFTContext);
  if (!context) throw new Error("useNFT must be used within an NFTProvider");
  return context;
};

export const NFTProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isContractReady, setIsContractReady] = useState(false);
  const { showToast } = useToast();
  const { walletAddress, isWalletConnected } = useWallet();

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

          const nftContract = new ethers.Contract(
            NFTContractAddress,
            nftContractABI,
            signer
          );

          setContract(nftContract);
          setIsContractReady(true);
        }
      } catch (error) {
        console.error("Contract initialization failed:", error);
        showToast("Failed to initialize contract", "error");
        setIsContractReady(false);
      }
    };

    initContract();
  }, [walletAddress, isWalletConnected]);

  // Contract write operations
  const mint = async (
    to: string,
    tokenURI: string,
    price: string,
    collectionId: number
  ): Promise<number | null> => {
    if (!contract || !isContractReady) return null;

    try {
      setIsLoading(true);
      const tx = await contract.mint(
        to,
        tokenURI,
        ethers.parseEther(price),
        collectionId
      );
      const receipt = await tx.wait();

      const event = receipt.logs.find(
        (log: any) => log.eventName === "NFTMinted"
      );
      const tokenId = event ? Number(event.args[0]) : null;

      return tokenId;
    } catch (error: any) {
      console.error("Minting failed:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const setNFTStatus = async (
    tokenId: number,
    status: number
  ): Promise<{ tokenId: number; success: boolean }> => {
    if (!contract || !isContractReady) return { tokenId, success: false };

    try {
      const tx = await contract.setNFTStatus(tokenId, status);
      await tx.wait();
      showToast("NFT status updated!", "success");
      return { tokenId, success: true };
    } catch (error: any) {
      showToast(error.message || "Failed to update status", "error");
      return { tokenId, success: false };
    }
  };

  const setPrice = async (
    tokenId: number,
    price: string
  ): Promise<{ tokenId: number; success: boolean }> => {
    if (!contract || !isContractReady) return { tokenId, success: false };

    try {
      const tx = await contract.setPrice(tokenId, ethers.parseEther(price));
      await tx.wait();
      showToast("Price set successfully!", "success");
      return { tokenId, success: true };
    } catch (error: any) {
      showToast(error.message || "Failed to set price", "error");
      return { tokenId, success: false };
    }
  };

  const updatePrice = async (
    tokenId: number,
    newPrice: string
  ): Promise<{ tokenId: number; success: boolean }> => {
    if (!contract || !isContractReady) return { tokenId, success: false };

    try {
      const tx = await contract.updatePrice(
        tokenId,
        ethers.parseEther(newPrice)
      );
      await tx.wait();
      showToast("Price updated successfully!", "success");
      return { tokenId, success: true };
    } catch (error: any) {
      showToast(error.message || "Failed to update price", "error");
      return { tokenId, success: false };
    }
  };

  // Read operations using server actions
  const getTokenInfo = async (tokenId: number): Promise<TokenInfo | null> => {
    const response = await getFullTokenInfo(tokenId);
    if (response.success && response.data) {
      return response.data;
    } else {
      return null;
    }
  };

  const getCreatorTokens = async (
    creator: string
  ): Promise<TokenInfo[] | null> => {
    const response = await getCreatedTokens(creator);
    return response.success ? response.data ?? [] : null;
  };

  const getUserTokens = async (owner: string): Promise<TokenInfo[] | null> => {
    const response = await getOwnedTokens(owner);
    return response.success ? response.data ?? [] : null;
  };

  const getSellerItemsSold = async (seller: string): Promise<number | null> => {
    const response = await getItemsSold(seller);
    return response.success ? response.data : null;
  };

  const checkOwnership = async (tokenId: number): Promise<boolean> => {
    if (!walletAddress) return false;
    const response = await verifyNFTOwnership(tokenId, walletAddress);
    return response.success ? response.data : false;
  };

  const getCurrentOwner = async (tokenId: number): Promise<string | null> => {
    const response = await getCurrentNFTOwner(tokenId);
    return response.success ? response.data : null;
  };

  const value = {
    contract,
    isLoading,
    isContractReady,
    mint,
    setNFTStatus,
    setPrice,
    updatePrice,
    getTokenInfo,
    getCreatorTokens,
    getUserTokens,
    checkOwnership,
    getItemsSold: getSellerItemsSold,
    getCurrentOwner,
  };

  return <NFTContext.Provider value={value}>{children}</NFTContext.Provider>;
};
