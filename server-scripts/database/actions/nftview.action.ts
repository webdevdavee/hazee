"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "../mongoConnect";
import Nftview from "../models/nftview.model";
import { headers } from "next/headers";

export async function incrementNftView(tokenId: number) {
  try {
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const userIP = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown";

    await connectToDatabase();

    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    // Create a safe key for MongoDB
    const ipKey = `${userIP.replace(/[.:]/g, "_")}`;

    const existingRecord = await Nftview.findOne({
      tokenId,
      [`uniqueViews.${ipKey}`]: { $exists: true },
    });

    if (existingRecord) {
      const lastViewTime = existingRecord.uniqueViews[ipKey];
      if (
        lastViewTime &&
        new Date(lastViewTime).getTime() > thirtyMinutesAgo.getTime()
      ) {
        return existingRecord; // Don't increment if viewed recently
      }
    }

    const result = await Nftview.findOneAndUpdate(
      { tokenId },
      {
        $inc: { viewCount: 1 },
        $set: {
          lastUpdated: new Date(),
          [`uniqueViews.${ipKey}`]: new Date(),
        },
      },
      {
        upsert: true,
        new: true,
      }
    );

    return result;
  } catch (error) {
    console.error("Error tracking view:", error);
    return null;
  }
}

export async function getNftViewStats(tokenId: number) {
  try {
    await connectToDatabase();

    const viewRecord = await Nftview.findOne({ tokenId });

    if (!viewRecord) {
      return {
        totalViews: 0,
        uniqueViews: 0,
      };
    }

    return {
      totalViews: viewRecord.viewCount || 0,
      uniqueViews: viewRecord.uniqueViews
        ? Object.keys(viewRecord.uniqueViews).length
        : 0,
      lastViewed: viewRecord.lastUpdated,
    };
  } catch (error) {
    console.error("Error fetching view stats:", error);
    return null;
  }
}
