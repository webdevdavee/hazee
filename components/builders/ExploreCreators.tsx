"use client";

import { creators } from "@/constants";
import CreatorsCard from "../cards/CreatorsCard";
import Searchbar from "../ui/Searchbar";

const ExploreCreators = () => {
  return (
    <section>
      <div className="flex items-center justify-between">
        <h1>Explore Creators</h1>
        <Searchbar placeholder="search creators..." />
      </div>
      <div className="w-full grid grid-cols-4 justify-center gap-6 mt-6">
        {creators.map((creator) => (
          <CreatorsCard key={creator.name} creator={creator} />
        ))}
      </div>
    </section>
  );
};

export default ExploreCreators;
