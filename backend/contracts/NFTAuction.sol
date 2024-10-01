// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./NFT.sol";
import "./NFTCreators.sol";

contract NFTAuction is ReentrancyGuard, Ownable {
    using Math for uint256;

    struct Auction {
        address seller;
        uint256 tokenId;
        uint256 startingPrice;
        uint256 reservePrice;
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

    mapping(uint256 => Auction) public auctions;
    mapping(uint256 => uint256) public tokenIdToAuctionId;
    mapping(address => uint256) public userAuctionCount;
    mapping(uint256 => Bid[]) public auctionBids;
    uint256 public auctionCount;

    uint256 public constant MINIMUM_AUCTION_DURATION = 1 days;
    uint256 public constant MAXIMUM_AUCTION_DURATION = 30 days;

    NFT public nftContract;
    NFTCreators public creatorsContract;

    event AuctionCreated(
        uint256 auctionId,
        address seller,
        uint256 tokenId,
        uint256 startingPrice,
        uint256 reservePrice,
        uint256 endTime
    );
    event BidPlaced(uint256 auctionId, address bidder, uint256 amount);
    event AuctionEnded(uint256 auctionId, address winner, uint256 amount);
    event AuctionCancelled(uint256 auctionId);
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

    constructor(
        address _nftContractAddress,
        address _creatorsAddress
    ) Ownable(msg.sender) {
        nftContract = NFT(_nftContractAddress);
        creatorsContract = NFTCreators(_creatorsAddress);
    }

    function createAuction(
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

        require(
            nftContract.ownerOf(_tokenId) == msg.sender,
            "You don't own this NFT"
        );
        require(
            nftContract.isApprovedForAll(msg.sender, address(this)),
            "Contract not approved"
        );

        auctionCount++;
        uint256 endTime = block.timestamp + _duration;

        auctions[auctionCount] = Auction({
            seller: msg.sender,
            tokenId: _tokenId,
            startingPrice: _startingPrice,
            reservePrice: _reservePrice,
            endTime: endTime,
            highestBidder: address(0),
            highestBid: 0,
            ended: false,
            active: true
        });

        tokenIdToAuctionId[_tokenId] = auctionCount;
        userAuctionCount[msg.sender]++;

        uint256 creatorId = creatorsContract.getCreatorIdByAddress(msg.sender);
        creatorsContract.recordActivity(creatorId, "Auction Created", _tokenId);

        emit AuctionCreated(
            auctionCount,
            msg.sender,
            _tokenId,
            _startingPrice,
            _reservePrice,
            endTime
        );

        nftContract.setNFTStatus(_tokenId, NFT.NFTStatus.AUCTION);
    }

    function placeBid(uint256 _tokenId) external payable nonReentrant {
        uint256 auctionId = tokenIdToAuctionId[_tokenId];
        require(
            auctionId != 0 && auctions[auctionId].active,
            "No active auction for this NFT"
        );

        Auction storage auction = auctions[auctionId];
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

        auctionBids[auctionId].push(
            Bid({
                bidder: msg.sender,
                amount: msg.value,
                timestamp: block.timestamp
            })
        );

        uint256 creatorId = creatorsContract.getCreatorIdByAddress(msg.sender);
        creatorsContract.updateBid(creatorId, auctionId, msg.value);
        creatorsContract.recordActivity(
            creatorId,
            "Bid Placed",
            auction.tokenId
        );

        emit BidPlaced(auctionId, msg.sender, msg.value);
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
            nftContract.safeTransferFrom(
                auction.seller,
                auction.highestBidder,
                auction.tokenId
            );

            uint256 fee = calculateFee(auction.highestBid);
            uint256 sellerProceeds = auction.highestBid - fee;

            payable(auction.seller).transfer(sellerProceeds);
            payable(owner()).transfer(fee);

            uint256 auctionSellerId = creatorsContract.getCreatorIdByAddress(
                auction.seller
            );
            creatorsContract.updateItemsSold(auctionSellerId);

            uint256 highestBidderId = creatorsContract.getCreatorIdByAddress(
                auction.highestBidder
            );
            creatorsContract.recordActivity(
                highestBidderId,
                "Auction Won",
                auction.tokenId
            );
            creatorsContract.recordActivity(
                auctionSellerId,
                "Auction Completed",
                auction.tokenId
            );

            emit AuctionEnded(
                _auctionId,
                auction.highestBidder,
                auction.highestBid
            );

            nftContract.addActivity(
                auction.tokenId,
                "Sold in Auction",
                auction.highestBid
            );
        } else {
            if (auction.highestBidder != address(0)) {
                payable(auction.highestBidder).transfer(auction.highestBid);
            }
            uint256 auctionSellerId = creatorsContract.getCreatorIdByAddress(
                auction.seller
            );
            creatorsContract.recordActivity(
                auctionSellerId,
                "Auction Ended (Reserve Not Met)",
                auction.tokenId
            );
            emit AuctionCancelled(_auctionId);
        }

        tokenIdToAuctionId[auction.tokenId] = 0;
        nftContract.setNFTStatus(auction.tokenId, NFT.NFTStatus.NONE);
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

        tokenIdToAuctionId[auction.tokenId] = 0;
        nftContract.setNFTStatus(auction.tokenId, NFT.NFTStatus.NONE);

        uint256 creatorId = creatorsContract.getCreatorIdByAddress(msg.sender);
        creatorsContract.recordActivity(
            creatorId,
            "Auction Cancelled",
            auction.tokenId
        );

        emit AuctionCancelled(_auctionId);
    }

    function isNFTOnAuction(uint256 _tokenId) public view returns (bool) {
        uint256 auctionId = tokenIdToAuctionId[_tokenId];
        return auctions[auctionId].active;
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
            auction.endTime,
            auction.highestBidder,
            auction.highestBid,
            auction.ended,
            auction.active
        );
    }

    function getUserAuctionCount(
        address _user
    ) external view returns (uint256) {
        return userAuctionCount[_user];
    }

    function getAuctionBids(
        uint256 _auctionId
    ) external view returns (Bid[] memory) {
        return auctionBids[_auctionId];
    }

    function calculateFee(uint256 _amount) internal pure returns (uint256) {
        return Math.mulDiv(_amount, 250, 10000); // 2.5% fee
    }

    function getActiveAuctions() external view returns (uint256[] memory) {
        uint256[] memory activeAuctionIds = new uint256[](auctionCount);
        uint256 activeCount = 0;

        for (uint256 i = 1; i <= auctionCount; i++) {
            if (auctions[i].active && !auctions[i].ended) {
                activeAuctionIds[activeCount] = i;
                activeCount++;
            }
        }

        // Resize the array to remove empty slots
        assembly {
            mstore(activeAuctionIds, activeCount)
        }

        return activeAuctionIds;
    }

    function extendAuction(
        uint256 _auctionId,
        uint256 _additionalTime
    ) external {
        Auction storage auction = auctions[_auctionId];
        require(
            msg.sender == auction.seller,
            "Only the seller can extend the auction"
        );
        require(
            auction.active && !auction.ended,
            "Auction is not active or has ended"
        );
        require(block.timestamp < auction.endTime, "Auction has already ended");

        uint256 newEndTime = auction.endTime + _additionalTime;
        require(
            newEndTime - block.timestamp <= MAXIMUM_AUCTION_DURATION,
            "Cannot extend beyond maximum duration"
        );

        auction.endTime = newEndTime;
        emit AuctionExtended(_auctionId, newEndTime);
    }

    function updateReservePrice(
        uint256 _auctionId,
        uint256 _newReservePrice
    ) external {
        Auction storage auction = auctions[_auctionId];
        require(
            msg.sender == auction.seller,
            "Only the seller can update the reserve price"
        );
        require(
            auction.active && !auction.ended,
            "Auction is not active or has ended"
        );
        require(
            _newReservePrice >= auction.startingPrice,
            "New reserve price must be at least the starting price"
        );

        auction.reservePrice = _newReservePrice;
        emit ReservePriceUpdated(_auctionId, _newReservePrice);
    }

    function withdrawBid(uint256 _auctionId) external nonReentrant {
        Auction storage auction = auctions[_auctionId];
        require(
            auction.active && !auction.ended,
            "Auction is not active or has ended"
        );
        require(
            msg.sender != auction.highestBidder,
            "Highest bidder cannot withdraw their bid"
        );

        uint256 bidAmount = 0;
        for (uint256 i = 0; i < auctionBids[_auctionId].length; i++) {
            if (auctionBids[_auctionId][i].bidder == msg.sender) {
                bidAmount = auctionBids[_auctionId][i].amount;
                // Remove the bid from the array by replacing it with the last element and reducing the array length
                auctionBids[_auctionId][i] = auctionBids[_auctionId][
                    auctionBids[_auctionId].length - 1
                ];
                auctionBids[_auctionId].pop();
                break;
            }
        }

        require(bidAmount > 0, "No bids found for this bidder");

        payable(msg.sender).transfer(bidAmount);
        emit BidWithdrawn(_auctionId, msg.sender, bidAmount);
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
