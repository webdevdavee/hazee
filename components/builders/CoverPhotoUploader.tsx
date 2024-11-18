"use client";

import React, { useEffect } from "react";
import { useDropzone } from "react-dropzone";
import clsx from "clsx";
import { FiUploadCloud } from "react-icons/fi";

type Props = {
  fileError: string | undefined;
  setFileError: React.Dispatch<React.SetStateAction<string | undefined>>;
  setFile: React.Dispatch<React.SetStateAction<File[] | undefined>>;
  user?: User | null | undefined;
  style?: string;
  type?: string;
};

type FileType =
  | "image/jpeg"
  | "image/png"
  | "image/gif"
  | "image/webp"
  | "image/svg+xml";

const CoverPhotoUploader: React.FC<Props> = ({
  fileError,
  setFileError,
  setFile,
  user,
  style,
  type,
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
    if (user && user.coverPhoto) {
      setPreviewUrl(user.coverPhoto);
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
    <div className={style}>
      {type === "collection" && (
        <h3 className="font-medium mb-4">Collection Cover Photo *</h3>
      )}
      <div
        {...getRootProps()}
        className={clsx(
          "relative w-full h-36 p-4 border-2 border-secondary rounded-md overflow-hidden transition-colors duration-300 cursor-pointer hover:bg-secondary hover:transition m:h-44",
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
              <div className="flex flex-col items-center justify-center mt-4">
                <p className="font-medium">Cover Photo</p>
                <p className="text-gray-300 text-sm m:text-center">
                  Supported file types: JPEG, PNG, SVG, WEBP, GIF
                </p>
                <p className="text-gray-300 text-sm">Maximum file size: 4MB</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="text-red-500">{fileError}</p>
    </div>
  );
};

export default CoverPhotoUploader;
