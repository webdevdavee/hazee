import NFTDetails from "@/components/nft/NFTDetails";
import { sampleNfts } from "@/constants";
import { Metadata } from "next";

type Params = {
  params: {
    id: number;
  };
};

export async function generateMetadata({
  params: { id },
}: Params): Promise<Metadata> {
  const nft = sampleNfts.find((nft) => nft.id == id);
  return {
    title: `${nft?.name} - Hazee`,
  };
}

const page = ({ params: { id } }: Params) => {
  const nft = sampleNfts.find((nft) => nft.id == id);
  return (
    <>
      <NFTDetails nft={nft} />
    </>
  );
};

export default page;

export async function generateStaticParams() {
  return sampleNfts.map((nft) => nft.id);
}
