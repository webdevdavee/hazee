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

    nftCreatorsFactory = (await ethers.getContractFactory(
      "NFTCreators"
    )) as unknown as NFTCreators__factory;
    nftCreators = await nftCreatorsFactory.deploy();
  });

  describe("registerCreator", function () {
    it("should register a new creator", async function () {
      await expect(nftCreators.connect(creator1).registerCreator())
        .to.emit(nftCreators, "CreatorRegistered")
        .withArgs(creator1.address, 1);

      const creatorInfo = await nftCreators.getCreatorInfo(1);
      expect(creatorInfo.userAddress).to.equal(creator1.address);
    });

    it("should not allow registering the same creator twice", async function () {
      await nftCreators.connect(creator1).registerCreator();
      await expect(
        nftCreators.connect(creator1).registerCreator()
      ).to.be.revertedWith("Creator already registered");
    });
  });

  describe("addCreatedNFT", function () {
    it("should add a created NFT to the creator's list", async function () {
      await nftCreators.connect(creator1).registerCreator();
      await nftCreators.addCreatedNFT(1, 1);

      const creatorInfo = await nftCreators.getCreatorInfo(1);
      expect(creatorInfo.createdNFTs).to.deep.equal([BigInt(1)]);
      expect(creatorInfo.ownedNFTs).to.deep.equal([BigInt(1)]);
    });

    it("should emit NFTCreated event", async function () {
      await nftCreators.connect(creator1).registerCreator();
      await expect(nftCreators.addCreatedNFT(1, 1))
        .to.emit(nftCreators, "NFTCreated")
        .withArgs(1, 1);
    });

    it("should revert if creator does not exist", async function () {
      await expect(nftCreators.addCreatedNFT(999, 1)).to.be.revertedWith(
        "Creator does not exist"
      );
    });
  });

  describe("addOwnedNFT", function () {
    it("should add an owned NFT to the creator's list", async function () {
      await nftCreators.connect(creator1).registerCreator();
      await nftCreators.addOwnedNFT(1, 2);

      const creatorInfo = await nftCreators.getCreatorInfo(1);
      expect(creatorInfo.ownedNFTs).to.deep.equal([BigInt(2)]);
    });

    it("should revert if creator does not exist", async function () {
      await expect(nftCreators.addOwnedNFT(999, 1)).to.be.revertedWith(
        "Creator does not exist"
      );
    });
  });

  describe("removeOwnedNFT", function () {
    it("should remove an owned NFT from the creator's list", async function () {
      await nftCreators.connect(creator1).registerCreator();
      await nftCreators.addOwnedNFT(1, 2);
      await nftCreators.addOwnedNFT(1, 3);
      await nftCreators.removeOwnedNFT(1, 2);

      const creatorInfo = await nftCreators.getCreatorInfo(1);
      expect(creatorInfo.ownedNFTs).to.deep.equal([BigInt(3)]);
    });

    it("should revert if creator does not exist", async function () {
      await expect(nftCreators.removeOwnedNFT(999, 1)).to.be.revertedWith(
        "Creator does not exist"
      );
    });
  });

  describe("addCreatedCollection", function () {
    it("should add a created collection to the creator's list", async function () {
      await nftCreators.connect(creator1).registerCreator();
      await nftCreators.addCreatedCollection(1, 1);

      const creatorInfo = await nftCreators.getCreatorInfo(1);
      expect(creatorInfo.createdCollections).to.deep.equal([BigInt(1)]);
    });

    it("should emit CollectionCreated event", async function () {
      await nftCreators.connect(creator1).registerCreator();
      await expect(nftCreators.addCreatedCollection(1, 1))
        .to.emit(nftCreators, "CollectionCreated")
        .withArgs(1, 1);
    });

    it("should revert if creator does not exist", async function () {
      await expect(nftCreators.addCreatedCollection(999, 1)).to.be.revertedWith(
        "Creator does not exist"
      );
    });
  });

  describe("recordActivity", function () {
    it("should record an activity for a creator", async function () {
      await nftCreators.connect(creator1).registerCreator();
      await nftCreators.recordActivity(1, "Test Action", 1);

      const activities = await nftCreators.getCreatorActivities(1);
      expect(activities[0].actionType).to.equal("Test Action");
      expect(activities[0].relatedItemId).to.equal(1);
    });

    it("should emit ActivityRecorded event", async function () {
      await nftCreators.connect(creator1).registerCreator();
      await expect(nftCreators.recordActivity(1, "Test Action", 1))
        .to.emit(nftCreators, "ActivityRecorded")
        .withArgs(1, "Test Action", 1);
    });
  });

  describe("updateCollectionOffer", function () {
    it("should update a collection offer", async function () {
      await nftCreators.connect(creator1).registerCreator();
      const expirationTime = (await time.latest()) + 3600; // 1 hour from now
      await nftCreators.updateCollectionOffer(
        1,
        1,
        ethers.parseEther("1"),
        5,
        expirationTime
      );

      const offer = await nftCreators.getCreatorCollectionOffers(1, 1);
      expect(offer.amount).to.equal(ethers.parseEther("1"));
      expect(offer.nftCount).to.equal(5);
      expect(offer.expirationTime).to.equal(expirationTime);
      expect(offer.isActive).to.be.true;
    });

    it("should revert if creator does not exist", async function () {
      const expirationTime = (await time.latest()) + 3600;
      await expect(
        nftCreators.updateCollectionOffer(
          999,
          1,
          ethers.parseEther("1"),
          5,
          expirationTime
        )
      ).to.be.revertedWith("Creator does not exist");
    });
  });

  describe("removeCollectionOffer", function () {
    it("should remove an active collection offer", async function () {
      await nftCreators.connect(creator1).registerCreator();
      const expirationTime = (await time.latest()) + 3600;
      await nftCreators.updateCollectionOffer(
        1,
        1,
        ethers.parseEther("1"),
        5,
        expirationTime
      );
      await nftCreators.removeCollectionOffer(1, 1);

      const offer = await nftCreators.getCreatorCollectionOffers(1, 1);
      expect(offer.isActive).to.be.false;
    });

    it("should revert if there's no active offer", async function () {
      await nftCreators.connect(creator1).registerCreator();
      await expect(nftCreators.removeCollectionOffer(1, 1)).to.be.revertedWith(
        "No active offer for this collection"
      );
    });

    it("should revert if creator does not exist", async function () {
      await expect(
        nftCreators.removeCollectionOffer(999, 1)
      ).to.be.revertedWith("Creator does not exist");
    });
  });

  describe("updateBid", function () {
    it("should update a bid for an auction", async function () {
      await nftCreators.connect(creator1).registerCreator();
      await nftCreators.updateBid(1, 1, ethers.parseEther("1"));

      const bidAmount = await nftCreators.getCreatorBids(1, 1);
      expect(bidAmount).to.equal(ethers.parseEther("1"));
    });

    it("should revert if creator does not exist", async function () {
      await expect(
        nftCreators.updateBid(999, 1, ethers.parseEther("1"))
      ).to.be.revertedWith("Creator does not exist");
    });
  });

  describe("updateItemsSold", function () {
    it("should increment the items sold count", async function () {
      await nftCreators.connect(creator1).registerCreator();
      await nftCreators.updateItemsSold(1);

      const creatorInfo = await nftCreators.getCreatorInfo(1);
      expect(creatorInfo.itemsSold).to.equal(1);
    });

    it("should revert if seller is not registered", async function () {
      await expect(nftCreators.updateItemsSold(999)).to.be.revertedWith(
        "Creator does not exist"
      );
    });
  });

  describe("updateWalletBalance", function () {
    it("should update the wallet balance", async function () {
      await nftCreators.connect(creator1).registerCreator();
      await nftCreators.updateWalletBalance(1, ethers.parseEther("10"));

      const creatorInfo = await nftCreators.getCreatorInfo(1);
      expect(creatorInfo.walletBalance).to.equal(ethers.parseEther("10"));
    });

    it("should revert if creator does not exist", async function () {
      await expect(
        nftCreators.updateWalletBalance(999, ethers.parseEther("10"))
      ).to.be.revertedWith("Creator does not exist");
    });
  });

  describe("getAllCreators", function () {
    it("should return all registered creators", async function () {
      await nftCreators.connect(creator1).registerCreator();
      await nftCreators.connect(creator2).registerCreator();

      const allCreators = await nftCreators.getAllCreators();
      expect(allCreators.length).to.equal(2);
      expect(allCreators[0].userAddress).to.equal(creator1.address);
      expect(allCreators[1].userAddress).to.equal(creator2.address);
    });
  });

  describe("getCreatorInfo", function () {
    it("should return the correct creator info", async function () {
      await nftCreators.connect(creator1).registerCreator();
      const creatorInfo = await nftCreators.getCreatorInfo(1);
      expect(creatorInfo.userAddress).to.equal(creator1.address);
    });

    it("should revert if creator does not exist", async function () {
      await expect(nftCreators.getCreatorInfo(999)).to.be.revertedWith(
        "Creator does not exist"
      );
    });
  });

  describe("getCreatorActivities", function () {
    it("should return the correct activities for a creator", async function () {
      await nftCreators.connect(creator1).registerCreator();
      await nftCreators.recordActivity(1, "Test Action", 1);

      const activities = await nftCreators.getCreatorActivities(1);
      expect(activities.length).to.equal(1);
      expect(activities[0].actionType).to.equal("Test Action");
    });
  });

  describe("getCreatorIdByAddress", function () {
    it("should return the correct creator ID for a given address", async function () {
      await nftCreators.connect(creator1).registerCreator();
      const creatorId = await nftCreators.getCreatorIdByAddress(
        creator1.address
      );
      expect(creatorId).to.equal(1);
    });

    it("should return 0 for an unregistered address", async function () {
      const creatorId = await nftCreators.getCreatorIdByAddress(
        nonCreator.address
      );
      expect(creatorId).to.equal(0);
    });
  });
});
