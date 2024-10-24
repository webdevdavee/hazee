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
      <div className="flex flex-col items-center gap-1 mt-4">
        <h1 className="font-medium">
          You will need to create a collection for your NFT
        </h1>
      </div>
      <CreateCollectionForm />
    </section>
  );
};

export default page;
