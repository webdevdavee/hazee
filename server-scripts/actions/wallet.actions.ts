"use server";

import { ethers } from "ethers";

async function getProvider() {
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  // const rpcUrl = "http://127.0.0.1:8545"; // Change later
  if (!rpcUrl) throw new Error("Missing RPC URL configuration");

  return new ethers.JsonRpcProvider(rpcUrl);
}

export async function getWalletBalance(address: string) {
  try {
    const provider = await getProvider();
    const balance = await provider.getBalance(address);
    return {
      success: true,
      balance: ethers.formatEther(balance),
    };
  } catch (error) {
    console.error("Error fetching balance:", error);
    return {
      success: false,
      error: "Failed to fetch balance",
    };
  }
}
