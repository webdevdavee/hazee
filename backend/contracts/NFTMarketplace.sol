// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./INFTCollections.sol";
import "./NFTAuction.sol";
import "./NFT.sol";
import "./NFTCreators.sol";

contract NFTMarketplace is ReentrancyGuard {
    NFTCreators public immutable i_creatorsContract;
    NFTAuction public immutable i_auctionContract;
    INFTCollections public immutable i_collectionContract;
    address public immutable i_feeRecipient;

    uint256 public constant PLATFORM_FEE_PERCENTAGE = 250; // 2.5%

    uint256 public listingCounter;

    struct Listing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        bool isActive;
        NFT.NFTStatus saleType;
    }

    mapping(uint256 => Listing) public listings;

    event NFTSold(
        uint256 listingId,
        address buyer,
        address seller,
        address nftContract,
        uint256 tokenId,
        uint256 price
    );

    event NFTListed(
        uint256 listingId,
        address seller,
        address nftContract,
        uint256 tokenId,
        uint256 price,
        NFT.NFTStatus saleType
    );

    event ListingCancelled(uint256 listingId);
    event ListingPriceUpdated(uint256 listingId, uint256 newPrice);

    constructor(
        address _creatorsContractAddress,
        address _auctionContractAddress,
        address _collectionContractAddress
    ) {
        i_feeRecipient = address(this);
        i_creatorsContract = NFTCreators(_creatorsContractAddress);
        i_auctionContract = NFTAuction(_auctionContractAddress);
        i_collectionContract = INFTCollections(_collectionContractAddress);
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
            !i_auctionContract.isNFTOnAuction(_tokenId),
            "NFT is currently on auction"
        );

        NFT NFTContract = NFT(_nftContract);
        uint256 collectionId = NFTContract.getCollection(_tokenId);

        INFTCollections.CollectionInfo
            memory collectionInfo = i_collectionContract.getCollectionInfo(
                collectionId
            );
        require(collectionInfo.isActive, "Collection does not exist");

        listingCounter++;
        listings[listingCounter] = Listing({
            seller: msg.sender,
            nftContract: _nftContract,
            tokenId: _tokenId,
            price: _price,
            isActive: true,
            saleType: NFT.NFTStatus.SALE
        });

        NFTContract.setNFTStatus(_tokenId, NFT.NFTStatus.SALE);
        NFTContract._addActivity(_tokenId, "Listed", _price);

        uint256 creatorId = i_creatorsContract.getCreatorIdByAddress(
            msg.sender
        );
        i_creatorsContract.recordActivity(creatorId, "NFT Listed", _tokenId);

        emit NFTListed(
            listingCounter,
            msg.sender,
            _nftContract,
            _tokenId,
            _price,
            NFT.NFTStatus.SALE
        );
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

        uint256 creatorId = i_creatorsContract.getCreatorIdByAddress(
            msg.sender
        );
        i_creatorsContract.recordActivity(
            creatorId,
            "Listing Cancelled",
            listing.tokenId
        );
        emit ListingCancelled(_listingId);
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

    function updateListingPrice(
        uint256 _listingId,
        uint256 _newPrice
    ) external nonReentrant {
        Listing storage listing = listings[_listingId];
        require(listing.seller == msg.sender, "You're not the seller");
        require(listing.isActive, "Listing is not active");
        require(_newPrice > 0, "Price must be greater than zero");

        listing.price = _newPrice;

        NFT(listing.nftContract).updatePrice(listing.tokenId, _newPrice);

        uint256 creatorId = i_creatorsContract.getCreatorIdByAddress(
            msg.sender
        );
        i_creatorsContract.recordActivity(
            creatorId,
            "Listing Price Updated",
            listing.tokenId
        );
        emit ListingPriceUpdated(_listingId, _newPrice);
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
            !i_auctionContract.isNFTOnAuction(listing.tokenId),
            "NFT is currently on auction"
        );

        listing.isActive = false;
        IERC721 nftContract = IERC721(listing.nftContract);

        uint256 platformFee = (listing.price * PLATFORM_FEE_PERCENTAGE) / 10000;
        uint256 royaltyFee = 0;

        NFT nft = NFT(listing.nftContract);
        uint256 collectionId = nft.getCollection(listing.tokenId);

        INFTCollections.CollectionInfo
            memory collectionInfo = i_collectionContract.getCollectionInfo(
                collectionId
            );

        royaltyFee = (listing.price * collectionInfo.royaltyPercentage) / 10000;

        uint256 sellerProceeds = listing.price - platformFee - royaltyFee;

        require(
            nftContract.ownerOf(listing.tokenId) == listing.seller,
            "Seller no longer owns the NFT"
        );

        // Transfer NFT first to prevent reentrancy
        nftContract.safeTransferFrom(
            listing.seller,
            msg.sender,
            listing.tokenId
        );

        // Transfer funds
        payable(i_feeRecipient).transfer(platformFee);
        if (royaltyFee > 0) {
            payable(collectionInfo.creator).transfer(royaltyFee);
        }
        payable(listing.seller).transfer(sellerProceeds);

        nft._addActivity(listing.tokenId, "Sold", listing.price);
        nft.setNFTStatus(listing.tokenId, NFT.NFTStatus.NONE);

        uint256 listingSellerId = i_creatorsContract.getCreatorIdByAddress(
            listing.seller
        );
        i_creatorsContract.updateItemsSold(listingSellerId);

        uint256 buyerId = i_creatorsContract.getCreatorIdByAddress(msg.sender);
        i_creatorsContract.recordActivity(
            buyerId,
            "NFT Purchased",
            listing.tokenId
        );
        i_creatorsContract.addOwnedNFT(buyerId, listing.tokenId);
        i_creatorsContract.removeOwnedNFT(listingSellerId, listing.tokenId);

        i_creatorsContract.recordActivity(
            listingSellerId,
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

    function getListingDetails(
        uint256 _listingId
    )
        external
        view
        returns (
            address seller,
            address nftContract,
            uint256 tokenId,
            uint256 price,
            bool isActive,
            NFT.NFTStatus saleType
        )
    {
        Listing storage listing = listings[_listingId];
        return (
            listing.seller,
            listing.nftContract,
            listing.tokenId,
            listing.price,
            listing.isActive,
            listing.saleType
        );
    }

    function getActiveListings(
        uint256 _offset,
        uint256 _limit
    ) external view returns (uint256[] memory) {
        uint256[] memory activeListings = new uint256[](_limit);
        uint256 count = 0;

        for (
            uint256 i = _offset + 1;
            i <= listingCounter && count < _limit;
            i++
        ) {
            if (listings[i].isActive) {
                activeListings[count] = i;
                count++;
            }
        }

        // Resize the array to remove empty slots
        assembly {
            mstore(activeListings, count)
        }

        return activeListings;
    }
}
