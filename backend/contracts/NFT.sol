// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFT is ERC721URIStorage, Ownable {
    uint256 private _tokenIds;

    enum NFTStatus {
        NONE,
        SALE,
        AUCTION,
        BOTH
    }

    struct Metadata {
        string name;
        string description;
        string externalUrl;
        uint256 creationDate;
        address creator;
        mapping(string => string) attributes;
    }

    struct Activity {
        string action;
        uint256 value;
        uint256 timestamp;
    }

    mapping(uint256 => Metadata) private _tokenMetadata;
    mapping(uint256 => NFTStatus) public nftStatus;
    mapping(uint256 => Activity[]) public nftActivities;
    mapping(uint256 => address) public collection;

    constructor(
        string memory name,
        string memory symbol,
        address collectionAddress
    ) ERC721(name, symbol) Ownable(collectionAddress) {}

    function exists(uint256 tokenId) public view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    function mint(
        address to,
        string memory tokenURI,
        string memory name,
        string memory description,
        string memory externalUrl
    ) public onlyOwner returns (uint256) {
        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        Metadata storage metadata = _tokenMetadata[newTokenId];
        metadata.name = name;
        metadata.description = description;
        metadata.externalUrl = externalUrl;
        metadata.creationDate = block.timestamp;
        metadata.creator = to;

        nftStatus[newTokenId] = NFTStatus.NONE;
        collection[newTokenId] = msg.sender;
        addActivity(newTokenId, "Minted", 0, block.timestamp);

        return newTokenId;
    }

    function addAttribute(
        uint256 tokenId,
        string memory key,
        string memory value
    ) public onlyOwner {
        require(exists(tokenId), "NFT: Attribute set for nonexistent token");
        _tokenMetadata[tokenId].attributes[key] = value;
    }

    function getMetadata(
        uint256 tokenId
    )
        public
        view
        returns (
            string memory name,
            string memory description,
            string memory externalUrl,
            uint256 creationDate,
            address creator
        )
    {
        require(exists(tokenId), "NFT: Metadata query for nonexistent token");
        Metadata storage metadata = _tokenMetadata[tokenId];
        return (
            metadata.name,
            metadata.description,
            metadata.externalUrl,
            metadata.creationDate,
            metadata.creator
        );
    }

    function getAttribute(
        uint256 tokenId,
        string memory key
    ) public view returns (string memory) {
        require(exists(tokenId), "NFT: Attribute query for nonexistent token");
        return _tokenMetadata[tokenId].attributes[key];
    }

    function setNFTStatus(uint256 tokenId, NFTStatus status) external {
        require(exists(tokenId), "NFT: Status set for nonexistent token");
        require(
            msg.sender == ownerOf(tokenId) || msg.sender == owner(),
            "NFT: Only owner or contract owner can set status"
        );
        nftStatus[tokenId] = status;
    }

    function addActivity(
        uint256 tokenId,
        string memory action,
        uint256 value,
        uint256 timestamp
    ) public {
        require(exists(tokenId), "NFT: Activity added for nonexistent token");
        require(
            msg.sender == ownerOf(tokenId) || msg.sender == owner(),
            "NFT: Only owner or contract owner can add activity"
        );
        nftActivities[tokenId].push(Activity(action, value, timestamp));
    }

    function getActivities(
        uint256 tokenId
    ) public view returns (Activity[] memory) {
        require(exists(tokenId), "NFT: Activities query for nonexistent token");
        return nftActivities[tokenId];
    }

    function getCollection(uint256 tokenId) public view returns (address) {
        require(exists(tokenId), "NFT: Collection query for nonexistent token");
        return collection[tokenId];
    }
}
