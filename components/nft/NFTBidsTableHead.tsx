const NFTBidsTableHead = () => {
  return (
    <thead className="border-b border-b-secondary">
      <tr>
        <th className="text-left text-slate-400 p-3 font-medium">
          <p className="w-max">Price</p>
        </th>
        <th className="text-left text-slate-400 p-3 font-medium">
          <p className="w-max">USD Price</p>
        </th>
        <th className="text-left text-slate-400 p-3 font-medium">
          <p className="w-max">Date and Time</p>
        </th>
        <th className="text-left text-slate-400 p-3 font-medium">
          <p className="w-max">From</p>
        </th>
      </tr>
    </thead>
  );
};

export default NFTBidsTableHead;
