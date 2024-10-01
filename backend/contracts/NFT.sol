// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./NFTCreators.sol";

contract NFT is ERC721URIStorage, Ownable {
    uint256 private _tokenIds;
    NFTCreators public creatorsContract;
    address public auctionContract;

    enum NFTStatus {
        NONE,
        SALE,
        AUCTION,
        BOTH
    }

    struct Attribute {
        string key;
        string value;
    }

    struct Metadata {
        uint256 tokenId;
        string name;
        string description;
        uint256 creationDate;
        address creator;
        uint256 price;
        NFTStatus status;
        Attribute[] attributes;
    }

    struct Activity {
        string action;
        uint256 value;
        uint256 timestamp;
    }

    mapping(uint256 => Metadata) private _tokenMetadata;
    mapping(uint256 => Activity[]) public nftActivities;
    mapping(uint256 => uint256) public collection;

    event NFTMinted(uint256 tokenId, address creator, string name);
    event NFTStatusChanged(uint256 tokenId, NFTStatus newStatus);
    event NFTActivityAdded(uint256 tokenId, string action, uint256 value);

    constructor(
        string memory name,
        string memory symbol,
        address _creatorsAddress
    ) ERC721(name, symbol) Ownable(msg.sender) {
        creatorsContract = NFTCreators(_creatorsAddress);
    }

    function exists(uint256 tokenId) public view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    function setAuctionContract(address _auctionContract) external onlyOwner {
        auctionContract = _auctionContract;
    }

    function mint(
        address to,
        string memory tokenURI,
        string memory name,
        string memory description,
        uint256 price,
        Attribute[] memory attributes,
        uint256 _collectionId
    ) public returns (uint256) {
        uint256 creatorId = creatorsContract.getCreatorIdByAddress(to);
        require(creatorId != 0, "Creator not registered");

        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        _tokenMetadata[newTokenId] = Metadata({
            tokenId: newTokenId,
            name: name,
            description: description,
            creationDate: block.timestamp,
            creator: to,
            price: price,
            status: NFTStatus.NONE,
            attributes: attributes
        });

        collection[newTokenId] = _collectionId;
        addActivity(newTokenId, "Minted", 0);

        creatorsContract.addCreatedNFT(creatorId, newTokenId);

        emit NFTMinted(newTokenId, to, name);

        return newTokenId;
    }

    function getMetadata(
        uint256 tokenId
    )
        public
        view
        returns (
            uint256 theTokenId,
            string memory name,
            string memory description,
            uint256 creationDate,
            address creator,
            uint256 price,
            NFTStatus status,
            Attribute[] memory attributes
        )
    {
        require(exists(tokenId), "NFT: Metadata query for nonexistent token");
        Metadata storage tokenMetadata = _tokenMetadata[tokenId];
        return (
            tokenMetadata.tokenId,
            tokenMetadata.name,
            tokenMetadata.description,
            tokenMetadata.creationDate,
            tokenMetadata.creator,
            tokenMetadata.price,
            tokenMetadata.status,
            tokenMetadata.attributes
        );
    }

    function getCollection(uint256 tokenId) public view returns (uint256) {
        require(exists(tokenId), "NFT: Collection query for nonexistent token");
        return collection[tokenId];
    }

    function setNFTStatus(uint256 tokenId, NFTStatus status) external {
        require(exists(tokenId), "NFT: Status set for nonexistent token");
        require(
            msg.sender == ownerOf(tokenId) ||
                msg.sender == owner() ||
                msg.sender == auctionContract,
            "NFT: Only owner, contract owner, or auction contract can set status"
        );
        _tokenMetadata[tokenId].status = status;
        emit NFTStatusChanged(tokenId, status);
    }

    function addActivity(
        uint256 tokenId,
        string memory action,
        uint256 value
    ) public {
        require(exists(tokenId), "NFT: Activity added for nonexistent token");
        require(
            msg.sender == ownerOf(tokenId) ||
                msg.sender == owner() ||
                msg.sender == auctionContract,
            "NFT: Only owner, contract owner, or auction contract can add activity"
        );
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

    function updatePrice(uint256 tokenId, uint256 newPrice) external {
        require(exists(tokenId), "NFT: Price update for nonexistent token");
        require(
            msg.sender == ownerOf(tokenId),
            "NFT: Only owner can update price"
        );
        _tokenMetadata[tokenId].price = newPrice;
        addActivity(tokenId, "Price Updated", newPrice);
    }

    function getAllTokens() public view returns (Metadata[] memory) {
        Metadata[] memory allTokens = new Metadata[](_tokenIds);
        for (uint256 i = 1; i <= _tokenIds; i++) {
            if (exists(i)) {
                allTokens[i - 1] = _tokenMetadata[i];
            }
        }
        return allTokens;
    }

    function getTokensByOwner(
        address owner
    ) public view returns (Metadata[] memory) {
        uint256 tokenCount = balanceOf(owner);
        Metadata[] memory ownedTokens = new Metadata[](tokenCount);
        uint256 currentIndex = 0;
        for (uint256 i = 1; i <= _tokenIds; i++) {
            if (exists(i) && ownerOf(i) == owner) {
                ownedTokens[currentIndex] = _tokenMetadata[i];
                currentIndex++;
            }
        }
        return ownedTokens;
    }
}
