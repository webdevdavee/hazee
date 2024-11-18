import { useState, useEffect, useRef } from "react";
import { ethToUsd } from "@/libs/utils/ethToUsd";

interface ConversionResult {
  usdAmount: string;
  isLoading: boolean;
  error: string | null;
}

export const useEthConverter = (
  ethAmount?: string,
  refreshInterval = 1200000
) => {
  // 1200000ms = 20 minutes
  const [conversionResult, setConversionResult] = useState<ConversionResult>({
    usdAmount: "",
    isLoading: false,
    error: null,
  });

  // Use ref to store the interval ID
  const intervalRef = useRef<NodeJS.Timeout>();

  // Function to perform the conversion
  const convertPrice = async () => {
    if (!ethAmount) {
      setConversionResult({
        usdAmount: "",
        isLoading: false,
        error: null,
      });
      return;
    }

    // Remove 'ETH' text if present and trim whitespace
    const cleanedAmount = ethAmount.replace(/ETH/i, "").trim();

    // Validate input is a number
    if (isNaN(parseFloat(cleanedAmount))) {
      setConversionResult({
        usdAmount: "",
        isLoading: false,
        error: "Invalid ETH amount",
      });
      return;
    }

    try {
      setConversionResult((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      const usdValue = await ethToUsd(cleanedAmount);

      // Format with commas and decimals
      const formattedUsd = parseFloat(usdValue).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      setConversionResult({
        usdAmount: formattedUsd,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setConversionResult({
        usdAmount: "",
        isLoading: false,
        error: err instanceof Error ? err.message : "Conversion failed",
      });
    }
  };

  useEffect(() => {
    // Initial conversion
    convertPrice();

    // Set up periodic refresh
    intervalRef.current = setInterval(convertPrice, refreshInterval);

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [ethAmount, refreshInterval]); // Dependencies array includes refreshInterval in case it changes

  return conversionResult;
};
