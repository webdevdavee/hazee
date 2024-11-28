import React from "react";
import Image from "next/image";

interface AvatarRingProps {
  src: string;
  alt: string;
  size: number;
  className?: string;
}

const AvatarRing: React.FC<AvatarRingProps> = ({
  src,
  alt,
  size,
  className,
}) => {
  return (
    <div
      className={`relative ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-full animate-spin-slow"></div>
      <div className="absolute inset-1 bg-secondary rounded-full"></div>
      <Image
        src={src}
        alt={alt}
        layout="fill"
        objectFit="cover"
        className="rounded-full"
      />
    </div>
  );
};

export default AvatarRing;
