export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + " bytes";
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  else if (bytes < 1024 * 1024 * 1024)
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + " GB";
};

export const truncateAddress = (address: string) => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatNumber = (num: string | number) => {
  // Convert to a number in case it's a string
  const parsedNum = parseFloat(num as string);

  // Check if the conversion was successful
  if (isNaN(parsedNum)) {
    return "Invalid input"; // Handle non-numeric strings
  }

  // Check if the number is an integer
  if (Number.isInteger(parsedNum)) {
    return parsedNum.toString(); // Return as an integer without decimals
  } else {
    // Only show necessary decimal places up to 3
    return parsedNum.toFixed(3).replace(/\.?0+$/, "");
  }
};

// Upload files to vercel blob
import { PutBlobResult } from "@vercel/blob";
interface UploadResponse {
  url: string;
  success: boolean;
  error?: string;
}
export const uploadFileToBlob = async (
  file: File | undefined,
  setIsLoading?: (loading: boolean) => void,
  setLoadingMessage?: (message: string) => void
): Promise<UploadResponse> => {
  try {
    if (!file) {
      return { success: false, url: "", error: "No file provided" };
    }

    const response = await fetch(`/api/avatar/upload?filename=${file.name}`, {
      method: "POST",
      body: file,
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status: ${response.status}`);
    }

    const image = (await response.json()) as PutBlobResult;
    return { success: true, url: image.url };
  } catch (error) {
    if (setIsLoading) setIsLoading(false);
    if (setLoadingMessage) setLoadingMessage("");

    return {
      success: false,
      url: "",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

export const capitalizeFirstCharacter = (str: string) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const formatTimestampWithTimeAMPM = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  // Determine AM or PM
  const period = hours >= 12 ? "PM" : "AM";

  // Convert to 12-hour format
  hours = hours % 12 || 12; // `0` becomes `12` for 12 AM/PM
  const formattedHours = String(hours).padStart(2, "0");

  return `${day}/${month}/${year} - ${formattedHours}:${minutes}:${seconds} ${period}`;
};
