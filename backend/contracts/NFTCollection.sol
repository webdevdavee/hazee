// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./NFT.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract NFTCollection is Ownable, ReentrancyGuard {
    string public name;
    string public description;
    address public nftContract;
    uint256 public maxSupply;
    uint256 public mintedSupply;
    uint256 public royaltyPercentage;
    uint256 public floorPrice;
    uint256 public owners;
    address public collectionCreator;

    struct CollectionOffer {
        address offerer;
        uint256 amount;
        uint256 nftCount;
        uint256 timestamp;
        bool isActive;
    }

    mapping(address => CollectionOffer) public collectionOffers;
    mapping(address => bool) private _isOwner;

    uint256[] public mintedTokens;
    mapping(uint256 => uint256) public tokenIdToIndex;

    event NFTMinted(uint256 tokenId, address owner);
    event CollectionOfferPlaced(
        address offerer,
        uint256 amount,
        uint256 nftCount
    );
    event CollectionOfferWithdrawn(address offerer, uint256 amount);
    event CollectionOfferAccepted(
        uint256[] tokenIds,
        address seller,
        address buyer,
        uint256 amount
    );
    event FloorPriceUpdated(uint256 newFloorPrice);
    event RoyaltyPercentageUpdated(uint256 newRoyaltyPercentage);

    constructor(
        string memory _name,
        string memory _description,
        uint256 _maxSupply,
        uint256 _royaltyPercentage,
        uint256 _floorPrice
    ) Ownable(msg.sender) {
        require(
            _royaltyPercentage <= 4000,
            "Royalty percentage must be 40% or less"
        );
        name = _name;
        description = _description;
        maxSupply = _maxSupply;
        royaltyPercentage = _royaltyPercentage;
        floorPrice = _floorPrice;
        collectionCreator = msg.sender;

        NFT newNFTContract = new NFT(_name, "NFT", address(this));
        nftContract = address(newNFTContract);
    }

    function mintNFT(
        string memory tokenURI,
        string memory nftName,
        string memory nftDescription,
        string memory externalUrl
    ) public onlyOwner returns (uint256) {
        require(mintedSupply < maxSupply, "Maximum supply reached");

        NFT nft = NFT(nftContract);
        mintedSupply++;
        uint256 tokenId = nft.mint(
            msg.sender,
            tokenURI,
            nftName,
            nftDescription,
            externalUrl
        );

        mintedTokens.push(tokenId);
        tokenIdToIndex[tokenId] = mintedTokens.length - 1;

        if (!_isOwner[msg.sender]) {
            _isOwner[msg.sender] = true;
            owners++;
        }

        emit NFTMinted(tokenId, msg.sender);
        return tokenId;
    }

    function getMintedNFTs() public view returns (uint256[] memory) {
        return mintedTokens;
    }

    function updateFloorPrice(uint256 _floorPrice) public onlyOwner {
        floorPrice = _floorPrice;
        emit FloorPriceUpdated(_floorPrice);
    }

    function updateRoyaltyPercentage(
        uint256 _royaltyPercentage
    ) public onlyOwner {
        require(
            _royaltyPercentage <= 4000,
            "Royalty percentage must be 40% or less"
        );
        royaltyPercentage = _royaltyPercentage;
        emit RoyaltyPercentageUpdated(_royaltyPercentage);
    }

    function placeCollectionOffer(
        uint256 nftCount
    ) public payable nonReentrant {
        require(
            msg.value >= floorPrice * nftCount,
            "Offer must be at least floor price * nftCount"
        );
        require(nftCount > 0 && nftCount <= mintedSupply, "Invalid NFT count");

        CollectionOffer storage existingOffer = collectionOffers[msg.sender];
        if (existingOffer.isActive) {
            payable(msg.sender).transfer(existingOffer.amount);
        }

        collectionOffers[msg.sender] = CollectionOffer(
            msg.sender,
            msg.value,
            nftCount,
            block.timestamp,
            true
        );

        emit CollectionOfferPlaced(msg.sender, msg.value, nftCount);
    }

    function withdrawCollectionOffer() public nonReentrant {
        CollectionOffer storage offer = collectionOffers[msg.sender];
        require(offer.isActive, "No active collection offer");

        uint256 amount = offer.amount;
        offer.isActive = false;

        payable(msg.sender).transfer(amount);

        emit CollectionOfferWithdrawn(msg.sender, amount);
    }

    function acceptCollectionOffer(
        uint256[] memory tokenIds,
        address offerer
    ) public nonReentrant {
        CollectionOffer memory offer = collectionOffers[offerer];
        require(offer.isActive, "No active collection offer from this address");
        require(tokenIds.length == offer.nftCount, "Invalid number of tokens");

        NFT nft = NFT(nftContract);
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(
                nft.ownerOf(tokenIds[i]) == msg.sender,
                "You don't own all the specified tokens"
            );
        }

        uint256 royaltyAmount = (offer.amount * royaltyPercentage) / 10000;
        uint256 sellerProceeds = offer.amount - royaltyAmount;

        payable(collectionCreator).transfer(royaltyAmount);
        payable(msg.sender).transfer(sellerProceeds);

        for (uint256 i = 0; i < tokenIds.length; i++) {
            nft.safeTransferFrom(msg.sender, offerer, tokenIds[i]);
            _updateOwnership(msg.sender, offerer);
        }

        emit CollectionOfferAccepted(
            tokenIds,
            msg.sender,
            offerer,
            offer.amount
        );

        delete collectionOffers[offerer];
    }

    function _updateOwnership(address from, address to) internal {
        if (from != address(0) && _isOwner[from]) {
            bool stillOwner = false;
            NFT nft = NFT(nftContract);
            for (uint256 i = 0; i < mintedTokens.length; i++) {
                if (nft.ownerOf(mintedTokens[i]) == from) {
                    stillOwner = true;
                    break;
                }
            }
            if (!stillOwner) {
                _isOwner[from] = false;
                owners--;
            }
        }
        if (to != address(0) && !_isOwner[to]) {
            _isOwner[to] = true;
            owners++;
        }
    }

    receive() external payable {}

    fallback() external payable {}
}
