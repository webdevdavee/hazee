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

      <section className="bg-base p-2 rounded-lg max-h-[30rem] overflow-hidden m:w-[21rem]">
        <div className="mb-8 pb-5 border-b border-b-secondary">
          <div className="w-full flex items-center gap-3">
            <div className="aspect-square">
              <IPFSImage
                ipfsUrl={nft?.metadata?.image as string}
                alt="nft-image"
                width={100}
                height={100}
                className="w-full object-cover rounded-lg h-full"
                priority
                quality={100}
              />
            </div>
            <div className="flex flex-col">
              <p className="font-medium text-lg capitalize">
                {nft.metadata?.name}
              </p>
              <p className="text-[gray]">{collection?.name}</p>
            </div>
          </div>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="h-72 custom-scrollbar pr-3 overflow-y-auto overflow-x-hidden flex flex-col gap-4"
        >
          <div className="bg-secondary rounded-lg p-4 w-[30rem] flex flex-col gap-4">
            <span className="flex items-center justify-between">
              <p className="font-medium">Current highest bid</p>
              <p>{auctionDetails?.highestBid} ETH</p>
            </span>
            <span className="flex items-center justify-between">
              <p className="font-medium">Starting price</p>
              <p>{auctionDetails?.startingPrice} ETH</p>
            </span>
            <span className="flex items-center justify-between">
              <p className="font-medium">Reserve price</p>
              <p>{auctionDetails?.reservePrice} ETH</p>
            </span>
          </div>
          <TextInput
            inputRegister={register("bid")}
            label="Bid"
            htmlFor="bid"
            inputType="number"
            inputMode="decimal"
            step="any"
            min="0"
            placeholder="0.01"
            required
            error={
              errors.bid && <p className="text-red-500">{errors.bid.message}</p>
            }
          />

          <div>
            <Button
              text="Place bid"
              type="submit"
              style="bg-primary rounded-md text-center w-full mt-4"
            />
            <p className="text-sm text-yellow-600 mt-2 text-center">
              Your bid will replace the current highest bid if it is higher.
            </p>
          </div>
        </form>
      </section>
    </>
  );
};

export default MakeOffer;
