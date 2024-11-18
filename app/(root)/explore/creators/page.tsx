import ExploreCreators from "@/components/builders/ExploreCreators";
import { getUsers } from "@/server-scripts/database/actions/user.action";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Explore Creators - Hazee",
  };
}

const page = async () => {
  const fetchedCreators = await getUsers(0, 10);

  return (
    <section>
      <ExploreCreators initialCreators={fetchedCreators.users} />
    </section>
  );
};

export default page;
