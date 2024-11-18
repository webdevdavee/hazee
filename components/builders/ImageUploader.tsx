"use client";

import React, { useEffect } from "react";
import { useDropzone } from "react-dropzone";
import clsx from "clsx";
import { FiUploadCloud } from "react-icons/fi";

type Props = {
  fileError: string | undefined;
  setFileError: React.Dispatch<React.SetStateAction<string | undefined>>;
  setFile: React.Dispatch<React.SetStateAction<File[] | undefined>>;
  user: User | null | undefined;
};

type FileType =
  | "image/jpeg"
  | "image/png"
  | "image/gif"
  | "image/webp"
  | "image/svg+xml";

const ImageUploader: React.FC<Props> = ({
  fileError,
  setFileError,
  setFile,
  user,
}) => {
  const [isDragActive, setIsDragActive] = React.useState(false);
  const [uploadedFile, setUploadedFile] = React.useState<File[] | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  const maxFileSize = 4 * 1024 * 1024; // 4 MB

  const supportedFileTypes: FileType[] = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ];

  useEffect(() => {
    if (user && user.photo) {
      setPreviewUrl(user.photo);
    }
  }, [user]);

  const onDrop = (acceptedFiles: File[]) => {
    setIsDragActive(false);
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles;
      setUploadedFile(file);
      handleFileUpload(file);
      setPreviewUrl(URL.createObjectURL(file[0]));
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: supportedFileTypes.reduce(
      (acc, type) => ({ ...acc, [type]: [] }),
      {}
    ),
    maxSize: maxFileSize,
    multiple: false,
  });

  const handleFileUpload = (file: File[]) => {
    setFileError(undefined);
    setFile(file);
  };

  return (
    <div className="w-full flex items-center justify-center gap-4 m:flex-col">
      <div
        {...getRootProps()}
        className={clsx(
          "relative w-36 h-36 p-4 border-2 border-secondary rounded-full overflow-hidden transition-colors duration-300 cursor-pointer hover:bg-secondary hover:transition",
          {
            "border-gray-300 hover:border-gray-400": !isDragActive,
            "border-blue-500": isDragActive,
          }
        )}
      >
        <input {...getInputProps()} />
        {previewUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${previewUrl})`,
            }}
          />
        )}
        {!previewUrl && (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center justify-center">
              <FiUploadCloud size={40} />
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col justify-center">
        <p className="font-medium">Profile Photo</p>
        <p className="text-gray-300 text-sm">
          Supported file types: JPEG, PNG, SVG, WEBP, GIF
        </p>
        <p className="text-gray-300 text-sm">Maximum file size: 4MB</p>
      </div>
      {fileError && <p className="text-red-500">{fileError}</p>}
    </div>
  );
};

export default ImageUploader;
