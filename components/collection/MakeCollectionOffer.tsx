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

      <div className="m:max-h-[28rem] rounded-2xl p-6 space-y-6 transition-all duration-300 overflow-y-auto m:w-[21rem]">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <p className="text-white/70 font-medium">Minted supply:</p>
            <div className="text-right text-white">
              {collection.mintedSupply}
            </div>
            <p className="text-white/70 font-medium">Floor price:</p>
            <p className="text-right text-white">
              {`${collection.floorPrice} ETH × ${collection.mintedSupply} = ${
                Number(collection.floorPrice) * collection.mintedSupply
              } ETH`}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <TextInput
            inputRegister={register("nftCount")}
            label="Number of tokens"
            htmlFor="nftCount"
            inputType="number"
            placeholder="number of tokens"
            required
            error={
              errors.nftCount && (
                <p className="text-red-400 text-xs pl-2">
                  {errors.nftCount.message}
                </p>
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
                <p className="text-red-400 text-xs pl-2">
                  {errors.amount.message}
                </p>
              )
            }
          />
          <div className="space-y-3">
            <Dropdown
              items={auctionDurations}
              defaultText="Select offer duration"
              renderItem={(item) => item.label}
              onSelect={setSelectedDuration}
              className="w-full"
            />
            <p className="text-yellow-400/80 text-xs italic pl-2">
              NOTE: If you do not select a duration, your offer will be placed
              with a 7 days duration by default
            </p>
          </div>
          <Button
            text="Place offer"
            style="w-full bg-abstract hover:bg-abstract/80 text-white font-semibold p-4 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-abstract/50 shadow-md hover:shadow-lg"
            type="submit"
          />
        </form>
      </div>
    </>
  );
};

export default MakeCollectionOffer;
