"use client";

import React from "react";
import { motion } from "framer-motion";
import { IoMdClose } from "react-icons/io";

export interface Toast {
  id: number;
  message: string;
  type: "info" | "success" | "error";
}

interface ToastComponentProps {
  toast: Toast;
  onClose: () => void;
}

export const ToastComponent: React.FC<ToastComponentProps> = ({
  toast,
  onClose,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className={`fixed bottom-4 right-4 p-4 rounded-md shadow-lg max-w-sm z-[50] ${
        toast.type === "success"
          ? "bg-green-500"
          : toast.type === "error"
          ? "bg-red-500"
          : "bg-[#3a3b3c]"
      } text-white`}
    >
      <motion.div
        className="flex items-center justify-between"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <p className="mr-8">{toast.message}</p>
        <button
          onClick={onClose}
          className="text-white hover:text-[#B9A6FD] transition-colors duration-200"
        >
          <IoMdClose size={20} />
        </button>
      </motion.div>
    </motion.div>
  );
};
