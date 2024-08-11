import NFTOffersTable from "./NFTOffersTable";

const NFTOffers = () => {
  return (
    <>
      <div className="bg-secondary bg-opacity-30 p-8 rounded-lg overflow-y-auto col-span-2">
        <h2 className="font-medium text-2xl mb-5">Offers</h2>
        <NFTOffersTable />
      </div>
    </>
  );
};

export default NFTOffers;
