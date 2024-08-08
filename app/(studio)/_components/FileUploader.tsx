"use client";

import React, { useState } from "react";
import { DropzoneRootProps, useDropzone } from "react-dropzone";
import clsx from "clsx";
import { FiUploadCloud } from "react-icons/fi";

type FileType =
  | "image/jpeg"
  | "image/png"
  | "image/svg+xml"
  | "video/mp4"
  | "image/gif";

const FileUploader = () => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const maxFileSize = 50 * 1024 * 1024; // 50 MB

  const supportedFileTypes: FileType[] = [
    "image/jpeg",
    "image/png",
    "image/svg+xml",
    "video/mp4",
    "image/gif",
  ];

  const { getRootProps, getInputProps } = useDropzone({
    accept: supportedFileTypes.reduce(
      (acc, type) => ({ ...acc, [type]: [] }),
      {}
    ),
    maxSize: maxFileSize,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDrop: (acceptedFiles) => {
      setIsDragActive(false);
      setUploadedFile(acceptedFiles[0]);
      handleFileUpload(acceptedFiles[0]);
    },
  });

  const handleFileUpload = (file: File) => {
    // Do something with the uploaded file
    console.log(file);
  };

  return (
    <div
      {...getRootProps()}
      className={clsx(
        "relative w-[50%] h-[34rem] p-4 border-2 border-dashed rounded-xl transition-colors duration-300 cursor-pointer hover:bg-secondary hover:transition",
        {
          "border-gray-300 hover:border-gray-400": !isDragActive,
          "border-blue-500": isDragActive,
        }
      )}
    >
      <input {...getInputProps()} />
      {uploadedFile && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${URL.createObjectURL(uploadedFile)})`,
          }}
        />
      )}
      {!uploadedFile && (
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center justify-center">
            <FiUploadCloud size={40} />
            <div className="flex flex-col items-center justify-center mt-6">
              <p className="font-medium">Drag and drop a file here</p>
              <p className="text-abstract">or click to select a file</p>
              <p className="text-gray-300 text-sm">
                Supported file types: JPEG, PNG, SVG, MP4, GIF
              </p>
              <p className="text-gray-300 text-sm">Maximum file size: 50MB</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
