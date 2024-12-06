"use server";

import { updateUserData } from "@/server-scripts/database/actions/user.action";
import { revalidatePath } from "next/cache";
import User from "../database/models/user.model";

// Store wallet data
export async function storeWalletConnection(
  walletData: WalletData,
  path?: string
) {
  // Find an existing user with the new wallet address
  let existingUser: User | null = await User.findOne({
    walletAddress: walletData.address,
  });

  try {
    await updateUserData({
      username: existingUser ? existingUser.username : "Unnamed",
      walletAddress: walletData.address,
      balance: walletData.balance,
      network: walletData.network,
    });

    revalidatePath(path || "/");
    return { success: true };
  } catch (error) {
    console.error("Error storing wallet data:", error);
    return {
      success: false,
      error: "Failed to store wallet data",
    };
  }
}
