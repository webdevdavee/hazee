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
  userDetails: CreatorPageData;
  offers: CollectionOffer[] | undefined;
};

const CreatorDetails: React.FC<Props> = ({ userDetails, offers }) => {
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
        <div className="flex items-center justify-center rounded-lg overflow-hidden h-80  object-cover m:h-40">
          <Image
            src={
              (userDetails?.user.coverPhoto as string) ||
              "/images/default-cover.webp"
            }
            width={1000}
            height={1000}
            quality={100}
            alt={userDetails?.user.username || "Unnamed"}
            className="w-full object-cover"
          />
        </div>
        <div className="w-fit rounded-full overflow-hidden -mt-20 ml-6">
          <Image
            src={userDetails?.user.photo || "/images/default-avatar.svg"}
            width={1000}
            height={1000}
            quality={100}
            alt={userDetails?.user.username || "Unnamed"}
            className="object-cover w-[9.5rem] h-[9.5rem] m:w-[8rem] m:h-[8rem]"
          />
        </div>
      </div>
      <div className="flex justify-between mt-3 m:mt-6">
        <div>
          <h1 className="font-medium m:text-3xl">
            {userDetails?.user.username || "Unnamed"}
          </h1>
          <span className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <p>Address: </p>
                <p className="text-[gray]">
                  {truncateAddress(userDetails.user.walletAddress) ||
                    "Couldn't load address"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => copyAddress(userDetails.user.walletAddress)}
                disabled={!userDetails.user.walletAddress}
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
        {walletAddress === userDetails.user.walletAddress && (
          <Link
            href={`/creator/settings`}
            className="p-2 rounded-md bg-secondary flex items-center gap-3 h-fit transition cursor-pointer hover:bg-secondaryhover"
          >
            <IoSettingsOutline size={20} />
            <p className="m:hidden">Settings</p>
          </Link>
        )}
      </div>
      <CreatorItemsTab userDetails={userDetails} offers={offers} />
    </section>
  );
};

export default CreatorDetails;
