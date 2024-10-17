"use client";

import { editProfileSchema, TEditProfileSchema } from "@/libs/zod";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import ImageUploader from "../builders/ImageUploader";
import EditProfileFormFields from "./EditProfileFormFields";

const EditProfileForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TEditProfileSchema>({
    resolver: zodResolver(editProfileSchema),
  });

  const [profilePhoto, setProfilePhoto] = React.useState<File>();
  const [profilePhotoError, setProfilePhotoError] = React.useState<string>();

  const [coverPhoto, setCoverPhoto] = React.useState<File>();
  const [coverPhotoError, setCoverPhotoError] = React.useState<string>();

  const onSubmit = async (data: TEditProfileSchema) => {
    console.log(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full px-72">
      <div className="mt-6 flex flex-col gap-5 w-full">
        <EditProfileFormFields register={register} errors={errors} />
        <ImageUploader
          fileError={profilePhotoError}
          setFileError={setProfilePhotoError}
          setFile={setProfilePhoto}
        />
      </div>
    </form>
  );
};

export default EditProfileForm;
