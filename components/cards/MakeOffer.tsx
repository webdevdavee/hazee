import Image from "next/image";
import Link from "next/link";
import { MdOutlineWallet } from "react-icons/md";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bidPriceSchema, TBidPriceSchema } from "@/libs/zod";
import TextInput from "../ui/TextInput";
import { FaArrowCircleRight } from "react-icons/fa";
import { FaArrowCircleLeft } from "react-icons/fa";
import React from "react";
import Button from "../ui/Button";

type Props = {
  nft: sampleNft;
};

const MakeOffer: React.FC<Props> = ({ nft }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TBidPriceSchema>({
    resolver: zodResolver(bidPriceSchema),
  });

  const onSubmit = async (data: TBidPriceSchema) => {
    reset();
  };

  const durations = [
    { id: 1, label: "12 hours", isButton: true },
    { id: 2, label: "1 day", isButton: true },
    { id: 3, label: "3 days", isButton: true },
    { id: 4, label: "7 days", isButton: true },
    { id: 4, label: "1 days", isButton: true },
  ];

  const [activeIndex, setActiveIndex] = React.useState(0);

  const goToNext = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % durations.length);
  };

  const goToPrevious = () => {
    setActiveIndex(
      (prevIndex) => (prevIndex - 1 + durations.length) % durations.length
    );
  };

  const activeDuration = durations[activeIndex];

  return (
    <section className="bg-base p-2 rounded-lg">
      <div className="mb-8 pb-5 border-b border-b-secondary">
        <div className="w-full flex items-center gap-3">
          <div className="aspect-square">
            <Image
              src={nft.src}
              width={100}
              height={100}
              alt={nft.name}
              className="object-cover rounded-lg"
            />
          </div>
          <div className="flex flex-col">
            <p className="font-medium text-lg">{nft.name}</p>
            <Link href="#" className="text-[gray]">
              {nft.collection}
            </Link>
          </div>
        </div>
      </div>
      <div className="h-72 custom-scrollbar pr-3 overflow-y-auto overflow-x-hidden flex flex-col gap-4">
        <div className="bg-secondary rounded-lg p-4 w-[30rem] flex flex-col gap-4">
          <span className="flex items-center gap-2">
            <MdOutlineWallet />
            <p className="font-medium">Balance</p>
          </span>
          <span className="flex items-center justify-between">
            <p className="font-medium">Floor price</p>
            <p>0.1 ETH</p>
          </span>
          <span className="flex items-center justify-between">
            <p className="font-medium">Best price</p>
            <p>0.04 ETH</p>
          </span>
        </div>
        <TextInput
          inputRegister={register("bid")}
          label="Bid"
          htmlFor="bid"
          inputType="number"
          placeholder="Price"
          inputMode="decimal"
          required
          error={
            errors.bid && <p className="text-red-500">{errors.bid.message}</p>
          }
        />
        <div className="flex flex-col gap-3">
          <p className="font-medium">Duration</p>
          <div>
            <div className="flex items-center justify-between gap-3 w-full border border-secondary text-sm py-2 px-3 rounded-full">
              <button type="button" onClick={goToPrevious}>
                <FaArrowCircleLeft size={20} />
              </button>
              {activeDuration.label}
              <button type="button" onClick={goToNext}>
                <FaArrowCircleRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
      <Button
        text="Make offer"
        type="submit"
        style="bg-primary rounded-md text-center w-full mt-4"
      />
    </section>
  );
};

export default MakeOffer;
