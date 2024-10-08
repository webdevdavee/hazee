"use client";

import Button from "../ui/Button";
import Modal from "@/components/layout/Modal";
import { useOverlayStore } from "@/libs/zustand/overlayStore";
import React from "react";
import MakeOffer from "./MakeOffer";

type Props = {
  nft: sampleNft;
};

const NFTPurchaseCard: React.FC<Props> = ({ nft }) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const showOverlay = useOverlayStore((state) => state.showOverlay);

  const handleOpenModal = () => {
    setIsModalOpen(true);
    showOverlay();
  };

  return (
    <section className="border border-secondary rounded-lg p-4">
      {isModalOpen && (
        <Modal title="Make an offer" setIsModalOpen={setIsModalOpen}>
          <MakeOffer nft={nft} />
        </Modal>
      )}
      <div className="flex flex-col gap-2 mb-4">
        <p className="text-lg font-medium">Sale ends in:</p>
        <div className="flex items-center gap-5">
          <div className="flex flex-col">
            <p className="text-lg text-abstract">00</p>
            <p className="text-lg text-abstract">Days</p>
          </div>
          <div className="flex flex-col">
            <p className="text-lg text-abstract">02</p>
            <p className="text-lg text-abstract">Hours</p>
          </div>
          <div className="flex flex-col">
            <p className="text-lg text-abstract">59</p>
            <p className="text-lg text-abstract">Minutes</p>
          </div>
          <div className="flex flex-col">
            <p className="text-lg text-abstract">45</p>
            <p className="text-lg text-abstract">Seconds</p>
          </div>
        </div>
      </div>
      <div className="bg-secondary bg-opacity-30 rounded-md flex flex-col p-4">
        <p className="text-[gray] text-lg font-medium">Price</p>
        <p className="font-medium text-3xl">{nft.price}</p>
        <p className="text-[gray] text-lg font-medium">$2,315</p>
      </div>
      <div className="mt-5 flex gap-4">
        <Button
          text="Place a bid"
          style="bg-white text-base font-medium w-full rounded-md"
          onclick={handleOpenModal}
        />
        <Button
          text="Buy now"
          style="bg-primary font-medium rounded-md w-full "
        />
      </div>
    </section>
  );
};

export default NFTPurchaseCard;
