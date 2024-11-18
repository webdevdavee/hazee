import TextArea from "@/components/ui/TextArea";
import TextInput from "@/components/ui/TextInput";
import { FaPlus } from "react-icons/fa6";
import Modal from "../../../components/layout/Modal";
import AddTraitForm from "./AddTraitForm";
import { MdOutlineEdit } from "react-icons/md";
import { IoClose } from "react-icons/io5";
import Link from "next/link";
import { FieldErrors, UseFormRegister } from "react-hook-form";
import { useOverlayStore } from "@/libs/zustand/overlayStore";
import React from "react";
import { TraitSchema, TCreateNFTSchema } from "@/libs/zod";
import { useWallet } from "@/context/WalletProvider";
import Dropdown from "./Dropdown";
import { getBatchCollections } from "@/server-scripts/database/actions/collection.action";
import { getUserCreatedCollections } from "@/server-scripts/actions/collection.contract.actions";

type Props = {
  register: UseFormRegister<TCreateNFTSchema>;
  errors: FieldErrors<TCreateNFTSchema>;
  traits: Trait[];
  setTraits: React.Dispatch<React.SetStateAction<Trait[]>>;
  collection: CollectionInfo | undefined;
  setCollection: React.Dispatch<
    React.SetStateAction<CollectionInfo | undefined>
  >;
  collectionError: string | undefined;
  isLoading?: boolean;
};

const CreateNFTFormFields: React.FC<Props> = ({
  register,
  errors,
  traits,
  setTraits,
  collection,
  setCollection,
  collectionError,
  isLoading = false,
}) => {
  const { walletAddress } = useWallet();

  const [traitToEdit, setTraitToEdit] = React.useState<Trait>();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const showOverlay = useOverlayStore((state) => state.showOverlay);
  const hideOverlay = useOverlayStore((state) => state.hideOverlay);
  const [isEditingTrait, setIsEditingTrait] = React.useState(false);
  const [userCollections, setUserCollections] = React.useState<
    CollectionInfo[]
  >([]);

  React.useEffect(() => {
    if (walletAddress) {
      const fetchUserCollections = async () => {
        try {
          // Get blockchain collections for current user
          const blockchainCollections = await getUserCreatedCollections(
            walletAddress
          );

          if (
            !blockchainCollections.success ||
            !blockchainCollections.data ||
            blockchainCollections.data.length === 0
          ) {
            setUserCollections([]);
            return;
          }

          // Single database query to get all metadata at once
          const metadata = await getBatchCollections(
            blockchainCollections.data.map((col) => col.collectionId)
          );

          // A simple object to look up metadata using collectionId
          const metadataLookup: { [key: number]: Collection } = {};
          for (const item of metadata) {
            if (item.collectionId) {
              metadataLookup[item.collectionId] = item;
            }
          }

          // Merge the data
          const mergedCollections = blockchainCollections.data.map(
            (blockchainData): CollectionInfo => {
              const metadataForCollection =
                metadataLookup[blockchainData.collectionId];

              return {
                // Blockchain data
                collectionId: blockchainData.collectionId,
                creator: blockchainData.creator,
                nftContract: blockchainData.nftContract,
                maxSupply: blockchainData.maxSupply,
                mintedSupply: blockchainData.mintedSupply,
                royaltyPercentage: blockchainData.royaltyPercentage,
                floorPrice: blockchainData.floorPrice,
                isActive: blockchainData.isActive,

                // Metadata
                name: metadataForCollection?.name,
                imageUrl: metadataForCollection?.imageUrl,
                coverPhoto: metadataForCollection?.coverPhoto,
                description: metadataForCollection?.description,
              };
            }
          );

          setUserCollections(mergedCollections);
        } catch (error) {
          console.error("Error fetching collections:", error);
          setUserCollections([]);
        }
      };

      fetchUserCollections();
    }
  }, [walletAddress]);

  const handleOpenModal = () => {
    setTraitToEdit(undefined);
    setIsEditingTrait(false);
    setIsModalOpen(true);
    showOverlay();
  };

  const handleAddTrait = (data: Trait) => {
    setTraits((prev) => [...prev, { ...data, id: Date.now() }]);
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
    <div className="w-[50%] m:w-full">
      <div>
        <Link href="/studio/collection" className="w-full">
          <p className="font-medium mb-4">Collection</p>
          <div className="flex items-center gap-4 bg-secondary p-6 rounded-lg">
            <button type="button" className="bg-secondaryhover p-4 rounded-md">
              <FaPlus />
            </button>
            <p className="font-medium">Create a new collection</p>
          </div>
        </Link>
        {/* Collection Selection */}
        <div className="mt-4 w-full">
          <Dropdown
            items={userCollections}
            defaultText="Select a collection"
            renderItem={(item) => `${item.name} - #${item.collectionId}`}
            onSelect={(item) => setCollection(item)}
            altText="You have no active collections"
          />
        </div>
        <p className="mt-2 text-red-500">{collectionError}</p>
      </div>
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
          inputRegister={register("price")}
          label="Price (ETH)"
          htmlFor="price"
          inputType="number"
          inputMode="decimal"
          step="0.000001"
          min="0"
          placeholder="0.01"
          required
          error={
            errors.price && (
              <p className="text-red-500">{errors.price.message}</p>
            )
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
                  key={`${trait.trait_type}-${index}`}
                  className="w-full bg-secondary rounded-md p-3 flex items-center justify-between"
                >
                  <p className="font-medium">
                    {trait.trait_type}: {trait.value}
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
        <button
          type="submit"
          className="bg-primary mt-4 w-full p-4 rounded-lg disabled:bg-secondary disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          Create NFT
        </button>
      </div>
    </div>
  );
};

export default CreateNFTFormFields;
