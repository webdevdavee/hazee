import React, { createContext, useContext, useState, ReactNode } from "react";
import { ethers } from "ethers";
import { z } from "zod";

// Define the shape of the metadata
const NFTMetadataSchema = z.object({
  name: z.string(),
  description: z.string(),
  image: z.string().url(),
  // Add other metadata fields as needed
});

type NFTMetadata = z.infer<typeof NFTMetadataSchema>;

interface NFTContextType {
  mintNFT: (metadata: NFTMetadata) => Promise<void>;
  // Add other functions or state as needed
}

const NFTContext = createContext<NFTContextType | undefined>(undefined);

export const useNFTContext = () => {
  const context = useContext(NFTContext);
  if (context === undefined) {
    throw new Error("useNFTContext must be used within a NFTProvider");
  }
  return context;
};

interface NFTProviderProps {
  children: ReactNode;
  contractAddress: string;
  contractABI: ethers.InterfaceAbi;
}

export const NFTProvider: React.FC<NFTProviderProps> = ({
  children,
  contractAddress,
  contractABI,
}) => {
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  const initializeContract = async () => {
    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const nftContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      setContract(nftContract);
    } else {
      console.error(
        "Ethereum object not found, do you have MetaMask installed?"
      );
    }
  };

  React.useEffect(() => {
    initializeContract();
  }, []);

  const mintNFT = async (metadata: NFTMetadata) => {
    if (!contract) {
      throw new Error("Contract not initialized");
    }

    try {
      // Validate metadata
      NFTMetadataSchema.parse(metadata);

      // Save metadata to IPFS or your preferred storage
      const metadataURI = await saveMetadataToIPFS(metadata);

      // Call the mint function on your contract
      const tx = await contract.mint(metadataURI);
      await tx.wait();

      console.log("NFT minted successfully!");
    } catch (error) {
      console.error("Error minting NFT:", error);
      throw error;
    }
  };

  const saveMetadataToIPFS = async (metadata: NFTMetadata): Promise<string> => {
    // Implement your logic to save metadata to IPFS or your preferred storage
    // Return the URI of the saved metadata
    // This is a placeholder function
    console.log("Saving metadata:", metadata);
    return "ipfs://your-metadata-uri";
  };

  const value = {
    mintNFT,
    // Add other functions or state as needed
  };

  return <NFTContext.Provider value={value}>{children}</NFTContext.Provider>;
};
