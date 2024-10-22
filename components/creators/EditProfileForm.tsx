"use client";

import { editProfileSchema, TEditProfileSchema } from "@/libs/zod";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import ImageUploader from "../builders/ImageUploader";
import EditProfileFormFields from "./EditProfileFormFields";
import CoverPhotoUploader from "../builders/CoverPhotoUploader";
import {
  getUserByWalletAddress,
  updateUserData,
} from "@/database/actions/user.action";
import { usePathname, useRouter } from "next/navigation";
import { useWallet } from "@/context/WalletProvider";
import Button from "../ui/Button";
import { useToast } from "@/context/ToastProvider";
import { useUploadThing } from "@/libs/utils/uploadthing";

const EditProfileForm = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { walletAddress } = useWallet();
  const { showToast } = useToast();

  const [user, setUser] = React.useState<User | null>();

  const [profilePhoto, setProfilePhoto] = React.useState<File[]>();
  const [profilePhotoError, setProfilePhotoError] = React.useState<string>();

  const [coverPhoto, setCoverPhoto] = React.useState<File[]>();
  const [coverPhotoError, setCoverPhotoError] = React.useState<string>();

  React.useEffect(() => {
    if (walletAddress) {
      const getUser = async () => {
        setUser(await getUserByWalletAddress(walletAddress));
      };
      getUser();
    }
  }, [walletAddress]);

  if (user && user.walletAddress !== walletAddress) {
    router.push(`/creator/${walletAddress}`);
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TEditProfileSchema>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      username: "",
      email: "",
    },
  });

  // Update form values when user data is fetched
  React.useEffect(() => {
    if (user) {
      reset({
        username: user.username,
        email: user.email,
      });
    }
  }, [user, reset]);

  const { startUpload } = useUploadThing("imageUploader");

  const onSubmit = async (data: TEditProfileSchema) => {
    setProfilePhotoError("");
    setCoverPhotoError("");

    // Initialize the URL for the profile photo.
    let profilePhotoUrl = "";

    // Initialize the URL for the cover photo.
    let coverPhotoUrl = "";

    if (walletAddress) {
      try {
        // Check if profile photo was given
        if (profilePhoto && profilePhoto.length > 0) {
          const uploadedImage = await startUpload(profilePhoto);
          if (uploadedImage) {
            profilePhotoUrl = uploadedImage[0].url;
            console.log(profilePhotoUrl);
          } else {
            return;
          }
        }

        // Check if cover photo was given
        if (coverPhoto && coverPhoto.length > 0) {
          const uploadedImage = await startUpload(coverPhoto);
          if (uploadedImage) coverPhotoUrl = uploadedImage[0].url;
          console.log(coverPhotoUrl);
        }

        const userData = {
          ...data,
          username: data.username.toLowerCase(),
          photo: profilePhotoUrl,
          coverPhoto: coverPhotoUrl,
          walletAddress,
        };

        const response = await updateUserData(userData, pathname);

        if (response.success) showToast(response.success, "success");
        if (response.error) showToast(response.error, "error");

        if (!response.error) {
          router.push(`/creator/${walletAddress}`);
          reset();
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full px-72">
      <div className="mt-6 flex flex-col gap-5 w-full">
        <EditProfileFormFields register={register} errors={errors} />
        <ImageUploader
          fileError={profilePhotoError}
          setFileError={setProfilePhotoError}
          setFile={setProfilePhoto}
          user={user}
        />
        <CoverPhotoUploader
          fileError={coverPhotoError}
          setFileError={setCoverPhotoError}
          setFile={setCoverPhoto}
          user={user}
        />
      </div>
      <Button
        text={`${isSubmitting ? "updating your profile..." : "Save"}`}
        type="submit"
        style={`p-4 rounded-md w-full mt-6 ${
          isSubmitting ? "bg-secondary transition" : "bg-primary"
        }`}
        disabled={isSubmitting}
      />
    </form>
  );
};

export default EditProfileForm;
