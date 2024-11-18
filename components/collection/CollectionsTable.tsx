import React from "react";
import CollectionsTableBody from "./CollectionsTableBody";
import CollectionsTableHead from "./CollectionsTableHead";

type Props = {
  collections: CollectionInfo[];
};

const CollectionsTable: React.FC<Props> = ({ collections }) => {
  return (
    <section className="w-full overflow-x-auto mt-8">
      <table className="w-full">
        <CollectionsTableHead />
        <CollectionsTableBody collections={collections} />
      </table>
    </section>
  );
};

export default CollectionsTable;
