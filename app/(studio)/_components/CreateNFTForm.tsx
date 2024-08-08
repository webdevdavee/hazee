"use client";

import TextArea from "@/components/ui/TextArea";
import TextInput from "@/components/ui/TextInput";
import { createNFTSchema, TCreateNFTSchema } from "@/libs/zod";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { FaPlus } from "react-icons/fa6";
import Modal from "./Modal";
import { useOverlayStore } from "@/libs/zustand/overlayStore";

const CreateNFTForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TCreateNFTSchema>({
    resolver: zodResolver(createNFTSchema),
  });

  const onSubmit = async (data: TCreateNFTSchema) => {
    reset();
  };

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const showOverlay = useOverlayStore((state) => state.showOverlay);

  const handleOpenModal = () => {
    setIsModalOpen(true);
    showOverlay();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-[50%]">
      <div className="flex flex-col gap-4">
        <TextInput
          inputRegister={register("name")}
          label="Name"
          htmlFor="name"
          inputType="text"
          placeholder="Name your NFT"
          required
          error={
            errors.name && <p className="text-red-500">{errors.name.message}</p>
          }
        />
        <TextInput
          inputRegister={register("supply")}
          label="Supply"
          htmlFor="supply"
          inputType="number"
          placeholder="1"
          inputMode="numeric"
          required
          error={
            errors.name && <p className="text-red-500">{errors.name.message}</p>
          }
        />
        <TextArea
          inputRegister={register("description")}
          label="Description"
          htmlFor="description"
          inputType="text"
          placeholder="Describe your NFT"
          style="max-h-[17rem] min-h-[12rem] overflow-y-auto"
          error={
            errors.description && (
              <p className="text-red-500">{errors.description.message}</p>
            )
          }
        />
        <div>
          <p className="font-medium text-lg">Traits</p>
          <p className="text-sm">
            Traits describe attributes of your item. They appear as filters
            inside your collection page and are also listed out inside your item
            page.
          </p>
          <div className="mt-2">
            <button
              type="button"
              className="p-3 rounded-md flex items-center gap-3 duration-300 hover:bg-secondary hover:transition-all"
              onClick={handleOpenModal}
            >
              <FaPlus />
              <p>Add trait</p>
            </button>
            {isModalOpen && (
              <Modal title="Add trait" setIsModalOpen={setIsModalOpen}>
                <p>This is the content of the modal.</p>
              </Modal>
            )}
          </div>
        </div>
      </div>
    </form>
  );
};

export default CreateNFTForm;
