type Collection = {
  collectionId?: number;
  name: string;
  imageUrl: string;
  coverPhoto: string;
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
  onclick?: () => void;
};

type Trait = { id: number; type: string; value: string };

type TruncateTextProps = {
  text: string;
  maxChars: number;
  className?: string;
};

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

interface TokenInfo {
  tokenId: number;
  price: string;
  collectionId: number;
  status: number; // 0: NONE, 1: SALE, 2: AUCTION, 3: BOTH
  owner: string;
  metadata: NFTMetadata | null;
}

interface NFTListing {
  listingId: number;
  seller: string;
  nftContract: string;
  tokenId: number;
  price: string;
  collectionId: number;
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

interface CollectionOffer {
  offerer: string;
  amount: string; // in ETH
  nftCount: number;
  timestamp: number;
  expirationTime: number;
  isActive: boolean;
  collectionId: number;
}

interface CollectionInfo {
  collectionId: number;
  creator: string;
  nftContract: string;
  maxSupply: number;
  mintedSupply: number;
  royaltyPercentage: number;
  floorPrice: string; // in ETH
  isActive: boolean;
  // Additional metadata from MongoDB
  name?: string;
  imageUrl?: string;
  coverPhoto?: string;
}
