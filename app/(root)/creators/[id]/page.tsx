import CollectionDetails from "@/components/collection/CollectionDetails";
import CreatorDetails from "@/components/creators/CreatorDetails";
import { creators } from "@/constants";
import { Metadata } from "next";

type Params = {
  params: {
    id: number;
  };
};

export async function generateMetadata({
  params: { id },
}: Params): Promise<Metadata> {
  const creator = creators.find((creator) => creator.id == id);
  return {
    title: `${creator?.name} - Hazee`,
  };
}

const page = ({ params: { id } }: Params) => {
  const creator = creators.find((creator) => creator.id == id);
  return (
    <>
      <CreatorDetails creator={creator} />
    </>
  );
};

export default page;

export async function generateStaticParams() {
  return creators.map((creator) => creator.id);
}
