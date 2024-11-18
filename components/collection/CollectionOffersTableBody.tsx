import React from "react";
import CollectionOffersTableBodyRow from "./CollectionOffersTableBodyRow";

type Props = {
  collectionOffers: CollectionOffer[] | undefined;
};

const CollectionOffersTableBody: React.FC<Props> = ({ collectionOffers }) => {
  return (
    <tbody>
      {collectionOffers?.map((offer, index) => (
        <CollectionOffersTableBodyRow
          key={`${offer.offerer} - ${index}`}
          offer={offer}
        />
      ))}
    </tbody>
  );
};

export default CollectionOffersTableBody;
