import CollectionsTableBody from "./CollectionsTableBody";
import CollectionsTableHead from "./CollectionsTableHead";
import { collections } from "@/constants";

const CollectionsTable = () => {
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
