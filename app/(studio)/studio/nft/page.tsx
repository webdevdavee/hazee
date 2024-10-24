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
        <h1 className="font-medium">Create an NFT</h1>
        <p className="font-medium">
          You will not be able to make changes to your NFT once minted.
        </p>
      </div>
      <CreateNFTForm />
    </section>
  );
};

export default page;
