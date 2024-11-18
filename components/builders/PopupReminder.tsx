"use client";

import { useState, useEffect, useCallback } from "react";
import { IoClose } from "react-icons/io5";

type PopupReminderProps = {
  delayMs?: number;
  persistKey?: string;
};

const PopupReminder = ({
  delayMs = 3000,
  persistKey = "nft_reminder_shown",
}: PopupReminderProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Check if user has already seen the popup
    const hasSeenPopup = localStorage.getItem(persistKey);

    if (!hasSeenPopup) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        localStorage.setItem(persistKey, "true");
      }, delayMs);

      return () => clearTimeout(timer);
    }
  }, [delayMs, persistKey]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    // Wait for animation to complete before removing from DOM
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
    }, 200);
  }, []);

  // Handle escape key press
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isVisible) {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => document.removeEventListener("keydown", handleEscapeKey);
  }, [isVisible, handleClose]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm
        ${isClosing ? "animate-fade-out" : "animate-fade-in"}`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-title"
    >
      <div
        className={`bg-zinc-900 text-white rounded-lg shadow-xl p-6 max-w-md w-full relative
          ${isClosing ? "animate-slide-down" : "animate-slide-up"}
          max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close popup"
        >
          <IoClose className="h-5 w-5" />
        </button>

        <h2 id="popup-title" className="text-xl font-bold mb-4 pr-8">
          🚨 Important NFT Notice!
        </h2>

        <div className="space-y-4 text-sm">
          <p>Hey there! 👋 Quick reminder about our NFT marketplace:</p>

          <ul className="list-disc pl-4 space-y-2">
            <li>We use Sepolia Testnet only</li>
            <li>It&apos;s all for testing - no real money!</li>
            <li>You need Sepolia ETH (test tokens) to start</li>
          </ul>

          <div>
            <p className="font-semibold mb-2">
              Get free Sepolia ETH from Google:
            </p>
            <ol className="list-decimal pl-4 space-y-2">
              <li>Search &quot;Google Sepolia Faucet&quot;</li>
              <li>Connect wallet (Sepolia network)</li>
              <li>Enter wallet address, request tokens</li>
            </ol>
          </div>

          <p className="font-bold">
            Remember: Test tokens only. No real money!
          </p>

          <p className="text-xs text-gray-400">
            Stay safe and have fun in Web3! 🚀
          </p>
        </div>
      </div>
    </div>
  );
};

export default PopupReminder;
