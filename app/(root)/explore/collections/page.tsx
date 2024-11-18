import ExploreCollections from "@/components/builders/ExploreCollections";
import { getCollections } from "@/server-scripts/actions/collection.contract.actions";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Explore Collections - Hazee",
  };
}

const page = async () => {
  const fetchedCollections = await getCollections(0, 4);
  const collections = fetchedCollections?.data;

  return (
    <section>
      <ExploreCollections collections={collections} />
    </section>
  );
};

export default page;
