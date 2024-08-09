"use client";

import Button from "@/components/ui/Button";
import { IoArrowBackCircle } from "react-icons/io5";
import { useRouter } from "next/navigation";

const Navbar = () => {
  const router = useRouter();

  return (
    <section className="sticky top-0 z-40 border-b border-b-secondary bg-base">
      <nav className="mx-8 flex items-center justify-between py-4">
        <button type="button" onClick={() => router.back()}>
          <IoArrowBackCircle size={35} className="cursor-pointer" />
        </button>
        <Button text="Connect wallet" style="bg-primary font-medium" />
      </nav>
    </section>
  );
};

export default Navbar;
