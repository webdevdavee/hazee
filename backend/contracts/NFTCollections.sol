// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./NFT.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract NFTCollections is Ownable, ReentrancyGuard {
    uint256 private constant MIN_OFFER_DURATION = 12 hours;
    uint256 private constant DEFAULT_OFFER_DURATION = 7 days;
    uint256 private constant MAX_OFFER_DURATION = 1 weeks;
    uint256 private constant MAX_ROYALTY_PERCENTAGE = 4000;

    NFT private nftContract;

    uint256 private offerCounter;

    enum OfferStatus {
        ACTIVE,
        WITHDRAWN,
        EXPIRED
    }

    struct CollectionInfo {
        uint256 collectionId;
        address creator;
        uint256 maxSupply;
        uint256 mintedSupply;
        uint256 royaltyPercentage;
        uint256 floorPrice;
        bool isActive;
    }

    struct CollectionOffer {
        uint256 offerId;
        uint256 collectionId;
        address offerer;
        uint256 amount;
        uint256 nftCount;
        uint256 timestamp;
        uint256 expirationTime;
        bool isActive;
        OfferStatus status;
    }

    mapping(uint256 => uint256[]) private mintedTokens;
    uint256 public collectionCounter;
    mapping(uint256 => CollectionInfo) public collections;
    mapping(address => uint256[]) public userCreatedCollections;
    mapping(uint256 => mapping(address => CollectionOffer))
        public collectionOffers;
    mapping(address => uint256[]) public userCollectionOffers;
    mapping(uint256 => address[]) private offerersByCollection;
    mapping(address => mapping(uint256 => bool)) public hasUserCollectionOffer;
    mapping(uint256 => mapping(address => bool)) public isOffererInCollection;

    mapping(uint256 => CollectionOffer) private offerById;

    // Events
    event NFTMinted(
        uint256 indexed collectionId,
        uint256 indexed tokenId,
        address indexed owner
    );
    event CollectionOfferPlaced(
        uint256 indexed collectionId,
        uint256 indexed offerId,
        address indexed offerer,
        uint256 amount,
        uint256 nftCount,
        uint256 expirationTime
    );
    event CollectionOfferWithdrawn(
        uint256 indexed collectionId,
        uint256 indexed offerId,
        address indexed offerer,
        uint256 amount
    );
    event CollectionOfferAccepted(
        uint256 indexed collectionId,
        uint256 indexed offerId,
        uint256[] tokenIds,
        address indexed seller,
        address buyer,
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
    event OfferStatusUpdated(uint256 indexed offerId, OfferStatus status);

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
    error InvalidMaxSupply();
    error InvalidFloorPrice();
    error InvalidOfferId();

    constructor(address _nftContract) Ownable(msg.sender) {
        nftContract = NFT(_nftContract);
    }

    function createCollection(
        uint256 _maxSupply,
        uint256 _royaltyPercentage,
        uint256 _floorPrice
    ) external returns (uint256) {
        if (_maxSupply == 0) revert InvalidMaxSupply();
        if (_floorPrice == 0) revert InvalidFloorPrice();
        if (_royaltyPercentage > MAX_ROYALTY_PERCENTAGE)
            revert RoyaltyPercentageTooHigh();

        uint256 newCollectionId = ++collectionCounter;

        collections[newCollectionId] = CollectionInfo({
            collectionId: newCollectionId,
            creator: msg.sender,
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

        uint256 tokenId = nftContract.mint(
            msg.sender,
            tokenURI,
            price,
            _collectionId
        );

        unchecked {
            collection.mintedSupply++;
        }

        mintedTokens[_collectionId].push(tokenId);

        emit NFTMinted(_collectionId, tokenId, msg.sender);
        return tokenId;
    }

    function getMintedNFTs(
        uint256 _collectionId
    ) public view returns (uint256[] memory) {
        if (_collectionId == 0 || _collectionId > collectionCounter) {
            revert InvalidCollectionID();
        }
        return mintedTokens[_collectionId];
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

        // Handle existing offer
        CollectionOffer storage existingOffer = collectionOffers[_collectionId][
            msg.sender
        ];
        if (existingOffer.isActive) {
            payable(msg.sender).transfer(existingOffer.amount);
            existingOffer.isActive = false;
            existingOffer.status = OfferStatus.WITHDRAWN;
            emit OfferStatusUpdated(
                existingOffer.offerId,
                OfferStatus.WITHDRAWN
            );
        }

        uint256 expirationTime = block.timestamp +
            (duration == 0 ? DEFAULT_OFFER_DURATION : duration);

        uint256 newOfferId = ++offerCounter;

        CollectionOffer memory newOffer = CollectionOffer({
            offerId: newOfferId,
            collectionId: _collectionId,
            offerer: msg.sender,
            amount: msg.value,
            nftCount: nftCount,
            timestamp: block.timestamp,
            expirationTime: expirationTime,
            isActive: true,
            status: OfferStatus.ACTIVE
        });

        collectionOffers[_collectionId][msg.sender] = newOffer;
        offerById[newOfferId] = newOffer;

        // Update the tracking arrays
        if (!hasUserCollectionOffer[msg.sender][_collectionId]) {
            userCollectionOffers[msg.sender].push(_collectionId);
            hasUserCollectionOffer[msg.sender][_collectionId] = true;
        }

        if (!isOffererInCollection[_collectionId][msg.sender]) {
            offerersByCollection[_collectionId].push(msg.sender);
            isOffererInCollection[_collectionId][msg.sender] = true;
        }

        emit CollectionOfferPlaced(
            _collectionId,
            newOfferId,
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
        offer.status = OfferStatus.WITHDRAWN;
        offer.amount = 0;

        // Update offerById
        offerById[offer.offerId].status = OfferStatus.WITHDRAWN;
        offerById[offer.offerId].isActive = false;
        offerById[offer.offerId].amount = 0;

        payable(msg.sender).transfer(amount);

        // Clean up tracking data
        _removeUserCollectionOffer(msg.sender, _collectionId);
        _removeOffererFromCollection(_collectionId, msg.sender);
        hasUserCollectionOffer[msg.sender][_collectionId] = false;
        isOffererInCollection[_collectionId][msg.sender] = false;

        emit OfferStatusUpdated(offer.offerId, OfferStatus.WITHDRAWN);
        emit CollectionOfferWithdrawn(
            _collectionId,
            offer.offerId,
            msg.sender,
            amount
        );
    }

    function acceptCollectionOffer(
        uint256 _collectionId,
        uint256[] calldata tokenIds,
        address offerer,
        address sender
    ) external nonReentrant {
        CollectionInfo storage collection = collections[_collectionId];
        if (!collection.isActive) revert CollectionNotActive();

        CollectionOffer memory offer = collectionOffers[_collectionId][offerer];
        if (!offer.isActive) revert NoActiveCollectionOffer();

        if (block.timestamp > offer.expirationTime) {
            offer.status = OfferStatus.EXPIRED;
            offer.isActive = false;
            offerById[offer.offerId].status = OfferStatus.EXPIRED;
            offerById[offer.offerId].isActive = false;
            emit OfferStatusUpdated(offer.offerId, OfferStatus.EXPIRED);
            revert OfferExpired();
        }

        if (tokenIds.length != offer.nftCount) revert InvalidNumberOfTokens();

        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (nftContract.ownerOf(tokenIds[i]) != sender)
                revert NotTokenOwner();
            nftContract.safeTransferFrom(sender, offerer, tokenIds[i]);
        }

        uint256 royaltyAmount = (offer.amount * collection.royaltyPercentage) /
            10000;
        uint256 sellerProceeds = offer.amount - royaltyAmount;

        payable(collection.creator).transfer(royaltyAmount);
        payable(sender).transfer(sellerProceeds);

        // Update offer status before deleting
        offerById[offer.offerId].status = OfferStatus.WITHDRAWN;
        offerById[offer.offerId].isActive = false;
        emit OfferStatusUpdated(offer.offerId, OfferStatus.WITHDRAWN);

        delete collectionOffers[_collectionId][offerer];

        _removeUserCollectionOffer(offerer, _collectionId);
        _removeOffererFromCollection(_collectionId, offerer);

        emit CollectionOfferAccepted(
            _collectionId,
            offer.offerId,
            tokenIds,
            sender,
            offerer,
            offer.amount
        );
    }

    function _removeUserCollectionOffer(
        address user,
        uint256 collectionId
    ) private {
        uint256[] storage userOffers = userCollectionOffers[user];
        for (uint256 i = 0; i < userOffers.length; i++) {
            if (userOffers[i] == collectionId) {
                userOffers[i] = userOffers[userOffers.length - 1];
                userOffers.pop();
                break;
            }
        }
    }

    function _removeOffererFromCollection(
        uint256 collectionId,
        address offerer
    ) private {
        address[] storage offerers = offerersByCollection[collectionId];
        for (uint256 i = 0; i < offerers.length; i++) {
            if (offerers[i] == offerer) {
                offerers[i] = offerers[offerers.length - 1];
                offerers.pop();
                break;
            }
        }
    }

    // View Functions
    function getUserCreatedCollections(
        address user
    ) external view returns (uint256[] memory) {
        return userCreatedCollections[user];
    }

    function getOfferById(
        uint256 _offerId
    ) external view returns (CollectionOffer memory) {
        CollectionOffer memory offer = offerById[_offerId];
        if (offer.offerId == 0) revert InvalidOfferId();

        // Update status if expired but still marked as active
        if (offer.isActive && block.timestamp > offer.expirationTime) {
            offer.status = OfferStatus.EXPIRED;
            offer.isActive = false;
        }

        return offer;
    }

    function getUserCollectionOffers(
        address user
    ) external view returns (CollectionOffer[] memory) {
        uint256[] memory collectionIds = userCollectionOffers[user];
        uint256 validOffersCount = 0;

        // First pass: count valid offers
        for (uint256 i = 0; i < collectionIds.length; i++) {
            CollectionOffer memory offer = collectionOffers[collectionIds[i]][
                user
            ];
            if (offer.isActive && block.timestamp <= offer.expirationTime) {
                validOffersCount++;
            }
        }

        // Create array with exact size needed
        CollectionOffer[] memory validOffers = new CollectionOffer[](
            validOffersCount
        );
        uint256 currentIndex = 0;

        // Second pass: fill array with valid offers
        for (uint256 i = 0; i < collectionIds.length; i++) {
            CollectionOffer memory offer = collectionOffers[collectionIds[i]][
                user
            ];
            if (offer.isActive && block.timestamp <= offer.expirationTime) {
                validOffers[currentIndex] = offer;
                currentIndex++;
            }
        }

        return validOffers;
    }

    function getCollectionOffers(
        uint256 _collectionId
    ) external view returns (CollectionOffer[] memory) {
        if (_collectionId == 0 || _collectionId > collectionCounter) {
            revert InvalidCollectionID();
        }

        address[] storage offerers = offerersByCollection[_collectionId];
        uint256 validOffersCount = 0;

        // First pass: count valid offers
        for (uint256 i = 0; i < offerers.length; i++) {
            CollectionOffer memory offer = collectionOffers[_collectionId][
                offerers[i]
            ];
            if (offer.isActive && block.timestamp <= offer.expirationTime) {
                validOffersCount++;
            }
        }

        // Create array with exact size needed
        CollectionOffer[] memory validOffers = new CollectionOffer[](
            validOffersCount
        );
        uint256 currentIndex = 0;

        // Second pass: fill array with valid offers
        for (uint256 i = 0; i < offerers.length; i++) {
            CollectionOffer memory offer = collectionOffers[_collectionId][
                offerers[i]
            ];
            if (offer.isActive && block.timestamp <= offer.expirationTime) {
                validOffers[currentIndex] = offer;
                currentIndex++;
            }
        }

        return validOffers;
    }

    function getCollections(
        uint256 _offset,
        uint256 _limit
    ) external view returns (CollectionInfo[] memory) {
        // If there are no collections, return empty array
        if (collectionCounter == 0) {
            return new CollectionInfo[](0);
        }

        // Adjust offset if it exceeds collection count
        _offset = _offset >= collectionCounter
            ? collectionCounter - 1
            : _offset;

        // Calculate the actual number of items to return
        uint256 remainingItems = collectionCounter - _offset;
        uint256 length = _limit > remainingItems ? remainingItems : _limit;

        // Create array with exact size needed
        CollectionInfo[] memory result = new CollectionInfo[](length);

        // Fill the array
        for (uint256 i = 0; i < length; i++) {
            result[i] = collections[_offset + i + 1];
        }

        return result;
    }

    function getCollectionInfo(
        uint256 _collectionId
    ) external view returns (CollectionInfo memory) {
        if (_collectionId == 0 || _collectionId > collectionCounter)
            revert InvalidCollectionID();
        return collections[_collectionId];
    }
}
