import { ethers } from "hardhat";
import { expect } from "chai";
import {
  NFTAuction,
  NFT,
  NFTCreators,
  NFTCreators__factory,
  NFT__factory,
  NFTAuction__factory,
} from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("NFTAuction", function () {
  let nftAuctionFactory: NFTAuction__factory;
  let nftAuction: NFTAuction;
  let nftFactory: NFT__factory;
  let nft: NFT;
  let nftCreatorsFactory: NFTCreators__factory;
  let nftCreators: NFTCreators;
  let owner: SignerWithAddress;
  let seller: SignerWithAddress;
  let bidder1: SignerWithAddress;
  let bidder2: SignerWithAddress;

  const TOKEN_ID = 1;
  const STARTING_PRICE = ethers.parseEther("1");
  const RESERVE_PRICE = ethers.parseEther("2");
  const AUCTION_DURATION = 60 * 60 * 24; // 1 day

  beforeEach(async function () {
    [owner, seller, bidder1, bidder2] = await ethers.getSigners();

    // NFTCreators Contract
    nftCreatorsFactory = (await ethers.getContractFactory(
      "NFTCreators"
    )) as unknown as NFTCreators__factory;

    nftCreators = await nftCreatorsFactory.deploy();

    // NFTAuction Contract
    nftAuctionFactory = (await ethers.getContractFactory(
      "NFTAuction"
    )) as unknown as NFTAuction__factory;
    nftAuction = await nftAuctionFactory.deploy(await nftCreators.getAddress());

    // NFT Contract
    nftFactory = (await ethers.getContractFactory(
      "NFT"
    )) as unknown as NFT__factory;

    nft = await nftFactory.deploy(
      "TestNFT",
      "TNFT",
      await nftCreators.getAddress(),
      await nftAuction.getAddress()
    );

    // Register seller
    await nftCreators.registerCreator(seller.address);

    // Mint NFT
    await nft
      .connect(owner)
      .mint(seller.address, "ipfs://test", "Test NFT", "A test NFT", []);

    // Approve NFTAuction contract
    await nft
      .connect(seller)
      .setApprovalForAll(await nftAuction.getAddress(), true);
  });

  describe("createAuction", function () {
    it("should create an auction successfully", async function () {
      try {
        const tx = await nftAuction
          .connect(seller)
          .createAuction(
            await nft.getAddress(),
            TOKEN_ID,
            STARTING_PRICE,
            RESERVE_PRICE,
            AUCTION_DURATION
          );

        // Wait for the transaction to be mined
        const receipt = await tx.wait();

        // Check if the AuctionCreated event was emitted
        const event = receipt?.logs?.find((e) =>
          e.topics.map((topic) => topic === "AuctionCreated")
        );
        expect(event).to.not.be.undefined;

        const auction = await nftAuction.auctions(1);
        expect(auction.seller).to.equal(seller.address);
        expect(auction.nftContract).to.equal(await nft.getAddress());
        expect(auction.tokenId).to.equal(TOKEN_ID);
        expect(auction.startingPrice).to.equal(STARTING_PRICE);
        expect(auction.reservePrice).to.equal(RESERVE_PRICE);
        expect(auction.active).to.be.true;
      } catch (error) {
        console.error("Error details:", error);
        throw error;
      }
    });

    it("should revert if auction duration is invalid", async function () {
      await expect(
        nftAuction.connect(seller).createAuction(
          await nft.getAddress(),
          TOKEN_ID,
          STARTING_PRICE,
          RESERVE_PRICE,
          60 // 1 minute
        )
      ).to.be.revertedWith("Invalid auction duration");
    });

    it("should revert if starting price is zero", async function () {
      await expect(
        nftAuction
          .connect(seller)
          .createAuction(
            await nft.getAddress(),
            TOKEN_ID,
            0,
            RESERVE_PRICE,
            AUCTION_DURATION
          )
      ).to.be.revertedWith("Starting price must be greater than zero");
    });

    it("should revert if reserve price is less than starting price", async function () {
      await expect(
        nftAuction
          .connect(seller)
          .createAuction(
            await nft.getAddress(),
            TOKEN_ID,
            STARTING_PRICE,
            ethers.parseEther("0.5"),
            AUCTION_DURATION
          )
      ).to.be.revertedWith(
        "Reserve price must be greater than or equal to starting price"
      );
    });
  });

  describe("placeBid", function () {
    beforeEach(async function () {
      await nftAuction
        .connect(seller)
        .createAuction(
          await nft.getAddress(),
          TOKEN_ID,
          STARTING_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );
    });

    it("should place a bid successfully", async function () {
      const bidAmount = ethers.parseEther("1.5");
      await expect(
        nftAuction.connect(bidder1).placeBid(1, { value: bidAmount })
      )
        .to.emit(nftAuction, "BidPlaced")
        .withArgs(1, bidder1.address, bidAmount);

      const auction = await nftAuction.auctions(1);
      expect(auction.highestBidder).to.equal(bidder1.address);
      expect(auction.highestBid).to.equal(bidAmount);
    });

    it("should refund previous highest bidder when outbid", async function () {
      const bid1 = ethers.parseEther("1.5");
      const bid2 = ethers.parseEther("2");

      await nftAuction.connect(bidder1).placeBid(1, { value: bid1 });

      const initialBalance = await ethers.provider.getBalance(bidder1.address);
      await nftAuction.connect(bidder2).placeBid(1, { value: bid2 });
      const finalBalance = await ethers.provider.getBalance(bidder1.address);

      expect(finalBalance - initialBalance).to.be.closeTo(
        bid1,
        ethers.parseEther("0.01")
      );
    });

    it("should revert if bid is not higher than current highest bid", async function () {
      await nftAuction
        .connect(bidder1)
        .placeBid(1, { value: ethers.parseEther("1.5") });
      await expect(
        nftAuction
          .connect(bidder2)
          .placeBid(1, { value: ethers.parseEther("1.4") })
      ).to.be.revertedWith("Bid must be higher than current highest bid");
    });

    it("should revert if auction has ended", async function () {
      await time.increase(AUCTION_DURATION + 1);
      await expect(
        nftAuction
          .connect(bidder1)
          .placeBid(1, { value: ethers.parseEther("1.5") })
      ).to.be.revertedWith("Auction has expired");
    });
  });

  describe("endAuction", function () {
    beforeEach(async function () {
      await nftAuction
        .connect(seller)
        .createAuction(
          await nft.getAddress(),
          TOKEN_ID,
          STARTING_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );
      await nftAuction
        .connect(bidder1)
        .placeBid(1, { value: ethers.parseEther("2.5") });
    });

    it("should end auction successfully when reserve price is met", async function () {
      await time.increase(AUCTION_DURATION + 1);
      await expect(nftAuction.endAuction(1))
        .to.emit(nftAuction, "AuctionEnded")
        .withArgs(1, bidder1.address, ethers.parseEther("2.5"));

      const auction = await nftAuction.auctions(1);
      expect(auction.ended).to.be.true;
      expect(auction.active).to.be.false;
      expect(await nft.ownerOf(TOKEN_ID)).to.equal(bidder1.address);
    });

    it("should refund highest bidder if reserve price is not met", async function () {
      await nftAuction
        .connect(seller)
        .createAuction(
          await nft.getAddress(),
          1,
          STARTING_PRICE,
          ethers.parseEther("3"),
          AUCTION_DURATION
        );
      await nftAuction
        .connect(bidder1)
        .placeBid(2, { value: ethers.parseEther("2.5") });

      await time.increase(AUCTION_DURATION + 1);

      const initialBalance = await ethers.provider.getBalance(bidder1.address);
      await nftAuction.endAuction(2);
      const finalBalance = await ethers.provider.getBalance(bidder1.address);

      expect(finalBalance - initialBalance).to.be.closeTo(
        ethers.parseEther("2.5"),
        ethers.parseEther("0.01")
      );
    });

    it("should revert if auction has not ended yet", async function () {
      await expect(nftAuction.endAuction(1)).to.be.revertedWith(
        "Auction has not yet ended"
      );
    });

    it("should revert if auction has already ended", async function () {
      await time.increase(AUCTION_DURATION + 1);
      await nftAuction.endAuction(1);
      await expect(nftAuction.endAuction(1)).to.be.revertedWith(
        "Auction is not active"
      );
    });
  });

  describe("cancelAuction", function () {
    beforeEach(async function () {
      await nftAuction
        .connect(seller)
        .createAuction(
          await nft.getAddress(),
          TOKEN_ID,
          STARTING_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );
    });

    it("should cancel auction successfully", async function () {
      await expect(nftAuction.connect(seller).cancelAuction(1))
        .to.emit(nftAuction, "AuctionCancelled")
        .withArgs(1);

      const auction = await nftAuction.auctions(1);
      expect(auction.ended).to.be.true;
      expect(auction.active).to.be.false;
    });

    it("should revert if non-seller tries to cancel", async function () {
      await expect(
        nftAuction.connect(bidder1).cancelAuction(1)
      ).to.be.revertedWith("Only the seller can cancel the auction");
    });

    it("should revert if auction has bids", async function () {
      await nftAuction
        .connect(bidder1)
        .placeBid(1, { value: ethers.parseEther("1.5") });
      await expect(
        nftAuction.connect(seller).cancelAuction(1)
      ).to.be.revertedWith("Cannot cancel auction with bids");
    });
  });

  describe("isNFTOnAuction", function () {
    it("should return true for active auction", async function () {
      await nftAuction
        .connect(seller)
        .createAuction(
          await nft.getAddress(),
          TOKEN_ID,
          STARTING_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );
      expect(await nftAuction.isNFTOnAuction(await nft.getAddress(), TOKEN_ID))
        .to.be.true;
    });

    it("should return false for non-existent auction", async function () {
      expect(await nftAuction.isNFTOnAuction(await nft.getAddress(), 999)).to.be
        .false;
    });
  });

  describe("getAuction", function () {
    it("should return correct auction details", async function () {
      await nftAuction
        .connect(seller)
        .createAuction(
          await nft.getAddress(),
          TOKEN_ID,
          STARTING_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );

      const auctionDetails = await nftAuction.getAuction(1);
      expect(auctionDetails.seller).to.equal(seller.address);
      expect(auctionDetails.nftContract).to.equal(await nft.getAddress());
      expect(auctionDetails.tokenId).to.equal(TOKEN_ID);
      expect(auctionDetails.startingPrice).to.equal(STARTING_PRICE);
      expect(auctionDetails.reservePrice).to.equal(RESERVE_PRICE);
      expect(auctionDetails.active).to.be.true;
    });
  });
});
