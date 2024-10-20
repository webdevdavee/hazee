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
  let fakeAuctionAddress: HardhatEthersSigner;
  let fakeMarketplaceAddress: HardhatEthersSigner;

  const TOKEN_ID = 1;
  const STARTING_PRICE = ethers.parseEther("1");
  const RESERVE_PRICE = ethers.parseEther("2");
  const AUCTION_DURATION = 7 * 24 * 60 * 60; // 7 days

  beforeEach(async function () {
    [
      owner,
      seller,
      bidder1,
      bidder2,
      fakeAuctionAddress,
      fakeMarketplaceAddress,
    ] = await ethers.getSigners();

    // Deploy NFT
    const NFTFactory = (await ethers.getContractFactory(
      "NFT"
    )) as unknown as NFT__factory;
    nft = await NFTFactory.deploy(
      "TestNFT",
      "TNFT",
      await fakeAuctionAddress.getAddress(),
      await fakeMarketplaceAddress.getAddress()
    );

    // Deploy NFTAuction
    const NFTAuctionFactory = (await ethers.getContractFactory(
      "NFTAuction"
    )) as unknown as NFTAuction__factory;
    nftAuction = await NFTAuctionFactory.deploy(await nft.getAddress());

    // Update NFT with correct NFTAuction address
    await nft.setAuctionContract(await nftAuction.getAddress());

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
          1n,
          await seller.getAddress(),
          TOKEN_ID,
          STARTING_PRICE,
          RESERVE_PRICE,
          (await time.latest()) + AUCTION_DURATION
        );

      const auction = await nftAuction.getAuction(1n);
      expect(auction.seller).to.equal(await seller.getAddress());
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
      ).to.be.revertedWithCustomError(nftAuction, "NotTokenOwner");
    });

    it("Should fail to create an auction with invalid duration", async function () {
      await expect(
        nftAuction
          .connect(seller)
          .createAuction(TOKEN_ID, STARTING_PRICE, RESERVE_PRICE, 60n)
      ).to.be.revertedWithCustomError(nftAuction, "InvalidDuration");
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
        .withArgs(1n, await bidder1.getAddress(), ethers.parseEther("1.5"));
    });

    it("Should fail to place a bid lower than the starting price", async function () {
      await expect(
        nftAuction
          .connect(bidder1)
          .placeBid(TOKEN_ID, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWithCustomError(nftAuction, "BelowStartingPrice");
    });

    it("Should fail to place a bid lower than the current highest bid", async function () {
      await nftAuction
        .connect(bidder1)
        .placeBid(TOKEN_ID, { value: ethers.parseEther("1.5") });
      await expect(
        nftAuction
          .connect(bidder2)
          .placeBid(TOKEN_ID, { value: ethers.parseEther("1.4") })
      ).to.be.revertedWithCustomError(nftAuction, "BidTooLow");
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
      await expect(nftAuction.endAuction(1n))
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
      await nftAuction.endAuction(1n);
      const bidderBalanceAfter = await ethers.provider.getBalance(
        await bidder1.getAddress()
      );

      expect(bidderBalanceAfter).to.be.gt(bidderBalanceBefore);
    });

    it("Should fail to end an auction before its end time", async function () {
      await expect(nftAuction.endAuction(1n)).to.be.revertedWithCustomError(
        nftAuction,
        "InvalidAuctionState"
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
      await expect(nftAuction.connect(seller).cancelAuction(1n))
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
        nftAuction.connect(seller).cancelAuction(1n)
      ).to.be.revertedWithCustomError(nftAuction, "BidsAlreadyPlaced");
    });

    it("Should fail to cancel an auction by non-seller", async function () {
      await expect(
        nftAuction.connect(bidder1).cancelAuction(1n)
      ).to.be.revertedWithCustomError(nftAuction, "NotSeller");
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
          TOKEN_ID,
          STARTING_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );

      await nft.connect(seller).mint(seller, tokenURI, price, collectionId);

      await nftAuction
        .connect(seller)
        .createAuction(2n, STARTING_PRICE, RESERVE_PRICE, AUCTION_DURATION);
    });

    it("Should return all active auctions", async function () {
      const activeAuctions = await nftAuction.getActiveAuctions();
      expect(activeAuctions.length).to.equal(2);
      expect(activeAuctions[0]).to.equal(1n);
      expect(activeAuctions[1]).to.equal(2n);
    });

    it("Should not include ended auctions", async function () {
      await time.increase(AUCTION_DURATION + 1);
      await nftAuction.endAuction(1n);

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
          TOKEN_ID,
          STARTING_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );

      const nftStatus = await nft.getTokenStatus(TOKEN_ID);
      expect(nftStatus).to.equal(2); // 2 represents NFT.NFTStatus.AUCTION
    });

    it("Should update NFT status when ending an auction", async function () {
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
        .placeBid(TOKEN_ID, { value: ethers.parseEther("2.5") });

      await time.increase(AUCTION_DURATION + 1);
      await nftAuction.endAuction(1n);

      const nftStatus = await nft.getTokenStatus(TOKEN_ID);
      expect(nftStatus).to.equal(0); // 0 represents NFT.NFTStatus.NONE
    });

    it("Should update NFT status when cancelling an auction", async function () {
      await nftAuction
        .connect(seller)
        .createAuction(
          TOKEN_ID,
          STARTING_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );

      await nftAuction.connect(seller).cancelAuction(1n);

      const nftStatus = await nft.getTokenStatus(TOKEN_ID);
      expect(nftStatus).to.equal(0); // 0 represents NFT.NFTStatus.NONE
    });
  });

  describe("User bids", function () {
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

      await nftAuction.endAuction(1n);

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

      await nftAuction.endAuction(1n);

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
