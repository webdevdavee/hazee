"use client";

import Button from "@/components/ui/Button";
import { IoArrowBackCircle } from "react-icons/io5";
import { useRouter } from "next/navigation";
import { useWallet } from "@/context/WalletProvider";

const Navbar = () => {
  const router = useRouter();

  const { connectWallet, truncatedAddress, balance } = useWallet();

  return (
    <section className="sticky top-0 z-40 border-b border-b-secondary bg-base">
      <nav className="mx-8 flex items-center justify-between py-4">
        <button type="button" onClick={() => router.back()}>
          <IoArrowBackCircle size={35} className="cursor-pointer" />
        </button>
        <div className="flex items-center gap-3">
          <Button
            text={truncatedAddress as string}
            style="bg-primary font-medium"
            onclick={connectWallet}
          />
          <p className="bg-secondary font-medium p-[0.6rem] rounded-full">
            {balance as string} ETH
          </p>
        </div>
      </nav>
    </section>
  );
};

export default Navbar;
