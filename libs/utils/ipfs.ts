import axios from "axios";

const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT;

if (!PINATA_JWT) {
  throw new Error(
    "Pinata JWT missing. Please check your environment variables."
  );
}

// Base configuration for Pinata API requests
const pinataConfig = {
  headers: {
    Authorization: `Bearer ${PINATA_JWT}`,
    "Content-Type": "application/json",
  },
};

// Upload file to IPFS via Pinata
async function uploadFileToIPFS(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`,
          // Let browser set the correct content-type for FormData
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    console.log("File upload response:", response.data);
    return `ipfs://${response.data.IpfsHash}`;
  } catch (error: any) {
    console.error("Error uploading file to Pinata:", {
      error: error.message,
      response: error.response?.data,
    });
    throw new Error(
      `Failed to upload file to Pinata: ${
        error.response?.data?.message || error.message
      }`
    );
  }
}

// Upload metadata to IPFS via Pinata
async function uploadMetadataToIPFS(metadata: NFTMetadata): Promise<string> {
  try {
    const data = {
      pinataContent: metadata,
      pinataOptions: {
        cidVersion: 1,
      },
      pinataMetadata: {
        name: `${metadata.name}-metadata.json`,
        keyvalues: {
          type: "nft-metadata",
        },
      },
    };

    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      data,
      pinataConfig
    );

    console.log("Metadata upload response:", response.data);
    return `ipfs://${response.data.IpfsHash}`;
  } catch (error: any) {
    console.error("Error uploading metadata to Pinata:", {
      error: error.message,
      response: error.response?.data,
    });
    throw new Error(
      `Failed to upload metadata to Pinata: ${
        error.response?.data?.message || error.message
      }`
    );
  }
}

// Main upload function
export async function uploadToPinata(
  metadata: NFTMetadata,
  file: File
): Promise<{ metadataUrl: string; imageUrl: string }> {
  try {
    console.log("Starting Pinata upload process...");

    // Upload image first
    const imageUrl = await uploadFileToIPFS(file);
    console.log("Image uploaded successfully:", imageUrl);

    // Update metadata with image URL
    const updatedMetadata = {
      ...metadata,
      image: imageUrl,
    };

    // Upload metadata
    const metadataUrl = await uploadMetadataToIPFS(updatedMetadata);
    console.log("Metadata uploaded successfully:", metadataUrl);

    return {
      metadataUrl,
      imageUrl,
    };
  } catch (error) {
    console.error("Error in Pinata upload process:", error);
    throw error;
  }
}

// Get IPFS Gateway URL for preview
export function getIPFSGatewayUrl(ipfsUrl: string): string {
  const pinataGateway = "https://gateway.pinata.cloud/ipfs/";
  const ipfsPath = ipfsUrl.replace("ipfs://", "");
  return `${pinataGateway}${ipfsPath}`;
}

// Test Pinata connection
export async function testPinataConnection(): Promise<boolean> {
  try {
    const response = await axios.get(
      "https://api.pinata.cloud/data/testAuthentication",
      {
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`,
        },
      }
    );
    return response.status === 200;
  } catch (error) {
    console.error("Pinata connection test failed:", error);
    return false;
  }
}
