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

interface NFTAuctionContextType {
  contract: ethers.Contract | null;
  isLoading: boolean;
  isContractReady: boolean;
  getAuctionDetails: (tokenId: number) => Promise<AuctionDetails | null>;
  getActiveAuctions: () => Promise<number[]>;
  placeBid: (tokenId: number, bidAmount: string) => Promise<boolean>;
  isNFTOnAuction: (tokenId: number) => Promise<boolean>;
  endAuction: (auctionId: number) => Promise<boolean>;
  cancelAuction: (auctionId: number) => Promise<boolean>;
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

  const getAuctionDetails = async (
    tokenId: number
  ): Promise<AuctionDetails | null> => {
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return null;
    }

    try {
      const auctionId = await contract.tokenIdToAuctionId(tokenId);
      if (auctionId.toString() === "0") {
        return null;
      }

      const auction = await contract.getAuction(auctionId);
      const bids = await contract.getAuctionBids(auctionId);

      const formattedBids: Bid[] = bids.map((bid: any) => ({
        bidder: bid.bidder,
        amount: ethers.formatEther(bid.amount),
        timestamp: Number(bid.timestamp),
      }));

      return {
        seller: auction[0],
        tokenId: Number(auction[1]),
        startingPrice: ethers.formatEther(auction[2]),
        reservePrice: ethers.formatEther(auction[3]),
        endTime: Number(auction[4]),
        highestBidder: auction[5],
        highestBid: ethers.formatEther(auction[6]),
        ended: auction[7],
        active: auction[8],
        bids: formattedBids,
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

  const placeBid = async (
    tokenId: number,
    bidAmount: string
  ): Promise<boolean> => {
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return false;
    }

    try {
      const tx = await contract.placeBid(tokenId, {
        value: ethers.parseEther(bidAmount),
      });
      await tx.wait();
      showToast("Bid placed successfully!", "success");
      return true;
    } catch (error) {
      console.error("Error placing bid:", error);
      showToast("Failed to place bid", "error");
      return false;
    }
  };

  const isNFTOnAuction = async (tokenId: number): Promise<boolean> => {
    if (!contract || !isContractReady) return false;
    try {
      return await contract.isNFTOnAuction(tokenId);
    } catch (error) {
      console.error("Error checking auction status:", error);
      return false;
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

  const value = {
    contract,
    isLoading,
    isContractReady,
    getAuctionDetails,
    getActiveAuctions,
    placeBid,
    isNFTOnAuction,
    endAuction,
    cancelAuction,
  };

  return (
    <NFTAuctionContext.Provider value={value}>
      {children}
    </NFTAuctionContext.Provider>
  );
};
