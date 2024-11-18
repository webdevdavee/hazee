"use server";

import { ethers } from "ethers";
import { auctionContractABI } from "@/backend/abi/NFTAuctionABI";
import { NFTAuctionContractAddress } from "@/backend/constants";

export interface AuctionContractResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Initialize contract
const getProvider = () => {
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  // const rpcUrl = "http://127.0.0.1:8545";
  if (!rpcUrl) throw new Error("Missing RPC URL configuration");
  return new ethers.JsonRpcProvider(rpcUrl);
};

// Initialize contract
const getContract = async () => {
  const provider = getProvider();
  return new ethers.Contract(
    NFTAuctionContractAddress,
    auctionContractABI,
    provider
  );
};

// Get auction details
export const getAuctionDetails = async (
  auctionId: number
): Promise<{ success: boolean; data?: AuctionDetails; error?: string }> => {
  try {
    const contract = await getContract();
    const auction = await contract.getAuction(auctionId);
    const tokenId = Number(auction[1]);
    const bids = await getTokenBids(tokenId);

    if (!bids.success) {
      throw new Error(bids.error);
    }

    const auctionDetails: AuctionDetails = {
      seller: auction[0],
      tokenId: tokenId,
      startingPrice: ethers.formatEther(auction[2]),
      reservePrice: ethers.formatEther(auction[3]),
      startTime: Number(auction[4]),
      endTime: Number(auction[5]),
      highestBidder: auction[6],
      highestBid: ethers.formatEther(auction[7]),
      ended: auction[8],
      active: auction[9],
      bids: bids.data,
    };

    return { success: true, data: auctionDetails };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Get active auctions
export const getActiveAuctions = async (): Promise<AuctionContractResponse> => {
  try {
    const contract = await getContract();
    const activeAuctions = await contract.getActiveAuctions();
    return {
      success: true,
      data: activeAuctions.map(Number),
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Check if NFT is on auction
export const checkNFTAuctionStatus = async (
  tokenId: number
): Promise<{ success: boolean; data?: NFTAuctionStatus; error?: string }> => {
  try {
    const contract = await getContract();
    const [isOnAuction, auctionId] = await contract.isNFTOnAuction(tokenId);
    return {
      success: true,
      data: {
        isOnAuction,
        auctionId: Number(auctionId),
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Get token bids
export const getTokenBids = async (
  tokenId: number
): Promise<AuctionContractResponse> => {
  try {
    const contract = await getContract();
    const bids = await contract.getTokenBids(tokenId);
    const formattedBids = bids.map((bid: any) => ({
      bidder: bid.bidder,
      amount: ethers.formatEther(bid.amount),
      timestamp: Number(bid.timestamp),
    }));

    return { success: true, data: formattedBids };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Get user bids
export const getUserBids = async (
  userAddress: string
): Promise<AuctionContractResponse> => {
  try {
    const contract = await getContract();
    const userBids = await contract.getUserBids(userAddress);
    return {
      success: true,
      data: userBids.map(Number),
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
