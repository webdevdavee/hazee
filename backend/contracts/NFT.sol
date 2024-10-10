// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./NFTCreators.sol";
import "./NFTAuction.sol";

contract NFT is ERC721URIStorage, Ownable {
    uint256 private _tokenIds;
    NFTCreators public creatorsContract;
    address public auctionContract;
    address public marketplaceContract;

    enum NFTStatus {
        NONE,
        SALE,
        AUCTION,
        BOTH
    }

    struct Activity {
        string action;
        uint256 value;
        uint256 timestamp;
    }

    mapping(uint256 => NFTStatus) private _tokenStatus;
    mapping(uint256 => uint256) public tokenPrices;
    mapping(uint256 => Activity[]) public nftActivities;
    mapping(uint256 => uint256) public collection;

    event NFTMinted(uint256 tokenId, address creator);
    event NFTStatusChanged(uint256 tokenId, NFTStatus newStatus);
    event NFTActivityAdded(uint256 tokenId, string action, uint256 value);
    event PriceSet(uint256 tokenId, uint256 price);
    event PriceUpdated(uint256 tokenId, uint256 newPrice);

    constructor(
        string memory name,
        string memory symbol,
        address _creatorsAddress,
        address _auctionContractAddress,
        address _marketplaceContractAddress
    ) ERC721(name, symbol) Ownable(msg.sender) {
        creatorsContract = NFTCreators(_creatorsAddress);
        auctionContract = _auctionContractAddress;
        marketplaceContract = _marketplaceContractAddress;
    }

    function exists(uint256 tokenId) public view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    function setAuctionContract(address _auctionContract) external {
        auctionContract = _auctionContract;
    }

    function mint(
        address to,
        string memory tokenURI,
        uint256 price,
        uint256 _collectionId
    ) public returns (uint256) {
        uint256 creatorId = creatorsContract.getCreatorIdByAddress(to);
        require(creatorId != 0, "Creator not registered");

        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        tokenPrices[newTokenId] = price;
        _tokenStatus[newTokenId] = NFTStatus.NONE;
        collection[newTokenId] = _collectionId;

        _addActivity(newTokenId, "Minted", 0);
        creatorsContract.addCreatedNFT(creatorId, newTokenId);

        emit NFTMinted(newTokenId, to);
        emit PriceSet(newTokenId, price);

        return newTokenId;
    }

    function setNFTStatus(uint256 tokenId, NFTStatus status) external {
        require(exists(tokenId), "NFT: Status set for nonexistent token");
        require(
            msg.sender == ownerOf(tokenId) ||
                msg.sender == owner() ||
                msg.sender == auctionContract ||
                msg.sender == marketplaceContract,
            "NFT: Only owner, contract owner, auction contract or marketplace contract can set status"
        );
        _tokenStatus[tokenId] = status;
        _addActivity(tokenId, "Status Changed", uint256(status));
        emit NFTStatusChanged(tokenId, status);
    }

    function _addActivity(
        uint256 tokenId,
        string memory action,
        uint256 value
    ) public {
        uint256 timestamp = block.timestamp;
        nftActivities[tokenId].push(Activity(action, value, timestamp));

        uint256 creatorId = creatorsContract.getCreatorIdByAddress(
            ownerOf(tokenId)
        );
        creatorsContract.recordActivity(creatorId, action, tokenId);

        emit NFTActivityAdded(tokenId, action, value);
    }

    function getActivities(
        uint256 tokenId
    ) public view returns (Activity[] memory) {
        require(exists(tokenId), "NFT: Activities query for nonexistent token");
        return nftActivities[tokenId];
    }

    function setPrice(uint256 tokenId, uint256 price) external {
        require(exists(tokenId), "NFT: Price set for nonexistent token");
        require(
            msg.sender == ownerOf(tokenId),
            "NFT: Only owner can set price"
        );
        tokenPrices[tokenId] = price;
        _addActivity(tokenId, "Price Set", price);
        emit PriceSet(tokenId, price);
    }

    function updatePrice(uint256 tokenId, uint256 newPrice) external {
        require(exists(tokenId), "NFT: Price update for nonexistent token");
        require(
            msg.sender == ownerOf(tokenId),
            "NFT: Only owner can update price"
        );
        tokenPrices[tokenId] = newPrice;
        _addActivity(tokenId, "Price Updated", newPrice);
        emit PriceUpdated(tokenId, newPrice);
    }

    function getPrice(uint256 tokenId) public view returns (uint256) {
        require(exists(tokenId), "NFT: Price query for nonexistent token");
        return tokenPrices[tokenId];
    }

    function getCollection(uint256 tokenId) public view returns (uint256) {
        require(exists(tokenId), "NFT: Collection query for nonexistent token");
        return collection[tokenId];
    }

    function getTokenStatus(uint256 tokenId) public view returns (NFTStatus) {
        require(exists(tokenId), "NFT: Status query for nonexistent token");
        return _tokenStatus[tokenId];
    }
}
