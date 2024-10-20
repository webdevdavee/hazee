// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./NFT.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./NFTAuction.sol";
import "./NFTMarketplace.sol";

contract NFTCollections is Ownable, ReentrancyGuard {
    uint256 private constant MIN_OFFER_DURATION = 12 hours;
    uint256 private constant MAX_OFFER_DURATION = 1 weeks;
    uint256 private constant MAX_ROYALTY_PERCENTAGE = 4000;

    address private auctionContract;
    address private marketplaceContract;

    struct CollectionInfo {
        uint256 collectionId;
        address creator;
        address nftContract;
        uint256 maxSupply;
        uint256 mintedSupply;
        uint256 royaltyPercentage;
        uint256 floorPrice;
        bool isActive;
    }

    struct CollectionOffer {
        address offerer;
        uint256 amount;
        uint256 nftCount;
        uint256 timestamp;
        uint256 expirationTime;
        bool isActive;
    }

    mapping(uint256 => CollectionInfo) private collections;
    mapping(uint256 => mapping(address => CollectionOffer))
        private collectionOffers;
    mapping(address => uint256[]) private userCreatedCollections;
    mapping(address => uint256[]) private userOfferCollections;
    uint256 public collectionCounter;

    // Events
    event NFTMinted(
        uint256 indexed collectionId,
        uint256 indexed tokenId,
        address indexed owner
    );
    event CollectionOfferPlaced(
        uint256 indexed collectionId,
        address indexed offerer,
        uint256 amount,
        uint256 nftCount,
        uint256 expirationTime
    );
    event CollectionOfferWithdrawn(
        uint256 indexed collectionId,
        address indexed offerer,
        uint256 amount
    );
    event CollectionOfferAccepted(
        uint256 indexed collectionId,
        uint256[] tokenIds,
        address indexed seller,
        address indexed buyer,
        uint256 amount
    );
    event FloorPriceUpdated(
        uint256 indexed collectionId,
        uint256 newFloorPrice
    );
    event RoyaltyPercentageUpdated(
        uint256 indexed collectionId,
        uint256 newRoyaltyPercentage
    );
    event CollectionAdded(
        uint256 indexed collectionId,
        address indexed collectionAddress,
        address indexed creator
    );

    // Custom Errors
    error RoyaltyPercentageTooHigh();
    error CollectionNotActive();
    error MaximumSupplyReached();
    error InvalidCollectionID();
    error OfferBelowFloorPrice();
    error InvalidNFTCount();
    error InvalidOfferDuration();
    error NoActiveCollectionOffer();
    error OfferExpired();
    error InvalidNumberOfTokens();
    error NotTokenOwner();
    error OffsetOutOfBounds();
    error Unauthorized();

    constructor(
        address _auctionContract,
        address _marketplaceContract
    ) Ownable(msg.sender) {
        auctionContract = _auctionContract;
        marketplaceContract = _marketplaceContract;
    }

    function setMarketplaceContract(
        address _marketplaceContract
    ) external onlyOwner {
        marketplaceContract = _marketplaceContract;
    }

    function createCollection(
        uint256 _maxSupply,
        uint256 _royaltyPercentage,
        uint256 _floorPrice
    ) external returns (uint256) {
        if (_royaltyPercentage > MAX_ROYALTY_PERCENTAGE)
            revert RoyaltyPercentageTooHigh();

        uint256 newCollectionId = ++collectionCounter;

        NFT newNFTContract = new NFT(
            "Test NFT",
            "TNFT",
            auctionContract,
            marketplaceContract
        );

        collections[newCollectionId] = CollectionInfo({
            collectionId: newCollectionId,
            creator: msg.sender,
            nftContract: address(newNFTContract),
            maxSupply: _maxSupply,
            mintedSupply: 0,
            royaltyPercentage: _royaltyPercentage,
            floorPrice: _floorPrice,
            isActive: true
        });

        userCreatedCollections[msg.sender].push(newCollectionId);

        emit CollectionAdded(newCollectionId, address(this), msg.sender);

        return newCollectionId;
    }

    function mintNFT(
        uint256 _collectionId,
        uint256 price,
        string calldata tokenURI
    ) external returns (uint256) {
        CollectionInfo storage collection = collections[_collectionId];
        if (!collection.isActive) revert CollectionNotActive();
        if (collection.mintedSupply >= collection.maxSupply)
            revert MaximumSupplyReached();
        if (msg.sender != collection.creator) revert Unauthorized();

        NFT nft = NFT(collection.nftContract);
        uint256 tokenId = nft.mint(msg.sender, tokenURI, price, _collectionId);

        unchecked {
            collection.mintedSupply++;
        }

        emit NFTMinted(_collectionId, tokenId, msg.sender);
        return tokenId;
    }

    function updateFloorPrice(
        uint256 _collectionId,
        uint256 _floorPrice
    ) external {
        CollectionInfo storage collection = collections[_collectionId];
        if (!collection.isActive) revert CollectionNotActive();
        if (msg.sender != collection.creator) revert Unauthorized();

        collection.floorPrice = _floorPrice;
        emit FloorPriceUpdated(_collectionId, _floorPrice);
    }

    function updateRoyaltyPercentage(
        uint256 _collectionId,
        uint256 _royaltyPercentage
    ) external {
        CollectionInfo storage collection = collections[_collectionId];
        if (!collection.isActive) revert CollectionNotActive();
        if (msg.sender != collection.creator) revert Unauthorized();
        if (_royaltyPercentage > MAX_ROYALTY_PERCENTAGE)
            revert RoyaltyPercentageTooHigh();

        collection.royaltyPercentage = _royaltyPercentage;
        emit RoyaltyPercentageUpdated(_collectionId, _royaltyPercentage);
    }

    function placeCollectionOffer(
        uint256 _collectionId,
        uint256 nftCount,
        uint256 duration
    ) external payable nonReentrant {
        CollectionInfo storage collection = collections[_collectionId];
        if (!collection.isActive) revert CollectionNotActive();
        if (msg.value < collection.floorPrice * nftCount)
            revert OfferBelowFloorPrice();
        if (nftCount == 0 || nftCount > collection.mintedSupply)
            revert InvalidNFTCount();
        if (duration < MIN_OFFER_DURATION || duration > MAX_OFFER_DURATION)
            revert InvalidOfferDuration();

        CollectionOffer storage existingOffer = collectionOffers[_collectionId][
            msg.sender
        ];
        if (existingOffer.isActive) {
            payable(msg.sender).transfer(existingOffer.amount);
        } else {
            userOfferCollections[msg.sender].push(_collectionId);
        }

        uint256 expirationTime = block.timestamp + duration;

        collectionOffers[_collectionId][msg.sender] = CollectionOffer({
            offerer: msg.sender,
            amount: msg.value,
            nftCount: nftCount,
            timestamp: block.timestamp,
            expirationTime: expirationTime,
            isActive: true
        });

        emit CollectionOfferPlaced(
            _collectionId,
            msg.sender,
            msg.value,
            nftCount,
            expirationTime
        );
    }

    function withdrawCollectionOffer(
        uint256 _collectionId
    ) external nonReentrant {
        CollectionOffer storage offer = collectionOffers[_collectionId][
            msg.sender
        ];
        if (!offer.isActive) revert NoActiveCollectionOffer();

        uint256 amount = offer.amount;
        offer.isActive = false;
        offer.amount = 0;

        payable(msg.sender).transfer(amount);

        emit CollectionOfferWithdrawn(_collectionId, msg.sender, amount);
    }

    function acceptCollectionOffer(
        uint256 _collectionId,
        uint256[] calldata tokenIds,
        address offerer
    ) external nonReentrant {
        CollectionInfo storage collection = collections[_collectionId];
        if (!collection.isActive) revert CollectionNotActive();

        CollectionOffer memory offer = collectionOffers[_collectionId][offerer];
        if (!offer.isActive) revert NoActiveCollectionOffer();
        if (block.timestamp > offer.expirationTime) revert OfferExpired();
        if (tokenIds.length != offer.nftCount) revert InvalidNumberOfTokens();

        NFT nft = NFT(collection.nftContract);
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (nft.ownerOf(tokenIds[i]) != msg.sender) revert NotTokenOwner();
            nft.safeTransferFrom(msg.sender, offerer, tokenIds[i]);
        }

        uint256 royaltyAmount = (offer.amount * collection.royaltyPercentage) /
            10000;
        uint256 sellerProceeds = offer.amount - royaltyAmount;

        payable(collection.creator).transfer(royaltyAmount);
        payable(msg.sender).transfer(sellerProceeds);

        delete collectionOffers[_collectionId][offerer];

        emit CollectionOfferAccepted(
            _collectionId,
            tokenIds,
            msg.sender,
            offerer,
            offer.amount
        );
    }

    // View Functions
    function getUserCreatedCollections(
        address user
    ) external view returns (uint256[] memory) {
        return userCreatedCollections[user];
    }

    function getUserCollectionOffers(
        address user
    ) external view returns (uint256[] memory) {
        return userOfferCollections[user];
    }

    function getCollectionInfo(
        uint256 _collectionId
    ) external view returns (CollectionInfo memory) {
        if (_collectionId == 0 || _collectionId > collectionCounter)
            revert InvalidCollectionID();
        return collections[_collectionId];
    }

    receive() external payable {}
}
