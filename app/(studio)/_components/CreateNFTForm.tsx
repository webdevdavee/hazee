"use client";

import { createNFTSchema, TCreateNFTSchema } from "@/libs/zod";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import FileUploader from "./FileUploader";
import CreateNFTFormFields from "./CreateNFTFormFields";
import { useWallet } from "@/context/WalletProvider";
import { uploadToPinata, testPinataConnection } from "@/libs/utils/ipfs";
import { useNFTCollections } from "@/context/NFTCollectionProvider";
import { useToast } from "@/context/ToastProvider";
import { useRouter } from "next/navigation";
import { useNFT } from "@/context/NFTProvider";
import Modal from "@/components/layout/Modal";
import SecondaryLoader from "@/components/ui/SecondaryLoader";
import { useOverlayStore } from "@/libs/zustand/overlayStore";
import { revalidatePathAction } from "@/server-scripts/actions/revalidate.from.client";

const CreateNFTForm = () => {
  const { walletAddress } = useWallet();
  const router = useRouter();

  React.useEffect(() => {
    if (!walletAddress) {
      router.replace('/');
    }
  }, [walletAddress]);

  const {
    mintNFT,
    verifyCollectionCreator,
    isContractReady: isNFTCollectionContractReady,
  } = useNFTCollections();
  const { checkOwnership, isContractReady: isNFTContractReady } = useNFT();
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
  const [loadingMessage, setLoadingMessage] = React.useState("");

  const showOverlay = useOverlayStore((state) => state.showOverlay);
  const hideOverlay = useOverlayStore((state) => state.hideOverlay);

  const onSubmit = async (data: TCreateNFTSchema) => {
    if (!isNFTContractReady && !isNFTCollectionContractReady) return;

    showOverlay();

    try {
      setIsLoading(true);
      setFileError("");
      setCollectionError("");
      setLoadingMessage("Starting upload process...");

      if (!collection) {
        setCollectionError("Please select a collection");
        setIsLoading(false);
        return;
      }

      if (!file || file.length === 0) {
        setFileError("Please upload an image");
        setIsLoading(false);
        return;
      }

      if (!walletAddress) {
        showToast("Please connect your wallet first", "error");
        setIsLoading(false);
        return;
      }

      // Verify collection creator
      const isCollectionOwner = await verifyCollectionCreator(
        collection,
        walletAddress
      );

      if (isCollectionOwner.error) {
        showToast(isCollectionOwner.error, "error");
        return;
      }

      setLoadingMessage("Preparing and uploading metadata...");

      await testPinataConnection().then(console.log);

      // Create metadata with Pinata-specific options
      const metadata: NFTMetadata = {
        name: data.name,
        description: data.description,
        image: "", // Will be populated by uploadToPinata
        attributes: traits.map((trait) => ({
          trait_type: trait.trait_type,
          value: trait.value,
        })),

        pinataMetadata: {
          name: `${data.name} NFT`,
          keyvalues: {
            collection: collection.collectionId,
            creator: walletAddress,
          },
        },
      };

      try {
        // Upload using new Pinata function
        const { metadataUrl } = await uploadToPinata(metadata, file[0]);
        setLoadingMessage("Upload complete. Minting NFT...");

        // Mint NFT process remains the same
        const result = await mintNFT(
          collection.collectionId,
          data.price,
          metadataUrl
        );

        if (!result) {
          throw new Error("Failed to mint NFT - transaction failed");
        }

        // Verify ownership of the minted NFT
        const isOwner = await checkOwnership(result.tokenId);

        if (!isOwner) {
          showToast("You do not own this NFT", "error");
          return;
        }

        setLoadingMessage("NFT minted successfully!");

        // Reset form state
        reset();
        setFile(undefined);
        setTraits([]);
        setCollection(undefined);
        await revalidatePathAction(`/creator/${walletAddress}`);
        router.push(`/creator/${walletAddress}`);
      } catch (error) {
        console.error("Error during Pinata upload or minting:", error);
        setLoadingMessage("Failed to create NFT");
        showToast(
          error instanceof Error
            ? error.message
            : "Failed to create NFT. Please try again.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error in form submission:", error);
      showToast("Failed. Please try again.", "error");
    } finally {
      setIsLoading(false);
      hideOverlay();
    }
  };

  return (
    <>
      {isLoading && (
        <Modal
          setIsModalOpen={setIsLoading}
          isLoading={isLoading}
          loadingMessage={loadingMessage}
        >
          <div className="flex items-center justify-center backdrop-blur-[2px]">
            <SecondaryLoader message={loadingMessage} size="md" />
          </div>
        </Modal>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="w-full">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between gap-24 mt-10 w-full m:flex-col m:gap-10 xl:gap-5">
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
        </div>
      </form>
    </>
  );
};

export default CreateNFTForm;
