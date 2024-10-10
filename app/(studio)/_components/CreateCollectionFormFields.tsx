"use client";

import Button from "@/components/ui/Button";
import TextArea from "@/components/ui/TextArea";
import TextInput from "@/components/ui/TextInput";
import { FieldErrors, UseFormRegister } from "react-hook-form";

type Props = {
  register: UseFormRegister<any>;
  errors: FieldErrors<{
    symbol: string;
    name: string;
    description?: string | undefined;
  }>;
};

const CreateCollectionFormFields: React.FC<Props> = ({ register, errors }) => {
  return (
    <div className="w-[50%]">
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
          inputRegister={register("symbol")}
          label="Symbol"
          htmlFor="symbol"
          inputType="text"
          placeholder="NYC"
          required
          error={
            errors.symbol && (
              <p className="text-red-500">{errors.symbol.message}</p>
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
        text="Create"
        type="submit"
        style="w-full bg-primary mt-4 rounded-lg"
      />
    </div>
  );
};

export default CreateCollectionFormFields;
