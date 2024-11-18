// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./NFT.sol";

contract NFTAuction is ReentrancyGuard, Ownable {
    using Math for uint256;

    address public marketplaceContract;

    struct Auction {
        address seller;
        uint256 tokenId;
        uint256 startingPrice;
        uint256 reservePrice;
        uint256 startTime;
        uint256 endTime;
        address highestBidder;
        uint256 highestBid;
        bool ended;
        bool active;
    }

    struct Bid {
        address bidder;
        uint256 amount;
        uint256 timestamp;
    }

    // Custom Errors
    error InvalidDuration();
    error InvalidStartingPrice();
    error InvalidReservePrice();
    error NotTokenOwner();
    error ContractNotApproved();
    error TokenNotAvailable();
    error AuctionNotFound();
    error InvalidAuctionState();
    error AuctionExpired();
    error BidTooLow();
    error BelowStartingPrice();
    error NotSeller();
    error BidsAlreadyPlaced();
    error NoBidsFound();
    error HighestBidderCannotWithdraw();
    error TokenAlreadyHasAuction();
    error NotMarketplace();
    error BidderRefundFailed();

    // Main storage
    mapping(uint256 => Auction) public auctions;
    mapping(uint256 => uint256) public tokenIdToAuctionId;
    mapping(uint256 => Bid[]) public auctionBids;

    mapping(address => mapping(uint256 => bool)) public userBids; // user address => auctionId => has bid
    mapping(address => uint256[]) private userAuctionBids; // user address => array of auction IDs they've bid on

    uint256 public auctionCount;

    // Constants
    uint256 public constant MINIMUM_AUCTION_DURATION = 1 days;
    uint256 public constant MAXIMUM_AUCTION_DURATION = 30 days;
    uint256 private constant FEE_DENOMINATOR = 10000;
    uint256 private constant FEE_NUMERATOR = 250; // 2.5% fee

    NFT public immutable nftContract;

    // Events
    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed seller,
        uint256 indexed tokenId,
        uint256 startingPrice,
        uint256 reservePrice,
        uint256 startTime,
        uint256 endTime
    );
    event BidPlaced(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 amount
    );
    event AuctionEnded(
        uint256 indexed auctionId,
        address indexed winner,
        uint256 amount
    );
    event AuctionCancelled(uint256 indexed auctionId);
    event AuctionExtended(uint256 indexed auctionId, uint256 newEndTime);
    event ReservePriceUpdated(
        uint256 indexed auctionId,
        uint256 newReservePrice
    );
    event BidWithdrawn(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 amount
    );
    event AuctionCancelledForDirectSale(uint256 indexed auctionId);

    constructor(
        address _nftContractAddress,
        address _marketplaceAddress
    ) Ownable(msg.sender) {
        nftContract = NFT(_nftContractAddress);
        marketplaceContract = _marketplaceAddress;
    }

    function updateMarketplaceContract(
        address _marketplaceContractAddress
    ) external onlyOwner {
        marketplaceContract = _marketplaceContractAddress;
    }

    function createAuction(
        address _sender,
        uint256 _tokenId,
        uint256 _startingPrice,
        uint256 _reservePrice,
        uint256 _duration
    ) external nonReentrant returns (uint256) {
        if (
            _duration < MINIMUM_AUCTION_DURATION ||
            _duration > MAXIMUM_AUCTION_DURATION
        ) revert InvalidDuration();
        if (_startingPrice == 0) revert InvalidStartingPrice();
        if (_reservePrice < _startingPrice) revert InvalidReservePrice();
        if (nftContract.ownerOf(_tokenId) != _sender) revert NotTokenOwner();
        if (!nftContract.isApprovedForAll(_sender, address(this)))
            revert ContractNotApproved();
        if (
            nftContract.getTokenStatus(_tokenId) != NFT.NFTStatus.NONE &&
            nftContract.getTokenStatus(_tokenId) != NFT.NFTStatus.SALE
        ) revert TokenAlreadyHasAuction();
        if (tokenIdToAuctionId[_tokenId] != 0) revert TokenAlreadyHasAuction();

        unchecked {
            auctionCount++;
        }

        uint256 startTime = block.timestamp;
        uint256 endTime = block.timestamp + _duration;

        auctions[auctionCount] = Auction({
            seller: _sender,
            tokenId: _tokenId,
            startingPrice: _startingPrice,
            reservePrice: _reservePrice,
            startTime: startTime,
            endTime: endTime,
            highestBidder: address(0),
            highestBid: 0,
            ended: false,
            active: true
        });

        tokenIdToAuctionId[_tokenId] = auctionCount;
        nftContract.setNFTStatus(_tokenId, NFT.NFTStatus.AUCTION);

        emit AuctionCreated(
            auctionCount,
            _sender,
            _tokenId,
            _startingPrice,
            _reservePrice,
            startTime,
            endTime
        );

        return auctionCount;
    }

    function isNFTOnAuction(
        uint256 _tokenId
    ) public view returns (bool, uint256) {
        uint256 auctionId = tokenIdToAuctionId[_tokenId];
        if (auctionId == 0) return (false, 0);

        Auction storage auction = auctions[auctionId];
        return (auction.active && !auction.ended, auctionId);
    }

    function placeBid(uint256 _tokenId) external payable nonReentrant {
        uint256 auctionId = tokenIdToAuctionId[_tokenId];
        if (auctionId == 0) revert AuctionNotFound();

        Auction storage auction = auctions[auctionId];
        if (!auction.active || auction.ended) revert InvalidAuctionState();
        if (block.timestamp >= auction.endTime) revert AuctionExpired();
        if (msg.value <= auction.highestBid) revert BidTooLow();
        if (msg.value < auction.startingPrice) revert BelowStartingPrice();

        // Refund previous highest bidder
        if (auction.highestBidder != address(0)) {
            payable(auction.highestBidder).transfer(auction.highestBid);
        }

        auction.highestBidder = msg.sender;
        auction.highestBid = msg.value;

        // Record bid
        auctionBids[auctionId].push(
            Bid({
                bidder: msg.sender,
                amount: msg.value,
                timestamp: block.timestamp
            })
        );

        // Track user bids if first time bidding on this auction
        if (!userBids[msg.sender][auctionId]) {
            userBids[msg.sender][auctionId] = true;
            userAuctionBids[msg.sender].push(auctionId);
        }

        emit BidPlaced(auctionId, msg.sender, msg.value);
    }

    function cancelAuctionForDirectSale(
        uint256 _auctionId
    ) external nonReentrant {
        if (msg.sender != marketplaceContract) revert NotMarketplace();

        Auction storage auction = auctions[_auctionId];
        if (!auction.active || auction.ended) revert InvalidAuctionState();

        auction.ended = true;
        auction.active = false;

        // Only handle bid refunds, NO token transfer
        if (auction.highestBidder != address(0)) {
            payable(auction.highestBidder).transfer(auction.highestBid);
        }

        tokenIdToAuctionId[auction.tokenId] = 0;

        // Only set NFT status if it's not already NONE
        if (nftContract.getTokenStatus(auction.tokenId) != NFT.NFTStatus.NONE) {
            nftContract.setNFTStatus(auction.tokenId, NFT.NFTStatus.NONE);
        }

        emit AuctionCancelledForDirectSale(_auctionId);
    }

    function endAuction(
        uint256 _auctionId
    ) external nonReentrant returns (bool) {
        if (msg.sender != marketplaceContract) revert NotMarketplace();

        Auction storage auction = auctions[_auctionId];
        if (!auction.active || auction.ended) revert InvalidAuctionState();
        if (block.timestamp < auction.endTime) revert InvalidAuctionState();

        auction.ended = true;
        auction.active = false;

        if (auction.highestBid >= auction.reservePrice) {
            // Transfer NFT to winner
            nftContract.safeTransferFrom(
                auction.seller,
                auction.highestBidder,
                auction.tokenId
            );

            // Calculate and distribute fees
            uint256 fee = (auction.highestBid * FEE_NUMERATOR) /
                FEE_DENOMINATOR;
            uint256 sellerProceeds = auction.highestBid - fee;

            payable(auction.seller).transfer(sellerProceeds);
            payable(owner()).transfer(fee);

            emit AuctionEnded(
                _auctionId,
                auction.highestBidder,
                auction.highestBid
            );
        } else {
            // Refund highest bidder if reserve price wasn't met
            if (auction.highestBidder != address(0)) {
                payable(auction.highestBidder).transfer(auction.highestBid);
            }
            emit AuctionCancelled(_auctionId);
        }

        tokenIdToAuctionId[auction.tokenId] = 0;

        // Indicate success
        return true;
    }

    function cancelAuction(
        address _sender,
        uint256 _auctionId
    ) external nonReentrant {
        Auction storage auction = auctions[_auctionId];
        if (_sender != auction.seller) revert NotSeller();
        if (!auction.active || auction.ended) revert InvalidAuctionState();
        if (auction.highestBidder != address(0)) revert BidsAlreadyPlaced();

        auction.ended = true;
        auction.active = false;

        tokenIdToAuctionId[auction.tokenId] = 0;
        nftContract.setNFTStatus(auction.tokenId, NFT.NFTStatus.NONE);

        emit AuctionCancelled(_auctionId);
    }

    function withdrawBid(uint256 _auctionId) external nonReentrant {
        Auction storage auction = auctions[_auctionId];
        if (!auction.active || auction.ended) revert InvalidAuctionState();
        if (msg.sender == auction.highestBidder)
            revert HighestBidderCannotWithdraw();

        uint256 bidAmount;
        uint256 bidsLength = auctionBids[_auctionId].length;

        for (uint256 i; i < bidsLength; ) {
            if (auctionBids[_auctionId][i].bidder == msg.sender) {
                bidAmount = auctionBids[_auctionId][i].amount;
                // Swap with last element and pop
                auctionBids[_auctionId][i] = auctionBids[_auctionId][
                    bidsLength - 1
                ];
                auctionBids[_auctionId].pop();
                break;
            }
            unchecked {
                ++i;
            }
        }

        if (bidAmount == 0) revert NoBidsFound();

        payable(msg.sender).transfer(bidAmount);
        emit BidWithdrawn(_auctionId, msg.sender, bidAmount);
    }

    // View functions
    function getTokenBids(uint256 _tokenId) public view returns (Bid[] memory) {
        uint256 auctionId = tokenIdToAuctionId[_tokenId];
        if (auctionId == 0) revert AuctionNotFound();
        return auctionBids[auctionId];
    }

    function getUserBids(
        address _user
    ) external view returns (uint256[] memory) {
        return userAuctionBids[_user];
    }

    function getAuction(
        uint256 _auctionId
    )
        external
        view
        returns (
            address seller,
            uint256 tokenId,
            uint256 startingPrice,
            uint256 reservePrice,
            uint256 startTime,
            uint256 endTime,
            address highestBidder,
            uint256 highestBid,
            bool ended,
            bool active
        )
    {
        Auction storage auction = auctions[_auctionId];
        return (
            auction.seller,
            auction.tokenId,
            auction.startingPrice,
            auction.reservePrice,
            auction.startTime,
            auction.endTime,
            auction.highestBidder,
            auction.highestBid,
            auction.ended,
            auction.active
        );
    }

    function getActiveAuctions() external view returns (uint256[] memory) {
        uint256[] memory activeAuctionIds = new uint256[](auctionCount);
        uint256 activeCount;

        for (uint256 i = 1; i <= auctionCount; ) {
            if (auctions[i].active && !auctions[i].ended) {
                activeAuctionIds[activeCount] = i;
                unchecked {
                    ++activeCount;
                }
            }
            unchecked {
                ++i;
            }
        }

        // Resize array
        assembly {
            mstore(activeAuctionIds, activeCount)
        }

        return activeAuctionIds;
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) public pure returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
