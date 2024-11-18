"use client";

import React from "react";
import Dropdown from "@/app/(studio)/_components/Dropdown";
import Button from "../ui/Button";
import TextInput from "../ui/TextInput";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ListNFTSchema, listNFTSchema } from "@/libs/zod";
import { useToast } from "@/context/ToastProvider";
import { useNFTMarketplace } from "@/context/NFTMarketplaceProvider";
import Modal from "./Modal";
import SecondaryLoader from "../ui/SecondaryLoader";

enum ListingType {
  NONE,
  SALE,
  AUCTION,
  BOTH,
}

type Props = {
  nft: TokenInfo;
  collection: CollectionInfo | undefined;
};

type ListingTypes = {
  id: ListingType;
  type: string;
};

const ListNFT: React.FC<Props> = ({ nft, collection }) => {
  const { showToast } = useToast();
  const { listNFT, isContractReady: isMarketplaceContractReady } =
    useNFTMarketplace();

  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingMessage, setLoadingMessage] = React.useState("");

  const listingTypes: ListingTypes[] = [
    { id: ListingType.SALE, type: "Sale" },
    { id: ListingType.AUCTION, type: "Auction" },
    { id: ListingType.BOTH, type: "Both" },
  ];

  const auctionDurations = [
    { label: "1 day", seconds: 1 * 24 * 60 * 60 },
    { label: "3 days", seconds: 3 * 24 * 60 * 60 },
    { label: "7 days", seconds: 7 * 24 * 60 * 60 },
    { label: "1 week", seconds: 7 * 24 * 60 * 60 },
  ];

  const [selectedListingType, setSelectedListingType] =
    React.useState<ListingTypes>();
  const [selectedDuration, setSelectedDuration] = React.useState<{
    label: string;
    seconds: number;
  }>();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ListNFTSchema>({
    resolver: zodResolver(listNFTSchema),
    defaultValues: {
      listingPrice: nft.price,
      startingPrice: "0",
      reservePrice: "0",
    },
  });

  const onSubmit = async (data: ListNFTSchema) => {
    if (!isMarketplaceContractReady) {
      showToast("Please connect your wallet", "error");
      return;
    }

    setIsLoading(true);
    setLoadingMessage("Preparing to list NFT...");

    try {
      const listingType = selectedListingType?.id || ListingType.SALE;

      // Validate auction parameters if needed
      if (
        (listingType === ListingType.AUCTION ||
          listingType === ListingType.BOTH) &&
        (!data.startingPrice || !data.reservePrice || !selectedDuration)
      ) {
        showToast("Please provide all auction parameters", "error");
        setIsLoading(false);
        return;
      }

      setLoadingMessage("Listing NFT...");

      const listingParams = {
        tokenId: nft.tokenId,
        price: data.listingPrice || nft.price,
        listingType,
        ...(listingType === ListingType.AUCTION ||
        listingType === ListingType.BOTH
          ? {
              startingPrice: data.startingPrice,
              reservePrice: data.reservePrice,
              duration: selectedDuration?.seconds,
            }
          : {}),
      };

      const success = await listNFT(listingParams);

      if (success) {
        reset();
        window.location.reload();
      }
    } catch (error) {
      console.error("Error listing NFT:", error);
      showToast("Failed to list NFT. Please try again.", "error");
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

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-[32rem] max-h-[28rem] rounded-lg p-4 overflow-y-auto custom-scrollbar m:w-[21rem]"
      >
        <div className="grid grid-cols-1">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3 rounded-md">
                <p>Name:</p>
                <p>{nft.metadata?.name}</p>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-md">
                <p>Minting price:</p>
                <p>{nft.price} ETH</p>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-md">
                <p>Collection:</p>
                <p>{collection?.name}</p>
              </div>
            </div>

            <div>
              <Dropdown
                items={listingTypes}
                defaultText="Select a listing type"
                renderItem={(item) => item.type}
                onSelect={(item) => setSelectedListingType(item)}
              />
              <p className="mt-3 text-yellow-600 text-sm">
                NOTE: If you do not select a listing option, your token will be
                listed with the &quot;Sale&quot; option by default
              </p>
            </div>

            {(selectedListingType?.id === ListingType.SALE ||
              selectedListingType?.id === ListingType.BOTH ||
              !selectedListingType) && (
              <TextInput
                inputRegister={register("listingPrice")}
                label="Listing Price (ETH)"
                htmlFor="listingPrice"
                inputType="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.01"
                required
                error={
                  errors.listingPrice && (
                    <p className="text-red-500">
                      {errors.listingPrice.message}
                    </p>
                  )
                }
              />
            )}

            {(selectedListingType?.id === ListingType.AUCTION ||
              selectedListingType?.id === ListingType.BOTH) && (
              <div className="flex flex-col gap-4">
                <TextInput
                  inputRegister={register("startingPrice")}
                  label="Starting Price (ETH)"
                  htmlFor="startingPrice"
                  inputType="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder="0.01"
                  required
                  error={
                    errors.startingPrice && (
                      <p className="text-red-500">
                        {errors.startingPrice.message}
                      </p>
                    )
                  }
                />
                <TextInput
                  inputRegister={register("reservePrice")}
                  label="Reserve Price (ETH)"
                  htmlFor="reservePrice"
                  inputType="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder="0.01"
                  required
                  error={
                    errors.reservePrice && (
                      <p className="text-red-500">
                        {errors.reservePrice.message}
                      </p>
                    )
                  }
                />
                <div>
                  <Dropdown
                    items={auctionDurations}
                    defaultText="Select auction duration"
                    renderItem={(item) => item.label}
                    onSelect={setSelectedDuration}
                  />
                </div>
              </div>
            )}

            <Button
              text="List NFT"
              style="mt-4 bg-abstract p-4 rounded-md"
              type="submit"
            />
          </div>
        </div>
      </form>
    </>
  );
};

export default ListNFT;
