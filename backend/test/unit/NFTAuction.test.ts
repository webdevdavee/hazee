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
  const AUCTION_DURATION = 7 * 24 * 60 * 60; // 7 days

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

    // Register creators
    await nftCreators.connect(seller).registerCreator();
    await nftCreators.connect(bidder1).registerCreator();
    await nftCreators.connect(bidder2).registerCreator();

    // Mint an NFT for the seller
    await nft
      .connect(owner)
      .mint(seller.address, "uri", "Test NFT", "Description", []);

    // Approve NFTAuction contract
    await nft
      .connect(seller)
      .setApprovalForAll(await nftAuction.getAddress(), true);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await nftAuction.owner()).to.equal(owner.address);
    });

    it("Should set the correct NFTCreators address", async function () {
      expect(await nftAuction.creatorsContract()).to.equal(
        await nftCreators.getAddress()
      );
    });
  });

  describe("Create Auction", function () {
    it("Should create an auction", async function () {
      await expect(
        nftAuction
          .connect(seller)
          .createAuction(
            await nft.getAddress(),
            TOKEN_ID,
            STARTING_PRICE,
            RESERVE_PRICE,
            AUCTION_DURATION
          )
      ).to.emit(nftAuction, "AuctionCreated");

      const auction = await nftAuction.getAuction(1);
      expect(auction.seller).to.equal(seller.address);
      expect(auction.nftContract).to.equal(await nft.getAddress());
      expect(auction.tokenId).to.equal(TOKEN_ID);
      expect(auction.startingPrice).to.equal(STARTING_PRICE);
      expect(auction.reservePrice).to.equal(RESERVE_PRICE);
      expect(auction.active).to.be.true;
    });

    it("Should fail if auction duration is invalid", async function () {
      await expect(
        nftAuction.connect(seller).createAuction(
          await nft.getAddress(),
          TOKEN_ID,
          STARTING_PRICE,
          RESERVE_PRICE,
          60 // 1 minute (too short)
        )
      ).to.be.revertedWith("Invalid auction duration");
    });

    it("Should fail if starting price is zero", async function () {
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

    it("Should fail if reserve price is less than starting price", async function () {
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

  describe("Place Bid", function () {
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

    it("Should place a bid", async function () {
      await expect(
        nftAuction
          .connect(bidder1)
          .placeBid(1, { value: ethers.parseEther("1.5") })
      )
        .to.emit(nftAuction, "BidPlaced")
        .withArgs(1, bidder1.address, ethers.parseEther("1.5"));

      const auction = await nftAuction.getAuction(1);
      expect(auction.highestBidder).to.equal(bidder1.address);
      expect(auction.highestBid).to.equal(ethers.parseEther("1.5"));
    });

    it("Should fail if bid is too low", async function () {
      await expect(
        nftAuction
          .connect(bidder1)
          .placeBid(1, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWith("Bid must be at least the starting price");
    });

    it("Should refund previous bidder when a new highest bid is placed", async function () {
      await nftAuction
        .connect(bidder1)
        .placeBid(1, { value: ethers.parseEther("1.5") });
      const initialBalance = await ethers.provider.getBalance(bidder1.address);

      await nftAuction
        .connect(bidder2)
        .placeBid(1, { value: ethers.parseEther("2") });

      const finalBalance = await ethers.provider.getBalance(bidder1.address);
      expect(finalBalance - initialBalance).to.be.closeTo(
        ethers.parseEther("1.5"),
        ethers.parseEther("0.01")
      );
    });
  });

  describe("End Auction", function () {
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

    it("Should end the auction successfully", async function () {
      await time.increase(AUCTION_DURATION + 1);

      await expect(nftAuction.connect(owner).endAuction(1))
        .to.emit(nftAuction, "AuctionEnded")
        .withArgs(1, bidder1.address, ethers.parseEther("2.5"));

      expect(await nft.ownerOf(TOKEN_ID)).to.equal(bidder1.address);
    });

    it("Should fail if auction has not ended", async function () {
      await expect(nftAuction.connect(owner).endAuction(1)).to.be.revertedWith(
        "Auction has not yet ended"
      );
    });

    it("Should refund highest bidder if reserve price is not met", async function () {
      await nftAuction
        .connect(bidder1)
        .placeBid(1, { value: ethers.parseEther("1.5") });
      await time.increase(AUCTION_DURATION + 1);

      const initialBalance = await ethers.provider.getBalance(bidder1.address);
      await nftAuction.connect(owner).endAuction(1);
      const finalBalance = await ethers.provider.getBalance(bidder1.address);

      expect(finalBalance - initialBalance).to.be.closeTo(
        ethers.parseEther("1.5"),
        ethers.parseEther("0.01")
      );
      expect(await nft.ownerOf(TOKEN_ID)).to.equal(seller.address);
    });
  });

  describe("Cancel Auction", function () {
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

    it("Should cancel the auction", async function () {
      await expect(nftAuction.connect(seller).cancelAuction(1))
        .to.emit(nftAuction, "AuctionCancelled")
        .withArgs(1);

      const auction = await nftAuction.getAuction(1);
      expect(auction.active).to.be.false;
      expect(auction.ended).to.be.true;
    });

    it("Should fail if non-seller tries to cancel", async function () {
      await expect(
        nftAuction.connect(bidder1).cancelAuction(1)
      ).to.be.revertedWith("Only the seller can cancel the auction");
    });

    it("Should fail if auction has bids", async function () {
      await nftAuction
        .connect(bidder1)
        .placeBid(1, { value: ethers.parseEther("1.5") });
      await expect(
        nftAuction.connect(seller).cancelAuction(1)
      ).to.be.revertedWith("Cannot cancel auction with bids");
    });
  });

  describe("Utility Functions", function () {
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

    it("Should check if NFT is on auction", async function () {
      expect(await nftAuction.isNFTOnAuction(await nft.getAddress(), TOKEN_ID))
        .to.be.true;
      expect(await nftAuction.isNFTOnAuction(await nft.getAddress(), 999)).to.be
        .false;
    });

    it("Should get auction details", async function () {
      const auction = await nftAuction.getAuction(1);
      expect(auction.seller).to.equal(seller.address);
      expect(auction.nftContract).to.equal(await nft.getAddress());
      expect(auction.tokenId).to.equal(TOKEN_ID);
      expect(auction.startingPrice).to.equal(STARTING_PRICE);
      expect(auction.reservePrice).to.equal(RESERVE_PRICE);
      expect(auction.active).to.be.true;
    });
  });
});
