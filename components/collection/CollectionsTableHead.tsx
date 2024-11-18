const CollectionsTableHead = () => {
  return (
    <thead className="border-b border-b-secondary">
      <tr>
        <th className="text-left text-slate-400 p-3 text-xs font-medium">#</th>
        <th className="text-left text-slate-400 p-3 text-xs font-medium">
          <p className="w-max">COLLECTION</p>
        </th>
        <th className="text-left text-slate-400 p-3 text-xs font-medium">
          <p className="w-max">FLOOR PRICE</p>
        </th>
        <th className="text-left text-slate-400 p-3 text-xs font-medium">
          <p className="w-max">MAX SUPPLY</p>
        </th>
        <th className="text-left text-slate-400 p-3 text-xs font-medium">
          <p className="w-max">MINTED TOKENS</p>
        </th>
      </tr>
    </thead>
  );
};

export default CollectionsTableHead;
