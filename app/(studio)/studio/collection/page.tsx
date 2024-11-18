import { Metadata } from "next";
import CreateCollectionForm from "../../_components/CreateCollectionForm";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Create Your Collection - Hazee`,
  };
}

const page = () => {
  return (
    <section>
      <h1 className="font-medium text-center m:text-2xl xl:text-3xl">
        You will need to create a collection for your NFT
      </h1>

      <CreateCollectionForm />
    </section>
  );
};

export default page;
