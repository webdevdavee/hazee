"use client";

import React, { createContext, useContext, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoMdClose } from "react-icons/io";

interface Toast {
  id: number;
  message: string;
  type: "info" | "success" | "error";
}

interface ToastContextType {
  showToast: (message: string, type: "info" | "success" | "error") => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

const ToastComponent: React.FC<{ toast: Toast; onClose: () => void }> = ({
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

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: "info" | "success" | "error") => {
    const id = Date.now();
    setToasts((prevToasts) => [...prevToasts, { id, message, type }]);
    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    }, 5000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastComponent
            key={toast.id}
            toast={toast}
            onClose={() =>
              setToasts((prevToasts) =>
                prevToasts.filter((t) => t.id !== toast.id)
              )
            }
          />
        ))}
      </AnimatePresence>
    </ToastContext.Provider>
  );
};
