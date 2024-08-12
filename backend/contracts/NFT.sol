// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFT is ERC721URIStorage, Ownable {
    uint256 private _tokenIds;

    struct Metadata {
        string name;
        string description;
        string externalUrl;
        uint256 creationDate;
        mapping(string => string) attributes;
    }

    mapping(uint256 => Metadata) private _tokenMetadata;

    constructor(
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) Ownable(msg.sender) {}

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
            uint256 creationDate
        )
    {
        require(exists(tokenId), "NFT: Metadata query for nonexistent token");
        Metadata storage metadata = _tokenMetadata[tokenId];
        return (
            metadata.name,
            metadata.description,
            metadata.externalUrl,
            metadata.creationDate
        );
    }

    function getAttribute(
        uint256 tokenId,
        string memory key
    ) public view returns (string memory) {
        require(exists(tokenId), "NFT: Attribute query for nonexistent token");
        return _tokenMetadata[tokenId].attributes[key];
    }
}
