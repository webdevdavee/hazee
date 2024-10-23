"use client";

import CreatorsCard from "../cards/CreatorsCard";
import Searchbar from "../ui/Searchbar";
import React from "react";
import { getUsers } from "@/database/actions/user.action";

const ExploreCreators = () => {
  const [creators, setCreators] = React.useState<User[]>([]);
  const [filteredCreators, setFilteredCreators] = React.useState<User[]>([]);
  const [offset, setOffset] = React.useState(0);
  const limit = 4;

  React.useEffect(() => {
    const fetchCreators = async () => {
      try {
        const fetchedCreators = await getUsers(offset, limit);
        const users = fetchedCreators.users || [];
        setCreators(users);
        setFilteredCreators(users); // Initialize filtered creators
      } catch (error) {
        console.error("Error fetching creators details:", error);
      }
    };

    fetchCreators();
  }, [limit, offset]);

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
      {filteredCreators.length > 0 ? (
        <div className="w-full grid grid-cols-4 justify-center gap-6 mt-6">
          {filteredCreators.map((creator) => (
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
