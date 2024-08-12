// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./NFT.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTCollection is Ownable {
    string public name;
    string public description;
    address public nftContract;
    uint256 public maxSupply;
    uint256 public mintedSupply;
    uint256 public royaltyPercentage;

    event NFTMinted(uint256 tokenId, address owner);

    constructor(
        string memory _name,
        string memory _description,
        uint256 _maxSupply,
        uint256 _royaltyPercentage
    ) Ownable(msg.sender) {
        require(
            _royaltyPercentage <= 10000,
            "Royalty percentage must be between 0 and 100%"
        );
        name = _name;
        description = _description;
        maxSupply = _maxSupply;
        royaltyPercentage = _royaltyPercentage;

        // Deploy a new NFT contract for this collection
        NFT newNFTContract = new NFT(_name, "NFT");
        nftContract = address(newNFTContract);
    }

    function mintNFT(
        address to,
        string memory tokenURI,
        string memory nftName,
        string memory nftDescription,
        string memory externalUrl
    ) public onlyOwner returns (uint256) {
        require(mintedSupply < maxSupply, "Maximum supply reached");

        NFT nft = NFT(nftContract);
        uint256 tokenId = nft.mint(
            to,
            tokenURI,
            nftName,
            nftDescription,
            externalUrl
        );

        mintedSupply++;
        emit NFTMinted(tokenId, to);
        return tokenId;
    }

    function addAttribute(
        uint256 tokenId,
        string memory key,
        string memory value
    ) public onlyOwner {
        NFT(nftContract).addAttribute(tokenId, key, value);
    }

    function updateRoyaltyPercentage(
        uint256 _royaltyPercentage
    ) public onlyOwner {
        require(
            _royaltyPercentage <= 10000,
            "Royalty percentage must be between 0 and 100%"
        );
        royaltyPercentage = _royaltyPercentage;
    }
}
