// SPDX-License-Identifier: MIT
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

    struct Bid {
        address bidder;
        uint256 amount;
        uint256 timestamp;
    }

    struct CollectionOffer {
        address offerer;
        uint256 amount;
        uint256 timestamp;
        bool isActive;
    }

    mapping(uint256 => Bid) public highestBids;
    mapping(address => mapping(uint256 => uint256)) public pendingReturns;
    mapping(address => CollectionOffer) public collectionOffers;

    uint256[] public mintedTokens;
    mapping(uint256 => uint256) public tokenIdToIndex;

    event NFTMinted(uint256 tokenId, address owner);
    event BidPlaced(uint256 tokenId, address bidder, uint256 amount);
    event BidWithdrawn(uint256 tokenId, address bidder, uint256 amount);
    event BidAccepted(
        uint256 tokenId,
        address seller,
        address buyer,
        uint256 amount
    );
    event CollectionOfferPlaced(address offerer, uint256 amount);
    event CollectionOfferWithdrawn(address offerer, uint256 amount);
    event CollectionOfferAccepted(
        uint256 tokenId,
        address seller,
        address buyer,
        uint256 amount
    );
    event FloorPriceUpdated(uint256 newFloorPrice);

    constructor(
        string memory _name,
        string memory _description,
        uint256 _maxSupply,
        uint256 _royaltyPercentage,
        uint256 _floorPrice
    ) Ownable(msg.sender) {
        require(
            _royaltyPercentage <= 10000,
            "Royalty percentage must be between 0 and 100%"
        );
        name = _name;
        description = _description;
        maxSupply = _maxSupply;
        royaltyPercentage = _royaltyPercentage;
        floorPrice = _floorPrice;

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
        mintedSupply++;
        uint256 tokenId = nft.mint(
            to,
            tokenURI,
            nftName,
            nftDescription,
            externalUrl
        );

        mintedTokens.push(tokenId);
        tokenIdToIndex[tokenId] = mintedTokens.length - 1;

        emit NFTMinted(tokenId, to);
        return tokenId;
    }

    function getMintedNFTs() public view returns (uint256[] memory) {
        return mintedTokens;
    }

    function updateFloorPrice(uint256 _floorPrice) public onlyOwner {
        floorPrice = _floorPrice;
        emit FloorPriceUpdated(_floorPrice);
    }

    function placeBid(uint256 tokenId) public payable nonReentrant {
        require(msg.value > floorPrice, "Bid must be higher than floor price");
        require(tokenId <= mintedSupply, "Token does not exist");

        Bid storage highestBid = highestBids[tokenId];
        require(
            msg.value > highestBid.amount,
            "Bid must be higher than current highest bid"
        );

        if (highestBid.amount != 0) {
            pendingReturns[highestBid.bidder][tokenId] += highestBid.amount;
        }

        highestBids[tokenId] = Bid(msg.sender, msg.value, block.timestamp);

        emit BidPlaced(tokenId, msg.sender, msg.value);
    }

    function withdrawBid(uint256 tokenId) public nonReentrant {
        uint256 amount = pendingReturns[msg.sender][tokenId];
        require(amount > 0, "No funds to withdraw");

        pendingReturns[msg.sender][tokenId] = 0;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit BidWithdrawn(tokenId, msg.sender, amount);
    }

    function acceptBid(uint256 tokenId) public nonReentrant {
        require(tokenId <= mintedSupply, "Token does not exist");
        NFT nft = NFT(nftContract);
        require(
            msg.sender == nft.ownerOf(tokenId),
            "Only the token owner can accept bids"
        );

        Bid memory highestBid = highestBids[tokenId];
        require(highestBid.amount > 0, "No active bid to accept");

        uint256 royaltyAmount = (highestBid.amount * royaltyPercentage) / 10000;
        uint256 sellerProceeds = highestBid.amount - royaltyAmount;

        (bool royaltySuccess, ) = owner().call{value: royaltyAmount}("");
        require(royaltySuccess, "Royalty transfer failed");

        (bool sellerSuccess, ) = msg.sender.call{value: sellerProceeds}("");
        require(sellerSuccess, "Seller proceeds transfer failed");

        nft.safeTransferFrom(msg.sender, highestBid.bidder, tokenId);

        emit BidAccepted(
            tokenId,
            msg.sender,
            highestBid.bidder,
            highestBid.amount
        );

        delete highestBids[tokenId];
    }

    function placeCollectionOffer() public payable nonReentrant {
        require(
            msg.value > floorPrice,
            "Offer must be higher than floor price"
        );

        CollectionOffer storage existingOffer = collectionOffers[msg.sender];
        if (existingOffer.isActive) {
            pendingReturns[msg.sender][0] += existingOffer.amount;
        }

        collectionOffers[msg.sender] = CollectionOffer(
            msg.sender,
            msg.value,
            block.timestamp,
            true
        );

        emit CollectionOfferPlaced(msg.sender, msg.value);
    }

    function withdrawCollectionOffer() public nonReentrant {
        CollectionOffer storage offer = collectionOffers[msg.sender];
        require(offer.isActive, "No active collection offer");

        uint256 amount = offer.amount;
        offer.isActive = false;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit CollectionOfferWithdrawn(msg.sender, amount);
    }

    function acceptCollectionOffer(
        uint256 tokenId,
        address offerer
    ) public nonReentrant {
        require(tokenId <= mintedSupply, "Token does not exist");
        NFT nft = NFT(nftContract);
        require(
            msg.sender == nft.ownerOf(tokenId),
            "Only the token owner can accept offers"
        );

        CollectionOffer memory offer = collectionOffers[offerer];
        require(offer.isActive, "No active collection offer from this address");

        uint256 royaltyAmount = (offer.amount * royaltyPercentage) / 10000;
        uint256 sellerProceeds = offer.amount - royaltyAmount;

        (bool royaltySuccess, ) = owner().call{value: royaltyAmount}("");
        require(royaltySuccess, "Royalty transfer failed");

        (bool sellerSuccess, ) = msg.sender.call{value: sellerProceeds}("");
        require(sellerSuccess, "Seller proceeds transfer failed");

        nft.safeTransferFrom(msg.sender, offerer, tokenId);

        emit CollectionOfferAccepted(
            tokenId,
            msg.sender,
            offerer,
            offer.amount
        );

        delete collectionOffers[offerer];
    }

    function getHighestBid(
        uint256 tokenId
    ) public view returns (address, uint256, uint256) {
        Bid memory bid = highestBids[tokenId];
        return (bid.bidder, bid.amount, bid.timestamp);
    }

    function getCollectionOffer(
        address offerer
    ) public view returns (address, uint256, uint256, bool) {
        CollectionOffer memory offer = collectionOffers[offerer];
        return (offer.offerer, offer.amount, offer.timestamp, offer.isActive);
    }

    receive() external payable {}

    fallback() external payable {}
}
