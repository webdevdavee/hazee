// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./NFT.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./NFTCreators.sol";
import "./NFTAuction.sol";
import "./NFTMarketplace.sol";

contract NFTCollections is Ownable, ReentrancyGuard {
    uint256 private constant MIN_OFFER_DURATION = 12 hours;
    uint256 private constant MAX_OFFER_DURATION = 1 weeks;
    uint256 private constant MAX_ROYALTY_PERCENTAGE = 4000;

    NFTCreators private immutable i_creatorsContract;
    NFTAuction private immutable i_auctionContract;
    NFTMarketplace private immutable i_marketplaceContract;

    struct CollectionInfo {
        address creator;
        address currentOwner;
        string name;
        address nftContract;
        uint256 maxSupply;
        uint256 mintedSupply;
        uint256 royaltyPercentage;
        uint256 floorPrice;
        uint256 owners;
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
    mapping(uint256 => mapping(address => bool)) private isOwner;
    mapping(uint256 => uint256[]) private mintedTokens;
    uint256 public collectionCounter;

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
        address indexed creator,
        string name
    );

    error RoyaltyPercentageTooHigh();
    error CollectionNotActive();
    error OnlyCurrentOwnerAllowed();
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

    constructor(
        address _creatorsAddress,
        address _auctionContractAddress,
        address _marketplaceAddress
    ) Ownable(msg.sender) {
        i_creatorsContract = NFTCreators(_creatorsAddress);
        i_auctionContract = NFTAuction(_auctionContractAddress);
        i_marketplaceContract = NFTMarketplace(_marketplaceAddress);
    }

    function createCollection(
        string memory _name,
        uint256 _maxSupply,
        uint256 _royaltyPercentage,
        uint256 _floorPrice
    ) external returns (uint256) {
        if (_royaltyPercentage > MAX_ROYALTY_PERCENTAGE)
            revert RoyaltyPercentageTooHigh();

        uint256 newCollectionId = ++collectionCounter;

        NFT newNFTContract = new NFT(
            _name,
            "NFT",
            address(i_creatorsContract),
            address(i_auctionContract),
            address(i_marketplaceContract)
        );

        collections[newCollectionId] = CollectionInfo({
            creator: msg.sender,
            currentOwner: msg.sender,
            name: _name,
            nftContract: address(newNFTContract),
            maxSupply: _maxSupply,
            mintedSupply: 0,
            royaltyPercentage: _royaltyPercentage,
            floorPrice: _floorPrice,
            owners: 0,
            isActive: true
        });

        emit CollectionAdded(
            newCollectionId,
            address(newNFTContract),
            msg.sender,
            _name
        );

        return newCollectionId;
    }

    function mintNFT(
        uint256 _collectionId,
        uint256 price,
        string memory tokenURI
    ) public returns (uint256) {
        CollectionInfo storage collection = collections[_collectionId];
        if (!collection.isActive) revert CollectionNotActive();
        if (collection.mintedSupply >= collection.maxSupply)
            revert MaximumSupplyReached();
        if (msg.sender != collection.currentOwner)
            revert OnlyCurrentOwnerAllowed();

        NFT nft = NFT(collection.nftContract);
        uint256 tokenId = nft.mint(msg.sender, tokenURI, price, _collectionId);

        collection.mintedSupply++;
        mintedTokens[_collectionId].push(tokenId);

        if (!isOwner[_collectionId][msg.sender]) {
            isOwner[_collectionId][msg.sender] = true;
            collection.owners++;
        }

        emit NFTMinted(_collectionId, tokenId, msg.sender);
        return tokenId;
    }

    function getMintedNFTs(
        uint256 _collectionId
    ) public view returns (uint256[] memory) {
        return mintedTokens[_collectionId];
    }

    function updateFloorPrice(
        uint256 _collectionId,
        uint256 _floorPrice
    ) public {
        CollectionInfo storage collection = collections[_collectionId];
        if (!collection.isActive) revert CollectionNotActive();
        if (msg.sender != collection.currentOwner)
            revert OnlyCurrentOwnerAllowed();

        collection.floorPrice = _floorPrice;
        emit FloorPriceUpdated(_collectionId, _floorPrice);
    }

    function updateRoyaltyPercentage(
        uint256 _collectionId,
        uint256 _royaltyPercentage
    ) public {
        CollectionInfo storage collection = collections[_collectionId];
        if (!collection.isActive) revert CollectionNotActive();
        if (msg.sender != collection.currentOwner)
            revert OnlyCurrentOwnerAllowed();
        if (_royaltyPercentage > MAX_ROYALTY_PERCENTAGE)
            revert RoyaltyPercentageTooHigh();

        collection.royaltyPercentage = _royaltyPercentage;
        emit RoyaltyPercentageUpdated(_collectionId, _royaltyPercentage);
    }

    function getCollections(
        uint256 _offset,
        uint256 _limit
    ) external view returns (CollectionInfo[] memory) {
        if (_offset >= collectionCounter) revert OffsetOutOfBounds();
        uint256 end = _offset + _limit > collectionCounter
            ? collectionCounter
            : _offset + _limit;
        uint256 length = end - _offset;
        CollectionInfo[] memory result = new CollectionInfo[](length);
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

    function placeCollectionOffer(
        uint256 _collectionId,
        uint256 nftCount,
        uint256 duration
    ) public payable nonReentrant {
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
        }

        uint256 expirationTime = block.timestamp + duration;

        collectionOffers[_collectionId][msg.sender] = CollectionOffer(
            msg.sender,
            msg.value,
            nftCount,
            block.timestamp,
            expirationTime,
            true
        );

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
    ) public nonReentrant {
        CollectionInfo storage collection = collections[_collectionId];
        if (!collection.isActive) revert CollectionNotActive();

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
        uint256[] memory tokenIds,
        address offerer
    ) public nonReentrant {
        CollectionInfo storage collection = collections[_collectionId];
        if (!collection.isActive) revert CollectionNotActive();

        CollectionOffer memory offer = collectionOffers[_collectionId][offerer];
        if (!offer.isActive) revert NoActiveCollectionOffer();
        if (block.timestamp > offer.expirationTime) revert OfferExpired();
        if (tokenIds.length != offer.nftCount) revert InvalidNumberOfTokens();

        NFT nft = NFT(collection.nftContract);
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (nft.ownerOf(tokenIds[i]) != msg.sender) revert NotTokenOwner();
        }

        uint256 royaltyAmount = (offer.amount * collection.royaltyPercentage) /
            10000;
        uint256 sellerProceeds = offer.amount - royaltyAmount;

        payable(collection.creator).transfer(royaltyAmount);
        payable(msg.sender).transfer(sellerProceeds);

        for (uint256 i = 0; i < tokenIds.length; i++) {
            nft.safeTransferFrom(msg.sender, offerer, tokenIds[i]);
            _updateOwnership(_collectionId, msg.sender, offerer);
        }

        emit CollectionOfferAccepted(
            _collectionId,
            tokenIds,
            msg.sender,
            offerer,
            offer.amount
        );

        delete collectionOffers[_collectionId][offerer];
    }

    function _updateOwnership(
        uint256 _collectionId,
        address from,
        address to
    ) private {
        CollectionInfo storage collection = collections[_collectionId];
        if (from != address(0) && isOwner[_collectionId][from]) {
            bool stillOwner = false;
            NFT nft = NFT(collection.nftContract);
            for (uint256 i = 0; i < mintedTokens[_collectionId].length; i++) {
                if (nft.ownerOf(mintedTokens[_collectionId][i]) == from) {
                    stillOwner = true;
                    break;
                }
            }
            if (!stillOwner) {
                isOwner[_collectionId][from] = false;
                collection.owners--;
            }
        }
        if (to != address(0) && !isOwner[_collectionId][to]) {
            isOwner[_collectionId][to] = true;
            collection.owners++;
        }
    }

    receive() external payable {}

    fallback() external payable {}
}
