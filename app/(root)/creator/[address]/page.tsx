import CreatorDetails from "@/components/creators/CreatorDetails";
import { getUserByWalletAddress } from "@/server-scripts/database/actions/user.action";
import { Metadata } from "next";
import { getCreatorPageData } from "@/server-scripts/actions/handlers.actions";
import { getUserCollectionOffers } from "@/server-scripts/actions/collection.contract.actions";

type Params = Promise<{ address: string }>;

export async function generateMetadata(props: {
  params: Params;
}): Promise<Metadata> {
  const params = await props.params;
  const address = params.address;

  const user = await getUserByWalletAddress(address);
  return {
    title: `${user?.username || "Your profile"} - Hazee`,
  };
}

const Page = async (props: { params: Params }) => {
  const params = await props.params;
  const address = params.address;

  // Single server-side request that aggregates all needed data for this page
  const data: CreatorPageData = await getCreatorPageData(address);
  const offers = await getUserCollectionOffers(address);

  return (
    <>
      <CreatorDetails userDetails={data} offers={offers.data} />
    </>
  );
};

export default Page;
