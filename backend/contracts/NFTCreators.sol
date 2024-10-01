// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

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

    mapping(uint256 => mapping(uint256 => CollectionOffer))
        public creatorCollectionOffers;

    mapping(uint256 => Creator) public creators;
    mapping(uint256 => Activity[]) public creatorActivities;
    mapping(uint256 => mapping(uint256 => uint256)) public creatorOffers;
    mapping(uint256 => mapping(uint256 => uint256)) public creatorBids;
    mapping(address => uint256) public creatorIdByAddress;

    event CreatorRegistered(address indexed creator, uint256 creatorId);
    event NFTCreated(uint256 indexed creatorId, uint256 tokenId);
    event CollectionCreated(uint256 indexed creatorId, uint256 collectionId);
    event ActivityRecorded(
        uint256 indexed creatorId,
        string actionType,
        uint256 relatedItemId
    );

    function registerCreator() public returns (uint256) {
        require(
            creatorIdByAddress[msg.sender] == 0,
            "Creator already registered"
        );
        _creatorIds++;
        uint256 newCreatorId = _creatorIds;
        creatorIdByAddress[msg.sender] = newCreatorId;
        creators[newCreatorId] = Creator({
            creatorId: newCreatorId,
            userAddress: msg.sender,
            createdNFTs: new uint256[](0),
            ownedNFTs: new uint256[](0),
            favouritedNFTs: new uint256[](0),
            cartedNFTs: new uint256[](0),
            createdCollections: new uint256[](0),
            itemsSold: 0,
            walletBalance: 0
        });
        allCreatorIds.push(newCreatorId);
        emit CreatorRegistered(msg.sender, newCreatorId);
        return newCreatorId;
    }

    function addCreatedNFT(uint256 creatorId, uint256 tokenId) external {
        require(creatorId != 0, "Creator not registered");
        creators[creatorId].createdNFTs.push(tokenId);
        creators[creatorId].ownedNFTs.push(tokenId);
        emit NFTCreated(creatorId, tokenId);
        recordActivity(creatorId, "NFT Created", tokenId);
    }

    function addOwnedNFT(uint256 creatorId, uint256 tokenId) external {
        require(creatorId != 0, "Creator not registered");
        creators[creatorId].ownedNFTs.push(tokenId);
        recordActivity(creatorId, "NFT Owned", tokenId);
    }

    function addCreatedCollection(
        uint256 creatorId,
        uint256 collectionId
    ) external {
        require(creatorId != 0, "Creator not registered");
        creators[creatorId].createdCollections.push(collectionId);
        emit CollectionCreated(creatorId, collectionId);
        recordActivity(creatorId, "Collection Created", collectionId);
    }

    function addToFavourites(uint256 creatorId, uint256 tokenId) external {
        require(creatorId != 0, "User not registered");
        creators[creatorId].favouritedNFTs.push(tokenId);
        recordActivity(creatorId, "NFT Favourited", tokenId);
    }

    function addToCart(uint256 creatorId, uint256 tokenId) external {
        require(creatorId != 0, "User not registered");
        creators[creatorId].cartedNFTs.push(tokenId);
        recordActivity(creatorId, "NFT Added to Cart", tokenId);
    }

    function recordActivity(
        uint256 creatorId,
        string memory actionType,
        uint256 relatedItemId
    ) public {
        creatorActivities[creatorId].push(
            Activity(actionType, block.timestamp, relatedItemId)
        );
        emit ActivityRecorded(creatorId, actionType, relatedItemId);
    }

    function updateCollectionOffer(
        uint256 creatorId,
        uint256 collectionId,
        uint256 offerAmount,
        uint256 nftCount,
        uint256 expirationTime
    ) external {
        require(creatorId != 0, "User not registered");
        creatorCollectionOffers[creatorId][collectionId] = CollectionOffer(
            offerAmount,
            nftCount,
            block.timestamp,
            expirationTime,
            true
        );
        recordActivity(creatorId, "Collection Offer Placed", collectionId);
    }

    function removeCollectionOffer(
        uint256 creatorId,
        uint256 collectionId
    ) external {
        require(creatorId != 0, "User not registered");
        require(
            creatorCollectionOffers[creatorId][collectionId].isActive,
            "No active offer for this collection"
        );

        delete creatorCollectionOffers[creatorId][collectionId];
        recordActivity(creatorId, "Collection Offer Removed", collectionId);
    }

    function updateBid(
        uint256 creatorId,
        uint256 auctionId,
        uint256 bidAmount
    ) external {
        require(creatorId != 0, "User not registered");
        creatorBids[creatorId][auctionId] = bidAmount;
        recordActivity(creatorId, "Bid Placed", auctionId);
    }

    function updateItemsSold(uint256 creatorId) external {
        require(creatorId != 0, "Seller not registered");
        creators[creatorId].itemsSold++;
        recordActivity(creatorId, "Item Sold", creators[creatorId].itemsSold);
    }

    function updateWalletBalance(
        uint256 creatorId,
        uint256 newBalance
    ) external {
        require(creatorId != 0, "User not registered");
        creators[creatorId].walletBalance = newBalance;
    }

    function getAllCreators() external view returns (Creator[] memory) {
        Creator[] memory allCreators = new Creator[](allCreatorIds.length);

        for (uint256 i = 0; i < allCreatorIds.length; i++) {
            uint256 creatorId = allCreatorIds[i];
            allCreators[i] = creators[creatorId];
        }

        return allCreators;
    }

    function getCreatorInfo(
        uint256 creatorId
    ) external view returns (Creator memory) {
        require(creatorId != 0, "User not registered");
        return creators[creatorId];
    }

    function getCreatorActivities(
        uint256 creatorId
    ) external view returns (Activity[] memory) {
        return creatorActivities[creatorId];
    }

    function getCreatorIdByAddress(
        address user
    ) external view returns (uint256) {
        return creatorIdByAddress[user];
    }
}
