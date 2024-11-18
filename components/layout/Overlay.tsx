"use client";

import { useOverlayStore } from "@/libs/zustand/overlayStore";

const Overlay = () => {
  const isVisible = useOverlayStore((state) => state.isVisible);

  return (
    <section
      className="bg-black w-full h-full fixed top-0 right-0 opacity-70 z-50"
      style={{ display: isVisible ? "block" : "none" }}
    ></section>
  );
};

export default Overlay;
