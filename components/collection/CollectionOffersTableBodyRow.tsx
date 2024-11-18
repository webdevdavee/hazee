import { useNFTCollections } from "@/context/NFTCollectionProvider";
import { useWallet } from "@/context/WalletProvider";
import { useEthConverter } from "@/hooks/useEthConverter";
import { formatTimestampWithTimeAMPM, truncateAddress } from "@/libs/utils";
import { useOverlayStore } from "@/libs/zustand/overlayStore";
import { getCollectionDetails } from "@/server-scripts/actions/collection.contract.actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import Modal from "../layout/Modal";
import SecondaryLoader from "../ui/SecondaryLoader";

type Props = { offer: CollectionOffer };

enum OfferStatus {
  ACTIVE,
  WITHDRAWN,
  EXPIRED,
}

const CollectionOffersTableBodyRow: React.FC<Props> = ({ offer }) => {
  const router = useRouter();

  const { walletAddress } = useWallet();

  const { usdAmount, isLoading, error } = useEthConverter(offer.amount);
  const { withdrawCollectionOffer, isContractReady } = useNFTCollections();

  const [isWithDrawLoading, setIsWithDrawLoading] = React.useState(false);
  const [loadingMessage, setLoadingMessage] = React.useState("");

  const showOverlay = useOverlayStore((state) => state.showOverlay);
  const hideOverlay = useOverlayStore((state) => state.hideOverlay);

  const [collection, setCollection] = React.useState<
    CollectionInfo | undefined
  >();

  console.log(offer);

  React.useEffect(() => {
    const getOfferCollection = async () => {
      const offerCollection = await getCollectionDetails(offer.collectionId);
      setCollection(offerCollection.data);
    };

    getOfferCollection();
  }, [offer.collectionId]);

  const redirectToOfferPage = () => {
    router.push(`/collection-offer/${offer.offerId}`);
    hideOverlay();
  };

  const handleOfferWithdraw = async () => {
    if (!isContractReady) return;

    showOverlay();
    setIsWithDrawLoading(true);
    setLoadingMessage("Withdrawing offer...");

    try {
      const response = await withdrawCollectionOffer(offer.collectionId);

      if (response.success) {
        window.location.reload();
      }
    } catch (error: any) {
      console.error(error.message);
    } finally {
      setIsWithDrawLoading(false);
      hideOverlay();
      setLoadingMessage("");
    }
  };

  return (
    <tr>
      {isWithDrawLoading && (
        <Modal
          setIsModalOpen={setIsWithDrawLoading}
          isLoading={isLoading}
          loadingMessage={loadingMessage}
        >
          <div className="flex items-center justify-center backdrop-blur-[2px]">
            <SecondaryLoader message={loadingMessage} size="md" />
          </div>
        </Modal>
      )}
      <td className="text-sm p-3">{offer.amount} ETH</td>
      <td>
        {isLoading
          ? "Converting..."
          : error
          ? "USD amount unavailable"
          : `$${usdAmount}`}
      </td>
      <td className="text-sm p-3">
        <Link
          href={`/collection/${collection?.collectionId}`}
          className="text-accent underline underline-offset-auto"
        >
          {collection?.name || "Unnamed"}
        </Link>
      </td>
      <td className="text-sm p-3">{offer.nftCount}</td>
      <td className="text-sm p-3 capitalize">
        {offer.status === OfferStatus.ACTIVE
          ? "Active"
          : offer.status === OfferStatus.EXPIRED
          ? "Expired"
          : "Withdrawn"}
      </td>
      <td className="text-sm p-3">
        {formatTimestampWithTimeAMPM(offer.expirationTime)}
      </td>
      <td>
        <Link
          href={`/creator/${offer.offerer}`}
          className="text-accent underline underline-offset-auto"
        >
          {offer.offerer === walletAddress
            ? "Me"
            : truncateAddress(offer.offerer)}
        </Link>
      </td>
      <td>
        <button
          type="button"
          className={`${
            offer.offerer === walletAddress ? "bg-red-500" : "bg-primary"
          } text-sm p-2 rounded-md`}
          onClick={
            offer.offerer === walletAddress
              ? handleOfferWithdraw
              : redirectToOfferPage
          }
        >
          {offer.offerer === walletAddress ? "Withdraw offer" : "View offer"}
        </button>
      </td>
    </tr>
  );
};

export default CollectionOffersTableBodyRow;
