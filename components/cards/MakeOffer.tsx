import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bidPriceSchema, TBidPriceSchema } from "@/libs/zod";
import TextInput from "../ui/TextInput";
import React from "react";
import Button from "../ui/Button";
import IPFSImage from "../ui/IPFSImage";
import { useNFTAuction } from "@/context/NFTAuctionProvider";
import SecondaryLoader from "../ui/SecondaryLoader";
import Modal from "../layout/Modal";
import { useWallet } from "@/context/WalletProvider";
import { useToast } from "@/context/ToastProvider";
import { revalidatePathAction } from "@/server-scripts/actions/revalidate.from.client";

type Props = {
  nft: TokenInfo;
  collection: CollectionInfo | undefined;
  auctionDetails: AuctionDetails | undefined;
};

const MakeOffer: React.FC<Props> = ({ nft, collection, auctionDetails }) => {
  const { placeBid } = useNFTAuction();
  const { balance } = useWallet();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingMessage, setLoadingMessage] = React.useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TBidPriceSchema>({
    resolver: zodResolver(bidPriceSchema),
  });

  const onSubmit = async (data: TBidPriceSchema) => {
    if (!data.bid) return;

    // Check if user has enough balance to place bid
    if (balance && Number(balance) <= data.bid) {
      showToast("Insufficient funds to place bid", "error");
      return;
    }

    // Check if user bid is lower or equal to current highest bid
    if (data.bid <= Number(auctionDetails?.startingPrice)) {
      showToast("Bid lower than starting price", "error");
      return;
    }

    // Check if user bid is lower or equal to current highest bid
    if (data.bid <= Number(auctionDetails?.highestBid)) {
      showToast("Bid lower than highest bid", "error");
      return;
    }

    setLoadingMessage("Processing bid...");

    try {
      setIsLoading(true);

      const isBidPlaced = await placeBid(nft.tokenId, data.bid.toString());

      if (isBidPlaced) {
        await revalidatePathAction("/");
        reset();
        window.location.reload();
      }
    } catch (error: any) {
      console.error(error.message);
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
        className="w-[32rem] m:max-h-[28rem] rounded-2xl p-6 overflow-y-auto m:w-[21rem] transition-all duration-300 m:p-4"
      >
        <div className="grid grid-cols-1">
          <div className="flex flex-col gap-8">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-white/70 font-medium">Name:</div>
                <div className="text-right text-white">
                  {nft.metadata?.name}
                </div>
                <div className="text-white/70 font-medium">
                  Current highest bid:
                </div>
                <div className="text-right text-white">
                  {auctionDetails?.highestBid} ETH
                </div>
                <div className="text-white/70 font-medium">Collection:</div>
                <div className="text-right text-white">{collection?.name}</div>
                <div className="text-white/70 font-medium">Starting price:</div>
                <div className="text-right text-white">
                  {auctionDetails?.startingPrice} ETH
                </div>
                <div className="text-white/70 font-medium">Reserve price:</div>
                <div className="text-right text-white">
                  {auctionDetails?.reservePrice} ETH
                </div>
              </div>
            </div>

            <TextInput
              inputRegister={register("bid")}
              label="Bid Price (ETH)"
              htmlFor="bid"
              inputType="number"
              inputMode="decimal"
              step="any"
              min="0"
              placeholder="0.01"
              required
              error={
                errors.bid && (
                  <p className="text-red-400 text-xs pl-2">
                    {errors.bid.message}
                  </p>
                )
              }
            />

            <Button
              text="Place bid"
              style="mt-4 bg-abstract hover:bg-abstract/80 text-white font-semibold p-4 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-abstract/50 shadow-md hover:shadow-lg"
              type="submit"
            />
            <p className="text-yellow-400/80 text-xs italic pl-2 text-center">
              Your bid will replace the current highest bid if it is higher.
            </p>
          </div>
        </div>
      </form>
    </>
  );
};

export default MakeOffer;
