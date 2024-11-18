"use client";

import Searchbar from "../ui/Searchbar";
import CollectionsTable from "../collection/CollectionsTable";
import React from "react";
import SecondaryLoader from "../ui/SecondaryLoader";

type Props = {
  collections:
    | {
        collections: CollectionInfo[];
        totalCollectionsCount: number;
      }
    | undefined;
};

const ExploreCollections: React.FC<Props> = ({ collections }) => {
  // Initial data
  const [initialCollections] = React.useState<CollectionInfo[]>(
    collections?.collections as CollectionInfo[]
  );

  // State for currently displayed collections
  const [collectionsData, setCollectionsData] = React.useState<
    CollectionInfo[]
  >(collections?.collections as CollectionInfo[]);

  const [isLoading, setIsLoading] = React.useState(false);

  const handleSearch = (results: CollectionInfo[]) => {
    // If search results are empty and there's no search term, restore initial data
    if (results.length === 0 && results === initialCollections) {
      setCollectionsData(initialCollections);
    } else {
      setCollectionsData(results);
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between m:flex-col m:items-start m:gap-6">
        <h1 className="m:text-2xl">Explore Collections</h1>
        <Searchbar<CollectionInfo>
          placeholder="Search collections..."
          data={initialCollections} // Passing initial data instead of filtered data
          onSearch={handleSearch}
          searchKeys={["name"]}
        />
      </div>
      {isLoading ? (
        <div className="my-12">
          <SecondaryLoader />
        </div>
      ) : collectionsData && collectionsData.length > 0 ? (
        <CollectionsTable collections={collectionsData} />
      ) : (
        <h3 className="w-full text-center mt-24 m:text-[1rem]">
          No data to show yet
        </h3>
      )}
    </section>
  );
};

export default ExploreCollections;
