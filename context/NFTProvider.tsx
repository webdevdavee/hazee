"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { ethers } from "ethers";
import { nftContractABI } from "@/backend/abi/NFTABI";
import { NFTContractAddress } from "@/backend/constants";
import { useToast } from "./ToastProvider";
import { useWallet } from "./WalletProvider";

interface NFTContextType {
  contract: ethers.Contract | null;
  isLoading: boolean;
  isContractReady: boolean;
  mint: (
    to: string,
    tokenURI: string,
    price: string,
    collectionId: number
  ) => Promise<number | null>;
  setNFTStatus: (
    tokenId: number,
    status: number
  ) => Promise<{ tokenId: number; success: boolean }>;
  setPrice: (
    tokenId: number,
    price: string
  ) => Promise<{ tokenId: number; success: boolean }>;
  updatePrice: (
    tokenId: number,
    newPrice: string
  ) => Promise<{ tokenId: number; success: boolean }>;
  getPrice: (tokenId: number) => Promise<string | null>;
  getCollection: (tokenId: number) => Promise<number | null>;
  getTokenStatus: (tokenId: number) => Promise<number | null>;
  getCreatedTokens: (creator: string) => Promise<TokenInfo[] | null>;
  getItemsSold: (seller: string) => Promise<number | null>;
  getOwnedTokens: (owner: string) => Promise<TokenInfo[] | null>;
  getCurrentOwner: (tokenId: number) => Promise<string | null>;
  exists: (tokenId: number) => Promise<boolean>;
  getTokenMetadata: (tokenId: number) => Promise<NFTMetadata | null>;
  getFullTokenInfo: (tokenId: number) => Promise<TokenInfo | null>;
}

const NFTContext = createContext<NFTContextType | undefined>(undefined);

export const useNFT = () => {
  const context = useContext(NFTContext);
  if (!context) {
    throw new Error("useNFT must be used within an NFTProvider");
  }
  return context;
};

interface NFTProviderProps {
  children: ReactNode;
}

