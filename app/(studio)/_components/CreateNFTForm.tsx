"use client";

import { createNFTSchema, TCreateNFTSchema } from "@/libs/zod";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import FileUploader from "./FileUploader";
import CreateNFTFormFields from "./CreateNFTFormFields";
import { useWallet } from "@/context/WalletProvider";
import { uploadToIPFS, getIPFSGatewayUrl } from "@/libs/utils/ipfs";
import Image from "next/image";
import { useNFTCollections } from "@/context/NFTCollectionProvider";
import { useToast } from "@/context/ToastProvider";

const CreateNFTForm = () => {
  const { walletAddress } = useWallet();
  const { mintNFT } = useNFTCollections();
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TCreateNFTSchema>({
    resolver: zodResolver(createNFTSchema),
  });

  const [collection, setCollection] = React.useState<CollectionInfo>();
  const [collectionError, setCollectionError] = React.useState<string>();
  const [file, setFile] = React.useState<File[]>();
  const [fileError, setFileError] = React.useState<string>();
  const [traits, setTraits] = React.useState<Trait[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [uploadStatus, setUploadStatus] = React.useState<string>("");
  const [previewUrl, setPreviewUrl] = React.useState<string>("");

  const onSubmit = async (data: TCreateNFTSchema) => {
    try {
      setIsLoading(true);
      setFileError("");
      setCollectionError("");
      setUploadStatus("Starting upload process...");

      // Validate collection
      if (!collection) {
        setCollectionError("Please select a collection");
        return;
      }

      // Validate file
      if (!file || file.length === 0) {
        setFileError("Please upload an image");
        return;
      }

      if (walletAddress) {
        setUploadStatus("Uploading to IPFS...");

        // Create initial metadata
        const metadata: NFTMetadata = {
          name: data.name,
          description: data.description,
          image: "", // Will be set by uploadToIPFS
          attributes: traits.map((trait) => ({
            trait_type: trait.trait_type,
            value: trait.value,
          })),
        };

        try {
          // Upload to IPFS
          const { metadataUrl, imageUrl } = await uploadToIPFS(
            metadata,
            file[0]
          );
          setUploadStatus("IPFS upload complete. Minting NFT...");

          // Set preview URL using gateway
          const previewGatewayUrl = getIPFSGatewayUrl(imageUrl);
          setPreviewUrl(previewGatewayUrl);

          // Mint NFT (assuming you have this function implemented)
          const result = await mintNFT(
            collection.collectionId,
            data.price,
            metadataUrl
          );

          if (result) {
            setUploadStatus("NFT minted successfully!");
            // Reset form on success
            reset();
            setFile(undefined);
            setTraits([]);
            setCollection(undefined);
            setPreviewUrl("");
            showToast(
              `NFT minted successfully! Token ID: ${result.tokenId}`,
              "success"
            );
          }
        } catch (error) {
          console.error("Error uploading to IPFS:", error);
          setUploadStatus("Failed to upload to IPFS");
          showToast("Failed to upload to IPFS. Please try again.", "error");
          return;
        }
      }
    } catch (error) {
      console.error("Error minting NFT:", error);
      setUploadStatus("Failed to mint NFT");
      showToast("Failed to mint NFT. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full">
      <div className="flex flex-col gap-4">
        {uploadStatus && (
          <p className="text-sm text-gray-600">{uploadStatus}</p>
        )}
        <div className="flex justify-between gap-24 mt-10 w-full">
          <FileUploader
            fileError={fileError}
            setFileError={setFileError}
            setFile={setFile}
          />
          <CreateNFTFormFields
            register={register}
            errors={errors}
            traits={traits}
            setTraits={setTraits}
            collection={collection}
            setCollection={setCollection}
            collectionError={collectionError}
            isLoading={isLoading}
          />
        </div>
        {previewUrl && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold">Preview</h3>
            <Image
              src={previewUrl}
              alt="NFT Preview"
              className="mt-2 max-w-xs rounded-lg"
            />
          </div>
        )}
      </div>
    </form>
  );
};

export default CreateNFTForm;
