"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "..";
import Collection from "../models/collection.model";

export const createNewCollection = async (
  collection: Collection,
  path?: string
) => {
  try {
    await connectToDatabase();

    await Collection.create(collection);

    revalidatePath(path || "/");

    return { success: "Collection created successfully!" };
  } catch (error: any) {
    console.error(error);
    return { error: "Error creating collection" };
  }
};

export const getSingleCollection = async (
  collectionId: number
): Promise<Collection | null> => {
  try {
    await connectToDatabase();
    const collection: Collection | null = await Collection.findOne({
      collectionId,
    });
    if (!collection) {
      throw new Error("Collection not found");
    }
    return JSON.parse(JSON.stringify(collection));
  } catch (error: any) {
    throw new Error(error);
  }
};
