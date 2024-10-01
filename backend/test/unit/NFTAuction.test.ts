import { ethers } from "hardhat";
import { expect } from "chai";
import {
  NFTAuction,
  NFTAuction__factory,
  NFT,
  NFTCreators,
  NFTCreators__factory,
  NFT__factory,
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
  let fakeAuctionAddress: SignerWithAddress;

  const TOKEN_ID = 1;
  const STARTING_PRICE = ethers.parseEther("1");
  const RESERVE_PRICE = ethers.parseEther("2");
  const AUCTION_DURATION = 7 * 24 * 60 * 60; // 7 days

  beforeEach(async function () {
    [owner, seller, bidder1, bidder2, fakeAuctionAddress] =
      await ethers.getSigners();

    // Deploy NFTCreators
    nftCreatorsFactory = (await ethers.getContractFactory(
      "NFTCreators"
    )) as unknown as NFTCreators__factory;
    nftCreators = await nftCreatorsFactory.deploy();

    // Deploy NFT
    nftFactory = (await ethers.getContractFactory(
      "NFT"
    )) as unknown as NFT__factory;
    nft = await nftFactory.deploy(
      "TestNFT",
      "TNFT",
      await nftCreators.getAddress(),
      fakeAuctionAddress // Dummy address before actual address can be inputted
    );

    // Deploy NFTAuction
    nftAuctionFactory = (await ethers.getContractFactory(
      "NFTAuction"
    )) as unknown as NFTAuction__factory;
    nftAuction = await nftAuctionFactory.deploy(
      await nft.getAddress(),
      await nftCreators.getAddress()
    );

    // Update NFT with correct NFTAuction address
    await nft.setAuctionContract(await nftAuction.getAddress());

    // Register creators
    await nftCreators.connect(seller).registerCreator();
    await nftCreators.connect(bidder1).registerCreator();
    await nftCreators.connect(bidder2).registerCreator();

    // Mint an NFT for the seller
    await nft
      .connect(seller)
      .mint(
        seller.address,
        "tokenURI",
        "Test NFT",
        "Description",
        ethers.parseEther("1"),
        [{ key: "rarity", value: "rare" }],
        1
      );

    // Approve NFTAuction contract
    await nft
      .connect(seller)
      .setApprovalForAll(await nftAuction.getAddress(), true);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await nftAuction.owner()).to.equal(owner.address);
    });

    it("Should set the correct NFT contract address", async function () {
      expect(await nftAuction.nftContract()).to.equal(await nft.getAddress());
    });

    it("Should set the correct NFTCreators contract address", async function () {
      expect(await nftAuction.creatorsContract()).to.equal(
        await nftCreators.getAddress()
      );
    });
  });

  describe("Creating an auction", function () {
    it("Should create an auction successfully", async function () {
      await expect(
        nftAuction
          .connect(seller)
          .createAuction(
            TOKEN_ID,
            STARTING_PRICE,
            RESERVE_PRICE,
            AUCTION_DURATION
          )
      )
        .to.emit(nftAuction, "AuctionCreated")
        .withArgs(
          1,
          seller.address,
          TOKEN_ID,
          STARTING_PRICE,
          RESERVE_PRICE,
          (await time.latest()) + AUCTION_DURATION
        );

      const auction = await nftAuction.getAuction(1);
      expect(auction.seller).to.equal(seller.address);
      expect(auction.tokenId).to.equal(TOKEN_ID);
      expect(auction.startingPrice).to.equal(STARTING_PRICE);
      expect(auction.reservePrice).to.equal(RESERVE_PRICE);
      expect(auction.active).to.be.true;
    });

    it("Should fail to create an auction for a non-owned NFT", async function () {
      await expect(
        nftAuction
          .connect(bidder1)
          .createAuction(
            TOKEN_ID,
            STARTING_PRICE,
            RESERVE_PRICE,
            AUCTION_DURATION
          )
      ).to.be.revertedWith("You don't own this NFT");
    });

    it("Should fail to create an auction with invalid duration", async function () {
      await expect(
        nftAuction
          .connect(seller)
          .createAuction(TOKEN_ID, STARTING_PRICE, RESERVE_PRICE, 60)
      ) // 1 minute
        .to.be.revertedWith("Invalid auction duration");
    });
  });

  describe("Placing bids", function () {
    beforeEach(async function () {
      await nftAuction
        .connect(seller)
        .createAuction(
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
        .withArgs(1, bidder1.address, ethers.parseEther("1.5"));
    });

    it("Should fail to place a bid lower than the starting price", async function () {
      await expect(
        nftAuction
          .connect(bidder1)
          .placeBid(TOKEN_ID, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWith("Bid must be at least the starting price");
    });

    it("Should fail to place a bid lower than the current highest bid", async function () {
      await nftAuction
        .connect(bidder1)
        .placeBid(TOKEN_ID, { value: ethers.parseEther("1.5") });
      await expect(
        nftAuction
          .connect(bidder2)
          .placeBid(TOKEN_ID, { value: ethers.parseEther("1.4") })
      ).to.be.revertedWith("Bid must be higher than current highest bid");
    });
  });

  describe("Ending an auction", function () {
    beforeEach(async function () {
      await nftAuction
        .connect(seller)
        .createAuction(
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
      await expect(nftAuction.endAuction(1))
        .to.emit(nftAuction, "AuctionEnded")
        .withArgs(1, bidder1.address, ethers.parseEther("2.5"));

      expect(await nft.ownerOf(TOKEN_ID)).to.equal(bidder1.address);
    });

    it("Should refund the highest bidder when reserve price is not met", async function () {
      await nftAuction
        .connect(bidder1)
        .placeBid(TOKEN_ID, { value: ethers.parseEther("1.5") });
      await time.increase(AUCTION_DURATION + 1);

      const bidderBalanceBefore = await ethers.provider.getBalance(
        bidder1.address
      );
      await nftAuction.endAuction(1);
      const bidderBalanceAfter = await ethers.provider.getBalance(
        bidder1.address
      );

      expect(bidderBalanceAfter).to.be.gt(bidderBalanceBefore);
    });

    it("Should fail to end an auction before its end time", async function () {
      await expect(nftAuction.endAuction(1)).to.be.revertedWith(
        "Auction has not yet ended"
      );
    });
  });

  describe("Cancelling an auction", function () {
    beforeEach(async function () {
      await nftAuction
        .connect(seller)
        .createAuction(
          TOKEN_ID,
          STARTING_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );
    });

    it("Should cancel an auction successfully", async function () {
      await expect(nftAuction.connect(seller).cancelAuction(1))
        .to.emit(nftAuction, "AuctionCancelled")
        .withArgs(1);

      const auction = await nftAuction.getAuction(1);
      expect(auction.active).to.be.false;
      expect(auction.ended).to.be.true;
    });

    it("Should fail to cancel an auction with bids", async function () {
      await nftAuction
        .connect(bidder1)
        .placeBid(TOKEN_ID, { value: ethers.parseEther("1.5") });
      await expect(
        nftAuction.connect(seller).cancelAuction(1)
      ).to.be.revertedWith("Cannot cancel auction with bids");
    });

    it("Should fail to cancel an auction by non-seller", async function () {
      await expect(
        nftAuction.connect(bidder1).cancelAuction(1)
      ).to.be.revertedWith("Only the seller can cancel the auction");
    });
  });

  describe("Auction queries", function () {
    beforeEach(async function () {
      await nftAuction
        .connect(seller)
        .createAuction(
          TOKEN_ID,
          STARTING_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );
    });

    it("Should return correct auction details", async function () {
      const auction = await nftAuction.getAuction(1);
      expect(auction.seller).to.equal(seller.address);
      expect(auction.tokenId).to.equal(TOKEN_ID);
      expect(auction.startingPrice).to.equal(STARTING_PRICE);
      expect(auction.reservePrice).to.equal(RESERVE_PRICE);
    });

    it("Should return correct user auction count", async function () {
      expect(await nftAuction.getUserAuctionCount(seller.address)).to.equal(1);
    });

    it("Should return correct auction bids", async function () {
      await nftAuction
        .connect(bidder1)
        .placeBid(TOKEN_ID, { value: ethers.parseEther("1.5") });
      await nftAuction
        .connect(bidder2)
        .placeBid(TOKEN_ID, { value: ethers.parseEther("2.0") });

      const bids = await nftAuction.getAuctionBids(1);
      expect(bids.length).to.equal(2);
      expect(bids[0].bidder).to.equal(bidder1.address);
      expect(bids[1].bidder).to.equal(bidder2.address);
    });
  });

  describe("Extending an auction", function () {
    beforeEach(async function () {
      await nftAuction
        .connect(seller)
        .createAuction(
          TOKEN_ID,
          STARTING_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );
    });

    it("Should extend an auction successfully", async function () {
      const additionalTime = 24 * 60 * 60; // 1 day
      await expect(
        nftAuction.connect(seller).extendAuction(1, additionalTime)
      ).to.emit(nftAuction, "AuctionExtended");

      const auction = await nftAuction.getAuction(1);
      expect(auction.endTime).to.be.gt(
        (await time.latest()) + AUCTION_DURATION
      );
    });

    it("Should fail to extend an auction beyond maximum duration", async function () {
      const additionalTime = 31 * 24 * 60 * 60; // 31 days
      await expect(
        nftAuction.connect(seller).extendAuction(1, additionalTime)
      ).to.be.revertedWith("Cannot extend beyond maximum duration");
    });
  });

  describe("Updating reserve price", function () {
    beforeEach(async function () {
      await nftAuction
        .connect(seller)
        .createAuction(
          TOKEN_ID,
          STARTING_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );
    });

    it("Should update reserve price successfully", async function () {
      const newReservePrice = ethers.parseEther("3");
      await expect(
        nftAuction.connect(seller).updateReservePrice(1, newReservePrice)
      )
        .to.emit(nftAuction, "ReservePriceUpdated")
        .withArgs(1, newReservePrice);

      const auction = await nftAuction.getAuction(1);
      expect(auction.reservePrice).to.equal(newReservePrice);
    });

    it("Should fail to update reserve price below starting price", async function () {
      const newReservePrice = ethers.parseEther("0.5");
      await expect(
        nftAuction.connect(seller).updateReservePrice(1, newReservePrice)
      ).to.be.revertedWith(
        "New reserve price must be at least the starting price"
      );
    });
  });

  describe("Withdrawing a bid", function () {
    beforeEach(async function () {
      await nftAuction
        .connect(seller)
        .createAuction(
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
        bidder1.address
      );
      await expect(nftAuction.connect(bidder1).withdrawBid(1))
        .to.emit(nftAuction, "BidWithdrawn")
        .withArgs(1, bidder1.address, ethers.parseEther("1.5"));

      const bidderBalanceAfter = await ethers.provider.getBalance(
        bidder1.address
      );
      expect(bidderBalanceAfter).to.be.gt(bidderBalanceBefore);
    });

    it("Should not allow the highest bidder to withdraw their bid", async function () {
      await expect(
        nftAuction.connect(bidder2).withdrawBid(1)
      ).to.be.revertedWith("Highest bidder cannot withdraw their bid");
    });
  });
});
