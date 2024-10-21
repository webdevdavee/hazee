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
import { NFTAuctionContractAddress } from "../backend/constants";
import { useToast } from "./ToastProvider";
import { useWallet } from "./WalletProvider";

interface NFTAuctionStatus {
  isOnAuction: boolean;
  auctionId: number;
}
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
  getAuctionDetails: (auctionId: number) => Promise<AuctionDetails | null>;
  getActiveAuctions: () => Promise<number[]>;
  placeBid: (tokenId: number) => Promise<boolean>;
  isNFTOnAuction: (tokenId: number) => Promise<NFTAuctionStatus>;
  endAuction: (auctionId: number) => Promise<boolean>;
  cancelAuction: (auctionId: number) => Promise<boolean>;
  withdrawBid: (auctionId: number) => Promise<boolean>;
  getTokenBids: (tokenId: number) => Promise<Bid[]>;
  getUserBids: (userAddress: string) => Promise<number[]>;
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

interface NFTAuctionProviderProps {
  children: ReactNode;
}

export const NFTAuctionProvider: React.FC<NFTAuctionProviderProps> = ({
  children,
}) => {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
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

          const auctionContract = new ethers.Contract(
            NFTAuctionContractAddress,
            auctionContractABI,
            signer
          );

          setContract(auctionContract);
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

  const createAuction = async (
    tokenId: number,
    startingPrice: string,
    reservePrice: string,
    duration: number
  ): Promise<boolean> => {
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return false;
    }

    try {
      const tx = await contract.createAuction(
        tokenId,
        ethers.parseEther(startingPrice),
        ethers.parseEther(reservePrice),
        duration
      );
      await tx.wait();
      showToast("Auction created successfully!", "success");
      return true;
    } catch (error) {
      console.error("Error creating auction:", error);
      showToast("Failed to create auction", "error");
      return false;
    }
  };

  const getAuctionDetails = async (
    auctionId: number
  ): Promise<AuctionDetails | null> => {
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return null;
    }

    try {
      const auction = await contract.getAuction(auctionId);
      const tokenId = Number(auction[1]);
      const bids = await getTokenBids(tokenId);

      return {
        seller: auction[0],
        tokenId: tokenId,
        startingPrice: ethers.formatEther(auction[2]),
        reservePrice: ethers.formatEther(auction[3]),
        endTime: Number(auction[4]),
        highestBidder: auction[5],
        highestBid: ethers.formatEther(auction[6]),
        ended: auction[7],
        active: auction[8],
        bids: bids,
      };
    } catch (error) {
      console.error("Error fetching auction details:", error);
      showToast("Failed to fetch auction details", "error");
      return null;
    }
  };

  const getActiveAuctions = async (): Promise<number[]> => {
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return [];
    }

    try {
      const activeAuctions = await contract.getActiveAuctions();
      return activeAuctions.map(Number);
    } catch (error) {
      console.error("Error fetching active auctions:", error);
      showToast("Failed to fetch active auctions", "error");
      return [];
    }
  };

  const placeBid = async (tokenId: number): Promise<boolean> => {
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return false;
    }

    try {
      const tx = await contract.placeBid(tokenId);
      await tx.wait();
      showToast("Bid placed successfully!", "success");
      return true;
    } catch (error) {
      console.error("Error placing bid:", error);
      showToast("Failed to place bid", "error");
      return false;
    }
  };

  const isNFTOnAuction = async (tokenId: number): Promise<NFTAuctionStatus> => {
    if (!contract || !isContractReady)
      return { isOnAuction: false, auctionId: 0 };

    try {
      const [isOnAuction, auctionId] = await contract.isNFTOnAuction(tokenId);
      return {
        isOnAuction,
        auctionId: Number(auctionId),
      };
    } catch (error) {
      console.error("Error checking auction status:", error);
      return { isOnAuction: false, auctionId: 0 };
    }
  };

  const endAuction = async (auctionId: number): Promise<boolean> => {
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return false;
    }

    try {
      const tx = await contract.endAuction(auctionId);
      await tx.wait();
      showToast("Auction ended successfully!", "success");
      return true;
    } catch (error) {
      console.error("Error ending auction:", error);
      showToast("Failed to end auction", "error");
      return false;
    }
  };

  const cancelAuction = async (auctionId: number): Promise<boolean> => {
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return false;
    }

    try {
      const tx = await contract.cancelAuction(auctionId);
      await tx.wait();
      showToast("Auction cancelled successfully!", "success");
      return true;
    } catch (error) {
      console.error("Error cancelling auction:", error);
      showToast("Failed to cancel auction", "error");
      return false;
    }
  };

  const withdrawBid = async (auctionId: number): Promise<boolean> => {
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return false;
    }

    try {
      const tx = await contract.withdrawBid(auctionId);
      await tx.wait();
      showToast("Bid withdrawn successfully!", "success");
      return true;
    } catch (error) {
      console.error("Error withdrawing bid:", error);
      showToast("Failed to withdraw bid", "error");
      return false;
    }
  };

  const getTokenBids = async (tokenId: number): Promise<Bid[]> => {
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return [];
    }

    try {
      const bids = await contract.getTokenBids(tokenId);
      return bids.map((bid: any) => ({
        bidder: bid.bidder,
        amount: ethers.formatEther(bid.amount),
        timestamp: Number(bid.timestamp),
      }));
    } catch (error) {
      console.error("Error fetching token bids:", error);
      showToast("Failed to fetch token bids", "error");
      return [];
    }
  };

  const getUserBids = async (userAddress: string): Promise<number[]> => {
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return [];
    }

    try {
      const userBids = await contract.getUserBids(userAddress);
      return userBids.map(Number);
    } catch (error) {
      console.error("Error fetching user bids:", error);
      showToast("Failed to fetch user bids", "error");
      return [];
    }
  };

  const value = {
    contract,
    isLoading,
    isContractReady,
    createAuction,
    getAuctionDetails,
    getActiveAuctions,
    placeBid,
    isNFTOnAuction,
    endAuction,
    cancelAuction,
    withdrawBid,
    getTokenBids,
    getUserBids,
  };

  return (
    <NFTAuctionContext.Provider value={value}>
      {children}
    </NFTAuctionContext.Provider>
  );
};
