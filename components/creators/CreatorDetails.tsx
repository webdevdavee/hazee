"use client";

import useCopyToClipboard from "@/hooks/useCopyToClipboard";
import Image from "next/image";
import { usePathname } from "next/navigation";
import React from "react";
import { FaLink } from "react-icons/fa";
import { IoCopyOutline } from "react-icons/io5";
import CreatorItemsTab from "./CreatorItemsTab";

type Props = {
  creator: Creator | undefined;
};

const CreatorDetails: React.FC<Props> = ({ creator }) => {
  const creatorsAddress = "0x0937...383h47sd";
  const { copyToClipboard: copyAddress, copyStatus: copyAddressStatus } =
    useCopyToClipboard();
  const { copyToClipboard: copyCreatorUrl, copyStatus: copyCreatorUrlStatus } =
    useCopyToClipboard();

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
    <section>
      <div>
        <div className="flex items-center justify-center rounded-xl overflow-hidden h-80">
          <Image
            src={creator?.cover as string}
            width={1000}
            height={1000}
            quality={100}
            alt={creator?.name as string}
            className="w-full object-cover"
          />
        </div>
        <div className="w-fit rounded-full overflow-hidden -mt-20 ml-6">
          <Image
            src={creator?.src as string}
            width={150}
            height={150}
            quality={100}
            alt={creator?.name as string}
            className="object-cover h-[9.5rem]"
          />
        </div>
      </div>
      <div>
        <h1 className="mt-3 font-medium">{creator?.name}</h1>
        <span className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <p className="text-[gray]">Address: {creatorsAddress}</p>
            <button type="button" onClick={() => copyAddress(creatorsAddress)}>
              {copyAddressStatus === "copied" ? (
                "Copied"
              ) : (
                <IoCopyOutline size={15} />
              )}
            </button>
          </div>
          <button
            type="button"
            className="w-fit bg-secondary p-2 rounded-md text-sm"
            onClick={() => copyCreatorUrl(fullURL)}
          >
            {copyCreatorUrlStatus === "copied" ? (
              "Link copied!"
            ) : (
              <FaLink size={15} />
            )}
          </button>
        </span>
      </div>
      <CreatorItemsTab creator={creator} />
    </section>
  );
};

export default CreatorDetails;
