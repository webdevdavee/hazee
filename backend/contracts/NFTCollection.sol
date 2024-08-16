// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./NFT.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./NFTCreators.sol";

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
    uint256 public collectionId;

    uint256 public constant MIN_OFFER_DURATION = 12 hours;
    uint256 public constant MAX_OFFER_DURATION = 1 weeks;

    NFTCreators public creatorsContract;

    struct CollectionOffer {
        address offerer;
        uint256 amount;
        uint256 nftCount;
        uint256 timestamp;
        uint256 expirationTime;
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
        uint256 nftCount,
        uint256 expirationTime
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
        uint256 _floorPrice,
        address _creatorsAddress,
        uint256 _collectionId
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
        creatorsContract = NFTCreators(_creatorsAddress);
        collectionId = _collectionId;

        NFT newNFTContract = new NFT(_name, "NFT", _creatorsAddress);
        nftContract = address(newNFTContract);
    }

    function mintNFT(
        string memory tokenURI,
        string memory nftName,
        string memory nftDescription,
        NFT.Attribute[] memory attributes
    ) public onlyOwner returns (uint256) {
        require(mintedSupply < maxSupply, "Maximum supply reached");

        NFT nft = NFT(nftContract);
        mintedSupply++;
        uint256 tokenId = nft.mint(
            msg.sender,
            tokenURI,
            nftName,
            nftDescription,
            attributes
        );

        mintedTokens.push(tokenId);
        tokenIdToIndex[tokenId] = mintedTokens.length - 1;

        if (!_isOwner[msg.sender]) {
            _isOwner[msg.sender] = true;
            owners++;
        }

        creatorsContract.recordActivity(msg.sender, "NFT Minted", tokenId);

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
        uint256 nftCount,
        uint256 duration
    ) public payable nonReentrant {
        require(
            msg.value >= floorPrice * nftCount,
            "Offer must be at least floor price * nftCount"
        );
        require(nftCount > 0 && nftCount <= mintedSupply, "Invalid NFT count");
        require(
            duration >= MIN_OFFER_DURATION && duration <= MAX_OFFER_DURATION,
            "Invalid offer duration"
        );

        CollectionOffer storage existingOffer = collectionOffers[msg.sender];
        if (existingOffer.isActive) {
            payable(msg.sender).transfer(existingOffer.amount);
        }

        uint256 expirationTime = block.timestamp + duration;

        collectionOffers[msg.sender] = CollectionOffer(
            msg.sender,
            msg.value,
            nftCount,
            block.timestamp,
            expirationTime,
            true
        );

        creatorsContract.updateCollectionOffer(
            msg.sender,
            collectionId,
            msg.value,
            nftCount,
            expirationTime
        );

        emit CollectionOfferPlaced(
            msg.sender,
            msg.value,
            nftCount,
            expirationTime
        );
    }

    function withdrawCollectionOffer() public nonReentrant {
        CollectionOffer storage offer = collectionOffers[msg.sender];
        require(offer.isActive, "No active collection offer");

        uint256 amount = offer.amount;
        offer.isActive = false;

        payable(msg.sender).transfer(amount);

        creatorsContract.removeCollectionOffer(msg.sender, collectionId);
        creatorsContract.recordActivity(
            msg.sender,
            "Collection Offer Withdrawn",
            0
        );

        emit CollectionOfferWithdrawn(msg.sender, amount);
    }

    function acceptCollectionOffer(
        uint256[] memory tokenIds,
        address offerer
    ) public nonReentrant {
        CollectionOffer memory offer = collectionOffers[offerer];
        require(offer.isActive, "No active collection offer from this address");
        require(block.timestamp <= offer.expirationTime, "Offer has expired");
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

        creatorsContract.removeCollectionOffer(offerer, collectionId);

        creatorsContract.recordActivity(
            msg.sender,
            "Collection Offer Accepted",
            0
        );
        creatorsContract.recordActivity(
            offerer,
            "Collection Offer Fulfilled",
            0
        );

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
