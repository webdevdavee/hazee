"use client";

import CreatorsCard from "../cards/CreatorsCard";
import Searchbar from "../ui/Searchbar";
import React from "react";
import { getUsers } from "@/database/actions/user.action";

const ExploreCreators = () => {
  const [creators, setCreators] = React.useState<User[]>([]);
  const [offset, setOffset] = React.useState(0);
  const limit = 4;
  const [filteredCreators, setFilteredCreators] = React.useState<User[]>([]);

  React.useEffect(() => {
    const fetchCreators = async () => {
      try {
        const fetchedCreators = await getUsers(offset, limit);
        setCreators(fetchedCreators.users || []);
      } catch (error) {
        console.error("Error fetching creators details:", error);
      }
    };

    fetchCreators();
  }, [limit, offset]);

  const loadNextCreators = () => {
    setOffset((prev) => prev + limit);
  };

  const loadPreviousCreators = () => {
    setOffset((prev) => Math.max(0, prev - limit));
  };

  const handleSearch = (results: User[]) => {
    setFilteredCreators(results);
  };

  return (
    <section>
      <div className="flex items-center justify-between">
        <h1>Explore Creators</h1>
        <Searchbar<User>
          placeholder="Search creators..."
          data={creators}
          onSearch={handleSearch}
          searchKeys={["username"]}
        />
      </div>
      {filteredCreators && filteredCreators.length > 0 ? (
        <div className="w-full grid grid-cols-4 justify-center gap-6 mt-6">
          {creators.map((creator) => (
            <CreatorsCard key={creator._id} creator={creator} />
          ))}
        </div>
      ) : (
        <h3 className="w-full text-center mt-24">No data to show yet</h3>
      )}
    </section>
  );
};

export default ExploreCreators;
