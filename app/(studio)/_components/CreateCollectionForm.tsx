"use client";

import React from "react";
import SmallFileUploader from "./SmallFileUploader";
import CreateCollectionFormFields from "./CreateCollectionFormFields";
import { createCollectionSchema, TCreateCollectionSchema } from "@/libs/zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNFTCollections } from "@/context/NFTCollectionProvider";
import { createNewCollection } from "@/server-scripts/database/actions/collection.action";
import { useToast } from "@/context/ToastProvider";
import { useRouter } from "next/navigation";
import Modal from "@/components/layout/Modal";
import SecondaryLoader from "@/components/ui/SecondaryLoader";
import { useOverlayStore } from "@/libs/zustand/overlayStore";
import { uploadFileToBlob } from "@/libs/utils";
import { useWallet } from "@/context/WalletProvider";
import CoverPhotoUploader from "@/components/builders/CoverPhotoUploader";
import { revalidatePathAction } from "@/server-scripts/actions/revalidate.from.client";

const CreateCollectionForm = () => {
  const { walletAddress } = useWallet();
  const router = useRouter();

  if (!walletAddress) router.replace("/");

  const { createCollection, isContractReady } = useNFTCollections();
  const { showToast } = useToast();

  const [collectionImage, seCollectionImage] = React.useState<File[]>();
  const [collectionImageError, setCollectionImageError] =
    React.useState<string>();

  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingMessage, setLoadingMessage] = React.useState("");

  const showOverlay = useOverlayStore((state) => state.showOverlay);
  const hideOverlay = useOverlayStore((state) => state.hideOverlay);

  const [coverPhoto, setCoverPhoto] = React.useState<File[]>();
  const [coverPhotoError, setCoverPhotoError] = React.useState<string>();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TCreateCollectionSchema>({
    resolver: zodResolver(createCollectionSchema),
  });

  const onSubmit = async (data: TCreateCollectionSchema) => {
    if (isContractReady) {
      setIsLoading(true);
      showOverlay();
      setCollectionImageError("");

      let collectionImageUrl = "";
      let collectionCoverPhotoUrl = "";

      try {
        setLoadingMessage("Creating collection...");

        const result = await createCollection(
          data.supply,
          data.royalty,
          data.floorPrice.toString()
        );

        if (result) {
          // Handle collection image upload
          if (collectionImage?.length) {
            const result = await uploadFileToBlob(
              collectionImage[0],
              setIsLoading,
              setLoadingMessage
            );

            if (!result.success) {
              throw new Error(result.error || "Failed to upload photo");
            }
            collectionImageUrl = result.url;
          } else {
            setCollectionImageError("No file selected");
          }

          // Handle collection cover photo upload
          if (coverPhoto?.length) {
            const result = await uploadFileToBlob(
              coverPhoto[0],
              setIsLoading,
              setLoadingMessage
            );

            if (!result.success) {
              throw new Error(result.error || "Failed to upload cover photo");
            }
            collectionCoverPhotoUrl = result.url;
          } else {
            setCoverPhotoError("No file selected");
          }

          setLoadingMessage("Saving collection details...");

          const databaseResponse = await createNewCollection(
            {
              collectionId: result,
              name: data.name,
              imageUrl: collectionImageUrl,
              description: data.description,
              coverPhoto: collectionCoverPhotoUrl,
            },
            "/studio/nft"
          );
          await revalidatePathAction("/explore/collections");

          if (databaseResponse?.success) {
            showToast(databaseResponse.success, "success");
            reset();
            router.push("/studio/nft");
          } else if (databaseResponse?.error) {
            showToast(databaseResponse.error, "error");
          }
        }
      } catch (error) {
        console.error("Error creating collection: ", error);
        showToast("Failed to create collection. Please try again.", "error");
      } finally {
        setIsLoading(false);
        hideOverlay();
      }

      reset();
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

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full flex flex-col items-center gap-4 mt-10"
      >
        <SmallFileUploader
          fileError={collectionImageError}
          setFileError={setCollectionImageError}
          setFile={seCollectionImage}
        />
        <CoverPhotoUploader
          fileError={coverPhotoError}
          setFileError={setCoverPhotoError}
          setFile={setCoverPhoto}
          style="w-[50%] m:w-full xl:w-full"
          type="collection"
        />
        <CreateCollectionFormFields
          register={register}
          errors={errors}
          isSubmitting={isSubmitting}
        />
      </form>
    </>
  );
};

export default CreateCollectionForm;
