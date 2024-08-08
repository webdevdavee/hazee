import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { priceRangeSchema, TPriceRangeSchema } from "@/libs/zod";

type PriceRangeDialogProps = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const PriceRangeDialog: React.FC<PriceRangeDialogProps> = ({
  isOpen,
  setIsOpen,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TPriceRangeSchema>({
    resolver: zodResolver(priceRangeSchema),
  });

  const [priceRange, setPriceRange] = React.useState({
    minPrice: "0",
    maxPrice: "0",
  });

  const onSubmit = async (data: TPriceRangeSchema) => {
    setPriceRange(() => ({
      minPrice: data.minPrice,
      maxPrice: data.maxPrice,
    }));
    setIsOpen(false);
    reset();
  };

  return (
    <section className="absolute">
      <div
        className={`relative p-4 rounded-xl bg-base border border-secondary shadow-md z-[45] ${
          isOpen ? "block" : "hidden"
        } mt-2`}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="flex items-start gap-4 overflow-x-hidden">
            <div className="flex flex-col">
              <div className="bg-secondary py-2 px-4 rounded-md">
                <input
                  {...register("minPrice")}
                  type="text"
                  inputMode="decimal"
                  placeholder="min-price"
                  className="placeholder:font-medium bg-transparent placeholder:text-sm text-white focus:outline-none"
                />
              </div>
              {errors.minPrice && (
                <p className="text-red-500 text-sm">
                  {errors.minPrice.message}
                </p>
              )}
            </div>
            <div className="flex flex-col">
              <div className="bg-secondary py-2 px-4 rounded-md">
                <input
                  {...register("maxPrice")}
                  type="text"
                  inputMode="numeric"
                  placeholder="max-price"
                  className="placeholder:font-medium bg-transparent placeholder:text-sm text-white focus:outline-none"
                />
              </div>
              {errors.maxPrice && (
                <p className="text-red-500 text-sm">
                  {errors.maxPrice.message}
                </p>
              )}
            </div>
          </div>
          <button
            type="submit"
            className="bg-primary py-3 px-4 rounded-full w-full"
          >
            Apply
          </button>
        </form>
      </div>
    </section>
  );
};

export default PriceRangeDialog;
