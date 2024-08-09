"use client";

import TextArea from "@/components/ui/TextArea";
import TextInput from "@/components/ui/TextInput";
import { createNFTSchema, TCreateNFTSchema, TraitSchema } from "@/libs/zod";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { FaPlus } from "react-icons/fa6";
import Modal from "./Modal";
import { useOverlayStore } from "@/libs/zustand/overlayStore";
import AddTraitForm from "./AddTraitForm";
import { MdOutlineEdit } from "react-icons/md";
import { IoClose } from "react-icons/io5";
import Link from "next/link";

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

  const [traits, setTraits] = React.useState<Trait[]>([]);
  const [traitToEdit, setTraitToEdit] = React.useState<Trait>();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const showOverlay = useOverlayStore((state) => state.showOverlay);
  const hideOverlay = useOverlayStore((state) => state.hideOverlay);
  const [isEditingTrait, setIsEditingTrait] = React.useState(false);

  const handleOpenModal = () => {
    setTraitToEdit(undefined);
    setIsEditingTrait(false);
    setIsModalOpen(true);
    showOverlay();
  };

  const handleAddTrait = (data: Trait) => {
    setTraits((prev) => [...prev, data]);
    setIsModalOpen(false);
    hideOverlay();
  };

  const prepareTraitToEdit = (trait: Trait) => {
    handleOpenModal();
    setIsEditingTrait(true);
    setTraitToEdit(trait);
  };

  const handleEditTrait = (data: TraitSchema) => {
    setTraits((prev) =>
      prev.map((trait) =>
        trait.id === traitToEdit?.id ? { ...trait, ...data } : trait
      )
    );
    setIsModalOpen(false);
    hideOverlay();
  };

  const removeTrait = (id: number) => {
    setTraits((prev) => prev.filter((trait) => trait.id !== id));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-[50%]">
      <Link href="/studio/collection" className="w-full">
        <p className="font-medium mb-4">Collection</p>
        <div className="flex items-center gap-4 bg-secondary p-6 rounded-lg">
          <button type="button" className="bg-secondaryhover p-4 rounded-md">
            <FaPlus />
          </button>
          <p className="font-medium">Create a new collection</p>
        </div>
      </Link>
      <div className="flex flex-col gap-4 mt-4">
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
          <div
            className="my-5 flex flex-col gap-3"
            style={{ display: traits.length > 0 ? "flex" : "none" }}
          >
            {traits
              .map((trait, index) => (
                <div
                  key={`${trait}-${index}`}
                  className="w-full bg-secondary rounded-md p-3 flex items-center justify-between"
                >
                  <p className="font-medium">
                    {trait.type}: {trait.name}
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => prepareTraitToEdit(trait)}
                    >
                      <MdOutlineEdit
                        size={20}
                        className="cursor-pointer hover:text-gray-400 hover:transition-all"
                      />
                    </button>
                    <button type="button" onClick={() => removeTrait(trait.id)}>
                      <IoClose
                        size={20}
                        className="cursor-pointer hover:text-gray-400 hover:transition-all"
                      />
                    </button>
                  </div>
                </div>
              ))
              .reverse()}
          </div>
          <div className="mt-3">
            <button
              type="button"
              className="p-3 rounded-md flex items-center gap-3 duration-300 hover:bg-secondary hover:transition-all"
              onClick={handleOpenModal}
            >
              <FaPlus />
              <p>Add trait</p>
            </button>
          </div>
          {isModalOpen && (
            <Modal
              title={!isEditingTrait ? "Add Trait" : "Edit Trait"}
              setIsModalOpen={setIsModalOpen}
            >
              <AddTraitForm
                onAddTrait={handleAddTrait}
                onEditTrait={handleEditTrait}
                initialValue={traitToEdit}
                isEditingTrait={isEditingTrait}
                traits={traits}
              />
            </Modal>
          )}
        </div>
      </div>
    </form>
  );
};

export default CreateNFTForm;