export const NFTProvider: React.FC<NFTProviderProps> = ({ children }) => {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isContractReady, setIsContractReady] = useState(false);
  const { showToast } = useToast();
  const { walletAddress, isWalletConnected } = useWallet();

  useEffect(() => {
    const initContract = async () => {
      if (!(await isWalletConnected())) {
        setIsContractReady(false);
        setContract(null);
        return;
      }

      try {
        if (typeof window.ethereum !== "undefined") {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();

          const nftContract = new ethers.Contract(
            NFTContractAddress,
            nftContractABI,
            signer
          );

          setContract(nftContract);
          setIsContractReady(true);
        } else {
          console.log("Ethereum object not found");
          showToast(
            "We couldn't find an Ethereum provider. Do you have MetaMask installed?",
            "error"
          );
          setIsContractReady(false);
        }
      } catch (err) {
        console.error("Failed to initialize the contract:", err);
        showToast("Failed to initialize the contract", "error");
        setIsContractReady(false);
      }
    };

    initContract();
  }, [walletAddress, isWalletConnected]);

  const checkContractReady = () => {
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return false;
    }
    return true;
  };

  const getTokenMetadata = async (
    tokenId: number
  ): Promise<NFTMetadata | null> => {
    if (!checkContractReady()) return null;

    try {
      const uri = await contract!.tokenURI(tokenId);
      let metadata: NFTMetadata;

      if (uri.startsWith("ipfs://")) {
        const ipfsHash = uri.replace("ipfs://", "");
        const response = await fetch(`https://ipfs.io/ipfs/${ipfsHash}`);
        metadata = await response.json();
      } else {
        const response = await fetch(uri);
        metadata = await response.json();
      }

      return metadata;
    } catch (error) {
      console.error("Error fetching token metadata:", error);
      showToast("Failed to fetch token metadata", "error");
      return null;
    }
  };

  const getFullTokenInfo = async (
    tokenId: number
  ): Promise<TokenInfo | null> => {
    if (!checkContractReady()) return null;

    try {
      const [price, collectionId, status, owner, metadata] = await Promise.all([
        contract!.getPrice(tokenId),
        contract!.getCollection(tokenId),
        contract!.getTokenStatus(tokenId),
        contract!.getCurrentOwner(tokenId),
        getTokenMetadata(tokenId),
      ]);

      return {
        tokenId,
        price: ethers.formatEther(price),
        collectionId: Number(collectionId),
        status: Number(status),
        owner,
        metadata,
      };
    } catch (error) {
      console.error("Error fetching full token info:", error);
      showToast("Failed to fetch token information", "error");
      return null;
    }
  };

  const mint = async (
    to: string,
    tokenURI: string,
    price: string,
    collectionId: number
  ): Promise<number | null> => {
    if (!checkContractReady()) return null;

    try {
      setIsLoading(true);
      const tx = await contract!.mint(
        to,
        tokenURI,
        ethers.parseEther(price),
        collectionId
      );
      const receipt = await tx.wait();

      const event = receipt.logs.find(
        (log: any) => log.eventName === "NFTMinted"
      );
      const tokenId = event ? Number(event.args[0]) : null;

      showToast("NFT minted successfully!", "success");
      return tokenId;
    } catch (error) {
      console.error("Error minting NFT:", error);
      showToast("Failed to mint NFT", "error");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const setNFTStatus = async (
    tokenId: number,
    status: number
  ): Promise<{ tokenId: number; success: boolean }> => {
    if (!checkContractReady()) return { tokenId, success: false };

    try {
      const tx = await contract!.setNFTStatus(tokenId, status);
      await tx.wait();
      showToast("NFT status updated successfully!", "success");
      return { tokenId, success: true };
    } catch (error) {
      console.error("Error setting NFT status:", error);
      showToast("Failed to set NFT status", "error");
      return { tokenId, success: false };
    }
  };

  const setPrice = async (
    tokenId: number,
    price: string
  ): Promise<{ tokenId: number; success: boolean }> => {
    if (!checkContractReady()) return { tokenId, success: false };

    try {
      const tx = await contract!.setPrice(tokenId, ethers.parseEther(price));
      await tx.wait();
      showToast("Price set successfully!", "success");
      return { tokenId, success: true };
    } catch (error) {
      console.error("Error setting price:", error);
      showToast("Failed to set price", "error");
      return { tokenId, success: false };
    }
  };

  const updatePrice = async (
    tokenId: number,
    newPrice: string
  ): Promise<{ tokenId: number; success: boolean }> => {
    if (!checkContractReady()) return { tokenId, success: false };

    try {
      const tx = await contract!.updatePrice(
        tokenId,
        ethers.parseEther(newPrice)
      );
      await tx.wait();
      showToast("Price updated successfully!", "success");
      return { tokenId, success: true };
    } catch (error) {
      console.error("Error updating price:", error);
      showToast("Failed to update price", "error");
      return { tokenId, success: false };
    }
  };

  const getPrice = async (tokenId: number): Promise<string | null> => {
    if (!checkContractReady()) return null;

    try {
      const price = await contract!.getPrice(tokenId);
      return ethers.formatEther(price);
    } catch (error) {
      console.error("Error getting price:", error);
      showToast("Failed to get price", "error");
      return null;
    }
  };

  const getCollection = async (tokenId: number): Promise<number | null> => {
    if (!checkContractReady()) return null;

    try {
      const collectionId = await contract!.getCollection(tokenId);
      return Number(collectionId);
    } catch (error) {
      console.error("Error getting collection:", error);
      showToast("Failed to get collection", "error");
      return null;
    }
  };

  const getTokenStatus = async (tokenId: number): Promise<number | null> => {
    if (!checkContractReady()) return null;

    try {
      const status = await contract!.getTokenStatus(tokenId);
      return Number(status);
    } catch (error) {
      console.error("Error getting token status:", error);
      showToast("Failed to get token status", "error");
      return null;
    }
  };

  const getCreatedTokens = async (
    creator: string
  ): Promise<TokenInfo[] | null> => {
    if (!checkContractReady()) return null;

    try {
      const tokenIds = await contract!.getCreatedTokens(creator);
      const tokenPromises = tokenIds.map((id: bigint) =>
        getFullTokenInfo(Number(id))
      );

      const tokens = await Promise.all(tokenPromises);
      return tokens.filter((token): token is TokenInfo => token !== null);
    } catch (error) {
      console.error("Error getting created tokens:", error);
      showToast("Failed to get created tokens", "error");
      return null;
    }
  };

  const getItemsSold = async (seller: string): Promise<number | null> => {
    if (!checkContractReady()) return null;

    try {
      const count = await contract!.getItemsSold(seller);
      return Number(count);
    } catch (error) {
      console.error("Error getting items sold:", error);
      showToast("Failed to get items sold", "error");
      return null;
    }
  };

  const getOwnedTokens = async (owner: string): Promise<TokenInfo[] | null> => {
    if (!checkContractReady()) return null;

    try {
      const tokenIds = await contract!.getOwnedTokens(owner);
      const tokenPromises = tokenIds.map((id: bigint) =>
        getFullTokenInfo(Number(id))
      );

      const tokens = await Promise.all(tokenPromises);
      return tokens.filter((token): token is TokenInfo => token !== null);
    } catch (error) {
      console.error("Error getting owned tokens:", error);
      showToast("Failed to get owned tokens", "error");
      return null;
    }
  };

  const getCurrentOwner = async (tokenId: number): Promise<string | null> => {
    if (!checkContractReady()) return null;

    try {
      return await contract!.getCurrentOwner(tokenId);
    } catch (error) {
      console.error("Error getting current owner:", error);
      showToast("Failed to get current owner", "error");
      return null;
    }
  };

  const exists = async (tokenId: number): Promise<boolean> => {
    if (!checkContractReady()) return false;

    try {
      return await contract!.exists(tokenId);
    } catch (error) {
      console.error("Error checking token existence:", error);
      showToast("Failed to check token existence", "error");
      return false;
    }
  };

  const tokenURI = async (tokenId: number): Promise<string | null> => {
    if (!checkContractReady()) return null;

    try {
      return await contract!.tokenURI(tokenId);
    } catch (error) {
      console.error("Error getting token URI:", error);
      showToast("Failed to get token URI", "error");
      return null;
    }
  };

  const value = {
    contract,
    isLoading,
    isContractReady,
    mint,
    setNFTStatus,
    setPrice,
    updatePrice,
    getPrice,
    getCollection,
    getTokenStatus,
    getCreatedTokens,
    getItemsSold,
    getOwnedTokens,
    getCurrentOwner,
    exists,
    getTokenMetadata,
    getFullTokenInfo,
  };

  return <NFTContext.Provider value={value}>{children}</NFTContext.Provider>;
};
