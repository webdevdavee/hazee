// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./NFTCollection.sol";

contract NFTMarketplace is ReentrancyGuard {
    struct Listing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        bool isActive;
    }

    mapping(uint256 => Listing) public listings;
    uint256 public listingCounter;

    uint256 public platformFeePercentage = 250; // 2.5%
    address public feeRecipient;

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

    constructor(address _feeRecipient) {
        feeRecipient = _feeRecipient;
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

        listing.isActive = false;
        IERC721 nftContract = IERC721(listing.nftContract);

        uint256 platformFee = (listing.price * platformFeePercentage) / 10000;
        uint256 royaltyFee = 0;

        if (address(nftContract).code.length > 0) {
            try NFTCollection(listing.nftContract).royaltyPercentage() returns (
                uint256 royaltyPercentage
            ) {
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
}
