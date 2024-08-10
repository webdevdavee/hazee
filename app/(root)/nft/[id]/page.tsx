import NFTDetails from "@/components/builders/NFTDetails";
import { sampleNfts } from "@/constants";

type Params = {
  params: {
    id: number;
  };
};

// export async function generateMetadata({
//   params: { id },
// }: Params): Promise<Metadata> {
//   const job = await getJobById(id);
//   return {
//     title: `${job.title} - Talentio`,
//     description: job.description,
//   };
// }

const page = ({ params: { id } }: Params) => {
  const nft = sampleNfts.find((nft) => nft.id == id);
  return (
    <section>
      <NFTDetails nft={nft} />
    </section>
  );
};

export default page;

// export async function generateStaticParams() {
//   const fetchedJobs = await getJobs();
//   let jobs = [];
//   jobs = fetchedJobs?.jobsNoLimit ?? [];
//   return jobs.map((job: Job) => ({ id: job._id }));
// }
