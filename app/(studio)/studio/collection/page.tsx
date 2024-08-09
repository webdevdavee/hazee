import CreateCollectionForm from "../../_components/CreateCollectionForm";
import SmallFileUploader from "../../_components/SmallFileUploader";

const page = () => {
  return (
    <section>
      <div className="flex flex-col items-center gap-1 mt-4">
        <h1 className="font-medium">
          You will need to create a collection for your NFT
        </h1>
        <p className="font-medium">
          You will need to deploy an ERC-721 contract on the blockchain to
          create a collection for your NFT.
        </p>
      </div>
      <div className="flex flex-col items-center gap-4 mt-10">
        <SmallFileUploader />
        <CreateCollectionForm />
      </div>
    </section>
  );
};

export default page;
