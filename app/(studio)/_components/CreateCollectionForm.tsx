"use client";

import React from "react";
import SmallFileUploader from "./SmallFileUploader";
import CreateCollectionFormFields from "./CreateCollectionFormFields";
import { createCollectionSchema, TCreateCollectionSchema } from "@/libs/zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUploadThing } from "@/libs/utils/uploadthing";
import { useNFTCollections } from "@/context/NFTCollectionProvider";
import { createNewCollection } from "@/database/actions/collection.action";
import { useToast } from "@/context/ToastProvider";
import { useRouter } from "next/navigation";

const CreateCollectionForm = () => {
  const router = useRouter();

  const { createCollection, isContractReady } = useNFTCollections();
  const { showToast } = useToast();

  const [collectionImage, seCollectionImage] = React.useState<File[]>();
  const [collectionImageError, setCollectionImageError] =
    React.useState<string>();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TCreateCollectionSchema>({
    resolver: zodResolver(createCollectionSchema),
  });

  const { startUpload } = useUploadThing("imageUploader");

  const onSubmit = async (data: TCreateCollectionSchema) => {
    if (isContractReady) {
      setCollectionImageError("");

      // Initialize the URL for the collection image.
      let collectionImageUrl = "";

      try {
        // Check if collection image was provided
        if (collectionImage && collectionImage.length > 0) {
          const uploadedImage = await startUpload(collectionImage);
          if (uploadedImage) {
            collectionImageUrl = uploadedImage[0].url;
          } else {
            return;
          }
        }

        const result = await createCollection(
          data.supply,
          data.royalty,
          data.floorPrice.toString()
        );

        if (result) {
          const databaseResponse = await createNewCollection(
            {
              collectionId: result,
              name: data.name,
              imageUrl: collectionImageUrl,
            },
            "/studio/nft"
          );
          if (databaseResponse.success) {
            showToast(databaseResponse.success, "success");
            reset();
            router.push("/studio/nft");
          } else if (databaseResponse.error) {
            showToast(databaseResponse.error, "error");
          }
        }
      } catch (error) {
        console.error("Error creating collection: ", error);
        showToast("Failed to create collection. Please try again.", "error");
      }

      console.log(data);
      reset();
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full flex flex-col items-center gap-4 mt-10"
    >
      <SmallFileUploader
        fileError={collectionImageError}
        setFileError={setCollectionImageError}
        setFile={seCollectionImage}
      />
      <CreateCollectionFormFields
        register={register}
        errors={errors}
        isSubmitting={isSubmitting}
      />
    </form>
  );
};

export default CreateCollectionForm;
