type sampleNft = {
  id: number;
  name: string;
  src: string;
  price: string;
  bid?: string;
  ends?: string;
  owner: string;
  collection: string;
};

type Collection = {
  id: number;
  name: string;
  by: string;
  volume: string;
  floor: string;
  src: string[];
};

type User = {
  _id: string;
  email: string;
  walletAddress: string;
  username: string;
  photo: string;
  coverPhoto: string;
};

type DropdownItem = {
  id: number | string;
  label: string;
  link?: string;
  icon?: React.ReactNode;
  isButton?: boolean;
};

type Trait = { id: number; type: string; value: string };

type TruncateTextProps = {
  text: string;
  maxChars: number;
  className?: string;
};

interface Creator {
  creatorId: number;
  userAddress: string;
  createdNFTs: number[];
  ownedNFTs: number[];
  createdCollections: number[];
  itemsSold: number;
  walletBalance: number;
}

interface NFTListing {
  listingId: number;
  seller: string;
  nftContract: string;
  tokenId: number;
  price: string;
  isActive: boolean;
  saleType: number;
  // Additional metadata from NFT contract
  name?: string;
  description?: string;
  imageUrl?: string;
}

interface AuctionDetails {
  seller: string;
  tokenId: number;
  startingPrice: string;
  reservePrice: string;
  endTime: number;
  highestBidder: string;
  highestBid: string;
  ended: boolean;
  active: boolean;
  bids: Bid[];
}

interface Bid {
  bidder: string;
  amount: string;
  timestamp: number;
}

interface CollectionInfo {
  collectionId: number;
  creator: string;
  currentOwner: string;
  name: string;
  nftContract: string;
  maxSupply: number;
  mintedSupply: number;
  royaltyPercentage: number;
  floorPrice: string;
  owners: number;
  isActive: boolean;
  imageUrl?: string;
}
