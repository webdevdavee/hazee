"use client";

import CreatorsCard from "../cards/CreatorsCard";
import Searchbar from "../ui/Searchbar";
import React from "react";
import SecondaryLoader from "../ui/SecondaryLoader";

type Props = {
  initialCreators: User[];
};

const ExploreCreators: React.FC<Props> = ({ initialCreators }) => {
  // Initial data
  const [initialCreatorsData] = React.useState<User[]>(
    initialCreators as User[]
  );

  // State for currently displayed creators
  const [creatorsData, setCreatorsData] = React.useState<User[]>(
    initialCreators as User[]
  );

  const [isLoading, setIsLoading] = React.useState(false);

  const handleSearch = (results: User[]) => {
    // If search results are empty and there's no search term, restore initial data
    if (results.length === 0 && results === initialCreatorsData) {
      setCreatorsData(initialCreatorsData);
    } else {
      setCreatorsData(results);
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between m:flex-col m:items-start m:gap-6">
        <h1 className="m:text-2xl">Explore Creators</h1>
        <Searchbar<User>
          placeholder="Search creators..."
          data={initialCreatorsData}
          onSearch={handleSearch}
          searchKeys={["username"]}
        />
      </div>
      {isLoading ? (
        <div className="my-12">
          <SecondaryLoader />
        </div>
      ) : creatorsData.length > 0 ? (
        <div className="w-full grid grid-cols-4 justify-center gap-6 mt-6 m:grid-cols-1 m:gap-4 xl:grid-cols-2 xl:gap-4">
          {creatorsData.map((creator) => (
            <CreatorsCard key={creator._id} creator={creator} />
          ))}
        </div>
      ) : (
        <h3 className="w-full text-center mt-24 m:text-[1rem]">
          No data to show yet
        </h3>
      )}
    </section>
  );
};

export default ExploreCreators;
