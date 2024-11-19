"use client";

import React from "react";
import TextInput from "../ui/TextInput";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  makeCollectionOfferSchema,
  TMakeCollectionOfferSchema,
} from "@/libs/zod";
import Dropdown from "@/app/(studio)/_components/Dropdown";
import Button from "../ui/Button";
import Modal from "../layout/Modal";
import SecondaryLoader from "../ui/SecondaryLoader";
import { useNFTCollections } from "@/context/NFTCollectionProvider";
import { useToast } from "@/context/ToastProvider";

type Props = { collection: CollectionInfo };

const MakeCollectionOffer: React.FC<Props> = ({ collection }) => {
  const { placeCollectionOffer, isContractReady } = useNFTCollections();
  const { showToast } = useToast();

  const [selectedDuration, setSelectedDuration] = React.useState<{
    label: string;
    seconds: number;
  }>();
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingMessage, setLoadingMessage] = React.useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TMakeCollectionOfferSchema>({
    resolver: zodResolver(makeCollectionOfferSchema),
  });

  const auctionDurations = [
    { label: "1 day", seconds: 1 * 24 * 60 * 60 },
    { label: "3 days", seconds: 3 * 24 * 60 * 60 },
    { label: "7 days", seconds: 7 * 24 * 60 * 60 },
    { label: "1 week", seconds: 7 * 24 * 60 * 60 },
  ];

  const onSubmit = async (data: TMakeCollectionOfferSchema) => {
    if (!isContractReady) {
      showToast("Please connect your wallet", "error");
      return;
    }

    setIsLoading(true);
    setLoadingMessage("Placing your offer...");

    try {
      if (!data.nftCount || Number(data.nftCount) < 1) {
        showToast("Token must be at least 1", "error");
        return;
      }

      if (Number(data.nftCount) > collection.mintedSupply) {
        showToast(
          "Number of tokens greater than collection's minted supply",
          "error"
        );
        return;
      }

      if (
        Number(data.amount) <
        Number(collection.floorPrice) * Number(data.nftCount)
      ) {
        showToast("Offer below floor price", "error");
        return;
      }

      const response = await placeCollectionOffer(
        collection.collectionId,
        Number(data.nftCount),
        selectedDuration?.seconds || 0,
        data.amount
      );

      if (response.success) {
        reset();
        window.location.reload();
      }
    } catch (error: any) {
      console.error("Error placing offer:", error);
    } finally {
      setIsLoading(false);
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

      <div className="flex flex-col gap-3 bg-secondary p-3 rounded-md mb-6">
        <div className="flex items-center justify-between">
          <p>Minted supply:</p>
          <p>{collection.mintedSupply}</p>
        </div>

        <div className="flex items-center justify-between">
          <p>Floor price:</p>
          <p>{collection.floorPrice} ETH * token count</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <TextInput
          inputRegister={register("nftCount")}
          label="Number of tokens"
          htmlFor="nftCount"
          inputType="number"
          placeholder="number of tokens"
          required
          error={
            errors.nftCount && (
              <p className="text-red-500">{errors.nftCount.message}</p>
            )
          }
        />
        <TextInput
          inputRegister={register("amount")}
          label="Offer amount (ETH)"
          htmlFor="listingPrice"
          inputType="number"
          inputMode="decimal"
          step="any"
          min="0"
          placeholder="0.01"
          required
          error={
            errors.amount && (
              <p className="text-red-500">{errors.amount.message}</p>
            )
          }
        />
        <div>
          <Dropdown
            items={auctionDurations}
            defaultText="Select offer duration"
            renderItem={(item) => item.label}
            onSelect={setSelectedDuration}
          />
          <p className="mt-3 text-yellow-600 text-sm">
            NOTE: If you do not select a duration, your offer will be placed
            with a 7 days duration by default
          </p>
        </div>
        <Button
          text="Place offer"
          style="bg-abstract p-4 rounded-md"
          type="submit"
        />
      </form>
    </>
  );
};

export default MakeCollectionOffer;
