import React from "react";

const CollectionBidsTableHead = () => {
  return (
    <thead className="border-b border-b-secondary">
      <tr>
        <th className="w-max text-left text-slate-400 p-3 font-medium">
          <p className="w-max">Amount</p>
        </th>
        <th className="w-max text-left text-slate-400 p-3 font-medium">
          <p className="w-max">USD Price</p>
        </th>
        <th className="w-max text-left text-slate-400 p-3 font-medium">
          <p className="w-max">Collection</p>
        </th>
        <th className="w-max text-left text-slate-400 p-3 font-medium">
          <p className="w-max">No. of Tokens</p>
        </th>
        <th className="w-max text-left text-slate-400 p-3 font-medium">
          <p className="w-max">Status</p>
        </th>
        <th className="w-max text-left text-slate-400 p-3 font-medium">
          <p className="w-max">Expiration Time</p>
        </th>
        <th className="w-max text-left text-slate-400 p-3 font-medium">
          <p className="w-max">From</p>
        </th>
        <th className="w-max text-left text-slate-400 p-3 font-medium"></th>
      </tr>
    </thead>
  );
};

export default CollectionBidsTableHead;
