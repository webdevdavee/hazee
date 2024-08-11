"use client";

import React from "react";
import Button from "../ui/Button";
import { FaLink } from "react-icons/fa6";
import useCopyToClipboard from "@/hooks/useCopyToClipboard";
import { usePathname } from "next/navigation";

const CollectionCTA = () => {
  const { copyToClipboard, copyStatus } = useCopyToClipboard();
  const [fullURL, setFullURL] = React.useState<string>("");
  const pathname = usePathname();

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const protocol = window.location.protocol;
      const host = window.location.host;

      setFullURL(`${protocol}//${host}${pathname}`);
    }
  }, [pathname]);

  return (
    <>
      <section className="mt-4 flex items-center gap-4">
        <Button text="Place floor bid" style="bg-primary rounded-md" />
        <button
          type="button"
          className="w-fit bg-secondary p-3 rounded-md text-sm"
          onClick={() => copyToClipboard(fullURL)}
        >
          {copyStatus === "copied" ? "Link copied!" : <FaLink size={20} />}
        </button>
      </section>
    </>
  );
};

export default CollectionCTA;
