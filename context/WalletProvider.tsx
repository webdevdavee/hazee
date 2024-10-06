"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import { truncateAddress } from "@/libs/utils";

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

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  const checkIfWalletIsConnected = async () => {
    try {
      if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        const getBalance = await provider.getBalance(accounts[0].address);
        if (accounts.length > 0) {
          setWalletAddress(accounts[0].address);
          setBalance(ethers.formatEther(getBalance));
        }
      }
    } catch (error) {
      console.error("Error checking if wallet is connected:", error);
    }
  };

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);
        const getBalance = await provider.getBalance(address);
        setBalance(ethers.formatEther(getBalance));
        window.location.reload();
      } else {
        alert("Please install MetaMask or another Ethereum wallet");
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
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
