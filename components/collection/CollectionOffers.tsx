import React from "react";
import CollectionOffersTableHead from "./CollectionOffersTableHead";
import CollectionOffersTableBody from "./CollectionOffersTableBody";

type Props = {
  collectionOffers: CollectionOffer[] | undefined;
};

const CollectionOffers: React.FC<Props> = ({ collectionOffers }) => {
  return (
    <section className="w-full overflow-x-auto mt-4 custom-scrollbar max-h-[370px] border-b border-b-secondary m:w-72">
      <table className="w-full">
        <CollectionOffersTableHead />
        {collectionOffers && collectionOffers.length > 0 && (
          <CollectionOffersTableBody collectionOffers={collectionOffers} />
        )}
      </table>
      {!collectionOffers ? (
        <p className="w-full my-10 text-center">
          No available offers for collection
        </p>
      ) : (
        collectionOffers &&
        collectionOffers?.length <= 0 && (
          <p className="w-full my-10 text-center">
            No available offers for collection
          </p>
        )
      )}
    </section>
  );
};

export default CollectionOffers;
