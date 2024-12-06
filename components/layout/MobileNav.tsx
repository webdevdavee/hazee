import React from "react";
import NavbarSearch from "../builders/NavbarSearch";
import { IoIosArrowDown } from "react-icons/io";
import Link from "next/link";
import Button from "../ui/Button";
import { useWallet } from "@/context/WalletProvider";
import { PiArrowBendDownRightBold } from "react-icons/pi";

type Props = {
  walletConnection: boolean | undefined;
  handleOpenModal: () => void;
  setShowMobileMenu: React.Dispatch<React.SetStateAction<boolean>>;
};

const MobileNav: React.FC<Props> = ({
  walletConnection,
  handleOpenModal,
  setShowMobileMenu,
}) => {
  const { walletAddress, truncatedAddress, balance } = useWallet();

  const [isExploreOpen, setIsExploreOpen] = React.useState<boolean>();
  const [isCreateOpen, setIsCreateOpen] = React.useState<boolean>();

  return (
    <nav className="w-full px-6 hidden m:block py-4 fixed top-16 h-screen bg-base shadow-md xl:block">
      <div className="flex flex-col gap-8">
        <NavbarSearch setShowMobileMenu={setShowMobileMenu} />

        <div>
          <div
            className="flex items-center justify-between"
            onClick={() => setIsExploreOpen(!isExploreOpen)}
          >
            <h4>Explore</h4>
            <IoIosArrowDown
              className={`${
                isExploreOpen && "rotate-180 transition-all duration-150"
              } transition-all duration-150`}
            />
          </div>
          {isExploreOpen && (
            <div className="mt-3 flex flex-col gap-5 pl-3">
              <Link
                href="/explore/nfts"
                className="text-sm text-slate-200 flex items-center gap-3"
                onClick={() => setShowMobileMenu(false)}
              >
                <PiArrowBendDownRightBold />
                <p>NFTs</p>
              </Link>
              <Link
                href="/explore/collections"
                className="text-sm text-slate-200 flex items-center gap-3"
                onClick={() => setShowMobileMenu(false)}
              >
                <PiArrowBendDownRightBold />
                <p>Collections</p>
              </Link>
              <Link
                href="/explore/creators"
                className="text-sm text-slate-200 flex items-center gap-3"
                onClick={() => setShowMobileMenu(false)}
              >
                <PiArrowBendDownRightBold />
                <p>Creators</p>
              </Link>
            </div>
          )}
        </div>

        <div>
          <div
            className="flex items-center justify-between"
            onClick={() => setIsCreateOpen(!isCreateOpen)}
          >
            <h4>Create</h4>
            <IoIosArrowDown
              className={`${
                isCreateOpen && "rotate-180 transition-all duration-150"
              } transition-all duration-150`}
            />
          </div>
          {isCreateOpen && (
            <div className="mt-3 flex flex-col gap-5 pl-3">
              <Link
                href="/studio/nft"
                className="text-sm text-slate-200 flex items-center gap-3"
                onClick={() => setShowMobileMenu(false)}
              >
                <PiArrowBendDownRightBold />
                <p>NFT</p>
              </Link>
              <Link
                href="/studio/collection"
                className="text-sm text-slate-200 flex items-center gap-3"
                onClick={() => setShowMobileMenu(false)}
              >
                <PiArrowBendDownRightBold />
                <p>Collection</p>
              </Link>
            </div>
          )}
        </div>

        <>
          {!walletConnection ? (
            <Button
              text="Connect wallet"
              style="bg-primary font-medium"
              onclick={handleOpenModal}
            />
          ) : (
            <div className="flex items-center gap-3 mt-4">
              <Link href={`/creator/${walletAddress}`}>
                <Button
                  text={truncatedAddress as string}
                  style="bg-primary font-medium"
                  onclick={() => setShowMobileMenu(false)}
                />
              </Link>
              <p
                className="bg-secondary font-medium p-[0.6rem] rounded-full"
                style={{ display: balance ? "block" : "none" }}
              >
                {parseFloat(balance as string).toFixed(3)} ETH
              </p>
            </div>
          )}
        </>
      </div>
    </nav>
  );
};

export default MobileNav;
