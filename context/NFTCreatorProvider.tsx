"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { ethers } from "ethers";
import { abi as creatorsContractABI } from "../backend/artifacts/contracts/NFTCreators.sol/NFTCreators.json";
import { NFTCreatorsContractAddress } from "../backend/constants";
import { useToast } from "./ToastProvider";
import { useWallet } from "./WalletProvider";

interface Creator {
  creatorId: number;
  userAddress: string;
  createdNFTs: number[];
  ownedNFTs: number[];
  createdCollections: number[];
  itemsSold: number;
  walletBalance: number;
}

interface NFTCreatorsContextType {
  contract: ethers.Contract | null;
  currentUser: Creator | null;
  getUserInfo: (address: string) => Promise<void>;
  isLoading: boolean;
  isContractReady: boolean;
}

const NFTCreatorsContext = createContext<NFTCreatorsContextType | undefined>(
  undefined
);

export const useNFTCreators = () => {
  const context = useContext(NFTCreatorsContext);
  if (!context) {
    throw new Error(
      "useNFTCreators must be used within an NFTCreatorsProvider"
    );
  }
  return context;
};

interface NFTCreatorsProviderProps {
  children: ReactNode;
}

export const NFTCreatorsProvider: React.FC<NFTCreatorsProviderProps> = ({
  children,
}) => {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [currentUser, setCurrentUser] = useState<Creator | null>(null);
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

          const nftCreatorsContract = new ethers.Contract(
            NFTCreatorsContractAddress,
            creatorsContractABI,
            signer
          );

          setContract(nftCreatorsContract);
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
        console.log("Failed to initialize the contract");
        console.error(err);
        showToast("Failed to initialize the contract", "error");
        setIsContractReady(false);
      }
    };

    initContract();
  }, [walletAddress, isWalletConnected]);

  const getUserInfo = async (address: string) => {
    if (!contract || !isContractReady) {
      showToast(
        "Contract not initialized. Please ensure your wallet is connected.",
        "error"
      );
      return;
    }

    setIsLoading(true);

    try {
      const creatorId = await contract.getCreatorIdByAddress(address);
      const creatorInfo = await contract.getCreatorInfo(creatorId);

      const creator: Creator = {
        creatorId: Number(creatorInfo.creatorId),
        userAddress: creatorInfo.userAddress,
        createdNFTs: creatorInfo.createdNFTs.map(Number),
        ownedNFTs: creatorInfo.ownedNFTs.map(Number),
        createdCollections: creatorInfo.createdCollections.map(Number),
        itemsSold: Number(creatorInfo.itemsSold),
        walletBalance: Number(creatorInfo.walletBalance),
      };

      setCurrentUser(creator);
    } catch (err) {
      showToast("Failed to fetch user info", "error");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    contract,
    currentUser,
    getUserInfo,
    isLoading,
    isContractReady,
  };

  return (
    <NFTCreatorsContext.Provider value={value}>
      {children}
    </NFTCreatorsContext.Provider>
  );
};
