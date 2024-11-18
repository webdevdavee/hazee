import { ethers } from "hardhat";
import { expect } from "chai";
import {
  NFTAuction,
  NFT,
  NFT__factory,
  NFTAuction__factory,
} from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("NFTAuction", function () {
  let nftAuction: NFTAuction;
  let nft: NFT;
  let owner: HardhatEthersSigner;
  let seller: HardhatEthersSigner;
  let bidder1: HardhatEthersSigner;
  let bidder2: HardhatEthersSigner;
  let marketplace: HardhatEthersSigner;

  const TOKEN_ID = 1;
  const STARTING_PRICE = ethers.parseEther("1");
  const RESERVE_PRICE = ethers.parseEther("2");
  const AUCTION_DURATION = 7 * 24 * 60 * 60; // 7 days

  beforeEach(async function () {
    [owner, seller, bidder1, bidder2, marketplace] = await ethers.getSigners();

    // Deploy NFT
    const NFTFactory = (await ethers.getContractFactory(
      "NFT"
    )) as unknown as NFT__factory;
    nft = await NFTFactory.deploy(
      "TestNFT",
      "TNFT",
      ethers.ZeroAddress, // Temporary auction address
      ethers.ZeroAddress // Temporary marketplace address
    );
    await nft.waitForDeployment();
    const nftContractAddress = await nft.getAddress();

    // Deploy NFTAuction
    const NFTAuctionFactory = (await ethers.getContractFactory(
      "NFTAuction"
    )) as unknown as NFTAuction__factory;
    nftAuction = await NFTAuctionFactory.deploy(
      nftContractAddress,
      marketplace
    );
    await nftAuction.waitForDeployment();
    const nftAuctionAddress = await nftAuction.getAddress();

    // Update NFT with correct NFTAuction address
    await nft.updateAuctionContract(nftAuctionAddress);

    // Mint an NFT for the seller
    const tokenURI = "https://example.com/token/1";
    const price = ethers.parseEther("1");
    const collectionId = 1;

    await nft.connect(seller).mint(seller, tokenURI, price, collectionId);

    // Approve NFTAuction contract
    await nft
      .connect(seller)
      .setApprovalForAll(await nftAuction.getAddress(), true);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await nftAuction.owner()).to.equal(await owner.getAddress());
    });

    it("Should set the correct NFT contract address", async function () {
      expect(await nftAuction.nftContract()).to.equal(await nft.getAddress());
    });
  });

  describe("Creating an auction", function () {
    it("Should create an auction successfully", async function () {
      const startTime = await time.latest();
      const endTime = startTime + AUCTION_DURATION;

      // Create the auction
      const tx = await nftAuction
        .connect(seller)
        .createAuction(
          seller,
          TOKEN_ID,
          STARTING_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );

      // Get the actual block timestamp from the transaction
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);
      const actualStartTime = block!.timestamp;
      const actualEndTime = actualStartTime + AUCTION_DURATION;

      await expect(tx)
        .to.emit(nftAuction, "AuctionCreated")
        .withArgs(
          1n,
          await seller.getAddress(),
          TOKEN_ID,
          STARTING_PRICE,
          RESERVE_PRICE,
          actualStartTime,
          actualEndTime
        );

      // Verify the auction state
      const auction = await nftAuction.getAuction(1n);
      expect(auction.seller).to.equal(await seller.getAddress());
      expect(auction.tokenId).to.equal(TOKEN_ID);
      expect(auction.startingPrice).to.equal(STARTING_PRICE);
      expect(auction.reservePrice).to.equal(RESERVE_PRICE);
      expect(auction.startTime).to.equal(actualStartTime);
      expect(auction.endTime).to.equal(actualEndTime);
      expect(auction.highestBidder).to.equal(ethers.ZeroAddress);
      expect(auction.highestBid).to.equal(0);
      expect(auction.ended).to.be.false;
      expect(auction.active).to.be.true;
    });

    it("Should fail to create an auction for a non-owned NFT", async function () {
      await expect(
        nftAuction
          .connect(bidder1)
          .createAuction(
            bidder1,
            TOKEN_ID,
            STARTING_PRICE,
            RESERVE_PRICE,
            AUCTION_DURATION
          )
      ).to.be.revertedWithCustomError(nftAuction, "NotTokenOwner");
    });

    it("Should fail to create an auction with invalid duration", async function () {
      await expect(
        nftAuction.connect(seller).createAuction(
          seller,
          TOKEN_ID,
          STARTING_PRICE,
          RESERVE_PRICE,
          60n // Duration less than MINIMUM_AUCTION_DURATION
        )
      ).to.be.revertedWithCustomError(nftAuction, "InvalidDuration");
    });

    it("Should fail to create an auction with zero starting price", async function () {
      await expect(
        nftAuction.connect(seller).createAuction(
          seller,
          TOKEN_ID,
          0, // Zero starting price
          RESERVE_PRICE,
          AUCTION_DURATION
        )
      ).to.be.revertedWithCustomError(nftAuction, "InvalidStartingPrice");
    });

    it("Should fail to create an auction with reserve price below starting price", async function () {
      await expect(
        nftAuction.connect(seller).createAuction(
          seller,
          TOKEN_ID,
          STARTING_PRICE,
          STARTING_PRICE - 1n, // Reserve price less than starting price
          AUCTION_DURATION
        )
      ).to.be.revertedWithCustomError(nftAuction, "InvalidReservePrice");
    });
  });

  describe("isNFTOnAuction", function () {
    it("Should return false for non-existent auction", async function () {
      const [isOnAuction, auctionId] = await nftAuction.isNFTOnAuction(
        TOKEN_ID
      );
      expect(isOnAuction).to.be.false;
      expect(auctionId).to.equal(0);
    });

    it("Should return true for active auction", async function () {
      // Create auction
      await nftAuction
        .connect(seller)
        .createAuction(
          seller,
          TOKEN_ID,
          STARTING_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );

      const [isOnAuction, auctionId] = await nftAuction.isNFTOnAuction(
        TOKEN_ID
      );
      expect(isOnAuction).to.be.true;
      expect(auctionId).to.equal(1);
    });

    it("Should return false for ended auction", async function () {
      // Create and end auction
      await nftAuction
        .connect(seller)
        .createAuction(
          seller,
          TOKEN_ID,
          STARTING_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );

      await nftAuction
        .connect(bidder1)
        .placeBid(TOKEN_ID, { value: ethers.parseEther("2.5") });

      await time.increase(AUCTION_DURATION + 1);
      await nftAuction.connect(marketplace).endAuction(1);

      const [isOnAuction, auctionId] = await nftAuction.isNFTOnAuction(
        TOKEN_ID
      );
      expect(isOnAuction).to.be.false;
      // Since tokenIdToAuctionId is cleared after auction ends
      expect(auctionId).to.equal(0);
    });

    it("Should return false for cancelled auction", async function () {
      // Create and cancel auction
      await nftAuction
        .connect(seller)
        .createAuction(
          seller,
          TOKEN_ID,
          STARTING_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );

      await nftAuction.connect(seller).cancelAuction(seller, 1);

      const [isOnAuction, auctionId] = await nftAuction.isNFTOnAuction(
        TOKEN_ID
      );
      expect(isOnAuction).to.be.false;
      // Since tokenIdToAuctionId is cleared after auction is cancelled
      expect(auctionId).to.equal(0);
    });
  });

  describe("cancel Auction For Direct Sale", function () {
    beforeEach(async function () {
      await nftAuction
        .connect(seller)
        .createAuction(
          seller,
          TOKEN_ID,
          STARTING_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );
    });

    it("Should allow marketplace to cancel auction for direct sale", async function () {
      await nftAuction
        .connect(bidder1)
        .placeBid(TOKEN_ID, { value: ethers.parseEther("1.5") });

      const bidderBalanceBefore = await ethers.provider.getBalance(
        await bidder1.getAddress()
      );

      await expect(
        nftAuction.connect(marketplace).cancelAuctionForDirectSale(1)
      )
        .to.emit(nftAuction, "AuctionCancelledForDirectSale")
        .withArgs(1);

      const auction = await nftAuction.getAuction(1);
      expect(auction.active).to.be.false;
      expect(auction.ended).to.be.true;

      // Verify NFT status is reset
      expect(await nft.getTokenStatus(TOKEN_ID)).to.equal(0);

      // Verify bidder was refunded
      const bidderBalanceAfter = await ethers.provider.getBalance(
        await bidder1.getAddress()
      );
      expect(bidderBalanceAfter).to.be.gt(bidderBalanceBefore);
    });

    it("Should not allow non-marketplace address to cancel auction for direct sale", async function () {
      await expect(
        nftAuction.connect(owner).cancelAuctionForDirectSale(1)
      ).to.be.revertedWithCustomError(nftAuction, "NotMarketplace");
    });

    it("Should not allow cancelling an already ended auction for direct sale", async function () {
      await time.increase(AUCTION_DURATION + 1);
      await nftAuction.connect(marketplace).endAuction(1);

      await expect(
        nftAuction.connect(marketplace).cancelAuctionForDirectSale(1)
      ).to.be.revertedWithCustomError(nftAuction, "InvalidAuctionState");
    });
  });

  describe("Placing bids", function () {
    beforeEach(async function () {
      await nftAuction
        .connect(seller)
        .createAuction(
          seller,
          TOKEN_ID,
          STARTING_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );
    });

    it("Should place a bid successfully", async function () {
      await expect(
        nftAuction
          .connect(bidder1)
          .placeBid(TOKEN_ID, { value: ethers.parseEther("1.5") })
      )
        .to.emit(nftAuction, "BidPlaced")
        .withArgs(1n, await bidder1.getAddress(), ethers.parseEther("1.5"));
    });

    it("Should fail to place a bid for non-existent auction", async function () {
      await expect(
        nftAuction
          .connect(bidder1)
          .placeBid(999, { value: ethers.parseEther("1.5") })
      ).to.be.revertedWithCustomError(nftAuction, "AuctionNotFound");
    });
  });

  describe("Auction creation restrictions", function () {
    it("Should prevent creating auction for token that already has an active auction", async function () {
      await nftAuction
        .connect(seller)
        .createAuction(
          seller,
          TOKEN_ID,
          STARTING_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );

      await expect(
        nftAuction
          .connect(seller)
          .createAuction(
            seller,
            TOKEN_ID,
            STARTING_PRICE,
            RESERVE_PRICE,
            AUCTION_DURATION
          )
      ).to.be.revertedWithCustomError(nftAuction, "TokenAlreadyHasAuction");
    });

    it("Should allow creating new auction after previous one is cancelled", async function () {
      // Create and cancel first auction
      await nftAuction
        .connect(seller)
        .createAuction(
          seller,
          TOKEN_ID,
          STARTING_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );

      await nftAuction.connect(seller).cancelAuction(seller, 1);

      // Should be able to create new auction
      await expect(
        nftAuction
          .connect(seller)
          .createAuction(
            seller,
            TOKEN_ID,
            STARTING_PRICE,
            RESERVE_PRICE,
            AUCTION_DURATION
          )
      ).to.not.be.reverted;
    });
  });

  describe("Ending an auction", function () {
    beforeEach(async function () {
      await nftAuction
        .connect(seller)
        .createAuction(
          seller,
          TOKEN_ID,
          STARTING_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );
    });

    it("Should end an auction successfully when reserve price is met", async function () {
      await nftAuction
        .connect(bidder1)
        .placeBid(TOKEN_ID, { value: ethers.parseEther("2.5") });
      await time.increase(AUCTION_DURATION + 1);
      await expect(nftAuction.connect(marketplace).endAuction(1n))
        .to.emit(nftAuction, "AuctionEnded")
        .withArgs(1n, await bidder1.getAddress(), ethers.parseEther("2.5"));

      expect(await nft.ownerOf(TOKEN_ID)).to.equal(await bidder1.getAddress());
    });

    it("Should refund the highest bidder when reserve price is not met", async function () {
      await nftAuction
        .connect(bidder1)
        .placeBid(TOKEN_ID, { value: ethers.parseEther("1.5") });
      await time.increase(AUCTION_DURATION + 1);

      const bidderBalanceBefore = await ethers.provider.getBalance(
        await bidder1.getAddress()
      );
      await nftAuction.connect(marketplace).endAuction(1n);
      const bidderBalanceAfter = await ethers.provider.getBalance(
        await bidder1.getAddress()
      );

      expect(bidderBalanceAfter).to.be.gt(bidderBalanceBefore);
    });

    it("Should fail to end an auction before its end time", async function () {
      await expect(
        nftAuction.connect(marketplace).endAuction(1n)
      ).to.be.revertedWithCustomError(nftAuction, "InvalidAuctionState");
    });
  });

  describe("Cancelling an auction", function () {
    beforeEach(async function () {
      await nftAuction
        .connect(seller)
        .createAuction(
          seller,
          TOKEN_ID,
          STARTING_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );
    });

    it("Should cancel an auction successfully", async function () {
      await expect(nftAuction.connect(seller).cancelAuction(seller, 1n))
        .to.emit(nftAuction, "AuctionCancelled")
        .withArgs(1n);

      const auction = await nftAuction.getAuction(1n);
      expect(auction.active).to.be.false;
      expect(auction.ended).to.be.true;
    });

    it("Should fail to cancel an auction with bids", async function () {
      await nftAuction
        .connect(bidder1)
        .placeBid(TOKEN_ID, { value: ethers.parseEther("1.5") });
      await expect(
        nftAuction.connect(seller).cancelAuction(seller, 1n)
      ).to.be.revertedWithCustomError(nftAuction, "BidsAlreadyPlaced");
    });

    it("Should fail to cancel an auction by non-seller", async function () {
      await expect(
        nftAuction.connect(bidder1).cancelAuction(bidder1, 1n)
      ).to.be.revertedWithCustomError(nftAuction, "NotSeller");
    });
  });

  describe("Auction queries", function () {
    beforeEach(async function () {
      await nftAuction
        .connect(seller)
        .createAuction(
          seller,
          TOKEN_ID,
          STARTING_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );
    });

    it("Should return correct auction details", async function () {
      const auction = await nftAuction.getAuction(1n);
      expect(auction.seller).to.equal(await seller.getAddress());
      expect(auction.tokenId).to.equal(TOKEN_ID);
      expect(auction.startingPrice).to.equal(STARTING_PRICE);
      expect(auction.reservePrice).to.equal(RESERVE_PRICE);
    });

    it("Should return correct auction bids", async function () {
      await nftAuction
        .connect(bidder1)
        .placeBid(TOKEN_ID, { value: ethers.parseEther("1.5") });
      await nftAuction
        .connect(bidder2)
        .placeBid(TOKEN_ID, { value: ethers.parseEther("2.0") });

      const bids = await nftAuction.getTokenBids(TOKEN_ID);
      expect(bids.length).to.equal(2);
      expect(bids[0].bidder).to.equal(await bidder1.getAddress());
      expect(bids[1].bidder).to.equal(await bidder2.getAddress());
    });
  });

  describe("Withdrawing a bid", function () {
    beforeEach(async function () {
      await nftAuction
        .connect(seller)
        .createAuction(
          seller,
          TOKEN_ID,
          STARTING_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );
      await nftAuction
        .connect(bidder1)
        .placeBid(TOKEN_ID, { value: ethers.parseEther("1.5") });
      await nftAuction
        .connect(bidder2)
        .placeBid(TOKEN_ID, { value: ethers.parseEther("2.0") });
    });

    it("Should allow a non-highest bidder to withdraw their bid", async function () {
      const bidderBalanceBefore = await ethers.provider.getBalance(
        await bidder1.getAddress()
      );
      await expect(nftAuction.connect(bidder1).withdrawBid(1n))
        .to.emit(nftAuction, "BidWithdrawn")
        .withArgs(1n, await bidder1.getAddress(), ethers.parseEther("1.5"));

      const bidderBalanceAfter = await ethers.provider.getBalance(
        await bidder1.getAddress()
      );
      expect(bidderBalanceAfter).to.be.gt(bidderBalanceBefore);
    });

    it("Should not allow the highest bidder to withdraw their bid", async function () {
      await expect(
        nftAuction.connect(bidder2).withdrawBid(1n)
      ).to.be.revertedWithCustomError(
        nftAuction,
        "HighestBidderCannotWithdraw"
      );
    });
  });

  describe("Getting active auctions", function () {
    beforeEach(async function () {
      const tokenURI = "https://example.com/token/1";
      const price = ethers.parseEther("1");
      const collectionId = 1n;

      // Create multiple auctions
      await nftAuction
        .connect(seller)
        .createAuction(
          seller,
          TOKEN_ID,
          STARTING_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );

      await nft.connect(seller).mint(seller, tokenURI, price, collectionId);

      await nftAuction
        .connect(seller)
        .createAuction(
          seller,
          2n,
          STARTING_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );
    });

    it("Should return all active auctions", async function () {
      const activeAuctions = await nftAuction.getActiveAuctions();
      expect(activeAuctions.length).to.equal(2);
      expect(activeAuctions[0]).to.equal(1n);
      expect(activeAuctions[1]).to.equal(2n);
    });

    it("Should not include ended auctions", async function () {
      await time.increase(AUCTION_DURATION + 1);
      await nftAuction.connect(marketplace).endAuction(1n);

      const activeAuctions = await nftAuction.getActiveAuctions();
      expect(activeAuctions.length).to.equal(1);
      expect(activeAuctions[0]).to.equal(2n);
    });
  });

  describe("NFT status", function () {
    it("Should update NFT status when creating an auction", async function () {
      await nftAuction
        .connect(seller)
        .createAuction(
          seller,
          TOKEN_ID,
          STARTING_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );

      const nftStatus = await nft.getTokenStatus(TOKEN_ID);
      expect(nftStatus).to.equal(2); // 2 represents NFT.NFTStatus.AUCTION
    });

    it("Should update NFT status when cancelling an auction", async function () {
      await nftAuction
        .connect(seller)
        .createAuction(
          seller,
          TOKEN_ID,
          STARTING_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );

      await nftAuction.connect(seller).cancelAuction(seller, 1n);

      const nftStatus = await nft.getTokenStatus(TOKEN_ID);
      expect(nftStatus).to.equal(0); // 0 represents NFT.NFTStatus.NONE
    });
  });

  describe("User bids", function () {
    beforeEach(async function () {
      await nftAuction
        .connect(seller)
        .createAuction(
          seller,
          TOKEN_ID,
          STARTING_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );
    });

    it("Should correctly track user bids", async function () {
      await nftAuction
        .connect(bidder1)
        .placeBid(TOKEN_ID, { value: ethers.parseEther("1.5") });

      await nftAuction
        .connect(bidder2)
        .placeBid(TOKEN_ID, { value: ethers.parseEther("2.0") });

      const bidder1Bids = await nftAuction.getUserBids(
        await bidder1.getAddress()
      );
      const bidder2Bids = await nftAuction.getUserBids(
        await bidder2.getAddress()
      );

      expect(bidder1Bids.length).to.equal(1);
      expect(bidder1Bids[0]).to.equal(1n);
      expect(bidder2Bids.length).to.equal(1);
      expect(bidder2Bids[0]).to.equal(1n);
    });

    it("Should not duplicate user bids for multiple bids on the same auction", async function () {
      await nftAuction
        .connect(bidder1)
        .placeBid(TOKEN_ID, { value: ethers.parseEther("1.5") });

      await nftAuction
        .connect(bidder1)
        .placeBid(TOKEN_ID, { value: ethers.parseEther("2.0") });

      const bidder1Bids = await nftAuction.getUserBids(
        await bidder1.getAddress()
      );

      expect(bidder1Bids.length).to.equal(1);
      expect(bidder1Bids[0]).to.equal(1n);
    });
  });

  describe("Auction fees", function () {
    const BID_AMOUNT = ethers.parseEther("3");
    const EXPECTED_FEE = (BID_AMOUNT * 250n) / 10000n; // 2.5% fee

    beforeEach(async function () {
      await nftAuction
        .connect(seller)
        .createAuction(
          seller,
          TOKEN_ID,
          STARTING_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );

      await nftAuction
        .connect(bidder1)
        .placeBid(TOKEN_ID, { value: BID_AMOUNT });

      await time.increase(AUCTION_DURATION + 1);
    });

    it("Should transfer the correct fee to the contract owner", async function () {
      const ownerBalanceBefore = await ethers.provider.getBalance(
        await owner.getAddress()
      );

      await nftAuction.connect(marketplace).endAuction(1n);

      const ownerBalanceAfter = await ethers.provider.getBalance(
        await owner.getAddress()
      );
      const ownerBalanceDiff = ownerBalanceAfter - ownerBalanceBefore;

      expect(ownerBalanceDiff).to.be.closeTo(
        EXPECTED_FEE,
        ethers.parseEther("0.01")
      );
    });

    it("Should transfer the correct amount to the seller", async function () {
      const sellerBalanceBefore = await ethers.provider.getBalance(
        await seller.getAddress()
      );

      await nftAuction.connect(marketplace).endAuction(1n);

      const sellerBalanceAfter = await ethers.provider.getBalance(
        await seller.getAddress()
      );
      const sellerBalanceDiff = sellerBalanceAfter - sellerBalanceBefore;

      const expectedSellerAmount = BID_AMOUNT - EXPECTED_FEE;
      expect(sellerBalanceDiff).to.be.closeTo(
        expectedSellerAmount,
        ethers.parseEther("0.01")
      );
    });
  });

  describe("ERC721 token receive", function () {
    it("Should implement onERC721Received", async function () {
      const onERC721ReceivedSelector = "0x150b7a02";
      const result = await nftAuction.onERC721Received(
        ethers.ZeroAddress,
        ethers.ZeroAddress,
        0n,
        "0x"
      );
      expect(result).to.equal(onERC721ReceivedSelector);
    });
  });
});
