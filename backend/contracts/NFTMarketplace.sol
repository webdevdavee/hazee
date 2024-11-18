// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./NFTCollections.sol";
import "./NFTAuction.sol";
import "./NFT.sol";

contract NFTMarketplace is ReentrancyGuard {
    enum ListingType {
        NONE,
        SALE,
        AUCTION,
        BOTH
    }

    enum SortOrder {
        NONE,
        PRICE_HIGH_TO_LOW,
        PRICE_LOW_TO_HIGH
    }

    NFTCollections public immutable i_collectionContract;
    NFTAuction public immutable i_auctionContract;
    NFT public immutable i_nftContract;
    address public immutable i_feeRecipient;

    uint256 public constant PLATFORM_FEE_PERCENTAGE = 250; // 2.5%

    uint256 public listingCounter;

    struct FilterParams {
        ListingType listingType;
        uint256 collectionId;
        uint256 minPrice;
        uint256 maxPrice;
        SortOrder sortOrder;
        uint256 offset;
        uint256 limit;
    }
    struct ListingView {
        uint256 listingId;
        address seller;
        uint256 tokenId;
        uint256 price;
        uint256 collectionId;
        ListingType listingType;
        uint256 auctionId;
    }

    struct Listing {
        address seller;
        uint256 tokenId;
        uint256 price;
        uint256 collectionId;
        bool isActive;
        ListingType listingType;
        uint256 auctionId;
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
    error PlatformFeeTransferFailed();
    error RoyaltyFeeTransferFailed();
    error SellerPaymentFailed();
    error ExcessRefundFailed();
    error InvalidListingType();
    error InvalidAuctionParameters();
    error TokenAlreadyListed();
    error AuctionOnlyListing();
    error InvalidStatus();
    error TransferFailed();
    error InvalidAuctionState();
    error AuctionEndingFailed();
    error InvalidPageSize();
    error InvalidSortOrder();
    error PriceFilterMismatch();
    error BatchDelistFailed();

    event BatchDelisted(uint256[] tokenIds);

    event NFTListed(
        uint256 indexed listingId,
        address indexed seller,
        uint256 tokenId,
        uint256 price,
        uint256 collectionId,
        ListingType listingType,
        uint256 auctionId
    );

    event NFTSold(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 tokenId,
        uint256 price,
        uint256 collectionId
    );
    event ListingCancelled(uint256 indexed listingId);
    event ListingPriceUpdated(uint256 indexed listingId, uint256 newPrice);
    event AuctionPurchaseProcessed(
        uint256 indexed listingId,
        uint256 indexed auctionId
    );
    event ListingTypeUpdated(uint256 indexed listingId, ListingType newType);

    constructor(
        address _nftContractAddress,
        address _collectionContractAddress,
        address _auctionContractAddress
    ) {
        i_feeRecipient = address(this);
        i_nftContract = NFT(_nftContractAddress);
        i_collectionContract = NFTCollections(_collectionContractAddress);
        i_auctionContract = NFTAuction(_auctionContractAddress);
    }

    function listNFT(
        uint256 _tokenId,
        uint256 _price,
        ListingType _listingType,
        uint256 _startingPrice,
        uint256 _reservePrice,
        uint256 _duration
    ) external nonReentrant {
        // Validate basic parameters
        if (_listingType == ListingType.NONE) revert InvalidListingType();
        if (
            (_listingType == ListingType.SALE ||
                _listingType == ListingType.BOTH) && _price == 0
        ) revert PriceMustBeGreaterThanZero();
        if (i_nftContract.ownerOf(_tokenId) != msg.sender) revert NotNFTOwner();
        if (!i_nftContract.isApprovedForAll(msg.sender, address(this)))
            revert ContractNotApproved();

        // Check if token is already listed
        (bool isListed, ) = this.isNFTListed(_tokenId);
        if (isListed) revert TokenAlreadyListed();

        // Validate collection status
        uint256 collectionId = i_nftContract.getCollection(_tokenId);
        NFTCollections.CollectionInfo
            memory collectionInfo = i_collectionContract.getCollectionInfo(
                collectionId
            );
        if (!collectionInfo.isActive) revert CollectionNotActive();

        // Validate auction parameters if needed
        if (
            _listingType == ListingType.AUCTION ||
            _listingType == ListingType.BOTH
        ) {
            if (_startingPrice == 0 || _duration == 0)
                revert InvalidAuctionParameters();
        }

        // Create listing
        unchecked {
            listingCounter++;
        }

        uint256 auctionId = 0;

        // Create auction if needed
        if (
            _listingType == ListingType.AUCTION ||
            _listingType == ListingType.BOTH
        ) {
            auctionId = i_auctionContract.createAuction(
                msg.sender,
                _tokenId,
                _startingPrice,
                _reservePrice,
                _duration
            );
        }

        listings[listingCounter] = Listing({
            seller: msg.sender,
            tokenId: _tokenId,
            price: _price,
            collectionId: collectionId,
            isActive: true,
            listingType: _listingType,
            auctionId: auctionId
        });

        // Set NFT status
        if (_listingType == ListingType.SALE) {
            i_nftContract.setNFTStatus(_tokenId, NFT.NFTStatus.SALE);
        } else if (_listingType == ListingType.AUCTION) {
            i_nftContract.setNFTStatus(_tokenId, NFT.NFTStatus.AUCTION);
        } else {
            i_nftContract.setNFTStatus(_tokenId, NFT.NFTStatus.BOTH);
        }

        emit NFTListed(
            listingCounter,
            msg.sender,
            _tokenId,
            _price,
            collectionId,
            _listingType,
            auctionId
        );
    }

    function cancelListing(uint256 _listingId) external nonReentrant {
        Listing storage listing = listings[_listingId];
        if (listing.seller != msg.sender) revert NotSeller();
        if (!listing.isActive) revert ListingNotActive();

        listing.isActive = false;

        // Cancel auction if exists
        if (listing.auctionId != 0) {
            i_auctionContract.cancelAuction(msg.sender, listing.auctionId);
            listing.auctionId = 0;
        }

        i_nftContract.setNFTStatus(listing.tokenId, NFT.NFTStatus.NONE);

        emit ListingCancelled(_listingId);
    }

    function finalizeAuctionAndDelist(
        uint256 _listingId
    ) external nonReentrant {
        Listing storage listing = listings[_listingId];
        if (!listing.isActive) revert ListingNotActive();
        if (
            listing.listingType != ListingType.AUCTION &&
            listing.listingType != ListingType.BOTH
        ) revert InvalidListingType();
        if (listing.auctionId == 0) revert InvalidAuctionState();

        // End the auction first
        bool success = i_auctionContract.endAuction(listing.auctionId);
        if (!success) revert AuctionEndingFailed();

        // Clean up the listing
        listing.isActive = false;
        listing.auctionId = 0;

        // Update NFT status
        i_nftContract.setNFTStatus(listing.tokenId, NFT.NFTStatus.NONE);

        emit ListingCancelled(_listingId);
    }

    function canEndAuction(uint256 _listingId) external view returns (bool) {
        Listing storage listing = listings[_listingId];
        if (!listing.isActive || listing.auctionId == 0) return false;

        // Get auction details from auction contract
        (
            ,
            ,
            ,
            ,
            ,
            uint256 endTime,
            ,
            ,
            bool ended,
            bool active
        ) = i_auctionContract.getAuction(listing.auctionId);

        return active && !ended && block.timestamp >= endTime;
    }

    function updateListingPrice(
        uint256 _listingId,
        uint256 _newPrice
    ) external nonReentrant {
        if (_newPrice == 0) revert PriceMustBeGreaterThanZero();

        Listing storage listing = listings[_listingId];
        if (listing.seller != msg.sender) revert NotSeller();
        if (!listing.isActive) revert ListingNotActive();
        if (listing.listingType == ListingType.AUCTION) revert InvalidStatus();

        // Check if the sender still owns the NFT
        if (i_nftContract.ownerOf(listing.tokenId) != msg.sender)
            revert NotNFTOwner();

        listing.price = _newPrice;

        emit ListingPriceUpdated(_listingId, _newPrice);
    }

    function buyNFT(uint256 _listingId) external payable nonReentrant {
        Listing storage listing = listings[_listingId];
        if (!listing.isActive) revert ListingNotActive();
        if (listing.listingType == ListingType.AUCTION)
            revert AuctionOnlyListing();
        if (msg.value < listing.price) revert InsufficientPayment();

        // Handle auction cancellation if BOTH type
        if (listing.listingType == ListingType.BOTH && listing.auctionId != 0) {
            i_auctionContract.cancelAuctionForDirectSale(listing.auctionId);
            listing.auctionId = 0;
        }

        // Process sale
        listing.isActive = false;

        // Calculate fees
        uint256 platformFee = (listing.price * PLATFORM_FEE_PERCENTAGE) / 10000;
        NFTCollections.CollectionInfo
            memory collectionInfo = i_collectionContract.getCollectionInfo(
                listing.collectionId
            );
        uint256 royaltyFee = (listing.price *
            collectionInfo.royaltyPercentage) / 10000;
        uint256 sellerProceeds = listing.price - platformFee - royaltyFee;

        // Transfer NFT
        i_nftContract.safeTransferFrom(
            listing.seller,
            msg.sender,
            listing.tokenId
        );

        // Process payments
        (bool feeSuccess, ) = payable(i_feeRecipient).call{value: platformFee}(
            ""
        );
        if (!feeSuccess) revert TransferFailed();

        if (royaltyFee > 0) {
            (bool royaltySuccess, ) = payable(collectionInfo.creator).call{
                value: royaltyFee
            }("");
            if (!royaltySuccess) revert TransferFailed();
        }

        (bool sellerSuccess, ) = payable(listing.seller).call{
            value: sellerProceeds
        }("");
        if (!sellerSuccess) revert TransferFailed();

        // Refund excess payment
        uint256 excess = msg.value - listing.price;
        if (excess > 0) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: excess}(
                ""
            );
            if (!refundSuccess) revert TransferFailed();
        }

        // Update NFT status
        i_nftContract.setNFTStatus(listing.tokenId, NFT.NFTStatus.NONE);

        emit NFTSold(
            _listingId,
            msg.sender,
            listing.seller,
            listing.tokenId,
            listing.price,
            listing.collectionId
        );
    }

    function getListingDetails(
        uint256 _listingId
    )
        external
        view
        returns (
            address seller,
            uint256 tokenId,
            uint256 price,
            uint256 collectionId,
            bool isActive,
            ListingType listingType,
            uint256 auctionId
        )
    {
        Listing storage listing = listings[_listingId];
        return (
            listing.seller,
            listing.tokenId,
            listing.price,
            listing.collectionId,
            listing.isActive,
            listing.listingType,
            listing.auctionId
        );
    }

    function updateListingType(
        uint256 _listingId,
        ListingType _newType,
        uint256 _startingPrice,
        uint256 _reservePrice,
        uint256 _duration
    ) external nonReentrant {
        Listing storage listing = listings[_listingId];
        if (listing.seller != msg.sender) revert NotSeller();
        if (!listing.isActive) revert ListingNotActive();
        if (_newType == ListingType.NONE) revert InvalidListingType();

        // Cancel existing auction if any
        if (listing.auctionId != 0) {
            i_auctionContract.cancelAuction(msg.sender, listing.auctionId);
            listing.auctionId = 0;
        }

        // Create new auction if needed
        if (_newType == ListingType.AUCTION || _newType == ListingType.BOTH) {
            if (_startingPrice == 0 || _duration == 0)
                revert InvalidAuctionParameters();

            listing.auctionId = i_auctionContract.createAuction(
                msg.sender,
                listing.tokenId,
                _startingPrice,
                _reservePrice,
                _duration
            );
        }

        listing.listingType = _newType;

        // Update NFT status
        if (_newType == ListingType.SALE) {
            i_nftContract.setNFTStatus(listing.tokenId, NFT.NFTStatus.SALE);
        } else if (_newType == ListingType.AUCTION) {
            i_nftContract.setNFTStatus(listing.tokenId, NFT.NFTStatus.AUCTION);
        } else {
            i_nftContract.setNFTStatus(listing.tokenId, NFT.NFTStatus.BOTH);
        }

        emit ListingTypeUpdated(_listingId, _newType);
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
        uint256[] memory creatorListings = new uint256[](listingCounter);
        uint256 count = 0;

        for (uint256 i = 1; i <= listingCounter; ) {
            if (listings[i].isActive) {
                uint256[] memory createdTokens = i_nftContract.getCreatedTokens(
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

    function acceptCollectionOfferAndDelist(
        uint256 collectionId,
        uint256[] calldata tokenIds,
        address offerer
    ) external nonReentrant {
        // Accept the collection offer first
        i_collectionContract.acceptCollectionOffer(
            collectionId,
            tokenIds,
            offerer,
            msg.sender
        );

        // Pre-calculate array length for gas optimization
        uint256 length = tokenIds.length;

        // Using unchecked for loop as we trust the input length
        unchecked {
            for (uint256 i; i < length; ++i) {
                uint256 tokenId = tokenIds[i];

                // Find and deactivate any active listings for this token
                for (uint256 j = 1; j <= listingCounter; ++j) {
                    Listing storage listing = listings[j];

                    if (listing.isActive && listing.tokenId == tokenId) {
                        // Cancel any associated auction
                        if (listing.auctionId != 0) {
                            i_auctionContract.cancelAuctionForDirectSale(
                                listing.auctionId
                            );
                        }

                        // Deactivate the listing
                        listing.isActive = false;

                        // Only set NFT status if it's not already NONE
                        if (
                            i_nftContract.getTokenStatus(tokenId) !=
                            NFT.NFTStatus.NONE
                        ) {
                            i_nftContract.setNFTStatus(
                                tokenId,
                                NFT.NFTStatus.NONE
                            );
                        }

                        // Break inner loop once listing is found
                        break;
                    }
                }
            }
        }

        emit BatchDelisted(tokenIds);
    }

    function isNFTListed(
        uint256 _tokenId
    ) external view returns (bool, uint256) {
        for (uint256 i = 1; i <= listingCounter; ) {
            if (listings[i].tokenId == _tokenId && listings[i].isActive) {
                return (true, i);
            }
            unchecked {
                ++i;
            }
        }
        return (false, 0);
    }

    // Token filtering
    function _isMatchingListing(
        Listing storage listing,
        FilterParams calldata params
    ) internal view returns (bool) {
        if (!listing.isActive) return false;

        // Short circuit early if possible
        if (
            params.listingType != ListingType.NONE &&
            listing.listingType != params.listingType
        ) return false;

        if (
            params.collectionId != 0 &&
            listing.collectionId != params.collectionId
        ) return false;

        // Price checks only if filters are set
        if (params.minPrice > 0 && listing.price < params.minPrice)
            return false;
        if (params.maxPrice > 0 && listing.price > params.maxPrice)
            return false;

        return true;
    }

    function getFilteredListings(
        FilterParams calldata params
    ) external view returns (ListingView[] memory, uint256) {
        // Input validation
        if (params.limit == 0 || params.limit > 100) revert InvalidPageSize();
        if (params.maxPrice > 0 && params.maxPrice < params.minPrice)
            revert PriceFilterMismatch();

        // First pass: count matching listings for array sizing
        uint256 matchCount;
        uint256 listingId = 1;

        // Count matches
        while (listingId <= listingCounter) {
            if (_isMatchingListing(listings[listingId], params)) {
                unchecked {
                    ++matchCount;
                }
            }
            unchecked {
                ++listingId;
            }
        }

        // Return early if no matches or offset is beyond results
        if (matchCount == 0 || params.offset >= matchCount) {
            return (new ListingView[](0), matchCount);
        }

        // Create arrays only if sorting is needed
        uint256[] memory matchingIds;
        uint256[] memory prices;

        if (params.sortOrder != SortOrder.NONE) {
            matchingIds = new uint256[](matchCount);
            prices = new uint256[](matchCount);

            uint256 currentIndex;
            listingId = 1;

            // Collect matching listings for sorting
            while (listingId <= listingCounter) {
                Listing storage listing = listings[listingId];
                if (_isMatchingListing(listing, params)) {
                    matchingIds[currentIndex] = listingId;
                    prices[currentIndex] = listing.price;
                    unchecked {
                        ++currentIndex;
                    }
                }
                unchecked {
                    ++listingId;
                }
            }

            // Sort if needed (using bubble sort)
            for (uint256 i = 0; i < matchCount - 1; ) {
                bool swapped;
                for (uint256 j = 0; j < matchCount - i - 1; ) {
                    bool shouldSwap = params.sortOrder ==
                        SortOrder.PRICE_HIGH_TO_LOW
                        ? prices[j] < prices[j + 1]
                        : prices[j] > prices[j + 1];

                    if (shouldSwap) {
                        (prices[j], prices[j + 1]) = (prices[j + 1], prices[j]);
                        (matchingIds[j], matchingIds[j + 1]) = (
                            matchingIds[j + 1],
                            matchingIds[j]
                        );
                        swapped = true;
                    }
                    unchecked {
                        ++j;
                    }
                }
                if (!swapped) break; // Array is sorted
                unchecked {
                    ++i;
                }
            }
        }

        // Calculate result size based on pagination
        uint256 startIndex = params.offset;
        uint256 endIndex = params.offset + params.limit;
        if (endIndex > matchCount) {
            endIndex = matchCount;
        }
        uint256 resultSize = endIndex - startIndex;

        // Create final result array
        ListingView[] memory result = new ListingView[](resultSize);

        if (params.sortOrder != SortOrder.NONE) {
            // Use sorted arrays
            for (uint256 i = 0; i < resultSize; ) {
                uint256 currentId = matchingIds[startIndex + i];
                Listing storage listing = listings[currentId];
                result[i] = ListingView({
                    listingId: currentId,
                    seller: listing.seller,
                    tokenId: listing.tokenId,
                    price: listing.price,
                    collectionId: listing.collectionId,
                    listingType: listing.listingType,
                    auctionId: listing.auctionId
                });
                unchecked {
                    ++i;
                }
            }
        } else {
            // No sorting needed, collect results directly
            uint256 currentIndex;
            listingId = 1;

            while (listingId <= listingCounter && currentIndex < endIndex) {
                Listing storage listing = listings[listingId];
                if (_isMatchingListing(listing, params)) {
                    if (currentIndex >= startIndex) {
                        result[currentIndex - startIndex] = ListingView({
                            listingId: listingId,
                            seller: listing.seller,
                            tokenId: listing.tokenId,
                            price: listing.price,
                            collectionId: listing.collectionId,
                            listingType: listing.listingType,
                            auctionId: listing.auctionId
                        });
                    }
                    unchecked {
                        ++currentIndex;
                    }
                }
                unchecked {
                    ++listingId;
                }
            }
        }

        return (result, matchCount);
    }

    receive() external payable {}

    fallback() external payable {}
}
