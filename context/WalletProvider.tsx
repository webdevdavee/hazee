"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import { truncateAddress } from "@/libs/utils";
import { NFTCreatorsContractAddress } from "../backend/constants";
import { useToast } from "./ToastProvider";
import { creatorsContractABI } from "@/backend/abi/NFTCreatorsABI";
import { updateUserData } from "@/database/actions/user.action";

declare global {
  interface Window {
    ethereum?: ethers.Eip1193Provider;
  }
}

interface WalletContextType {
  walletAddress: string | null;
  connectWallet: () => Promise<void>;
  truncatedAddress: string | null;
  isWalletConnected: () => Promise<boolean>;
  balance: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  const checkIfWalletIsConnected = async () => {
    try {
      if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setWalletAddress(accounts[0].address);
          const getBalance = await provider.getBalance(accounts[0].address);
          setBalance(ethers.formatEther(getBalance));
        }
      }
    } catch (error) {
      console.error("Error checking if wallet is connected:", error);
      showToast("Failed to check wallet connection", "error");
    }
  };

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== "undefined") {
        // Reset the connection to clear cached nonces
        const provider = new ethers.BrowserProvider(window.ethereum, "any");

        // Request accounts and switch to the correct network
        await provider.send("eth_requestAccounts", []);

        // Get network details
        const network = await provider.getNetwork();
        console.log("Connected to network:", network.chainId);

        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();
        setWalletAddress(userAddress);

        // Get and reset the nonce if necessary
        const nonce = await provider.getTransactionCount(userAddress);

        const getBalance = await provider.getBalance(userAddress);
        setBalance(ethers.formatEther(getBalance));

        showToast("Wallet connected successfully", "success");

        // Save user's wallet address in MongoDB database
        await updateUserData({ walletAddress: userAddress });

        const creatorContract = new ethers.Contract(
          NFTCreatorsContractAddress,
          creatorsContractABI,
          signer
        );

        try {
          const isRegistered = await creatorContract.isAddressRegistered(
            userAddress
          );
          if (!isRegistered) {
            console.log("Registering as a creator...");
            const tx = await creatorContract.registerCreator();
            await tx.wait();
            showToast("Registration successful", "success");
          } else {
            showToast("Already registered as a creator", "info");
          }
        } catch (checkError: any) {
          console.error("Error during contract interaction:", checkError);
          if (checkError.message.includes("nonce too high")) {
            showToast(
              "Please reset your MetaMask account and try again",
              "error"
            );
          } else {
            showToast("Error during creator registration", "error");
          }
        }
      } else {
        showToast(
          "Please install MetaMask or another Ethereum wallet",
          "error"
        );
      }
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      if (error.message.includes("nonce too high")) {
        showToast("Please reset your MetaMask account and try again", "error");
      } else {
        showToast("Failed to connect wallet. Please try again.", "error");
      }
    }
  };

  const isWalletConnected = async (): Promise<boolean> => {
    if (!walletAddress) return false;

    try {
      if (
        typeof window !== "undefined" &&
        typeof window.ethereum !== "undefined"
      ) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        return accounts.some(
          (account) =>
            account.address.toLowerCase() === walletAddress.toLowerCase()
        );
      }
    } catch (error) {
      console.error("Error checking wallet connection:", error);
      showToast("Error checking wallet connection", "error");
    }

    return false;
  };

  const truncatedAddress = walletAddress
    ? truncateAddress(walletAddress)
    : "Connect Wallet";

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        connectWallet,
        truncatedAddress,
        isWalletConnected,
        balance,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
