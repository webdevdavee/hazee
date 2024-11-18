export const marketplaceContractABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_nftContractAddress",
        type: "address",
      },
      {
        internalType: "address",
        name: "_collectionContractAddress",
        type: "address",
      },
      {
        internalType: "address",
        name: "_auctionContractAddress",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "AuctionEndingFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "AuctionOnlyListing",
    type: "error",
  },
  {
    inputs: [],
    name: "BatchDelistFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "CollectionNotActive",
    type: "error",
  },
  {
    inputs: [],
    name: "ContractNotApproved",
    type: "error",
  },
  {
    inputs: [],
    name: "ExcessRefundFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "InsufficientPayment",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidAuctionParameters",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidAuctionState",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidListingType",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidPageSize",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidSortOrder",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidStatus",
    type: "error",
  },
  {
    inputs: [],
    name: "ListingNotActive",
    type: "error",
  },
  {
    inputs: [],
    name: "ListingNotFound",
    type: "error",
  },
  {
    inputs: [],
    name: "NFTOnAuction",
    type: "error",
  },
  {
    inputs: [],
    name: "NFTUnavailableForPurchase",
    type: "error",
  },
  {
    inputs: [],
    name: "NotNFTOwner",
    type: "error",
  },
  {
    inputs: [],
    name: "NotSeller",
    type: "error",
  },
  {
    inputs: [],
    name: "PlatformFeeTransferFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "PriceFilterMismatch",
    type: "error",
  },
  {
    inputs: [],
    name: "PriceMustBeGreaterThanZero",
    type: "error",
  },
  {
    inputs: [],
    name: "ReentrancyGuardReentrantCall",
    type: "error",
  },
  {
    inputs: [],
    name: "RoyaltyFeeTransferFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "SellerNoLongerOwnsNFT",
    type: "error",
  },
  {
    inputs: [],
    name: "SellerPaymentFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "TokenAlreadyListed",
    type: "error",
  },
  {
    inputs: [],
    name: "TransferFailed",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "listingId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "auctionId",
        type: "uint256",
      },
    ],
    name: "AuctionPurchaseProcessed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256[]",
        name: "tokenIds",
        type: "uint256[]",
      },
    ],
    name: "BatchDelisted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "listingId",
        type: "uint256",
      },
    ],
    name: "ListingCancelled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "listingId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "newPrice",
        type: "uint256",
      },
    ],
    name: "ListingPriceUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "listingId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "enum NFTMarketplace.ListingType",
        name: "newType",
        type: "uint8",
      },
    ],
    name: "ListingTypeUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "listingId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "seller",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "collectionId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "enum NFTMarketplace.ListingType",
        name: "listingType",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "auctionId",
        type: "uint256",
      },
    ],
    name: "NFTListed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "listingId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "buyer",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "seller",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "collectionId",
        type: "uint256",
      },
    ],
    name: "NFTSold",
    type: "event",
  },
  {
    stateMutability: "payable",
    type: "fallback",
  },
  {
    inputs: [],
    name: "PLATFORM_FEE_PERCENTAGE",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "collectionId",
        type: "uint256",
      },
      {
        internalType: "uint256[]",
        name: "tokenIds",
        type: "uint256[]",
      },
      {
        internalType: "address",
        name: "offerer",
        type: "address",
      },
    ],
    name: "acceptCollectionOfferAndDelist",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_listingId",
        type: "uint256",
      },
    ],
    name: "buyNFT",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_listingId",
        type: "uint256",
      },
    ],
    name: "canEndAuction",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_listingId",
        type: "uint256",
      },
    ],
    name: "cancelListing",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_listingId",
        type: "uint256",
      },
    ],
    name: "finalizeAuctionAndDelist",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_offset",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_limit",
        type: "uint256",
      },
    ],
    name: "getActiveListings",
    outputs: [
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_collectionId",
        type: "uint256",
      },
    ],
    name: "getCollectionListings",
    outputs: [
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_creator",
        type: "address",
      },
    ],
    name: "getCreatorListings",
    outputs: [
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "enum NFTMarketplace.ListingType",
            name: "listingType",
            type: "uint8",
          },
          {
            internalType: "uint256",
            name: "collectionId",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "minPrice",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "maxPrice",
            type: "uint256",
          },
          {
            internalType: "enum NFTMarketplace.SortOrder",
            name: "sortOrder",
            type: "uint8",
          },
          {
            internalType: "uint256",
            name: "offset",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "limit",
            type: "uint256",
          },
        ],
        internalType: "struct NFTMarketplace.FilterParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "getFilteredListings",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "listingId",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "seller",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "price",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "collectionId",
            type: "uint256",
          },
          {
            internalType: "enum NFTMarketplace.ListingType",
            name: "listingType",
            type: "uint8",
          },
          {
            internalType: "uint256",
            name: "auctionId",
            type: "uint256",
          },
        ],
        internalType: "struct NFTMarketplace.ListingView[]",
        name: "",
        type: "tuple[]",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_listingId",
        type: "uint256",
      },
    ],
    name: "getListingDetails",
    outputs: [
      {
        internalType: "address",
        name: "seller",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "collectionId",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "isActive",
        type: "bool",
      },
      {
        internalType: "enum NFTMarketplace.ListingType",
        name: "listingType",
        type: "uint8",
      },
      {
        internalType: "uint256",
        name: "auctionId",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "i_auctionContract",
    outputs: [
      {
        internalType: "contract NFTAuction",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "i_collectionContract",
    outputs: [
      {
        internalType: "contract NFTCollections",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "i_feeRecipient",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "i_nftContract",
    outputs: [
      {
        internalType: "contract NFT",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_tokenId",
        type: "uint256",
      },
    ],
    name: "isNFTListed",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_tokenId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_price",
        type: "uint256",
      },
      {
        internalType: "enum NFTMarketplace.ListingType",
        name: "_listingType",
        type: "uint8",
      },
      {
        internalType: "uint256",
        name: "_startingPrice",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_reservePrice",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_duration",
        type: "uint256",
      },
    ],
    name: "listNFT",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "listingCounter",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "listings",
    outputs: [
      {
        internalType: "address",
        name: "seller",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "price",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "collectionId",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "isActive",
        type: "bool",
      },
      {
        internalType: "enum NFTMarketplace.ListingType",
        name: "listingType",
        type: "uint8",
      },
      {
        internalType: "uint256",
        name: "auctionId",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_listingId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_newPrice",
        type: "uint256",
      },
    ],
    name: "updateListingPrice",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_listingId",
        type: "uint256",
      },
      {
        internalType: "enum NFTMarketplace.ListingType",
        name: "_newType",
        type: "uint8",
      },
      {
        internalType: "uint256",
        name: "_startingPrice",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_reservePrice",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_duration",
        type: "uint256",
      },
    ],
    name: "updateListingType",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    stateMutability: "payable",
    type: "receive",
  },
];
