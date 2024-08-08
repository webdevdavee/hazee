import CreateNFTForm from "../../_components/CreateNFTForm";
import FileUploader from "../../_components/FileUploader";

const page = () => {
  return (
    <section>
      <div className="flex flex-col gap-1">
        <h1 className="font-medium">Create an NFT</h1>
        <p className="font-medium">
          You will not be able to make changes to your NFT once minted.
        </p>
      </div>
      <div className="flex justify-between gap-24 mt-10">
        <FileUploader />
        <CreateNFTForm />
      </div>
    </section>
  );
};

export default page;
