// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract NFTCreators {
    uint256 private _creatorIds;
    uint256[] private allCreatorIds;

    struct Creator {
        uint256 creatorId;
        address userAddress;
        uint256[] createdNFTs;
        uint256[] ownedNFTs;
        uint256[] favouritedNFTs;
        uint256[] cartedNFTs;
        uint256[] createdCollections;
        uint256 itemsSold;
        uint256 walletBalance;
    }

    struct Activity {
        string actionType;
        uint256 timestamp;
        uint256 relatedItemId;
    }

    struct CollectionOffer {
        uint256 amount;
        uint256 nftCount;
        uint256 timestamp;
        uint256 expirationTime;
        bool isActive;
    }

    mapping(address => mapping(uint256 => CollectionOffer))
        public creatorCollectionOffers;

    mapping(address => uint256) public creatorIdByAddress;
    mapping(uint256 => Creator) public creators;
    mapping(address => Activity[]) public creatorActivities;
    mapping(address => mapping(uint256 => uint256)) public creatorOffers;
    mapping(address => mapping(uint256 => uint256)) public creatorBids;

    event CreatorRegistered(address indexed creatorAddress, uint256 creatorId);
    event NFTCreated(address indexed creator, uint256 tokenId);
    event CollectionCreated(address indexed creator, uint256 collectionId);
    event ActivityRecorded(
        address indexed creator,
        string actionType,
        uint256 relatedItemId
    );

    function registerCreator(address _creator) public returns (uint256) {
        require(
            creatorIdByAddress[_creator] == 0,
            "Creator already registered"
        );
        _creatorIds++;
        uint256 newCreatorId = _creatorIds;
        creatorIdByAddress[_creator] = newCreatorId;
        creators[newCreatorId] = Creator({
            creatorId: newCreatorId,
            userAddress: _creator,
            createdNFTs: new uint256[](0),
            ownedNFTs: new uint256[](0),
            favouritedNFTs: new uint256[](0),
            cartedNFTs: new uint256[](0),
            createdCollections: new uint256[](0),
            itemsSold: 0,
            walletBalance: 0
        });
        allCreatorIds.push(newCreatorId);
        emit CreatorRegistered(_creator, newCreatorId);
        return newCreatorId;
    }

    function addCreatedNFT(address creator, uint256 tokenId) external {
        uint256 creatorId = creatorIdByAddress[creator];
        require(creatorId != 0, "Creator not registered");
        creators[creatorId].createdNFTs.push(tokenId);
        creators[creatorId].ownedNFTs.push(tokenId);
        emit NFTCreated(creator, tokenId);
        recordActivity(creator, "NFT Created", tokenId);
    }

    function addCreatedCollection(
        address creator,
        uint256 collectionId
    ) external {
        uint256 creatorId = creatorIdByAddress[creator];
        require(creatorId != 0, "Creator not registered");
        creators[creatorId].createdCollections.push(collectionId);
        emit CollectionCreated(creator, collectionId);
        recordActivity(creator, "Collection Created", collectionId);
    }

    function addToFavourites(address user, uint256 tokenId) external {
        uint256 creatorId = creatorIdByAddress[user];
        require(creatorId != 0, "User not registered");
        creators[creatorId].favouritedNFTs.push(tokenId);
        recordActivity(user, "NFT Favourited", tokenId);
    }

    function addToCart(address user, uint256 tokenId) external {
        uint256 creatorId = creatorIdByAddress[user];
        require(creatorId != 0, "User not registered");
        creators[creatorId].cartedNFTs.push(tokenId);
        recordActivity(user, "NFT Added to Cart", tokenId);
    }

    function recordActivity(
        address user,
        string memory actionType,
        uint256 relatedItemId
    ) public {
        creatorActivities[user].push(
            Activity(actionType, block.timestamp, relatedItemId)
        );
        emit ActivityRecorded(user, actionType, relatedItemId);
    }

    function updateCollectionOffer(
        address user,
        uint256 collectionId,
        uint256 offerAmount,
        uint256 nftCount,
        uint256 expirationTime
    ) external {
        creatorCollectionOffers[user][collectionId] = CollectionOffer(
            offerAmount,
            nftCount,
            block.timestamp,
            expirationTime,
            true
        );
        recordActivity(user, "Collection Offer Placed", collectionId);
    }

    function removeCollectionOffer(
        address user,
        uint256 collectionId
    ) external {
        require(creatorIdByAddress[user] != 0, "User not registered");
        require(
            creatorCollectionOffers[user][collectionId].isActive,
            "No active offer for this collection"
        );

        delete creatorCollectionOffers[user][collectionId];
        recordActivity(user, "Collection Offer Removed", collectionId);
    }

    function updateBid(
        address user,
        uint256 auctionId,
        uint256 bidAmount
    ) external {
        creatorBids[user][auctionId] = bidAmount;
        recordActivity(user, "Bid Placed", auctionId);
    }

    function updateItemsSold(address seller) external {
        uint256 creatorId = creatorIdByAddress[seller];
        require(creatorId != 0, "Seller not registered");
        creators[creatorId].itemsSold++;
        recordActivity(seller, "Item Sold", creators[creatorId].itemsSold);
    }

    function updateWalletBalance(address user, uint256 newBalance) external {
        uint256 creatorId = creatorIdByAddress[user];
        require(creatorId != 0, "User not registered");
        creators[creatorId].walletBalance = newBalance;
    }

    function getCreatorInfo(
        address user
    ) external view returns (Creator memory) {
        uint256 creatorId = creatorIdByAddress[user];
        require(creatorId != 0, "User not registered");
        return creators[creatorId];
    }

    function getCreatorActivities(
        address user
    ) external view returns (Activity[] memory) {
        return creatorActivities[user];
    }

    function getCreatorId(address user) external view returns (uint256) {
        return creatorIdByAddress[user];
    }
}
