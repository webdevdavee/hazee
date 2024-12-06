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
} from "@/server-scripts/database/actions/user.action";
import { useRouter } from "next/navigation";
import { useWallet } from "@/context/WalletProvider";
import Button from "../ui/Button";
import { useToast } from "@/context/ToastProvider";
import Modal from "../layout/Modal";
import SecondaryLoader from "../ui/SecondaryLoader";
import { uploadFileToBlob } from "@/libs/utils";
import { useOverlayStore } from "@/libs/zustand/overlayStore";

const EditProfileForm = () => {
  const router = useRouter();
  const { walletAddress } = useWallet();
  const { showToast } = useToast();

  const [user, setUser] = React.useState<User | null>();

  const [profilePhoto, setProfilePhoto] = React.useState<File[]>();
  const [profilePhotoError, setProfilePhotoError] = React.useState<string>();

  const [coverPhoto, setCoverPhoto] = React.useState<File[]>();
  const [coverPhotoError, setCoverPhotoError] = React.useState<string>();

  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingMessage, setLoadingMessage] = React.useState("");

  const showOverlay = useOverlayStore((state) => state.showOverlay);
  const hideOverlay = useOverlayStore((state) => state.hideOverlay);

  React.useEffect(() => {
    if (!walletAddress) {
      router.replace("/");
    }

    if (walletAddress) {
      const getUser = async () => {
        setUser(await getUserByWalletAddress(walletAddress));
      };
      getUser();
    }
  }, [walletAddress]);

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

  const onSubmit = async (data: TEditProfileSchema) => {
    setIsLoading(true);
    showOverlay();

    setProfilePhotoError("");
    setCoverPhotoError("");
    setLoadingMessage("Updating profile...");

    // Initialize the URL for the profile photo.
    let profilePhotoUrl = "";

    // Initialize the URL for the cover photo.
    let coverPhotoUrl = "";

    if (walletAddress) {
      try {
        // Handle profile photo upload
        if (profilePhoto?.length) {
          const result = await uploadFileToBlob(
            profilePhoto[0],
            setIsLoading,
            setLoadingMessage
          );

          if (!result.success) {
            throw new Error(result.error || "Failed to upload profile photo");
          }
          profilePhotoUrl = result.url;
        }

        // Handle cover photo upload
        if (coverPhoto?.length) {
          const result = await uploadFileToBlob(
            coverPhoto[0],
            setIsLoading,
            setLoadingMessage
          );

          if (!result.success) {
            throw new Error(result.error || "Failed to upload cover photo");
          }
          coverPhotoUrl = result.url;
        }

        const userData = {
          ...data,
          username: data.username.toLowerCase(),
          photo: profilePhotoUrl,
          coverPhoto: coverPhotoUrl,
          walletAddress,
        };

        const response = await updateUserData(
          userData,
          `/creator/${walletAddress}`
        );

        if (response.success) showToast(response.success, "success");
        if (response.error) showToast(response.error, "error");

        if (!response.error) {
          router.push(`/creator/${walletAddress}`);
          reset();
        }
      } catch (error) {
        console.error(error);
        showToast("Failed to update profile. Please try again.", "error");
      } finally {
        setIsLoading(false);
        setLoadingMessage("");
        hideOverlay();
      }
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

      <form onSubmit={handleSubmit(onSubmit)} className="w-full px-72 m:px-0">
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
    </>
  );
};

export default EditProfileForm;
