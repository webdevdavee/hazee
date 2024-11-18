"use client";

import Button from "@/components/ui/Button";
import TextArea from "@/components/ui/TextArea";
import TextInput from "@/components/ui/TextInput";
import { FieldErrors, UseFormRegister } from "react-hook-form";

type Props = {
  register: UseFormRegister<any>;
  errors: FieldErrors<{
    name: string;
    royalty: number;
    floorPrice: number;
    supply: number;
    description?: string | undefined;
  }>;
  isSubmitting: boolean;
};

const CreateCollectionFormFields: React.FC<Props> = ({
  register,
  errors,
  isSubmitting,
}) => {
  return (
    <div className="w-[50%] m:w-full xl:w-full">
      <div className="flex flex-col gap-4 mt-4">
        <TextInput
          inputRegister={register("name")}
          label="Name"
          htmlFor="name"
          inputType="text"
          placeholder="Name your collection"
          required
          error={
            errors.name && <p className="text-red-500">{errors.name.message}</p>
          }
        />
        <TextInput
          inputRegister={register("royalty")}
          label="Royalty Percentage"
          htmlFor="royalty"
          inputType="number"
          inputMode="decimal"
          placeholder="Royalty percentage (must not be more than 40%)"
          required
          error={
            errors.royalty && (
              <p className="text-red-500">{errors.royalty.message}</p>
            )
          }
        />
        <TextInput
          inputRegister={register("floorPrice")}
          label="Floor Price"
          htmlFor="floorprice"
          inputType="number"
          inputMode="decimal"
          placeholder="Floor price (in ETH)"
          step="any"
          min="0"
          required
          error={
            errors.floorPrice && (
              <p className="text-red-500">{errors.floorPrice.message}</p>
            )
          }
        />
        <TextInput
          inputRegister={register("supply")}
          label="Supply"
          htmlFor="supply"
          inputType="number"
          inputMode="numeric"
          placeholder="Describe your collection"
          required
          error={
            errors.supply && (
              <p className="text-red-500">{errors.supply.message}</p>
            )
          }
        />
        <TextArea
          inputRegister={register("description")}
          label="Description"
          htmlFor="description"
          inputType="text"
          placeholder="Describe your collection"
          style="max-h-[17rem] min-h-[12rem] overflow-y-auto"
          error={
            errors.description && (
              <p className="text-red-500">{errors.description.message}</p>
            )
          }
        />
      </div>
      <Button
        text="Create collection"
        type="submit"
        style="w-full mt-4 rounded-lg bg-primary disabled:bg-secondary disabled:cursor-not-allowed"
        disabled={isSubmitting}
      />
    </div>
  );
};

export default CreateCollectionFormFields;
