// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./NFTCollection.sol";
import "./NFTAuction.sol";

contract NFTMarketplace is ReentrancyGuard {
    struct Listing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        bool isActive;
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
        uint256 numberOfOwners;
        bool isActive;
    }

    mapping(uint256 => Listing) public listings;
    uint256 public listingCounter;

    uint256 public platformFeePercentage = 250; // 2.5%
    address public feeRecipient;

    NFTAuction public auctionContract;

    mapping(uint256 => CollectionInfo) public collections;
    uint256 public collectionCounter;

    event NFTListed(
        uint256 listingId,
        address seller,
        address nftContract,
        uint256 tokenId,
        uint256 price
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

    constructor(address _feeRecipient, address _auctionAddress) {
        feeRecipient = _feeRecipient;
        auctionContract = NFTAuction(_auctionAddress);
    }

    function addCollection(address _collectionAddress) external {
        NFTCollection collection = NFTCollection(payable(_collectionAddress));
        collectionCounter++;
        collections[collectionCounter] = CollectionInfo({
            collectionAddress: _collectionAddress,
            creator: collection.getCollectionCreator(),
            name: collection.name(),
            description: collection.description(),
            nftContract: collection.nftContract(),
            maxSupply: collection.maxSupply(),
            mintedSupply: collection.mintedSupply(),
            royaltyPercentage: collection.royaltyPercentage(),
            floorPrice: collection.floorPrice(),
            numberOfOwners: collection.numberOfOwners(),
            isActive: true
        });

        emit CollectionAdded(
            collectionCounter,
            _collectionAddress,
            collection.getCollectionCreator(),
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
        collectionInfo.numberOfOwners = collection.numberOfOwners();
    }

    function listNFT(
        address _nftContract,
        uint256 _tokenId,
        uint256 _price
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
            isActive: true
        });

        emit NFTListed(
            listingCounter,
            msg.sender,
            _nftContract,
            _tokenId,
            _price
        );
    }

    function buyNFT(uint256 _listingId) external payable nonReentrant {
        Listing storage listing = listings[_listingId];
        require(listing.isActive, "Listing is not active");
        require(msg.value >= listing.price, "Insufficient payment");
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

        if (address(nftContract).code.length > 0) {
            try
                NFTCollection(payable(listing.nftContract)).royaltyPercentage()
            returns (uint256 royaltyPercentage) {
                royaltyFee = (listing.price * royaltyPercentage) / 10000;
            } catch {
                // If the call fails, assume it's not an NFTCollection contract and skip royalties
            }
        }

        uint256 sellerProceeds = listing.price - platformFee - royaltyFee;

        payable(feeRecipient).transfer(platformFee);
        if (royaltyFee > 0) {
            payable(nftContract.ownerOf(listing.tokenId)).transfer(royaltyFee);
        }
        payable(listing.seller).transfer(sellerProceeds);

        nftContract.safeTransferFrom(
            listing.seller,
            msg.sender,
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
        emit NFTListed(
            _listingId,
            msg.sender,
            listing.nftContract,
            listing.tokenId,
            _newPrice
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
}
