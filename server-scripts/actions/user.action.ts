"use server";

import { updateUserData } from "@/server-scripts/database/actions/user.action";
import { revalidatePath } from "next/cache";

// Store wallet data
export async function storeWalletConnection(
  walletData: WalletData,
  path?: string
) {
  try {
    await updateUserData({
      username: "Unnamed",
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
