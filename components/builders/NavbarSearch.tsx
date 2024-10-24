import { getUsers } from "@/database/actions/user.action";
import React from "react";
import DualSearchbar from "../ui/DualSearchbar";
import { useNFTCollections } from "@/context/NFTCollectionProvider";
import CollectionMiniCard from "../cards/CollectionMiniCard";
import Image from "next/image";
import Link from "next/link";
import useClickOutside from "@/hooks/useClickOutside";

const NavbarSearch = () => {
  const { getCollections, isContractReady } = useNFTCollections();
  const [creators, setCreators] = React.useState<User[]>([]);
  const [collections, setCollections] = React.useState<CollectionInfo[]>([]);
  const [filteredResults, setFilteredResults] = React.useState<SearchResults>({
    creators: [],
    collections: [],
  });

  const [searchTerm, setSearchTerm] = React.useState("");
  const searchResultRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isContractReady) return;

    const fetchData = async () => {
      try {
        const fetchedCreators = await getUsers();
        const fetchedCollections = await getCollections(0, 10);

        setCreators(fetchedCreators.users || []);
        setCollections(fetchedCollections?.collections || []);
        setFilteredResults({
          creators: fetchedCreators.users || [],
          collections: fetchedCollections?.collections || [],
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [isContractReady]);

  const handleSearch = (results: SearchResults) => {
    setFilteredResults(results);
  };

  useClickOutside(searchResultRef, () => {
    setSearchTerm("");
  });

  return (
    <section className="relative">
      <DualSearchbar
        creators={creators}
        collections={collections}
        onSearch={handleSearch}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      {searchTerm && (
        <div
          ref={searchResultRef}
          className="absolute w-full max-h-96 mt-3 p-6 bg-base border border-secondary rounded-lg overflow-y-auto overflow-x-hidden"
        >
          {/* Collections Section */}
          <div className="mb-8">
            <h5 className="mb-4 font-medium uppercase">Collections</h5>
            {filteredResults.collections.length > 0 ? (
              <div className="w-full grid grid-cols-4 justify-center gap-6">
                {filteredResults.collections.map((collection) => (
                  <CollectionMiniCard
                    key={collection.collectionId}
                    collection={collection}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm">No collections found</p>
            )}
          </div>

          {/* Creators Section */}
          <div className="mt-8">
            <h5 className="mb-4 font-medium uppercase">Creators</h5>
            {filteredResults.creators.length > 0 ? (
              <div className="flex flex-col gap-4">
                {filteredResults.creators.map((creator) => (
                  <Link
                    href={`/creator/${creator.walletAddress}`}
                    key={creator._id}
                    className="flex items-center gap-3"
                  >
                    <Image
                      src={creator.photo}
                      width={40}
                      height={40}
                      quality={100}
                      alt="user-image"
                      className="rounded-full"
                    />
                    <p>{creator.username}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm">No creators found</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default NavbarSearch;
