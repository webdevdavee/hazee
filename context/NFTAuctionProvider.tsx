"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { ethers } from "ethers";
import { auctionContractABI } from "@/backend/abi/NFTAuctionABI";
import { NFTAuctionContractAddress } from "@/backend/constants";
import { useToast } from "./ToastProvider";
import { useWallet } from "./WalletProvider";
import {
  getAuctionDetails,
  getActiveAuctions,
  checkNFTAuctionStatus,
  getTokenBids,
  getUserBids,
} from "@/server-scripts/actions/auction.contract.action";
import { useNFT } from "./NFTProvider";

interface NFTAuctionContextType {
  contract: ethers.Contract | null;
  isLoading: boolean;
  isContractReady: boolean;
  createAuction: (
    tokenId: number,
    startingPrice: string,
    reservePrice: string,
    duration: number
  ) => Promise<boolean>;
  getAuctionDetails: (
    auctionId: number
  ) => Promise<AuctionDetails | null | undefined>;
  getActiveAuctions: () => Promise<number[]>;
  placeBid: (tokenId: number, bidAmount: string) => Promise<boolean>;
  isNFTOnAuction: (tokenId: number) => Promise<NFTAuctionStatus | undefined>;
  endAuction: (auctionId: number) => Promise<boolean>;
  cancelAuction: (auctionId: number) => Promise<boolean>;
  withdrawBid: (auctionId: number) => Promise<boolean>;
  getTokenBids: (tokenId: number) => Promise<Bid[]>;
  getUserBids: (userAddress: string) => Promise<number[]>;
  cancelAuctionForDirectSale: (auctionId: number) => Promise<boolean>;
}

const NFTAuctionContext = createContext<NFTAuctionContextType | undefined>(
  undefined
);

export const useNFTAuction = () => {
  const context = useContext(NFTAuctionContext);
  if (!context) {
    throw new Error("useNFTAuction must be used within an NFTAuctionProvider");
  }
  return context;
};

export const NFTAuctionProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isContractReady, setIsContractReady] = useState(false);
  const { showToast } = useToast();
  const { walletAddress, isWalletConnected } = useWallet();
  const { contract: nftContract, isContractReady: isNFTContractReady } =
    useNFT();

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

          const auctionContract = new ethers.Contract(
            NFTAuctionContractAddress,
            auctionContractABI,
            signer
          );

          setContract(auctionContract);
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

  // Write operations that need signer
  const createAuction = async (
    tokenId: number,
    startingPrice: string,
    reservePrice: string,
    duration: number
  ): Promise<boolean> => {
    if (!contract || !isContractReady || !nftContract || !isNFTContractReady) {
      showToast("Contract not initialized", "error");
      return false;
    }

    try {
      setIsLoading(true);
      // Approve auction contract to handle NFTs
      const approveTx = await nftContract.setApprovalForAll(
        NFTAuctionContractAddress,
        true
      );
      await approveTx.wait();

      const tx = await contract.createAuction(
        tokenId,
        ethers.parseEther(startingPrice),
        ethers.parseEther(reservePrice),
        duration
      );
      await tx.wait();
      showToast("Auction created successfully!", "success");
      return true;
    } catch (error: any) {
      console.error("Creating auction failed:", error);
      showToast("Failed to create auction", "error");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const placeBid = async (
    tokenId: number,
    bidAmount: string
  ): Promise<boolean> => {
    if (!contract || !isContractReady) {
      showToast("Contract not initialized", "error");
      return false;
    }

    try {
      const tx = await contract.placeBid(tokenId, {
        value: ethers.parseEther(bidAmount),
      });
      await tx.wait();
      showToast("Bid placed successfully!", "success");
      return true;
    } catch (error: any) {
      console.error("Failed to place bid", error.message);
      showToast("Failed to place bid", "error");
      return false;
    }
  };

  const endAuction = async (auctionId: number): Promise<boolean> => {
    if (!contract || !isContractReady) {
      showToast("Contract not initialized", "error");
      return false;
    }

    try {
      const tx = await contract.endAuction(auctionId);
      await tx.wait();
      showToast("Auction ended successfully!", "success");
      return true;
    } catch (error: any) {
      console.error("Failed to end auction", error.message);
      showToast("Failed to end auction", "error");
      return false;
    }
  };

  const cancelAuction = async (auctionId: number): Promise<boolean> => {
    if (!contract || !isContractReady) {
      showToast("Contract not initialized", "error");
      return false;
    }

    try {
      const tx = await contract.cancelAuction(auctionId);
      await tx.wait();
      showToast("Auction cancelled successfully!", "success");
      return true;
    } catch (error: any) {
      console.error("Failed to cancel auction", error.message);
      showToast("Failed to cancel auction", "error");
      return false;
    }
  };

  const withdrawBid = async (auctionId: number): Promise<boolean> => {
    if (!contract || !isContractReady) {
      showToast("Contract not initialized", "error");
      return false;
    }

    try {
      const tx = await contract.withdrawBid(auctionId);
      await tx.wait();
      showToast("Bid withdrawn successfully!", "success");
      return true;
    } catch (error: any) {
      console.error("Failed to withdraw bid", error.message);
      showToast("Failed to withdraw bid", "error");
      return false;
    }
  };

  // Read operations using server actions
  const getAuctionDetailsFromServer = async (auctionId: number) => {
    const response = await getAuctionDetails(auctionId);
    return response.success ? response.data : null;
  };

  const getActiveAuctionsFromServer = async () => {
    const response = await getActiveAuctions();
    return response.success ? response.data : [];
  };

  const isNFTOnAuctionFromServer = async (tokenId: number) => {
    const response = await checkNFTAuctionStatus(tokenId);
    return response.success
      ? response.data
      : { isOnAuction: false, auctionId: 0 };
  };

  const getTokenBidsFromServer = async (tokenId: number) => {
    const response = await getTokenBids(tokenId);
    return response.success ? response.data : [];
  };

  const getUserBidsFromServer = async (userAddress: string) => {
    const response = await getUserBids(userAddress);
    return response.success ? response.data : [];
  };

  const cancelAuctionForDirectSale = async (
    auctionId: number
  ): Promise<boolean> => {
    if (!contract || !isContractReady) {
      showToast("Contract not initialized", "error");
      return false;
    }

    try {
      setIsLoading(true);
      const tx = await contract.cancelAuctionForDirectSale(auctionId);
      await tx.wait();
      showToast("Auction cancelled for direct sale successfully!", "success");
      return true;
    } catch (error: any) {
      console.error("Failed to cancel auction for direct sale:", error.message);
      showToast("Failed to cancel auction for direct sale", "error");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    contract,
    isLoading,
    isContractReady,
    createAuction,
    getAuctionDetails: getAuctionDetailsFromServer,
    getActiveAuctions: getActiveAuctionsFromServer,
    placeBid,
    isNFTOnAuction: isNFTOnAuctionFromServer,
    endAuction,
    cancelAuction,
    withdrawBid,
    getTokenBids: getTokenBidsFromServer,
    getUserBids: getUserBidsFromServer,
    cancelAuctionForDirectSale,
  };

  return (
    <NFTAuctionContext.Provider value={value}>
      {children}
    </NFTAuctionContext.Provider>
  );
};
