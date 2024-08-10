"use client";

import { useForm } from "react-hook-form";
import Button from "../ui/Button";
import { zodResolver } from "@hookform/resolvers/zod";
import { bidPriceSchema, TBidPriceSchema } from "@/libs/zod";
import { FaPlus } from "react-icons/fa6";

const NFTPurchaseCard = () => {
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

  return (
    <section className="border border-secondary rounded-lg p-4">
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
        <p className="font-medium text-3xl">0.88 ETH</p>
        <p className="text-[gray] text-lg font-medium">$2,315</p>
      </div>
      <div className="mt-5 flex gap-4">
        <Button
          text="Place a bid"
          style="bg-white text-base font-medium w-full rounded-md"
        />
        <div className="flex items-center gap-2 w-full">
          <Button
            text="Buy now"
            style="bg-primary font-medium rounded-md w-full "
          />
          <button type="button" className="bg-white p-[0.85rem] rounded-lg">
            <FaPlus color="#181818" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default NFTPurchaseCard;
