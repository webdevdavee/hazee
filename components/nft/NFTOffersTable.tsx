import NFTOffersTableHead from "./NFTOffersTableHead";
import NFTOffersTableBody from "./NFTOffersTableBody";

const NFTOffersTable = () => {
  return (
    <section className="w-full overflow-x-auto mt-8 custom-scrollbar h-[200px] border-y border-y-secondary">
      <table className="w-full">
        <NFTOffersTableHead />
        <NFTOffersTableBody />
      </table>
    </section>
  );
};

export default NFTOffersTable;
