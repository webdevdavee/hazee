"use client";

import React from "react";
import SmallFileUploader from "./SmallFileUploader";
import CreateCollectionFormFields from "./CreateCollectionFormFields";
import { creatCollectionSchema, TCreatCollectionSchema } from "@/libs/zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const CreateCollectionForm = () => {
  const [file, setFile] = React.useState<File>();
  const [fileError, setFileError] = React.useState<string>();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TCreatCollectionSchema>({
    resolver: zodResolver(creatCollectionSchema),
  });

  const onSubmit = async (data: TCreatCollectionSchema) => {
    setFileError("");

    if (!file) {
      setFileError("Image field cannot be empty");
      return;
    }

    console.log(data);
    reset();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full flex flex-col items-center gap-4 mt-10"
    >
      <SmallFileUploader
        fileError={fileError}
        setFileError={setFileError}
        setFile={setFile}
      />
      <CreateCollectionFormFields register={register} errors={errors} />
    </form>
  );
};

export default CreateCollectionForm;
