"use server";

export interface NFTContractResponse {
  success: boolean;
  data?: any;
  error?: string;
}

import { ethers } from "ethers";
import { NFTContractAddress } from "@/backend/constants";
import { nftContractABI } from "@/backend/abi/NFTABI";

// Initialize contract
const getProvider = () => {
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  // const rpcUrl = "http://127.0.0.1:8545"; // Change later
  if (!rpcUrl) throw new Error("Missing RPC URL configuration");
  return new ethers.JsonRpcProvider(rpcUrl);
};

const getContract = async () => {
  const provider = getProvider();
  return new ethers.Contract(NFTContractAddress, nftContractABI, provider);
};

// Fetch and cache token metadata
export const getTokenMetadata = async (
  tokenId: number
): Promise<NFTContractResponse> => {
  try {
    const contract = await getContract();
    const uri = await contract.tokenURI(tokenId);

    let metadata: NFTMetadata;
    if (uri.startsWith("ipfs://")) {
      const ipfsHash = uri.replace("ipfs://", "");
      const response = await fetch(`https://ipfs.io/ipfs/${ipfsHash}`);
      metadata = await response.json();
    } else {
      const response = await fetch(uri);
      metadata = await response.json();
    }

    return { success: true, data: metadata };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Get full token information
export const getFullTokenInfo = async (
  tokenId: number
): Promise<{ success: boolean; data?: TokenInfo; error?: string }> => {
  try {
    const contract = await getContract();
    const [price, collectionId, status, owner, metadataResponse] =
      await Promise.all([
        contract.getPrice(tokenId),
        contract.getCollection(tokenId),
        contract.getTokenStatus(tokenId),
        contract.getCurrentOwner(tokenId),
        getTokenMetadata(tokenId),
      ]);

    if (!metadataResponse.success) {
      throw new Error(metadataResponse.error);
    }

    const tokenInfo: TokenInfo = {
      tokenId,
      price: ethers.formatEther(price),
      collectionId: Number(collectionId),
      status: Number(status),
      owner,
      metadata: metadataResponse.data,
    };

    return { success: true, data: tokenInfo };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Get tokens created by an address
export const getCreatedTokens = async (
  creator: string
): Promise<{ success: boolean; data?: TokenInfo[]; error?: string }> => {
  try {
    const contract = await getContract();
    const tokenIds = await contract.getCreatedTokens(creator);

    const tokenPromises = tokenIds.map((id: bigint) =>
      getFullTokenInfo(Number(id))
    );

    const tokens = await Promise.all(tokenPromises);
    const validTokens = tokens
      .filter((response) => response.success)
      .map((response) => response.data);

    return { success: true, data: validTokens };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Get owned tokens
export const getOwnedTokens = async (
  owner: string
): Promise<{ success: boolean; data?: TokenInfo[]; error?: string }> => {
  try {
    const contract = await getContract();
    const tokenIds = await contract.getOwnedTokens(owner);

    const tokenPromises = tokenIds.map((id: bigint) =>
      getFullTokenInfo(Number(id))
    );

    const tokens = await Promise.all(tokenPromises);
    const validTokens = tokens
      .filter((response) => response.success)
      .map((response) => response.data);

    return { success: true, data: validTokens };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Get items sold
export const getItemsSold = async (
  seller: string
): Promise<NFTContractResponse> => {
  try {
    const contract = await getContract();
    const count = await contract.getItemsSold(seller);

    return {
      success: true,
      data: Number(count),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
};

// Verify NFT ownership
export const verifyNFTOwnership = async (
  tokenId: number,
  walletAddress: string
): Promise<NFTContractResponse> => {
  try {
    const contract = await getContract();
    const owner = await contract.getCurrentOwner(tokenId);
    const isOwner = owner.toLowerCase() === walletAddress.toLowerCase();

    return { success: true, data: isOwner };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getCurrentNFTOwner = async (
  tokenId: number
): Promise<NFTContractResponse> => {
  try {
    const contract = await getContract();
    const owner = await contract.getCurrentOwner(tokenId);
    return { success: true, data: owner };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
