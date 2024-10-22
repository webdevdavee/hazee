"use client";

import Searchbar from "../ui/Searchbar";
import CollectionsTable from "../collection/CollectionsTable";
import { useNFTCollections } from "@/context/NFTCollectionProvider";
import React from "react";

const ExploreCollections = () => {
  const { getCollections, isContractReady } = useNFTCollections();
  const [collections, setCollections] = React.useState<CollectionInfo[]>([]);
  const [filteredCollections, setFilteredCollections] = React.useState<
    CollectionInfo[]
  >([]);
  const [offset, setOffset] = React.useState(0);

  const limit = 4;

  React.useEffect(() => {
    if (!isContractReady) return;

    const fetchCollectionDetails = async () => {
      try {
        const fetchedCollections = await getCollections(offset, limit);
        const collections = fetchedCollections?.collections || [];
        setCollections(collections);
        setFilteredCollections(collections);
      } catch (error) {
        console.error("Error fetching collection details:", error);
      }
    };

    fetchCollectionDetails();
  }, [isContractReady, limit, offset, getCollections]);

  const handleSearch = (results: CollectionInfo[]) => {
    setFilteredCollections(results);
  };

  return (
    <section>
      <div className="flex items-center justify-between">
        <h1>Explore Collections</h1>
        <Searchbar<CollectionInfo>
          placeholder="Search collections..."
          data={collections}
          onSearch={handleSearch}
          searchKeys={["name"]}
        />
      </div>
      {filteredCollections && filteredCollections.length > 0 ? (
        <CollectionsTable collections={filteredCollections} />
      ) : (
        <h3 className="w-full text-center mt-24">No data to show yet</h3>
      )}
    </section>
  );
};

export default ExploreCollections;
