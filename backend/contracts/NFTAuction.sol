// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./NFTCollection.sol";
import "./NFTMarketplace.sol";

contract NFTAuction is ReentrancyGuard, Ownable {
    using Math for uint256;

    struct Auction {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 startingPrice;
        uint256 reservePrice;
        uint256 endTime;
        address highestBidder;
        uint256 highestBid;
        bool ended;
        bool active;
    }

    mapping(uint256 => Auction) public auctions;
    mapping(address => mapping(uint256 => uint256)) public nftToAuctionId;
    uint256 public auctionCount;

    NFTMarketplace public marketplaceContract;

    uint256 public constant MINIMUM_AUCTION_DURATION = 1 days;
    uint256 public constant MAXIMUM_AUCTION_DURATION = 30 days;

    event AuctionCreated(
        uint256 auctionId,
        address seller,
        address nftContract,
        uint256 tokenId,
        uint256 startingPrice,
        uint256 reservePrice,
        uint256 endTime
    );
    event BidPlaced(uint256 auctionId, address bidder, uint256 amount);
    event AuctionEnded(uint256 auctionId, address winner, uint256 amount);
    event AuctionCancelled(uint256 auctionId);

    constructor(address _marketplaceAddress) Ownable(msg.sender) {
        marketplaceContract = NFTMarketplace(_marketplaceAddress);
    }

    function createAuction(
        address _nftContract,
        uint256 _tokenId,
        uint256 _startingPrice,
        uint256 _reservePrice,
        uint256 _duration
    ) external nonReentrant {
        require(
            _duration >= MINIMUM_AUCTION_DURATION &&
                _duration <= MAXIMUM_AUCTION_DURATION,
            "Invalid auction duration"
        );
        require(_startingPrice > 0, "Starting price must be greater than zero");
        require(
            _reservePrice >= _startingPrice,
            "Reserve price must be greater than or equal to starting price"
        );

        IERC721 nft = IERC721(_nftContract);
        require(nft.ownerOf(_tokenId) == msg.sender, "You don't own this NFT");
        require(
            nft.isApprovedForAll(msg.sender, address(this)),
            "Contract not approved"
        );

        require(
            !marketplaceContract.isNFTListed(_nftContract, _tokenId),
            "NFT is already listed in the marketplace"
        );

        auctionCount++;
        uint256 endTime = block.timestamp + _duration;

        auctions[auctionCount] = Auction({
            seller: msg.sender,
            nftContract: _nftContract,
            tokenId: _tokenId,
            startingPrice: _startingPrice,
            reservePrice: _reservePrice,
            endTime: endTime,
            highestBidder: address(0),
            highestBid: 0,
            ended: false,
            active: true
        });

        nftToAuctionId[_nftContract][_tokenId] = auctionCount;

        emit AuctionCreated(
            auctionCount,
            msg.sender,
            _nftContract,
            _tokenId,
            _startingPrice,
            _reservePrice,
            endTime
        );
    }

    function placeBid(uint256 _auctionId) external payable nonReentrant {
        Auction storage auction = auctions[_auctionId];
        require(auction.active, "Auction is not active");
        require(!auction.ended, "Auction has ended");
        require(block.timestamp < auction.endTime, "Auction has expired");
        require(
            msg.value > auction.highestBid,
            "Bid must be higher than current highest bid"
        );
        require(
            msg.value >= auction.startingPrice,
            "Bid must be at least the starting price"
        );

        if (auction.highestBidder != address(0)) {
            payable(auction.highestBidder).transfer(auction.highestBid);
        }

        auction.highestBidder = msg.sender;
        auction.highestBid = msg.value;

        emit BidPlaced(_auctionId, msg.sender, msg.value);
    }

    function endAuction(uint256 _auctionId) external nonReentrant {
        Auction storage auction = auctions[_auctionId];
        require(auction.active, "Auction is not active");
        require(!auction.ended, "Auction has already ended");
        require(
            block.timestamp >= auction.endTime,
            "Auction has not yet ended"
        );

        auction.ended = true;
        auction.active = false;

        if (auction.highestBid >= auction.reservePrice) {
            IERC721(auction.nftContract).safeTransferFrom(
                auction.seller,
                auction.highestBidder,
                auction.tokenId
            );

            uint256 fee = calculateFee(auction.highestBid);
            uint256 sellerProceeds = auction.highestBid - fee;

            payable(auction.seller).transfer(sellerProceeds);
            payable(owner()).transfer(fee);

            emit AuctionEnded(
                _auctionId,
                auction.highestBidder,
                auction.highestBid
            );
        } else {
            if (auction.highestBidder != address(0)) {
                payable(auction.highestBidder).transfer(auction.highestBid);
            }
            emit AuctionCancelled(_auctionId);
        }

        nftToAuctionId[auction.nftContract][auction.tokenId] = 0;
    }

    function cancelAuction(uint256 _auctionId) external nonReentrant {
        Auction storage auction = auctions[_auctionId];
        require(
            msg.sender == auction.seller,
            "Only the seller can cancel the auction"
        );
        require(auction.active, "Auction is not active");
        require(!auction.ended, "Auction has already ended");
        require(
            auction.highestBidder == address(0),
            "Cannot cancel auction with bids"
        );

        auction.ended = true;
        auction.active = false;

        nftToAuctionId[auction.nftContract][auction.tokenId] = 0;

        emit AuctionCancelled(_auctionId);
    }

    function isNFTOnAuction(
        address _nftContract,
        uint256 _tokenId
    ) public view returns (bool) {
        uint256 auctionId = nftToAuctionId[_nftContract][_tokenId];
        return auctions[auctionId].active;
    }

    function getAuction(
        uint256 _auctionId
    )
        external
        view
        returns (
            address seller,
            address nftContract,
            uint256 tokenId,
            uint256 startingPrice,
            uint256 reservePrice,
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
            auction.nftContract,
            auction.tokenId,
            auction.startingPrice,
            auction.reservePrice,
            auction.endTime,
            auction.highestBidder,
            auction.highestBid,
            auction.ended,
            auction.active
        );
    }

    function calculateFee(uint256 _amount) internal pure returns (uint256) {
        return Math.mulDiv(_amount, 250, 10000);
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
