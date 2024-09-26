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
        string name;
        string description;
        uint256 creationDate;
        address creator;
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
    mapping(uint256 => Attribute[]) private _tokenAttributes;

    constructor(
        string memory name,
        string memory symbol,
        address _creatorsAddress,
        address _nftAuctionAddress
    ) ERC721(name, symbol) Ownable(msg.sender) {
        creatorsContract = NFTCreators(_creatorsAddress);
        auctionContract = _nftAuctionAddress;
    }

    function exists(uint256 tokenId) public view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    function mint(
        address to,
        string memory tokenURI,
        string memory name,
        string memory description,
        Attribute[] memory attributes
    ) public onlyOwner returns (uint256) {
        uint256 creatorId = creatorsContract.getCreatorIdByAddress(to);
        require(creatorId != 0, "Creator not registered");

        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        _tokenMetadata[newTokenId] = Metadata({
            name: name,
            description: description,
            creationDate: block.timestamp,
            creator: to
        });

        for (uint i = 0; i < attributes.length; i++) {
            _tokenAttributes[newTokenId].push(attributes[i]);
        }

        nftStatus[newTokenId] = NFTStatus.NONE;
        collection[newTokenId] = msg.sender;
        addActivity(newTokenId, "Minted", 0);

        creatorsContract.addCreatedNFT(creatorId, newTokenId);

        return newTokenId;
    }

    function getMetadata(
        uint256 tokenId
    )
        public
        view
        returns (
            string memory name,
            string memory description,
            uint256 creationDate,
            address creator,
            Attribute[] memory attributes
        )
    {
        require(exists(tokenId), "NFT: Metadata query for nonexistent token");
        Metadata storage metadata = _tokenMetadata[tokenId];
        return (
            metadata.name,
            metadata.description,
            metadata.creationDate,
            metadata.creator,
            _tokenAttributes[tokenId]
        );
    }

    function getAttribute(
        uint256 tokenId,
        string memory key
    ) public view returns (string memory) {
        require(exists(tokenId), "NFT: Attribute query for nonexistent token");
        Attribute[] storage attributes = _tokenAttributes[tokenId];
        for (uint i = 0; i < attributes.length; i++) {
            if (keccak256(bytes(attributes[i].key)) == keccak256(bytes(key))) {
                return attributes[i].value;
            }
        }
        return "";
    }

    function setNFTStatus(uint256 tokenId, NFTStatus status) external {
        require(exists(tokenId), "NFT: Status set for nonexistent token");
        require(
            msg.sender == ownerOf(tokenId) ||
                msg.sender == owner() ||
                msg.sender == auctionContract,
            "NFT: Only owner, contract owner, or auction contract can set status"
        );
        nftStatus[tokenId] = status;
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
            "NFT: Only owner or contract owner can add activity"
        );
        uint256 timestamp = block.timestamp;
        nftActivities[tokenId].push(Activity(action, value, timestamp));

        uint256 creatorId = creatorsContract.getCreatorIdByAddress(
            ownerOf(tokenId)
        );
        creatorsContract.recordActivity(creatorId, action, tokenId);
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
