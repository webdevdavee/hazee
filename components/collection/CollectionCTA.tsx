import React from "react";
import Button from "../ui/Button";
import { FaLink } from "react-icons/fa6";
import useCopyToClipboard from "@/hooks/useCopyToClipboard";
import { usePathname } from "next/navigation";
import { useWallet } from "@/context/WalletProvider";
import Modal from "../layout/Modal";
import CollectionBids from "./CollectionOffers";
import { useOverlayStore } from "@/libs/zustand/overlayStore";
import MakeCollectionOffer from "./MakeCollectionOffer";

type Props = {
  collection: CollectionInfo;
  collectionOffers: CollectionOffer[] | undefined;
};

const CollectionCTA: React.FC<Props> = ({ collection, collectionOffers }) => {
  const { walletAddress, connectWallet } = useWallet();
  const { copyToClipboard, copyStatus } = useCopyToClipboard();
  const [fullURL, setFullURL] = React.useState<string>("");
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isPlaceOfferModalOpen, setIsPlaceOfferModalOpen] =
    React.useState(false);

  const showOverlay = useOverlayStore((state) => state.showOverlay);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const protocol = window.location.protocol;
      const host = window.location.host;

      setFullURL(`${protocol}//${host}${pathname}`);
    }
  }, [pathname]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
    showOverlay();
  };

  const handleOpenPlaceOfferModal = () => {
    setIsPlaceOfferModalOpen(true);
    showOverlay();
  };

  return (
    <>
      {isModalOpen && (
        <Modal title="Offers" setIsModalOpen={setIsModalOpen}>
          <div className="bg-secondary h-fit bg-opacity-30 p-5 rounded-lg overflow-y-auto col-span-2 border border-secondary xl:w-[36rem]">
            <CollectionBids collectionOffers={collectionOffers} />
          </div>
        </Modal>
      )}

      {isPlaceOfferModalOpen && (
        <Modal
          title="Place collection offer"
          setIsModalOpen={setIsPlaceOfferModalOpen}
        >
          <MakeCollectionOffer collection={collection} />
        </Modal>
      )}

      <section className="mt-4 flex items-center gap-4">
        {walletAddress !== collection.creator && (
          <Button
            text="Place offer"
            style="bg-primary font-medium rounded-md"
            onclick={!walletAddress ? connectWallet : handleOpenPlaceOfferModal}
          />
        )}
        <Button
          text="View offers"
          style="bg-white text-base font-medium rounded-md"
          onclick={!walletAddress ? connectWallet : handleOpenModal}
        />
        <button
          type="button"
          className="w-fit bg-secondary p-3 rounded-md text-sm"
          onClick={() => copyToClipboard(fullURL)}
        >
          {copyStatus === "copied" ? "Link copied!" : <FaLink size={20} />}
        </button>
      </section>
    </>
  );
};

export default CollectionCTA;
