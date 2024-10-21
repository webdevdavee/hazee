"use client";

import useCopyToClipboard from "@/hooks/useCopyToClipboard";
import Image from "next/image";
import { usePathname } from "next/navigation";
import React from "react";
import { FaLink } from "react-icons/fa";
import { IoCopyOutline } from "react-icons/io5";
import CreatorItemsTab from "./CreatorItemsTab";
import { truncateAddress } from "@/libs/utils";
import { IoSettingsOutline } from "react-icons/io5";
import Link from "next/link";
import { useWallet } from "@/context/WalletProvider";

type Props = {
  urlWalletAddress: string;
  userDetails: User | null;
};

const CreatorDetails: React.FC<Props> = ({ urlWalletAddress, userDetails }) => {
  const pathname = usePathname();
  const { walletAddress } = useWallet();

  const { copyToClipboard: copyAddress, copyStatus: copyAddressStatus } =
    useCopyToClipboard();
  const { copyToClipboard: copyCreatorUrl, copyStatus: copyCreatorUrlStatus } =
    useCopyToClipboard();

  const [fullURL, setFullURL] = React.useState<string>("");

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
          {!userDetails?.coverPhoto ? (
            <div className="w-full h-full object-cover bg-secondary" />
          ) : (
            <Image
              src={userDetails?.coverPhoto as string}
              width={1000}
              height={1000}
              quality={100}
              alt={userDetails?.username || "Unnamed"}
              className="w-full object-cover"
            />
          )}
        </div>
        <div className="w-fit rounded-full overflow-hidden -mt-20 ml-6">
          <Image
            src={userDetails?.photo || "/images/default-avatar.webp"}
            width={150}
            height={150}
            quality={100}
            alt={userDetails?.username || "Unnamed"}
            className="object-cover h-[9.5rem]"
          />
        </div>
      </div>
      <div className="flex justify-between">
        <div>
          <h1 className="mt-3 font-medium">
            {userDetails?.username || "Unnamed"}
          </h1>
          <span className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <p>Address: </p>
                <p className="text-[gray]">
                  {truncateAddress(urlWalletAddress) || "Couldn't load address"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => copyAddress(urlWalletAddress)}
                disabled={!urlWalletAddress}
              >
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
        {walletAddress === urlWalletAddress && (
          <Link
            href={`/creator/settings`}
            className="p-2 rounded-md bg-secondary flex items-center gap-3 h-fit transition cursor-pointer hover:bg-secondaryhover"
          >
            <IoSettingsOutline size={20} />
            <p>Settings</p>
          </Link>
        )}
      </div>
      <CreatorItemsTab urlWalletAddress={urlWalletAddress} />
    </section>
  );
};

export default CreatorDetails;
