"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import { truncateAddress } from "@/libs/utils";
import { useToast } from "./ToastProvider";
import { getWalletBalance } from "@/server-scripts/actions/wallet.actions";
import { storeWalletConnection } from "@/server-scripts/actions/user.action";

declare global {
  interface Window {
    ethereum?: ethers.Eip1193Provider & {
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (
        event: string,
        callback: (...args: any[]) => void
      ) => void;
      isMetaMask?: boolean;
    };
  }
}

interface WalletContextType {
  walletAddress: string | null;
  connectWallet: () => Promise<void>;
  truncatedAddress: string | null;
  isWalletConnected: () => Promise<boolean>;
  balance: string | null;
  isMetaMaskMobile: boolean;
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
  const [isMetaMaskMobile, setIsMetaMaskMobile] = useState(false);
  const { showToast } = useToast();

  // Environment detection
  const detectEnvironment = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|iphone|ipad|ipod/.test(userAgent);
    const isMetaMaskBrowser = userAgent.includes("metamask");
    return { isMobile, isMetaMaskBrowser };
  };

  // Enhanced connection handling
  const handleWalletConnection = async (provider: ethers.BrowserProvider) => {
    try {
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      const network = await provider.getNetwork();
      const getBalance = await provider.getBalance(userAddress);
      const balanceEther = ethers.formatEther(getBalance);

      const walletData = {
        address: userAddress,
        balance: balanceEther,
        network: {
          chainId: Number(network.chainId),
          name: network.name,
        },
      };

      const result = await storeWalletConnection(walletData);

      if (result.success) {
        setWalletAddress(userAddress);
        setBalance(balanceEther);
        // Store connection state in localStorage for persistence
        localStorage.setItem("walletConnected", "true");
        localStorage.setItem("lastConnectedAddress", userAddress);
        showToast("Wallet connected successfully", "success");
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error("Connection handling error:", error);
      throw error;
    }
  };

  // Mobile redirect handling
  const handleMobileRedirect = () => {
    const currentUrl = window.location.href;
    // Store connection attempt state
    localStorage.setItem("connectionAttempted", "true");
    localStorage.setItem("connectionTimestamp", Date.now().toString());

    // Redirect to MetaMask browser
    const metaMaskUrl = `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}${window.location.search}`;
    window.location.href = metaMaskUrl;

    // Fallback to app stores after timeout
    setTimeout(() => {
      const isAndroid = /android/i.test(navigator.userAgent);
      const appStoreUrl = isAndroid
        ? "https://play.google.com/store/apps/details?id=io.metamask"
        : "https://apps.apple.com/us/app/metamask-blockchain-wallet/id1438144202";
      window.location.href = appStoreUrl;
    }, 3000);
  };

  // Check for pending connections on load
  useEffect(() => {
    const checkPendingConnection = async () => {
      const { isMetaMaskBrowser } = detectEnvironment();
      const connectionAttempted = localStorage.getItem("connectionAttempted");
      const connectionTimestamp = localStorage.getItem("connectionTimestamp");

      // Clear old connection attempts (older than 5 minutes)
      if (
        connectionTimestamp &&
        Date.now() - parseInt(connectionTimestamp) > 300000
      ) {
        localStorage.removeItem("connectionAttempted");
        localStorage.removeItem("connectionTimestamp");
        return;
      }

      if (isMetaMaskBrowser && connectionAttempted && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          await handleWalletConnection(provider);
          // Clear connection attempt state
          localStorage.removeItem("connectionAttempted");
          localStorage.removeItem("connectionTimestamp");
        } catch (error) {
          console.error("Auto-connection error:", error);
          showToast("Failed to auto-connect wallet", "error");
        }
      }
    };

    checkPendingConnection();
  }, []);

  // Main connection function
  const connectWallet = async () => {
    const { isMobile, isMetaMaskBrowser } = detectEnvironment();

    try {
      if (isMobile && !isMetaMaskBrowser) {
        handleMobileRedirect();
        return;
      }

      if (typeof window.ethereum === "undefined") {
        showToast("Please install MetaMask or use MetaMask browser", "error");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      await handleWalletConnection(provider);
    } catch (error: any) {
      console.error("Wallet connection error:", error);
      if (error.message.includes("nonce too high")) {
        showToast(
          "Please reset your MetaMask account. Settings -> Advanced -> Reset Account",
          "error"
        );
      } else if (
        error.message.includes("eth_call") &&
        error.message.includes("block tag")
      ) {
        showToast("Network sync error. Please refresh the page", "error");
      } else {
        showToast("Failed to connect wallet. Please try again.", "error");
      }
    }
  };

  // Event handlers
  useEffect(() => {
    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        setWalletAddress(null);
        setBalance(null);
        localStorage.removeItem("walletConnected");
        localStorage.removeItem("lastConnectedAddress");
        showToast("Wallet disconnected", "info");
        window.location.reload();
      } else {
        const newAddress = accounts[0];
        setWalletAddress(newAddress);
        const balanceResult = await getWalletBalance(newAddress);
        if (balanceResult.success) {
          setBalance(balanceResult.balance as string);
        }
        localStorage.setItem("lastConnectedAddress", newAddress);
      }
    };

    const handleChainChanged = () => {
      showToast("Network changed. Reloading...", "info");
      window.location.reload();
    };

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
      window.ethereum.on("disconnect", () => {
        setWalletAddress(null);
        setBalance(null);
        localStorage.removeItem("walletConnected");
        localStorage.removeItem("lastConnectedAddress");
        showToast("Wallet disconnected", "info");
        window.location.reload();
      });

      return () => {
        window.ethereum?.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
        window.ethereum?.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, []);

  // Initial connection check
  useEffect(() => {
    const { isMetaMaskBrowser } = detectEnvironment();
    setIsMetaMaskMobile(isMetaMaskBrowser);

    const checkInitialConnection = async () => {
      const wasConnected = localStorage.getItem("walletConnected");
      const lastAddress = localStorage.getItem("lastConnectedAddress");

      if (wasConnected && lastAddress && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.listAccounts();

          if (accounts.length > 0) {
            const currentAddress = accounts[0].address;
            if (currentAddress.toLowerCase() === lastAddress.toLowerCase()) {
              setWalletAddress(currentAddress);
              const balanceResult = await getWalletBalance(currentAddress);
              if (balanceResult.success) {
                setBalance(balanceResult.balance as string);
              }
            }
          }
        } catch (error) {
          console.error("Initial connection check error:", error);
        }
      }
    };

    checkInitialConnection();
  }, []);

  const isWalletConnected = async (): Promise<boolean> => {
    if (!walletAddress) return false;

    try {
      if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        return accounts.some(
          (account) =>
            account.address.toLowerCase() === walletAddress.toLowerCase()
        );
      }
    } catch (error) {
      console.error("Connection check error:", error);
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
        isMetaMaskMobile,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
