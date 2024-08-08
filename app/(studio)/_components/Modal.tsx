import React, { useRef } from "react";
import clsx from "clsx";
import { IoClose } from "react-icons/io5";
import { useOverlayStore } from "@/libs/zustand/overlayStore";
import useClickOutside from "@/hooks/useClickOutside";

interface Props {
  title: string;
  children: React.ReactNode;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const Modal: React.FC<Props> = ({ title, children, setIsModalOpen }) => {
  const isVisible = useOverlayStore((state) => state.isVisible);
  const hideOverlay = useOverlayStore((state) => state.hideOverlay);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleCloseModal = () => {
    hideOverlay();
  };

  useClickOutside(modalRef, () => {
    handleCloseModal();
  });

  return (
    <div
      ref={modalRef}
      className={clsx(
        "fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300",
        {
          "opacity-0 pointer-events-none": !isVisible,
          "opacity-100": isVisible,
        }
      )}
    >
      <div className="bg-secondary p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{title}</h2>
          <button type="button" onClick={handleCloseModal}>
            <IoClose size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
