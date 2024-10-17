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

interface Activity {
  actionType: string;
  timestamp: number;
  relatedItemId: number;
}

interface CollectionOffer {
  amount: number;
  nftCount: number;
  timestamp: number;
  expirationTime: number;
  isActive: boolean;
}

interface NFTCreatorsContextType {
  contract: ethers.Contract | null;
  currentUser: Creator | null;
  getUserInfo: (address: string) => Promise<void>;
  isLoading: boolean;
  isContractReady: boolean;
  registerCreator: () => Promise<number>;
  isCreatorRegistered: (creatorId: number) => Promise<boolean>;
  isAddressRegistered: (address: string) => Promise<boolean>;
  addCreatedNFT: (creatorId: number, tokenId: number) => Promise<void>;
  addOwnedNFT: (creatorId: number, tokenId: number) => Promise<void>;
  addCreatedCollection: (
    creatorId: number,
    collectionId: number
  ) => Promise<void>;
  recordActivity: (
    creatorId: number,
    actionType: string,
    relatedItemId: number
  ) => Promise<void>;
  updateCollectionOffer: (
    creatorId: number,
    collectionId: number,
    offerAmount: number,
    nftCount: number,
    expirationTime: number
  ) => Promise<void>;
  removeCollectionOffer: (
    creatorId: number,
    collectionId: number
  ) => Promise<void>;
  updateBid: (
    creatorId: number,
    auctionId: number,
    bidAmount: number
  ) => Promise<void>;
  updateItemsSold: (creatorId: number) => Promise<void>;
  updateWalletBalance: (creatorId: number, newBalance: number) => Promise<void>;
  getAllCreators: () => Promise<Creator[]>;
  getCreatorInfo: (creatorId: number) => Promise<Creator>;
  getCreatorActivities: (creatorId: number) => Promise<Activity[]>;
  getCreatorIdByAddress: (address: string) => Promise<number>;
  removeOwnedNFT: (creatorId: number, tokenId: number) => Promise<void>;
  getCreatorCollectionOffers: (
    creatorId: number,
    collectionId: number
  ) => Promise<CollectionOffer>;
  getCreatorBids: (creatorId: number, auctionId: number) => Promise<number>;
  getCreatorCount: () => Promise<number>;
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

  const registerCreator = async () => {
    if (!contract || !isContractReady) throw new Error("Contract not ready");
    const tx = await contract.registerCreator();
    const receipt = await tx.wait();
    const event = receipt.events.find(
      (e: any) => e.event === "CreatorRegistered"
    );
    return Number(event.args.creatorId);
  };

  const isCreatorRegistered = async (creatorId: number) => {
    if (!contract || !isContractReady) throw new Error("Contract not ready");
    return contract.isCreatorRegistered(creatorId);
  };

  const isAddressRegistered = async (address: string) => {
    if (!contract || !isContractReady) throw new Error("Contract not ready");
    return contract.isAddressRegistered(address);
  };

  const addCreatedNFT = async (creatorId: number, tokenId: number) => {
    if (!contract || !isContractReady) throw new Error("Contract not ready");
    await contract.addCreatedNFT(creatorId, tokenId);
  };

  const addOwnedNFT = async (creatorId: number, tokenId: number) => {
    if (!contract || !isContractReady) throw new Error("Contract not ready");
    await contract.addOwnedNFT(creatorId, tokenId);
  };

  const addCreatedCollection = async (
    creatorId: number,
    collectionId: number
  ) => {
    if (!contract || !isContractReady) throw new Error("Contract not ready");
    await contract.addCreatedCollection(creatorId, collectionId);
  };

  const recordActivity = async (
    creatorId: number,
    actionType: string,
    relatedItemId: number
  ) => {
    if (!contract || !isContractReady) throw new Error("Contract not ready");
    await contract.recordActivity(creatorId, actionType, relatedItemId);
  };

  const updateCollectionOffer = async (
    creatorId: number,
    collectionId: number,
    offerAmount: number,
    nftCount: number,
    expirationTime: number
  ) => {
    if (!contract || !isContractReady) throw new Error("Contract not ready");
    await contract.updateCollectionOffer(
      creatorId,
      collectionId,
      offerAmount,
      nftCount,
      expirationTime
    );
  };

  const removeCollectionOffer = async (
    creatorId: number,
    collectionId: number
  ) => {
    if (!contract || !isContractReady) throw new Error("Contract not ready");
    await contract.removeCollectionOffer(creatorId, collectionId);
  };

  const updateBid = async (
    creatorId: number,
    auctionId: number,
    bidAmount: number
  ) => {
    if (!contract || !isContractReady) throw new Error("Contract not ready");
    await contract.updateBid(creatorId, auctionId, bidAmount);
  };

  const updateItemsSold = async (creatorId: number) => {
    if (!contract || !isContractReady) throw new Error("Contract not ready");
    await contract.updateItemsSold(creatorId);
  };

  const updateWalletBalance = async (creatorId: number, newBalance: number) => {
    if (!contract || !isContractReady) throw new Error("Contract not ready");
    await contract.updateWalletBalance(creatorId, newBalance);
  };

  const getAllCreators = async () => {
    if (!contract || !isContractReady) throw new Error("Contract not ready");
    return contract.getAllCreators();
  };

  const getCreatorInfo = async (creatorId: number) => {
    if (!contract || !isContractReady) throw new Error("Contract not ready");
    return contract.getCreatorInfo(creatorId);
  };

  const getCreatorActivities = async (creatorId: number) => {
    if (!contract || !isContractReady) throw new Error("Contract not ready");
    return contract.getCreatorActivities(creatorId);
  };

  const getCreatorIdByAddress = async (address: string) => {
    if (!contract || !isContractReady) throw new Error("Contract not ready");
    return contract.getCreatorIdByAddress(address);
  };

  const removeOwnedNFT = async (creatorId: number, tokenId: number) => {
    if (!contract || !isContractReady) throw new Error("Contract not ready");
    await contract.removeOwnedNFT(creatorId, tokenId);
  };

  const getCreatorCollectionOffers = async (
    creatorId: number,
    collectionId: number
  ) => {
    if (!contract || !isContractReady) throw new Error("Contract not ready");
    return contract.getCreatorCollectionOffers(creatorId, collectionId);
  };

  const getCreatorBids = async (creatorId: number, auctionId: number) => {
    if (!contract || !isContractReady) throw new Error("Contract not ready");
    return contract.getCreatorBids(creatorId, auctionId);
  };

  const getCreatorCount = async () => {
    if (!contract || !isContractReady) throw new Error("Contract not ready");
    return contract.getCreatorCount();
  };

  const value = {
    contract,
    currentUser,
    getUserInfo,
    isLoading,
    isContractReady,
    registerCreator,
    isCreatorRegistered,
    isAddressRegistered,
    addCreatedNFT,
    addOwnedNFT,
    addCreatedCollection,
    recordActivity,
    updateCollectionOffer,
    removeCollectionOffer,
    updateBid,
    updateItemsSold,
    updateWalletBalance,
    getAllCreators,
    getCreatorInfo,
    getCreatorActivities,
    getCreatorIdByAddress,
    removeOwnedNFT,
    getCreatorCollectionOffers,
    getCreatorBids,
    getCreatorCount,
  };

  return (
    <NFTCreatorsContext.Provider value={value}>
      {children}
    </NFTCreatorsContext.Provider>
  );
};
