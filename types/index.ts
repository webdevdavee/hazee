type WalletData = {
  address: string;
  balance: string;
  network: {
    chainId: number;
    name: string;
  };
};

type Collection = {
  collectionId: number;
  name: string;
  imageUrl: string;
  coverPhoto?: string;
  description?: string;
};

type User = {
  _id: string;
  email: string;
  walletAddress: string;
  username: string;
  photo: string;
  coverPhoto: string;
  balance: string;
  network: {
    chainId: number;
    name: string;
  };
};

type DropdownItem = {
  id: number | string;
  label: string;
  link?: string;
  icon?: React.ReactNode;
  isButton?: boolean;
  onclick?: () => void;
};

interface Trait {
  id: number;
  trait_type: string;
  value: string;
}

type TruncateTextProps = {
  text: string;
  maxChars: number;
  className?: string;
};

interface PinataMetadata {
  name?: string;
  keyvalues?: {
    [key: string]: string | number;
  };
}

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  pinataMetadata?: PinataMetadata;
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
  tokenId: number;
  price: string;
  collectionId: number;
  isActive: boolean;
  listingType: number;
  auctionId: number;
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
  startTime: number;
  endTime: number;
  highestBidder: string;
  highestBid: string;
  ended: boolean;
  active: boolean;
  bids: Bid[];
}

interface NFTAuctionStatus {
  isOnAuction: boolean;
  auctionId: number;
}

interface Bid {
  bidder: string;
  amount: string;
  timestamp: number;
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
  description?: string;
}

type SearchResults = {
  creators: User[];
  collections: CollectionInfo[];
};

interface CollectionContractResponse {
  success: boolean;
  data?: any;
  error?: string;
}

type ViewStats = {
  totalViews: number;
  uniqueViews: number;
  lastViewed?: Date;
} | null;

type CreatorPageData = {
  user: User;
  tokens: {
    created: TokenInfo[];
    owned: TokenInfo[];
    sold: number;
  };
  collections: CollectionInfo[] | undefined;
  nftStatuses: Record<
    string,
    {
      isOnAuction: boolean;
      auctionDetails?: AuctionDetails;
      isListed: boolean;
      isOwner: boolean;
    }
  >;
};

interface NFTListingStatus {
  isListed: boolean;
  listingId: number;
}

interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  isTestnet: boolean;
}

type NetworkConfigs = {
  [chainId: number]: NetworkConfig;
};

type NetworkTier = "mainnet" | "testnet" | "local";

interface EnrichedNFTListing extends NFTListing {
  isAuctionActive?: boolean;
  startingPrice?: string;
  reservePrice?: string;
  startTime?: number;
  endTime?: number;
  highestBidder?: string;
  highestBid?: string;
  ended?: boolean;
}

enum OfferStatus {
  ACTIVE,
  WITHDRAWN,
  EXPIRED,
}

type CollectionOffer = {
  offerId: number;
  collectionId: number;
  offerer: string;
  amount: string;
  nftCount: number;
  timestamp: number;
  expirationTime: number;
  isActive: boolean;
  status: OfferStatus;
};
