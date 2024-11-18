import { Metadata } from "next";
import CreateNFTForm from "../../_components/CreateNFTForm";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Create Your NFT - Hazee`,
  };
}

const page = () => {
  return (
    <section>
      <div className="flex flex-col gap-1">
        <h1 className="font-medium m:text-2xl xl:text-3xl">Create an NFT</h1>
        <p className="font-medium m:text-sm">
          You will not be able to make changes to your NFT once minted.
        </p>
      </div>
      <CreateNFTForm />
    </section>
  );
};

export default page;
