import React, { useRef } from "react";
import clsx from "clsx";
import { IoClose } from "react-icons/io5";
import { useOverlayStore } from "@/libs/zustand/overlayStore";
import useClickOutside from "@/hooks/useClickOutside";

interface Props {
  title?: string;
  children: React.ReactNode;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isLoading?: boolean;
  loadingMessage?: string;
}

const Modal: React.FC<Props> = ({
  title,
  children,
  setIsModalOpen,
  isLoading = false,
  loadingMessage = "Processing...",
}) => {
  const isVisible = useOverlayStore((state) => state.isVisible);
  const hideOverlay = useOverlayStore((state) => state.hideOverlay);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleCloseModal = () => {
    if (!isLoading) {
      hideOverlay();
      setIsModalOpen(false);
    }
  };

  useClickOutside(modalRef, handleCloseModal);

  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300",
        {
          "opacity-0 pointer-events-none": !isVisible,
          "opacity-100": isVisible,
        }
      )}
    >
      <div
        ref={modalRef}
        className="bg-base p-8 rounded-lg shadow-lg max-w-fit relative"
      >
        <div className="flex justify-between items-center gap-16 mb-4">
          <h2 className="text-2xl font-bold">{title}</h2>
          <button
            type="button"
            onClick={handleCloseModal}
            disabled={isLoading}
            className={clsx("transition-opacity", {
              hidden: isLoading,
              "hover:opacity-70": !isLoading,
            })}
          >
            <IoClose size={20} />
          </button>
        </div>

        <div className="relative">
          <div
            className={clsx("transition-opacity duration-300", {
              "pointer-events-none": isLoading,
              "opacity-100": !isLoading,
            })}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
