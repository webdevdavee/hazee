// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./NFTCollection.sol";
import "./NFTAuction.sol";
import "./NFT.sol";
import "./NFTCreators.sol";

contract NFTMarketplace is ReentrancyGuard {
    struct Listing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        bool isActive;
        NFT.NFTStatus saleType;
    }

    struct CollectionInfo {
        address collectionAddress;
        address creator;
        string name;
        string description;
        address nftContract;
        uint256 maxSupply;
        uint256 mintedSupply;
        uint256 royaltyPercentage;
        uint256 floorPrice;
        uint256 owners;
        bool isActive;
    }

    mapping(uint256 => Listing) public listings;
    uint256 public listingCounter;

    uint256 public platformFeePercentage = 250; // 2.5%
    address public feeRecipient;

    NFTAuction public auctionContract;
    NFTCreators public creatorsContract;

    mapping(uint256 => CollectionInfo) public collections;
    uint256 public collectionCounter;

    event NFTListed(
        uint256 listingId,
        address seller,
        address nftContract,
        uint256 tokenId,
        uint256 price,
        NFT.NFTStatus saleType
    );
    event NFTSold(
        uint256 listingId,
        address buyer,
        address seller,
        address nftContract,
        uint256 tokenId,
        uint256 price
    );
    event ListingCancelled(uint256 listingId);
    event CollectionAdded(
        uint256 collectionId,
        address collectionAddress,
        address creator,
        string name
    );
    event CollectionDeactivated(uint256 collectionId);

    constructor(
        address _feeRecipient,
        address _auctionAddress,
        address _creatorsAddress
    ) {
        feeRecipient = _feeRecipient;
        auctionContract = NFTAuction(_auctionAddress);
        creatorsContract = NFTCreators(_creatorsAddress);
    }

    function createCollection(
        string memory _name,
        string memory _description,
        uint256 _maxSupply,
        uint256 _royaltyPercentage,
        uint256 _floorPrice
    ) external nonReentrant returns (uint256) {
        require(
            _royaltyPercentage <= 4000,
            "Royalty percentage must be 40% or less"
        );

        collectionCounter++;
        uint256 creatorId = creatorsContract.getCreatorId(msg.sender);
        if (creatorId == 0) {
            creatorId = creatorsContract.registerCreator(msg.sender);
        }

        NFTCollection newCollection = new NFTCollection(
            _name,
            _description,
            _maxSupply,
            _royaltyPercentage,
            _floorPrice,
            address(creatorsContract),
            collectionCounter
        );

        collections[collectionCounter] = CollectionInfo({
            collectionAddress: address(newCollection),
            creator: msg.sender,
            name: _name,
            description: _description,
            nftContract: newCollection.nftContract(),
            maxSupply: _maxSupply,
            mintedSupply: 0,
            royaltyPercentage: _royaltyPercentage,
            floorPrice: _floorPrice,
            owners: 0,
            isActive: true
        });

        creatorsContract.addCreatedCollection(msg.sender, collectionCounter);

        emit CollectionAdded(
            collectionCounter,
            address(newCollection),
            msg.sender,
            _name
        );

        return collectionCounter;
    }

    function addCollection(address _collectionAddress) external {
        NFTCollection collection = NFTCollection(payable(_collectionAddress));
        collectionCounter++;
        collections[collectionCounter] = CollectionInfo({
            collectionAddress: _collectionAddress,
            creator: collection.collectionCreator(),
            name: collection.name(),
            description: collection.description(),
            nftContract: collection.nftContract(),
            maxSupply: collection.maxSupply(),
            mintedSupply: collection.mintedSupply(),
            royaltyPercentage: collection.royaltyPercentage(),
            floorPrice: collection.floorPrice(),
            owners: collection.owners(),
            isActive: true
        });

        creatorsContract.addCreatedCollection(
            collection.collectionCreator(),
            collectionCounter
        );

        emit CollectionAdded(
            collectionCounter,
            _collectionAddress,
            collection.collectionCreator(),
            collection.name()
        );
    }

    function deactivateCollection(uint256 _collectionId) external {
        require(
            collections[_collectionId].isActive,
            "Collection is not active"
        );
        require(
            msg.sender == collections[_collectionId].creator,
            "Only creator can deactivate"
        );

        collections[_collectionId].isActive = false;
        emit CollectionDeactivated(_collectionId);
    }

    function getCollections(
        uint256 _offset,
        uint256 _limit
    ) external view returns (CollectionInfo[] memory) {
        require(_offset < collectionCounter, "Offset out of bounds");
        uint256 end = _offset + _limit;
        if (end > collectionCounter) {
            end = collectionCounter;
        }
        uint256 length = end - _offset;
        CollectionInfo[] memory result = new CollectionInfo[](length);
        for (uint256 i = 0; i < length; i++) {
            result[i] = collections[_offset + i + 1];
        }
        return result;
    }

    function getCollectionInfo(
        uint256 _collectionId
    ) external view returns (CollectionInfo memory) {
        require(
            _collectionId > 0 && _collectionId <= collectionCounter,
            "Invalid collection ID"
        );
        return collections[_collectionId];
    }

    function updateCollectionInfo(uint256 _collectionId) external {
        require(
            _collectionId > 0 && _collectionId <= collectionCounter,
            "Invalid collection ID"
        );
        CollectionInfo storage collectionInfo = collections[_collectionId];
        require(collectionInfo.isActive, "Collection is not active");

        NFTCollection collection = NFTCollection(
            payable(collectionInfo.collectionAddress)
        );

        collectionInfo.mintedSupply = collection.mintedSupply();
        collectionInfo.floorPrice = collection.floorPrice();
        collectionInfo.owners = collection.owners();
        collectionInfo.royaltyPercentage = collection.royaltyPercentage();
    }

    function listNFT(
        address _nftContract,
        uint256 _tokenId,
        uint256 _price,
        NFT.NFTStatus _saleType
    ) external nonReentrant {
        require(_price > 0, "Price must be greater than zero");
        IERC721 nftContract = IERC721(_nftContract);
        require(
            nftContract.ownerOf(_tokenId) == msg.sender,
            "You don't own this NFT"
        );
        require(
            nftContract.isApprovedForAll(msg.sender, address(this)),
            "Contract not approved"
        );
        require(
            !auctionContract.isNFTOnAuction(_nftContract, _tokenId),
            "NFT is currently on auction"
        );

        listingCounter++;
        listings[listingCounter] = Listing({
            seller: msg.sender,
            nftContract: _nftContract,
            tokenId: _tokenId,
            price: _price,
            isActive: true,
            saleType: _saleType
        });

        NFT(_nftContract).setNFTStatus(_tokenId, _saleType);

        creatorsContract.recordActivity(msg.sender, "NFT Listed", _tokenId);

        emit NFTListed(
            listingCounter,
            msg.sender,
            _nftContract,
            _tokenId,
            _price,
            _saleType
        );
    }

    function buyNFT(uint256 _listingId) external payable nonReentrant {
        Listing storage listing = listings[_listingId];
        require(listing.isActive, "Listing is not active");
        require(msg.value >= listing.price, "Insufficient payment");
        require(
            listing.saleType == NFT.NFTStatus.SALE ||
                listing.saleType == NFT.NFTStatus.BOTH,
            "NFT is not available for direct purchase"
        );
        require(
            !auctionContract.isNFTOnAuction(
                listing.nftContract,
                listing.tokenId
            ),
            "NFT is currently on auction"
        );

        listing.isActive = false;
        IERC721 nftContract = IERC721(listing.nftContract);

        uint256 platformFee = (listing.price * platformFeePercentage) / 10000;
        uint256 royaltyFee = 0;

        NFT nft = NFT(listing.nftContract);
        (, , , address creator, ) = nft.getMetadata(listing.tokenId);
        uint256 collectionId = uint256(
            uint160(nft.getCollection(listing.tokenId))
        );
        CollectionInfo storage collectionInfo = collections[collectionId];

        royaltyFee = (listing.price * collectionInfo.royaltyPercentage) / 10000;

        uint256 sellerProceeds = listing.price - platformFee - royaltyFee;

        payable(feeRecipient).transfer(platformFee);
        if (royaltyFee > 0) {
            payable(creator).transfer(royaltyFee);
        }
        payable(listing.seller).transfer(sellerProceeds);

        nftContract.safeTransferFrom(
            listing.seller,
            msg.sender,
            listing.tokenId
        );

        nft.addActivity(
            listing.tokenId,
            "Sold",
            listing.price,
            block.timestamp
        );
        nft.setNFTStatus(listing.tokenId, NFT.NFTStatus.NONE);

        creatorsContract.updateItemsSold(listing.seller);
        creatorsContract.recordActivity(
            msg.sender,
            "NFT Purchased",
            listing.tokenId
        );
        creatorsContract.recordActivity(
            listing.seller,
            "NFT Sold",
            listing.tokenId
        );

        emit NFTSold(
            _listingId,
            msg.sender,
            listing.seller,
            listing.nftContract,
            listing.tokenId,
            listing.price
        );

        // Refund excess payment
        uint256 excess = msg.value - listing.price;
        if (excess > 0) {
            payable(msg.sender).transfer(excess);
        }
    }

    function cancelListing(uint256 _listingId) external nonReentrant {
        Listing storage listing = listings[_listingId];
        require(listing.seller == msg.sender, "You're not the seller");
        require(listing.isActive, "Listing is not active");

        listing.isActive = false;
        NFT(listing.nftContract).setNFTStatus(
            listing.tokenId,
            NFT.NFTStatus.NONE
        );
        creatorsContract.recordActivity(
            msg.sender,
            "Listing Cancelled",
            listing.tokenId
        );
        emit ListingCancelled(_listingId);
    }

    function updateListingPrice(
        uint256 _listingId,
        uint256 _newPrice
    ) external nonReentrant {
        Listing storage listing = listings[_listingId];
        require(listing.seller == msg.sender, "You're not the seller");
        require(listing.isActive, "Listing is not active");
        require(_newPrice > 0, "Price must be greater than zero");

        listing.price = _newPrice;
        creatorsContract.recordActivity(
            msg.sender,
            "Listing Price Updated",
            listing.tokenId
        );
        emit NFTListed(
            _listingId,
            msg.sender,
            listing.nftContract,
            listing.tokenId,
            _newPrice,
            listing.saleType
        );
    }

    function isNFTListed(
        address _nftContract,
        uint256 _tokenId
    ) external view returns (bool) {
        for (uint256 i = 1; i <= listingCounter; i++) {
            if (
                listings[i].nftContract == _nftContract &&
                listings[i].tokenId == _tokenId &&
                listings[i].isActive
            ) {
                return true;
            }
        }
        return false;
    }

    function addToFavorites(uint256 _tokenId) external {
        creatorsContract.addToFavourites(msg.sender, _tokenId);
    }

    function addToCart(uint256 _tokenId) external {
        creatorsContract.addToCart(msg.sender, _tokenId);
    }

    function getCreatorInfo(
        address _creator
    ) external view returns (NFTCreators.Creator memory) {
        return creatorsContract.getCreatorInfo(_creator);
    }

    function getCreatorActivities(
        address _creator
    ) external view returns (NFTCreators.Activity[] memory) {
        return creatorsContract.getCreatorActivities(_creator);
    }

    function mintNFT(
        uint256 _collectionId,
        string memory tokenURI,
        string memory nftName,
        string memory nftDescription,
        NFT.Attribute[] memory attributes
    ) external returns (uint256) {
        CollectionInfo storage collection = collections[_collectionId];
        require(collection.isActive, "Collection is not active");
        require(msg.sender == collection.creator, "Only creator can mint NFTs");

        NFTCollection nftCollection = NFTCollection(
            payable(collection.collectionAddress)
        );
        uint256 tokenId = nftCollection.mintNFT(
            tokenURI,
            nftName,
            nftDescription,
            attributes
        );

        collection.mintedSupply++;
        return tokenId;
    }

    function updateFloorPrice(
        uint256 _collectionId,
        uint256 _newFloorPrice
    ) external {
        CollectionInfo storage collection = collections[_collectionId];
        require(collection.isActive, "Collection is not active");
        require(
            msg.sender == collection.creator,
            "Only creator can update floor price"
        );

        NFTCollection nftCollection = NFTCollection(
            payable(collection.collectionAddress)
        );
        nftCollection.updateFloorPrice(_newFloorPrice);
        collection.floorPrice = _newFloorPrice;
    }

    function updateRoyaltyPercentage(
        uint256 _collectionId,
        uint256 _newRoyaltyPercentage
    ) external {
        CollectionInfo storage collection = collections[_collectionId];
        require(collection.isActive, "Collection is not active");
        require(
            msg.sender == collection.creator,
            "Only creator can update royalty percentage"
        );

        NFTCollection nftCollection = NFTCollection(
            payable(collection.collectionAddress)
        );
        nftCollection.updateRoyaltyPercentage(_newRoyaltyPercentage);
        collection.royaltyPercentage = _newRoyaltyPercentage;
    }

    function createAuction(
        address _nftContract,
        uint256 _tokenId,
        uint256 _startingPrice,
        uint256 _reservePrice,
        uint256 _duration
    ) external {
        require(
            IERC721(_nftContract).ownerOf(_tokenId) == msg.sender,
            "You don't own this NFT"
        );
        require(
            IERC721(_nftContract).isApprovedForAll(msg.sender, address(this)),
            "Contract not approved"
        );

        IERC721(_nftContract).transferFrom(msg.sender, address(this), _tokenId);
        IERC721(_nftContract).approve(address(auctionContract), _tokenId);

        auctionContract.createAuction(
            _nftContract,
            _tokenId,
            _startingPrice,
            _reservePrice,
            _duration
        );
    }

    function placeBid(uint256 _auctionId) external payable {
        auctionContract.placeBid{value: msg.value}(_auctionId);
    }

    function endAuction(uint256 _auctionId) external {
        auctionContract.endAuction(_auctionId);
    }

    function cancelAuction(uint256 _auctionId) external {
        auctionContract.cancelAuction(_auctionId);
    }

    function registerCreator() external returns (uint256) {
        return creatorsContract.registerCreator(msg.sender);
    }

    function placeCollectionOffer(
        uint256 _collectionId,
        uint256 _nftCount,
        uint256 _duration
    ) external payable {
        CollectionInfo storage collection = collections[_collectionId];
        require(collection.isActive, "Collection is not active");

        NFTCollection nftCollection = NFTCollection(
            payable(collection.collectionAddress)
        );
        nftCollection.placeCollectionOffer{value: msg.value}(
            _nftCount,
            _duration
        );
    }

    function withdrawCollectionOffer(uint256 _collectionId) external {
        CollectionInfo storage collection = collections[_collectionId];
        require(collection.isActive, "Collection is not active");

        NFTCollection nftCollection = NFTCollection(
            payable(collection.collectionAddress)
        );
        nftCollection.withdrawCollectionOffer();

        creatorsContract.recordActivity(
            msg.sender,
            "Collection Offer Withdrawn",
            _collectionId
        );
    }

    function acceptCollectionOffer(
        uint256 _collectionId,
        uint256[] memory _tokenIds,
        address _offerer
    ) external {
        CollectionInfo storage collection = collections[_collectionId];
        require(collection.isActive, "Collection is not active");

        NFTCollection nftCollection = NFTCollection(
            payable(collection.collectionAddress)
        );
        nftCollection.acceptCollectionOffer(_tokenIds, _offerer);

        creatorsContract.recordActivity(
            msg.sender,
            "Collection Offer Accepted",
            _collectionId
        );
        creatorsContract.recordActivity(
            _offerer,
            "Collection Offer Fulfilled",
            _collectionId
        );
    }

    // Function to get creator ID
    function getCreatorId(address _creator) external view returns (uint256) {
        return creatorsContract.creatorIdByAddress(_creator);
    }

    // Function to update wallet balance
    function updateWalletBalance(address _user, uint256 _newBalance) external {
        require(
            msg.sender == address(this) ||
                msg.sender == address(auctionContract),
            "Unauthorized"
        );
        creatorsContract.updateWalletBalance(_user, _newBalance);
    }
}
