// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./INFTCollections.sol";
import "./NFTAuction.sol";
import "./NFT.sol";

contract NFTMarketplace is ReentrancyGuard {
    INFTCollections public immutable i_collectionContract;
    NFTAuction public immutable i_auctionContract;
    address public immutable i_feeRecipient;

    uint256 public constant PLATFORM_FEE_PERCENTAGE = 250; // 2.5%

    uint256 public listingCounter;

    struct Listing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        uint256 collectionId;
        bool isActive;
        NFT.NFTStatus saleType;
    }

    mapping(uint256 => Listing) public listings;

    // Custom errors
    error PriceMustBeGreaterThanZero();
    error NotNFTOwner();
    error ContractNotApproved();
    error NFTOnAuction();
    error CollectionNotActive();
    error NotSeller();
    error ListingNotActive();
    error InsufficientPayment();
    error NFTUnavailableForPurchase();
    error SellerNoLongerOwnsNFT();
    error ListingNotFound();

    event NFTListed(
        uint256 indexed listingId,
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId,
        uint256 price,
        uint256 collectionId,
        NFT.NFTStatus saleType
    );
    event NFTSold(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        address nftContract,
        uint256 tokenId,
        uint256 price,
        uint256 collectionId
    );
    event ListingCancelled(uint256 indexed listingId);
    event ListingPriceUpdated(uint256 indexed listingId, uint256 newPrice);

    constructor(
        address _collectionContractAddress,
        address _auctionContractAddress
    ) {
        i_feeRecipient = address(this);
        i_collectionContract = INFTCollections(_collectionContractAddress);
        i_auctionContract = NFTAuction(_auctionContractAddress);
    }

    function listNFT(
        address _nftContract,
        uint256 _tokenId,
        uint256 _price
    ) external nonReentrant {
        if (_price == 0) revert PriceMustBeGreaterThanZero();

        IERC721 nftContract = IERC721(_nftContract);
        if (nftContract.ownerOf(_tokenId) != msg.sender) revert NotNFTOwner();
        if (!nftContract.isApprovedForAll(msg.sender, address(this)))
            revert ContractNotApproved();
        (bool isOnAuction, ) = i_auctionContract.isNFTOnAuction(_tokenId);
        if (isOnAuction) revert NFTOnAuction();

        NFT NFTContract = NFT(_nftContract);
        uint256 collectionId = NFTContract.getCollection(_tokenId);

        INFTCollections.CollectionInfo
            memory collectionInfo = i_collectionContract.getCollectionInfo(
                collectionId
            );
        if (!collectionInfo.isActive) revert CollectionNotActive();

        unchecked {
            listingCounter++;
        }

        listings[listingCounter] = Listing({
            seller: msg.sender,
            nftContract: _nftContract,
            tokenId: _tokenId,
            price: _price,
            collectionId: collectionId,
            isActive: true,
            saleType: NFT.NFTStatus.SALE
        });

        NFTContract.setNFTStatus(_tokenId, NFT.NFTStatus.SALE);

        emit NFTListed(
            listingCounter,
            msg.sender,
            _nftContract,
            _tokenId,
            _price,
            collectionId,
            NFT.NFTStatus.SALE
        );
    }

    function cancelListing(uint256 _listingId) external nonReentrant {
        Listing storage listing = listings[_listingId];
        if (listing.seller != msg.sender) revert NotSeller();
        if (!listing.isActive) revert ListingNotActive();

        listing.isActive = false;
        NFT(listing.nftContract).setNFTStatus(
            listing.tokenId,
            NFT.NFTStatus.NONE
        );

        emit ListingCancelled(_listingId);
    }

    function updateListingPrice(
        uint256 _listingId,
        uint256 _newPrice
    ) external nonReentrant {
        if (_newPrice == 0) revert PriceMustBeGreaterThanZero();

        Listing storage listing = listings[_listingId];
        if (listing.seller != msg.sender) revert NotSeller();
        if (!listing.isActive) revert ListingNotActive();

        listing.price = _newPrice;
        NFT(listing.nftContract).updatePrice(listing.tokenId, _newPrice);

        emit ListingPriceUpdated(_listingId, _newPrice);
    }

    function buyNFT(uint256 _listingId) external payable nonReentrant {
        Listing storage listing = listings[_listingId];
        if (!listing.isActive) revert ListingNotActive();
        if (msg.value < listing.price) revert InsufficientPayment();
        if (
            listing.saleType != NFT.NFTStatus.SALE &&
            listing.saleType != NFT.NFTStatus.BOTH
        ) revert NFTUnavailableForPurchase();
        (bool isOnAuction, ) = i_auctionContract.isNFTOnAuction(
            listing.tokenId
        );
        if (isOnAuction) revert NFTOnAuction();

        IERC721 nftContract = IERC721(listing.nftContract);
        if (nftContract.ownerOf(listing.tokenId) != listing.seller)
            revert SellerNoLongerOwnsNFT();

        listing.isActive = false;

        uint256 platformFee = (listing.price * PLATFORM_FEE_PERCENTAGE) / 10000;
        uint256 royaltyFee = 0;

        INFTCollections.CollectionInfo
            memory collectionInfo = i_collectionContract.getCollectionInfo(
                listing.collectionId
            );

        royaltyFee = (listing.price * collectionInfo.royaltyPercentage) / 10000;

        uint256 sellerProceeds = listing.price - platformFee - royaltyFee;

        nftContract.safeTransferFrom(
            listing.seller,
            msg.sender,
            listing.tokenId
        );

        payable(i_feeRecipient).transfer(platformFee);
        if (royaltyFee > 0) {
            payable(collectionInfo.creator).transfer(royaltyFee);
        }
        payable(listing.seller).transfer(sellerProceeds);

        NFT(listing.nftContract).setNFTStatus(
            listing.tokenId,
            NFT.NFTStatus.NONE
        );

        emit NFTSold(
            _listingId,
            msg.sender,
            listing.seller,
            listing.nftContract,
            listing.tokenId,
            listing.price,
            listing.collectionId
        );

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
            uint256 collectionId,
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
            listing.collectionId,
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

        for (uint256 i = _offset + 1; i <= listingCounter && count < _limit; ) {
            if (listings[i].isActive) {
                activeListings[count] = i;
                unchecked {
                    ++count;
                }
            }
            unchecked {
                ++i;
            }
        }

        // Resize the array to remove empty slots
        assembly {
            mstore(activeListings, count)
        }

        return activeListings;
    }

    function getCollectionListings(
        uint256 _collectionId
    ) external view returns (uint256[] memory) {
        uint256[] memory collectionListings = new uint256[](listingCounter);
        uint256 count = 0;

        for (uint256 i = 1; i <= listingCounter; ) {
            if (
                listings[i].isActive &&
                listings[i].collectionId == _collectionId
            ) {
                collectionListings[count] = i;
                unchecked {
                    ++count;
                }
            }
            unchecked {
                ++i;
            }
        }

        // Resize the array to remove empty slots
        assembly {
            mstore(collectionListings, count)
        }

        return collectionListings;
    }

    function getCreatorListings(
        address _creator
    ) external view returns (uint256[] memory) {
        NFT nftContract;
        uint256[] memory creatorListings = new uint256[](listingCounter);
        uint256 count = 0;

        for (uint256 i = 1; i <= listingCounter; ) {
            if (listings[i].isActive) {
                nftContract = NFT(listings[i].nftContract);
                uint256[] memory createdTokens = nftContract.getCreatedTokens(
                    _creator
                );

                // Check if the listed token was created by this creator
                for (uint256 j = 0; j < createdTokens.length; ) {
                    if (createdTokens[j] == listings[i].tokenId) {
                        creatorListings[count] = i;
                        unchecked {
                            ++count;
                        }
                        break;
                    }
                    unchecked {
                        ++j;
                    }
                }
            }
            unchecked {
                ++i;
            }
        }

        // Resize the array to remove empty slots
        assembly {
            mstore(creatorListings, count)
        }

        return creatorListings;
    }

    function isNFTListed(
        address _nftContract,
        uint256 _tokenId
    ) external view returns (bool) {
        for (uint256 i = 1; i <= listingCounter; ) {
            if (
                listings[i].nftContract == _nftContract &&
                listings[i].tokenId == _tokenId &&
                listings[i].isActive
            ) {
                return true;
            }
            unchecked {
                ++i;
            }
        }
        return false;
    }
}
