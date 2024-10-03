// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./NFT.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./NFTCreators.sol";
import "./NFTAuction.sol";
import "./NFTMarketplace.sol";

contract NFTCollections is Ownable, ReentrancyGuard {
    uint256 public constant MIN_OFFER_DURATION = 12 hours;
    uint256 public constant MAX_OFFER_DURATION = 1 weeks;

    NFTCreators public immutable i_creatorsContract;
    NFTAuction public immutable i_auctionContract;
    NFTMarketplace public immutable i_marketplaceContract;

    struct CollectionInfo {
        address collectionAddress;
        address creator;
        address currentOwner;
        string name;
        string description;
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

    mapping(uint256 => CollectionInfo) public collections;
    mapping(uint256 => mapping(address => CollectionOffer))
        public collectionOffers;
    mapping(uint256 => mapping(address => bool)) private isOwner;
    mapping(uint256 => uint256[]) public mintedTokens;
    uint256 public collectionCounter;

    event NFTMinted(uint256 collectionId, uint256 tokenId, address owner);
    event CollectionOfferPlaced(
        uint256 collectionId,
        address offerer,
        uint256 amount,
        uint256 nftCount,
        uint256 expirationTime
    );
    event CollectionOfferWithdrawn(
        uint256 collectionId,
        address offerer,
        uint256 amount
    );
    event CollectionOfferAccepted(
        uint256 collectionId,
        uint256[] tokenIds,
        address seller,
        address buyer,
        uint256 amount
    );
    event FloorPriceUpdated(uint256 collectionId, uint256 newFloorPrice);
    event RoyaltyPercentageUpdated(
        uint256 collectionId,
        uint256 newRoyaltyPercentage
    );
    event CollectionAdded(
        uint256 collectionId,
        address collectionAddress,
        address creator,
        string name
    );
    event CollectionDeactivated(uint256 collectionId);
    event CollectionOwnershipTransferred(
        uint256 collectionId,
        address previousOwner,
        address newOwner
    );

    // Custom errors
    error RoyaltyPercentageTooHigh();
    error CollectionNotActive();
    error OnlyCurrentOwnerAllowed();
    error InvalidNewOwner();
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
        address _auctionContractAddress
    ) Ownable(msg.sender) {
        i_creatorsContract = NFTCreators(_creatorsAddress);
        i_auctionContract = NFTAuction(_auctionContractAddress);
    }

    function createCollection(
        string memory _name,
        string memory _description,
        uint256 _maxSupply,
        uint256 _royaltyPercentage,
        uint256 _floorPrice
    ) external returns (uint256) {
        if (_royaltyPercentage > 4000) revert RoyaltyPercentageTooHigh();

        collectionCounter++;
        uint256 newCollectionId = collectionCounter;

        NFT newNFTContract = new NFT(
            _name,
            "NFT",
            address(i_creatorsContract),
            address(i_auctionContract),
            address(i_marketplaceContract)
        );

        collections[newCollectionId] = CollectionInfo({
            collectionAddress: address(this),
            creator: msg.sender,
            currentOwner: msg.sender,
            name: _name,
            description: _description,
            nftContract: address(newNFTContract),
            maxSupply: _maxSupply,
            mintedSupply: 0,
            royaltyPercentage: _royaltyPercentage,
            floorPrice: _floorPrice,
            owners: 0,
            isActive: true
        });

        emit CollectionAdded(newCollectionId, address(this), msg.sender, _name);

        return newCollectionId;
    }

    // function transferCollectionOwnership(
    //     uint256 _collectionId,
    //     address newOwner
    // ) external {
    //     CollectionInfo storage collection = collections[_collectionId];
    //     require(
    //         msg.sender == collection.currentOwner,
    //         "Only current owner can transfer ownership"
    //     );
    //     require(newOwner != address(0), "New owner cannot be the zero address");

    //     address previousOwner = collection.currentOwner;
    //     collection.currentOwner = newOwner;

    //     emit CollectionOwnershipTransferred(
    //         _collectionId,
    //         previousOwner,
    //         newOwner
    //     );
    // }

    function mintNFT(
        uint256 _collectionId,
        uint256 price,
        string memory tokenURI,
        string memory nftName,
        string memory nftDescription,
        NFT.Attribute[] memory attributes
    ) public returns (uint256) {
        CollectionInfo storage collection = collections[_collectionId];
        if (!collection.isActive) revert CollectionNotActive();
        if (collection.mintedSupply >= collection.maxSupply)
            revert MaximumSupplyReached();
        if (msg.sender != collection.currentOwner)
            revert OnlyCurrentOwnerAllowed();

        NFT nft = NFT(collection.nftContract);
        uint256 tokenId = nft.mint(
            msg.sender,
            tokenURI,
            nftName,
            nftDescription,
            price,
            attributes,
            _collectionId
        );

        collection.mintedSupply++;

        mintedTokens[_collectionId].push(tokenId);

        if (!isOwner[_collectionId][msg.sender]) {
            isOwner[_collectionId][msg.sender] = true;
            collection.owners++;
        }

        uint256 creatorId = i_creatorsContract.getCreatorIdByAddress(
            msg.sender
        );
        i_creatorsContract.recordActivity(creatorId, "NFT Minted", tokenId);

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
        if (_royaltyPercentage > 4000) revert RoyaltyPercentageTooHigh();

        collection.royaltyPercentage = _royaltyPercentage;
        emit RoyaltyPercentageUpdated(_collectionId, _royaltyPercentage);
    }

    function getCollections(
        uint256 _offset,
        uint256 _limit
    ) external view returns (CollectionInfo[] memory) {
        if (_offset >= collectionCounter) revert OffsetOutOfBounds();
        uint256 end = _offset + _limit;
        if (end > collectionCounter) {
            end = collectionCounter;
        }
        uint256 length = end - _offset;
        CollectionInfo[] memory result = new CollectionInfo[](length);
        for (uint256 i = 0; i < length; i++) {
            result[i] = collections[_offset + i + 1];
        }
        return result;
    }

    function getCollectionInfo(
        uint256 _collectionId
    )
        external
        view
        returns (
            address collectionAddress,
            address creator,
            address currentOwner,
            string memory name,
            string memory description,
            address nftContract,
            uint256 maxSupply,
            uint256 mintedSupply,
            uint256 royaltyPercentage,
            uint256 floorPrice,
            uint256 owners,
            bool isActive
        )
    {
        if (_collectionId == 0 || _collectionId > collectionCounter)
            revert InvalidCollectionID();
        CollectionInfo storage collection = collections[_collectionId];
        return (
            collection.collectionAddress,
            collection.creator,
            collection.currentOwner,
            collection.name,
            collection.description,
            collection.nftContract,
            collection.maxSupply,
            collection.mintedSupply,
            collection.royaltyPercentage,
            collection.floorPrice,
            collection.owners,
            collection.isActive
        );
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

        uint256 creatorId = i_creatorsContract.getCreatorIdByAddress(
            msg.sender
        );
        i_creatorsContract.updateCollectionOffer(
            creatorId,
            _collectionId,
            msg.value,
            nftCount,
            expirationTime
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

        uint256 creatorId = i_creatorsContract.getCreatorIdByAddress(
            msg.sender
        );
        i_creatorsContract.removeCollectionOffer(creatorId, _collectionId);
        i_creatorsContract.recordActivity(
            creatorId,
            "Collection Offer Withdrawn",
            0
        );

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

        uint256 sellerCreatorId = i_creatorsContract.getCreatorIdByAddress(
            msg.sender
        );
        uint256 offererCreatorId = i_creatorsContract.getCreatorIdByAddress(
            offerer
        );
        i_creatorsContract.removeCollectionOffer(
            offererCreatorId,
            _collectionId
        );

        i_creatorsContract.recordActivity(
            sellerCreatorId,
            "Collection Offer Accepted",
            0
        );
        i_creatorsContract.recordActivity(
            offererCreatorId,
            "Collection Offer Fulfilled",
            0
        );

        emit CollectionOfferAccepted(
            _collectionId,
            tokenIds,
            msg.sender,
            offerer,
            offer.amount
        );

        delete collectionOffers[_collectionId][offerer];
    }

    // function deactivateCollection(uint256 _collectionId) external {
    //     CollectionInfo storage collection = collections[_collectionId];
    //     require(collection.isActive, "Collection is not active");
    //     require(
    //         msg.sender == collection.currentOwner,
    //         "Only current owner can deactivate"
    //     );

    //     collection.isActive = false;
    //     emit CollectionDeactivated(_collectionId);
    // }

    function _updateOwnership(
        uint256 _collectionId,
        address from,
        address to
    ) internal {
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
