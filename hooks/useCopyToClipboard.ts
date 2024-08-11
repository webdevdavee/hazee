import { useState } from "react";

const useCopyToClipboard = () => {
  const [copyStatus, setCopyStatus] = useState<
    "inactive" | "copied" | "failed"
  >("inactive");

  const copyToClipboard = (text: string) => {
    if (!navigator.clipboard) {
      console.warn("Clipboard not supported");
      setCopyStatus("failed");
      return;
    }

    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopyStatus("copied");
        setTimeout(() => setCopyStatus("inactive"), 2000);
      })
      .catch((err) => {
        console.warn("Failed to copy text: ", err);
        setCopyStatus("failed");
      });
  };

  return { copyToClipboard, copyStatus };
};

export default useCopyToClipboard;
