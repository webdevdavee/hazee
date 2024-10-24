import { create } from "@web3-storage/w3up-client";
import { NFTStorage, File } from "nft.storage";

export const uploadToIPFS = async (
  metadata: NFTMetadata,
  imageFile: File
): Promise<{ metadataUrl: string; imageUrl: string }> => {
  try {
    // Check for NFT.Storage token
    const nftStorageToken = process.env.NEXT_PUBLIC_NFT_STORAGE_TOKEN;
    if (!nftStorageToken) {
      throw new Error("NFT.Storage token not configured");
    }

    // Initialize NFT.Storage client
    const nftStorageClient = new NFTStorage({ token: nftStorageToken });

    // Create a w3up client
    const client = await create();

    // Get the account email from environment variables
    const email = process.env.NEXT_PUBLIC_W3UP_EMAIL;
    if (!email) {
      throw new Error("W3UP email not configured");
    }

    // Register and authorize the agent with the account
    const space = await client.login("dachael0852@gmail.com");
    await client.setCurrentSpace(space.did());

    // First, upload the image to NFT.Storage
    const imageBlob = new Blob([imageFile], { type: imageFile.type });
    const imageNFTFile = new File([imageBlob], imageFile.name, {
      type: imageFile.type,
    });
    const imageCid = await nftStorageClient.storeBlob(imageNFTFile);
    const imageUrl = `ipfs://${imageCid}`;

    // Update metadata with IPFS image URL
    const updatedMetadata = {
      ...metadata,
      image: imageUrl,
    };

    // Convert metadata to JSON and create a blob
    const metadataBlob = new Blob([JSON.stringify(updatedMetadata)], {
      type: "application/json",
    });

    // Upload metadata using w3up client
    const metadataFile = new File([metadataBlob], "metadata.json", {
      type: "application/json",
    });

    // Upload the file and get the CID
    const metadataCid = await client.uploadFile(metadataFile);
    const metadataUrl = `ipfs://${metadataCid}/metadata.json`;

    return {
      metadataUrl,
      imageUrl,
    };
  } catch (error) {
    console.error("Error uploading to IPFS:", error);
    throw new Error("Failed to upload to IPFS");
  }
};

// Helper to transform IPFS URL to HTTP gateway URL for preview
export const getIPFSGatewayUrl = (ipfsUrl: string): string => {
  if (!ipfsUrl) return "";
  // Remove ipfs:// prefix
  const cid = ipfsUrl.replace("ipfs://", "");
  // Use preferred gateway
  return `https://${cid}.ipfs.w3s.link`;
};
