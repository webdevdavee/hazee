import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { NFTCreators, NFTCreators__factory } from "../../typechain-types";

describe("NFTCreators", function () {
  let nftCreatorsFactory: NFTCreators__factory;
  let nftCreators: NFTCreators;
  let owner: SignerWithAddress;
  let creator1: SignerWithAddress;
  let creator2: SignerWithAddress;
  let nonCreator: SignerWithAddress;

  beforeEach(async function () {
    [owner, creator1, creator2, nonCreator] = await ethers.getSigners();

    // NFT Contract
    nftCreatorsFactory = (await ethers.getContractFactory(
      "NFTCreators"
    )) as unknown as NFTCreators__factory;

    nftCreators = await nftCreatorsFactory.deploy();
  });

  describe("Creator Registration", function () {
    it("should register a new creator", async function () {
      await expect(nftCreators.connect(creator1).registerCreator(creator1))
        .to.emit(nftCreators, "CreatorRegistered")
        .withArgs(creator1, 1);

      const creatorInfo = await nftCreators.getCreatorInfo(creator1);
      expect(creatorInfo.creatorId).to.equal(1);
      expect(creatorInfo.userAddress).to.equal(creator1);
    });

    it("should not allow registering the same creator twice", async function () {
      await nftCreators.connect(creator1).registerCreator(creator1);
      await expect(
        nftCreators.connect(creator1).registerCreator(creator1)
      ).to.be.revertedWith("Creator already registered");
    });
  });

  describe("NFT and Collection Creation", function () {
    beforeEach(async function () {
      await nftCreators.connect(creator1).registerCreator(creator1);
    });

    it("should add a created NFT", async function () {
      await expect(nftCreators.connect(creator1).addCreatedNFT(creator1, 1))
        .to.emit(nftCreators, "NFTCreated")
        .withArgs(creator1, 1);

      const creatorInfo = await nftCreators.getCreatorInfo(creator1);
      expect(creatorInfo.createdNFTs.map((n) => n.toString())).to.include("1");
      expect(creatorInfo.ownedNFTs.map((n) => n.toString())).to.include("1");
    });

    it("should add a created collection", async function () {
      await expect(
        nftCreators
          .connect(creator1)
          .addCreatedCollection(await creator1.getAddress(), 1)
      )
        .to.emit(nftCreators, "CollectionCreated")
        .withArgs(await creator1.getAddress(), 1);

      const creatorInfo = await nftCreators.getCreatorInfo(
        await creator1.getAddress()
      );
      expect(
        creatorInfo.createdCollections.map((n) => n.toString())
      ).to.include("1");
    });

    it("should not allow adding NFTs or collections for unregistered creators", async function () {
      await expect(
        nftCreators
          .connect(nonCreator)
          .addCreatedNFT(await nonCreator.getAddress(), 1)
      ).to.be.revertedWith("Creator not registered");

      await expect(
        nftCreators
          .connect(nonCreator)
          .addCreatedCollection(await nonCreator.getAddress(), 1)
      ).to.be.revertedWith("Creator not registered");
    });
  });

  describe("Favorites and Cart", function () {
    beforeEach(async function () {
      await nftCreators
        .connect(creator1)
        .registerCreator(await creator1.getAddress());
    });

    it("should add an NFT to favorites", async function () {
      await nftCreators
        .connect(creator1)
        .addToFavourites(await creator1.getAddress(), 1);
      const creatorInfo = await nftCreators.getCreatorInfo(
        await creator1.getAddress()
      );
      expect(creatorInfo.favouritedNFTs.map((n) => n.toString())).to.include(
        "1"
      );
    });

    it("should add an NFT to cart", async function () {
      await nftCreators
        .connect(creator1)
        .addToCart(await creator1.getAddress(), 1);
      const creatorInfo = await nftCreators.getCreatorInfo(
        await creator1.getAddress()
      );
      expect(creatorInfo.cartedNFTs.map((n) => n.toString())).to.include("1");
    });

    it("should not allow unregistered users to add to favorites or cart", async function () {
      await expect(
        nftCreators
          .connect(nonCreator)
          .addToFavourites(await nonCreator.getAddress(), 1)
      ).to.be.revertedWith("User not registered");

      await expect(
        nftCreators
          .connect(nonCreator)
          .addToCart(await nonCreator.getAddress(), 1)
      ).to.be.revertedWith("User not registered");
    });
  });

  describe("Activities", function () {
    beforeEach(async function () {
      await nftCreators
        .connect(creator1)
        .registerCreator(await creator1.getAddress());
    });

    it("should record activities", async function () {
      await nftCreators
        .connect(creator1)
        .recordActivity(await creator1.getAddress(), "Test Action", 1);
      const activities = await nftCreators.getCreatorActivities(
        await creator1.getAddress()
      );
      expect(activities).to.have.lengthOf(1);
      expect(activities[0].actionType).to.equal("Test Action");
      expect(activities[0].relatedItemId).to.equal(1);
    });
  });

  describe("Collection Offers", function () {
    beforeEach(async function () {
      await nftCreators
        .connect(creator1)
        .registerCreator(await creator1.getAddress());
    });

    it("should update a collection offer", async function () {
      const offerAmount = ethers.parseEther("1");
      const nftCount = 5;
      const expirationTime = (await time.latest()) + 3600; // 1 hour from now

      await nftCreators
        .connect(creator1)
        .updateCollectionOffer(
          await creator1.getAddress(),
          1,
          offerAmount,
          nftCount,
          expirationTime
        );

      const offer = await nftCreators.creatorCollectionOffers(
        await creator1.getAddress(),
        1
      );
      expect(offer.amount).to.equal(offerAmount);
      expect(offer.nftCount).to.equal(nftCount);
      expect(offer.expirationTime).to.equal(expirationTime);
      expect(offer.isActive).to.be.true;
    });

    it("should remove a collection offer", async function () {
      const offerAmount = ethers.parseEther("1");
      const nftCount = 5;
      const expirationTime = (await time.latest()) + 3600; // 1 hour from now

      await nftCreators
        .connect(creator1)
        .updateCollectionOffer(
          await creator1.getAddress(),
          1,
          offerAmount,
          nftCount,
          expirationTime
        );

      await nftCreators
        .connect(creator1)
        .removeCollectionOffer(await creator1.getAddress(), 1);

      const offer = await nftCreators.creatorCollectionOffers(
        await creator1.getAddress(),
        1
      );
      expect(offer.isActive).to.be.false;
    });

    it("should not allow removing non-existent offers", async function () {
      await expect(
        nftCreators
          .connect(creator1)
          .removeCollectionOffer(await creator1.getAddress(), 1)
      ).to.be.revertedWith("No active offer for this collection");
    });
  });

  describe("Bids and Sales", function () {
    beforeEach(async function () {
      await nftCreators
        .connect(creator1)
        .registerCreator(await creator1.getAddress());
    });

    it("should update a bid", async function () {
      const bidAmount = ethers.parseEther("1");
      await nftCreators
        .connect(creator1)
        .updateBid(await creator1.getAddress(), 1, bidAmount);
      const bid = await nftCreators.creatorBids(await creator1.getAddress(), 1);
      expect(bid).to.equal(bidAmount);
    });

    it("should update items sold", async function () {
      await nftCreators
        .connect(creator1)
        .updateItemsSold(await creator1.getAddress());
      const creatorInfo = await nftCreators.getCreatorInfo(
        await creator1.getAddress()
      );
      expect(creatorInfo.itemsSold).to.equal(1);
    });

    it("should update wallet balance", async function () {
      const newBalance = ethers.parseEther("10");
      await nftCreators
        .connect(creator1)
        .updateWalletBalance(await creator1.getAddress(), newBalance);
      const creatorInfo = await nftCreators.getCreatorInfo(
        await creator1.getAddress()
      );
      expect(creatorInfo.walletBalance).to.equal(newBalance);
    });
  });

  describe("Getter Functions", function () {
    beforeEach(async function () {
      await nftCreators
        .connect(creator1)
        .registerCreator(await creator1.getAddress());
    });

    it("should get creator info", async function () {
      const creatorInfo = await nftCreators.getCreatorInfo(
        await creator1.getAddress()
      );
      expect(creatorInfo.creatorId).to.equal(1);
      expect(creatorInfo.userAddress).to.equal(await creator1.getAddress());
    });

    it("should get creator activities", async function () {
      await nftCreators
        .connect(creator1)
        .recordActivity(await creator1.getAddress(), "Test Action", 1);
      const activities = await nftCreators.getCreatorActivities(
        await creator1.getAddress()
      );
      expect(activities).to.have.lengthOf(1);
    });

    it("should get creator ID", async function () {
      const creatorId = await nftCreators.getCreatorId(
        await creator1.getAddress()
      );
      expect(creatorId).to.equal(1);
    });

    it("should return 0 for unregistered creator ID", async function () {
      const creatorId = await nftCreators.getCreatorId(
        await nonCreator.getAddress()
      );
      expect(creatorId).to.equal(0);
    });
  });
});
