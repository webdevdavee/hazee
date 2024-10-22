const CollectionsTableHead = () => {
  return (
    <thead className="border-b border-b-secondary">
      <tr>
        <th className="text-left text-slate-400 p-3 text-xs font-medium">#</th>
        <th className="text-left text-slate-400 p-3 text-xs font-medium">
          COLLECTION
        </th>
        <th className="text-left text-slate-400 p-3 text-xs font-medium">
          FLOOR PRICE
        </th>
        <th className="text-left text-slate-400 p-3 text-xs font-medium">
          MAX SUPPLY
        </th>
        <th className="text-left text-slate-400 p-3 text-xs font-medium">
          TOKENS
        </th>
      </tr>
    </thead>
  );
};

export default CollectionsTableHead;
