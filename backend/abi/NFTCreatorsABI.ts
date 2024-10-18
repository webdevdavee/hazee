export const creatorsContractABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "creatorId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "actionType",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "relatedItemId",
        type: "uint256",
      },
    ],
    name: "ActivityRecorded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "creatorId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "collectionId",
        type: "uint256",
      },
    ],
    name: "CollectionCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "creator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "creatorId",
        type: "uint256",
      },
    ],
    name: "CreatorRegistered",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "creatorId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "NFTCreated",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "creatorId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "collectionId",
        type: "uint256",
      },
    ],
    name: "addCreatedCollection",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "creatorId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "addCreatedNFT",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "creatorId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "addOwnedNFT",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "creatorActivities",
    outputs: [
      {
        internalType: "string",
        name: "actionType",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "relatedItemId",
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
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "creatorBids",
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
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "creatorCollectionOffers",
    outputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "nftCount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "expirationTime",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "isActive",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "creatorIdByAddress",
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
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "creatorOffers",
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
    name: "creators",
    outputs: [
      {
        internalType: "uint256",
        name: "creatorId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "userAddress",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "itemsSold",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "walletBalance",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllCreators",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "creatorId",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "userAddress",
            type: "address",
          },
          {
            internalType: "uint256[]",
            name: "createdNFTs",
            type: "uint256[]",
          },
          {
            internalType: "uint256[]",
            name: "ownedNFTs",
            type: "uint256[]",
          },
          {
            internalType: "uint256[]",
            name: "createdCollections",
            type: "uint256[]",
          },
          {
            internalType: "uint256",
            name: "itemsSold",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "walletBalance",
            type: "uint256",
          },
        ],
        internalType: "struct NFTCreators.Creator[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "creatorId",
        type: "uint256",
      },
    ],
    name: "getCreatorActivities",
    outputs: [
      {
        components: [
          {
            internalType: "string",
            name: "actionType",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "timestamp",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "relatedItemId",
            type: "uint256",
          },
        ],
        internalType: "struct NFTCreators.Activity[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "creatorId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "auctionId",
        type: "uint256",
      },
    ],
    name: "getCreatorBids",
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
        name: "creatorId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "collectionId",
        type: "uint256",
      },
    ],
    name: "getCreatorCollectionOffers",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "nftCount",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "timestamp",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "expirationTime",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "isActive",
            type: "bool",
          },
        ],
        internalType: "struct NFTCreators.CollectionOffer",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "getCreatorIdByAddress",
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
        name: "creatorId",
        type: "uint256",
      },
    ],
    name: "getCreatorInfo",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "creatorId",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "userAddress",
            type: "address",
          },
          {
            internalType: "uint256[]",
            name: "createdNFTs",
            type: "uint256[]",
          },
          {
            internalType: "uint256[]",
            name: "ownedNFTs",
            type: "uint256[]",
          },
          {
            internalType: "uint256[]",
            name: "createdCollections",
            type: "uint256[]",
          },
          {
            internalType: "uint256",
            name: "itemsSold",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "walletBalance",
            type: "uint256",
          },
        ],
        internalType: "struct NFTCreators.Creator",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "userAddress",
        type: "address",
      },
    ],
    name: "isAddressRegistered",
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
        name: "creatorId",
        type: "uint256",
      },
    ],
    name: "isCreatorRegistered",
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
        name: "creatorId",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "actionType",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "relatedItemId",
        type: "uint256",
      },
    ],
    name: "recordActivity",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "registerCreator",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "creatorId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "collectionId",
        type: "uint256",
      },
    ],
    name: "removeCollectionOffer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "creatorId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "removeOwnedNFT",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "creatorId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "auctionId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "bidAmount",
        type: "uint256",
      },
    ],
    name: "updateBid",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "creatorId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "collectionId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "offerAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "nftCount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "expirationTime",
        type: "uint256",
      },
    ],
    name: "updateCollectionOffer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "creatorId",
        type: "uint256",
      },
    ],
    name: "updateItemsSold",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "creatorId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "newBalance",
        type: "uint256",
      },
    ],
    name: "updateWalletBalance",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
