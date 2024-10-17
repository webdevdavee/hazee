"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "..";
import User from "../models/user.model";

export const saveUser = async (
  user: {
    email: string;
    walletAddress: string;
    username: string;
    photo: string;
    coverphoto: string;
  },
  path: string
) => {
  try {
    await connectToDatabase();

    await User.create(user);
    revalidatePath(path);
  } catch (error: any) {
    throw new Error(error);
  }
};

export const getUserByWalletAddress = async (walletAddress: string) => {
  try {
    await connectToDatabase();
    const user = await User.find({ walletAddress });
    if (!user) {
      throw new Error("User not found");
    }
    return JSON.parse(JSON.stringify(user));
  } catch (error: any) {
    throw new Error(error);
  }
};

export const getUsers = async (page = 1, limit = 10) => {
  try {
    await connectToDatabase();

    // Calculate the number of documents to skip
    const skips = limit * (page - 1);

    const users = await User.find({})
      .skip(skips >= 0 ? skips : 0)
      .limit(limit > 0 ? limit : 10);

    // Get the total number of users
    const userCount = await User.find({}).countDocuments();
    const totalPages = Math.ceil(userCount / limit);

    const jobsNoLimit = await User.find({});

    return {
      users: JSON.parse(JSON.stringify(users)),
      totalPages,
      usersNoLimit: JSON.parse(JSON.stringify(jobsNoLimit)),
    };
  } catch (error: any) {
    throw new Error(error);
  }
};
