"use client";

import Searchbar from "../ui/Searchbar";
import CollectionsTable from "../collection/CollectionsTable";

const ExploreCollections = () => {
  return (
    <section>
      <div className="flex items-center justify-between">
        <h1>Explore Collections</h1>
        <Searchbar placeholder="search collections..." />
      </div>
      <CollectionsTable />
    </section>
  );
};

export default ExploreCollections;
