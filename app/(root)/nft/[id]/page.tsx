import NFTDetails from "@/components/nft/NFTDetails";
import { capitalizeFirstCharacter } from "@/libs/utils";
import {
  checkNFTAuctionStatus,
  getAuctionDetails,
} from "@/server-scripts/actions/auction.contract.action";
import { getCollectionDetails } from "@/server-scripts/actions/collection.contract.actions";
import {
  checkNFTListing,
  getListingDetails,
} from "@/server-scripts/actions/marketplace.contract.actions";
import { getFullTokenInfo } from "@/server-scripts/actions/nft.contract.actions";
import {
  getNftViewStats,
  incrementNftView,
} from "@/server-scripts/database/actions/nftview.action";
import { getUserByWalletAddress } from "@/server-scripts/database/actions/user.action";
import { Metadata } from "next";

type Params = Promise<{ id: string }>;

export async function generateMetadata(props: {
  params: Params;
}): Promise<Metadata> {
  const params = await props.params;
  const id = params.id;

  const nft = await getFullTokenInfo(Number(id));

  if (nft.data) {
    return {
      title: `${capitalizeFirstCharacter(
        nft.data.metadata?.name || "Null"
      )} - Hazee`,
    };
  }

  return {
    title: "Error Fetching Token Data - Hazee",
  };
}

const Page = async (props: { params: Params }) => {
  const params = await props.params;
  const id = params.id;

  const nft = await getFullTokenInfo(Number(id));

  if (!nft.data) {
    return null;
  }

  const nftData = nft.data;
  const user = await getUserByWalletAddress(nftData.owner);
  const collection = await getCollectionDetails(nftData.collectionId);

  // Increment and retrieve token's view count
  await incrementNftView(nftData.tokenId);
  const nftViewCount = await getNftViewStats(Number(id));

  // Check if token is listed
  const listingStatus = await checkNFTListing(nftData.tokenId);

  // fetch listing details
  const listingDetails = await getListingDetails(listingStatus.data.listingId);

  // Check if token has auction and get auction details
  const auctionStatus = await checkNFTAuctionStatus(nftData.tokenId);
  let auctionDetails: AuctionDetails | undefined;

  if (auctionStatus.data?.isOnAuction) {
    const response = await getAuctionDetails(auctionStatus.data.auctionId);
    auctionDetails = response.data;
  }

  return (
    <>
      <NFTDetails
        nft={nftData}
        collection={collection.data}
        nftViewCount={nftViewCount}
        userDetails={user}
        listingStatus={listingStatus.data}
        auctionDetails={auctionDetails}
        listingDetails={listingDetails.data}
      />
    </>
  );
};

export default Page;
