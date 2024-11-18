import React from "react";
import { useAuctionTimer } from "@/hooks/useAuctionTimer";
import { useNFTMarketplace } from "@/context/NFTMarketplaceProvider";
import Button from "../ui/Button";
import Modal from "../layout/Modal";
import SecondaryLoader from "../ui/SecondaryLoader";
import { useOverlayStore } from "@/libs/zustand/overlayStore";

interface AuctionTimerProps {
  endTime: number | undefined;
  listingId: number;
}

const AuctionTimer: React.FC<AuctionTimerProps> = ({ endTime, listingId }) => {
  const { endAuction } = useNFTMarketplace();
  const { timeLeft, isEnded } = useAuctionTimer(endTime);

  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingMessage, setLoadingMessage] = React.useState("");

  const showOverlay = useOverlayStore((state) => state.showOverlay);
  const hideOverlay = useOverlayStore((state) => state.hideOverlay);

  const formatNumber = (num: number): string => String(num).padStart(2, "0");

  const handleEndAuction = async () => {
    setIsLoading(true);
    showOverlay();

    setLoadingMessage("Ending auction...");
    try {
      await endAuction(listingId);
    } catch (error: any) {
      console.error("Failed to end auction", error.message);
    } finally {
      setIsLoading(false);
      hideOverlay();
      setLoadingMessage("");
    }
  };

  return (
    <>
      {isLoading && (
        <Modal
          setIsModalOpen={setIsLoading}
          isLoading={isLoading}
          loadingMessage={loadingMessage}
        >
          <div className="flex items-center justify-center backdrop-blur-[2px]">
            <SecondaryLoader message={loadingMessage} size="md" />
          </div>
        </Modal>
      )}

      <section>
        <div className="flex flex-col gap-2 mb-4">
          <p className="text-lg font-medium">
            {isEnded ? "Auction Ended" : "Auction ends in:"}
          </p>
          <div className="flex items-center gap-5">
            {[
              { value: formatNumber(timeLeft.days), label: "Days" },
              { value: formatNumber(timeLeft.hours), label: "Hours" },
              { value: formatNumber(timeLeft.minutes), label: "Minutes" },
              { value: formatNumber(timeLeft.seconds), label: "Seconds" },
            ].map((timeUnit, index) => (
              <div key={index} className="flex flex-col">
                <p className="text-lg text-yellow-600">{timeUnit.value}</p>
                <p className="text-lg text-yellow-600">{timeUnit.label}</p>
              </div>
            ))}
          </div>
        </div>

        {isEnded && (
          <Button
            text="End auction"
            style="bg-abstract rounded-md mb-4"
            onclick={() => handleEndAuction()}
          />
        )}
      </section>
    </>
  );
};

export default AuctionTimer;
