"use client";

import { createNFTSchema, TCreateNFTSchema } from "@/libs/zod";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import FileUploader from "./FileUploader";
import CreateNFTFormFields from "./CreateNFTFormFields";

const CreateNFTForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TCreateNFTSchema>({
    resolver: zodResolver(createNFTSchema),
  });

  const [collection, setCollection] = React.useState<string>();
  const [collectionError, setCollectionError] = React.useState<string>();
  const [file, setFile] = React.useState<File>();
  const [fileError, setFileError] = React.useState<string>();
  const [traits, setTraits] = React.useState<Trait[]>([]);

  const onSubmit = async (data: TCreateNFTSchema) => {
    setFileError("");
    setCollectionError("");

    if (!file) {
      setFileError("Image field cannot be empty");
      return;
    }
    if (!collection) {
      setCollectionError("NFT must be minted in a collection");
      return;
    }
    console.log(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
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
          collectionError={collectionError}
        />
      </div>
    </form>
  );
};

export default CreateNFTForm;
