"use client";

import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import clsx from "clsx";
import { FiUploadCloud } from "react-icons/fi";

type Props = {
  fileError: string | undefined;
  setFileError: React.Dispatch<React.SetStateAction<string | undefined>>;
  setFile: React.Dispatch<React.SetStateAction<File[] | undefined>>;
};

type FileType =
  | "image/jpeg"
  | "image/png"
  | "image/gif"
  | "image/webp"
  | "image/svg+xml";

const SmallFileUploader: React.FC<Props> = ({
  fileError,
  setFileError,
  setFile,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  const maxFileSize = 4 * 1024 * 1024; // 4 MB

  const supportedFileTypes: FileType[] = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ];

  const onDrop = (acceptedFiles: File[]) => {
    setIsDragActive(false);
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles;
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
    <section className="w-[50%] m:w-full xl:w-full">
      <h3 className="font-medium mb-4">Collection image *</h3>
      <div
        tabIndex={0}
        {...getRootProps()}
        className="flex items-center gap-5 border border-secondary p-5 rounded-lg overflow-hidden transition-colors duration-300 cursor-pointer hover:bg-secondary hover:transition m:flex-col"
      >
        <div
          className={clsx(
            "relative w-28 h-28 p-4 border-2 border-dashed rounded-xl overflow-hidden transition-colors duration-300 cursor-pointer hover:bg-secondary hover:transition m:w-full m:h-56",
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
              <FiUploadCloud size={40} />
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <p className="font-medium">Drag and drop a file here</p>
          <p className="text-abstract">or click to select a file</p>
          <p className="text-gray-300 text-sm">
            Supported file types: JPEG, PNG, SVG, MP4, GIF
          </p>
          <p className="text-gray-300 text-sm">Maximum file size: 4MB</p>
        </div>
      </div>
      <p className="text-red-500">{fileError}</p>
    </section>
  );
};

export default SmallFileUploader;
