import CollectionDetails from "@/components/collection/CollectionDetails";
import { collections } from "@/constants";
import { Metadata } from "next";

type Params = {
  params: {
    id: number;
  };
};

export async function generateMetadata({
  params: { id },
}: Params): Promise<Metadata> {
  const collection = collections.find((collection) => collection.id == id);
  return {
    title: `${collection?.name} - Hazee`,
  };
}

const page = ({ params: { id } }: Params) => {
  const collection = collections.find((collection) => collection.id == id);
  return (
    <>
      <CollectionDetails collection={collection} />
    </>
  );
};

export default page;

export async function generateStaticParams() {
  return collections.map((collection) => collection.id);
}
