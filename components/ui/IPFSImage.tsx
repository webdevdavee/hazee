"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { getIPFSGatewayUrl } from "@/libs/utils/ipfs";

interface IPFSImageProps {
  ipfsUrl: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
}

const IPFSImage: React.FC<IPFSImageProps> = ({
  ipfsUrl,
  alt = "IPFS Image",
  width = 300,
  height = 300,
  className = "",
  priority = false,
  quality = 75,
}) => {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  useEffect(() => {
    if (!ipfsUrl) {
      setError("No image URL provided");
      return;
    }

    try {
      const url = getIPFSGatewayUrl(ipfsUrl);
      setImageUrl(url);
    } catch (err) {
      setError("Failed to process IPFS URL");
    }
  }, [ipfsUrl]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-red-50 ${className}`}
      >
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {!isImageLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg" />
      )}
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={alt}
          width={width}
          height={height}
          className={`${className} ${
            isImageLoaded ? "opacity-100" : "opacity-0"
          } transition-opacity duration-300`}
          priority={priority}
          quality={quality}
          onLoadingComplete={() => setIsImageLoaded(true)}
          onError={() => {
            setError("Failed to load image");
            setIsImageLoaded(false);
          }}
        />
      )}
    </div>
  );
};

export default IPFSImage;
