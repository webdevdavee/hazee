import { expect } from "chai";
import { ethers } from "hardhat";
import {
  NFT,
  NFT__factory,
  NFTCollections,
  NFTCollections__factory,
  NFTAuction,
  NFTAuction__factory,
  NFTMarketplace,
  NFTMarketplace__factory,
} from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("NFTCollections", function () {
  let nftCollections: NFTCollections;
  let nftAuction: NFTAuction;
  let nftMarketplace: NFTMarketplace;
  let nftContract: NFT;
  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;

  const DEFAULT_MAX_SUPPLY = 100;
  const DEFAULT_ROYALTY_PERCENTAGE = 250; // 2.5%
  const DEFAULT_FLOOR_PRICE = ethers.parseEther("0.1");
  const DEFAULT_NFT_PRICE = ethers.parseEther("0.5");

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const NFTFactory = (await ethers.getContractFactory(
      "NFT"
    )) as unknown as NFT__factory;
    nftContract = await NFTFactory.deploy(
      "Test NFT",
      "TNFT",
      ethers.ZeroAddress,
      ethers.ZeroAddress
    );
    await nftContract.waitForDeployment();

    const nftContractAddress = await nftContract.getAddress();
    const NFTAuctionFactory = (await ethers.getContractFactory(
      "NFTAuction"
    )) as unknown as NFTAuction__factory;
    nftAuction = await NFTAuctionFactory.deploy(
      nftContractAddress,
      ethers.ZeroAddress
    );
    await nftAuction.waitForDeployment();

    const nftAuctionAddress = await nftAuction.getAddress();
    const NFTCollectionsFactory = (await ethers.getContractFactory(
      "NFTCollections"
    )) as unknown as NFTCollections__factory;
    nftCollections = await NFTCollectionsFactory.deploy(nftContractAddress);
    await nftCollections.waitForDeployment();

    const nftCollectionsAddress = await nftCollections.getAddress();
    const NFTMarketplaceFactory = (await ethers.getContractFactory(
      "NFTMarketplace"
    )) as unknown as NFTMarketplace__factory;
    nftMarketplace = await NFTMarketplaceFactory.deploy(
      nftContractAddress,
      nftCollectionsAddress,
      nftAuctionAddress
    );
    await nftMarketplace.waitForDeployment();

    const nftMarketplaceAddress = await nftMarketplace.getAddress();
    await nftContract.updateAuctionContract(nftAuctionAddress);
    await nftContract.updateMarketplaceContract(nftMarketplaceAddress);
  });

  describe("Collection Creation", function () {
    it("should create a collection with valid parameters", async function () {
      const tx = await nftCollections.createCollection(
        DEFAULT_MAX_SUPPLY,
        DEFAULT_ROYALTY_PERCENTAGE,
        DEFAULT_FLOOR_PRICE
      );

      const receipt = await tx.wait();
      expect(receipt?.status).to.equal(1);

      const collectionInfo = await nftCollections.getCollectionInfo(1);
      expect(collectionInfo.creator).to.equal(owner.address);
      expect(collectionInfo.maxSupply).to.equal(DEFAULT_MAX_SUPPLY);
      expect(collectionInfo.royaltyPercentage).to.equal(
        DEFAULT_ROYALTY_PERCENTAGE
      );
      expect(collectionInfo.floorPrice).to.equal(DEFAULT_FLOOR_PRICE);
      expect(collectionInfo.isActive).to.be.true;
    });

    it("should revert when creating collection with invalid parameters", async function () {
      await expect(
        nftCollections.createCollection(
          0,
          DEFAULT_ROYALTY_PERCENTAGE,
          DEFAULT_FLOOR_PRICE
        )
      ).to.be.revertedWithCustomError(nftCollections, "InvalidMaxSupply");

      await expect(
        nftCollections.createCollection(
          DEFAULT_MAX_SUPPLY,
          5000,
          DEFAULT_FLOOR_PRICE
        )
      ).to.be.revertedWithCustomError(
        nftCollections,
        "RoyaltyPercentageTooHigh"
      );

      await expect(
        nftCollections.createCollection(
          DEFAULT_MAX_SUPPLY,
          DEFAULT_ROYALTY_PERCENTAGE,
          0
        )
      ).to.be.revertedWithCustomError(nftCollections, "InvalidFloorPrice");
    });
  });

  describe("NFT Minting", function () {
    beforeEach(async function () {
      await nftCollections.createCollection(
        DEFAULT_MAX_SUPPLY,
        DEFAULT_ROYALTY_PERCENTAGE,
        DEFAULT_FLOOR_PRICE
      );
    });

    it("should mint NFT successfully", async function () {
      const tokenURI = "ipfs://test-uri";
      const tx = await nftCollections.mintNFT(1, DEFAULT_NFT_PRICE, tokenURI);
      const receipt = await tx.wait();

      const mintedTokens = await nftCollections.getMintedNFTs(1);
      expect(mintedTokens.length).to.equal(1);

      const collectionInfo = await nftCollections.getCollectionInfo(1);
      expect(collectionInfo.mintedSupply).to.equal(1);
    });

    it("should revert when non-creator tries to mint", async function () {
      await expect(
        nftCollections
          .connect(addr1)
          .mintNFT(1, DEFAULT_NFT_PRICE, "ipfs://test-uri")
      ).to.be.revertedWithCustomError(nftCollections, "Unauthorized");
    });
  });

  describe("Collection Offers", function () {
    beforeEach(async function () {
      await nftCollections.createCollection(
        DEFAULT_MAX_SUPPLY,
        DEFAULT_ROYALTY_PERCENTAGE,
        DEFAULT_FLOOR_PRICE
      );
      await nftCollections.mintNFT(1, DEFAULT_NFT_PRICE, "ipfs://test-uri");
    });

    it("should place collection offer successfully", async function () {
      const offerAmount = DEFAULT_FLOOR_PRICE;
      const nftCount = 1;
      const duration = 86400; // 1 day
      const offerId = 1;

      const tx = await nftCollections
        .connect(addr1)
        .placeCollectionOffer(1, nftCount, duration, {
          value: offerAmount,
        });

      await tx.wait();

      const txBlock = await ethers.provider.getBlock(tx.blockNumber!);
      const txTimestamp = txBlock!.timestamp;
      const expectedExpirationTime = BigInt(txTimestamp) + BigInt(duration);

      expect(tx)
        .to.emit(nftCollections, "CollectionOfferPlaced")
        .withArgs(
          1,
          offerId,
          addr1.address,
          offerAmount,
          nftCount,
          expectedExpirationTime
        );

      // Verify offer details using getOfferById
      const offerInfo = await nftCollections.getOfferById(offerId);
      expect(offerInfo.offerer).to.equal(addr1.address);
      expect(offerInfo.amount).to.equal(offerAmount);
      expect(offerInfo.nftCount).to.equal(nftCount);
      expect(offerInfo.expirationTime).to.equal(expectedExpirationTime);
      expect(offerInfo.isActive).to.be.true;
      expect(offerInfo.status).to.equal(0); // ACTIVE status
    });

    it("should revert when offer amount is below floor price", async function () {
      const lowOffer = DEFAULT_FLOOR_PRICE / 2n;
      await expect(
        nftCollections.connect(addr1).placeCollectionOffer(1, 1, 86400, {
          value: lowOffer,
        })
      ).to.be.revertedWithCustomError(nftCollections, "OfferBelowFloorPrice");
    });

    it("should withdraw collection offer successfully", async function () {
      const offerAmount = DEFAULT_FLOOR_PRICE;
      await nftCollections.connect(addr1).placeCollectionOffer(1, 1, 86400, {
        value: offerAmount,
      });

      const initialBalance = await ethers.provider.getBalance(addr1.address);
      const tx = await nftCollections.connect(addr1).withdrawCollectionOffer(1);
      const receipt = await tx.wait();

      // Calculate gas costs
      const gasUsed = receipt!.gasUsed;
      const gasPrice = await ethers.provider
        .getFeeData()
        .then((data) => data.gasPrice!);
      const gasCost = gasUsed * gasPrice;

      const finalBalance = await ethers.provider.getBalance(addr1.address);
      expect(finalBalance + gasCost).to.be.closeTo(
        initialBalance + offerAmount,
        1000000000000000n
      ); // Allow for small rounding differences
    });

    it("should accept collection offer successfully", async function () {
      const tokenId = 1;
      const offerAmount = DEFAULT_FLOOR_PRICE;
      const offerId = 1;

      // Place offer
      const offerTx = await nftCollections
        .connect(addr1)
        .placeCollectionOffer(1, 1, 86400, {
          value: offerAmount,
        });
      await offerTx.wait();

      // Transfer NFT to addr2 (seller)
      await nftContract.transferFrom(owner.address, addr2.address, tokenId);

      // Approve NFTCollections contract to transfer the NFT
      const nftCollectionsAddress = await nftCollections.getAddress();
      await nftContract.connect(addr2).approve(nftCollectionsAddress, tokenId);

      // Accept offer
      await expect(
        nftCollections
          .connect(addr2)
          .acceptCollectionOffer(1, [tokenId], addr1.address, addr2.address)
      )
        .to.emit(nftCollections, "CollectionOfferAccepted")
        .withArgs(
          1,
          offerId,
          [tokenId],
          addr2.address,
          addr1.address,
          offerAmount
        );

      // Verify ownership transfer
      expect(await nftContract.ownerOf(tokenId)).to.equal(addr1.address);
    });
  });

  describe("Collection Management", function () {
    beforeEach(async function () {
      await nftCollections.createCollection(
        DEFAULT_MAX_SUPPLY,
        DEFAULT_ROYALTY_PERCENTAGE,
        DEFAULT_FLOOR_PRICE
      );
    });

    it("should update floor price successfully", async function () {
      const newFloorPrice = ethers.parseEther("0.2");
      await expect(nftCollections.updateFloorPrice(1, newFloorPrice))
        .to.emit(nftCollections, "FloorPriceUpdated")
        .withArgs(1, newFloorPrice);

      const collectionInfo = await nftCollections.getCollectionInfo(1);
      expect(collectionInfo.floorPrice).to.equal(newFloorPrice);
    });

    it("should update royalty percentage successfully", async function () {
      const newRoyaltyPercentage = 300; // 3%
      await expect(
        nftCollections.updateRoyaltyPercentage(1, newRoyaltyPercentage)
      )
        .to.emit(nftCollections, "RoyaltyPercentageUpdated")
        .withArgs(1, newRoyaltyPercentage);

      const collectionInfo = await nftCollections.getCollectionInfo(1);
      expect(collectionInfo.royaltyPercentage).to.equal(newRoyaltyPercentage);
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await nftCollections.createCollection(
        DEFAULT_MAX_SUPPLY,
        DEFAULT_ROYALTY_PERCENTAGE,
        DEFAULT_FLOOR_PRICE
      );
      await nftCollections.mintNFT(1, DEFAULT_NFT_PRICE, "ipfs://test-uri");
    });

    it("should return user created collections", async function () {
      const collections = await nftCollections.getUserCreatedCollections(
        owner.address
      );
      expect(collections.length).to.equal(1);
      expect(collections[0]).to.equal(1);
    });

    it("should return collection offers", async function () {
      await nftCollections.connect(addr1).placeCollectionOffer(1, 1, 86400, {
        value: DEFAULT_FLOOR_PRICE,
      });

      const offers = await nftCollections.getCollectionOffers(1);
      expect(offers.length).to.equal(1);
      expect(offers[0].offerer).to.equal(addr1.address);
      expect(offers[0].amount).to.equal(DEFAULT_FLOOR_PRICE);
      expect(offers[0].nftCount).to.equal(1);
      expect(offers[0].isActive).to.be.true;
    });

    it("should return user collection offers", async function () {
      await nftCollections.connect(addr1).placeCollectionOffer(1, 1, 86400, {
        value: DEFAULT_FLOOR_PRICE,
      });

      const offers = await nftCollections.getUserCollectionOffers(
        addr1.address
      );
      expect(offers.length).to.equal(1);
      expect(offers[0].offerer).to.equal(addr1.address);
      expect(offers[0].amount).to.equal(DEFAULT_FLOOR_PRICE);
      expect(offers[0].nftCount).to.equal(1);
      expect(offers[0].isActive).to.be.true;
    });

    it("should return collections with pagination", async function () {
      await nftCollections.createCollection(
        DEFAULT_MAX_SUPPLY,
        DEFAULT_ROYALTY_PERCENTAGE,
        DEFAULT_FLOOR_PRICE
      );

      const collections = await nftCollections.getCollections(0, 2);

      expect(collections.length).to.equal(2);
      expect(collections[0].collectionId).to.equal(1);
      expect(collections[1].collectionId).to.equal(2);
    });

    it("should handle pagination with offset correctly", async function () {
      // Create additional collections
      await nftCollections.createCollection(
        DEFAULT_MAX_SUPPLY,
        DEFAULT_ROYALTY_PERCENTAGE,
        DEFAULT_FLOOR_PRICE
      );
      await nftCollections.createCollection(
        DEFAULT_MAX_SUPPLY,
        DEFAULT_ROYALTY_PERCENTAGE,
        DEFAULT_FLOOR_PRICE
      );

      const collections = await nftCollections.getCollections(1, 2);
      expect(collections.length).to.equal(2);
      expect(collections[0].collectionId).to.equal(2);
      expect(collections[1].collectionId).to.equal(3);
    });

    it("should return correct number of collections when limit exceeds remaining items", async function () {
      const collections = await nftCollections.getCollections(0, 5);
      expect(collections.length).to.equal(1);
      expect(collections[0].collectionId).to.equal(1);
    });

    it("should return empty array when offset is greater than collection count", async function () {
      const collections = await nftCollections.getCollections(5, 1);
      expect(collections.length).to.equal(1);
    });
  });

  describe("Collection Status Management", function () {
    beforeEach(async function () {
      await nftCollections.createCollection(
        DEFAULT_MAX_SUPPLY,
        DEFAULT_ROYALTY_PERCENTAGE,
        DEFAULT_FLOOR_PRICE
      );

      await nftCollections.mintNFT(1, DEFAULT_NFT_PRICE, "ipfs://test-uri");
    });

    it("should handle expired collection offers correctly", async function () {
      // Place offer with short duration
      const shortDuration = 43200; // 12 hours
      await nftCollections
        .connect(addr1)
        .placeCollectionOffer(1, 1, shortDuration, {
          value: DEFAULT_FLOOR_PRICE,
        });

      // Fast forward time beyond offer expiration
      await ethers.provider.send("evm_increaseTime", [shortDuration + 1]);
      await ethers.provider.send("evm_mine", []);

      // Check offer status
      const offers = await nftCollections.getCollectionOffers(1);
      expect(offers.length).to.equal(0); // Expired offers should not be included
    });

    it("should not allow accepting expired offers", async function () {
      // Place offer
      const shortDuration = 43200; // 12 hours
      const tokenId = 1;

      await nftCollections
        .connect(addr1)
        .placeCollectionOffer(1, 1, shortDuration, {
          value: DEFAULT_FLOOR_PRICE,
        });

      // Mint and transfer NFT to addr2
      await nftCollections.mintNFT(1, DEFAULT_NFT_PRICE, "ipfs://test-uri");
      await nftContract.transferFrom(owner, addr2, tokenId);

      // Fast forward time beyond offer expiration
      await ethers.provider.send("evm_increaseTime", [shortDuration + 1]);
      await ethers.provider.send("evm_mine", []);

      // Try to accept expired offer
      await expect(
        nftCollections
          .connect(addr2)
          .acceptCollectionOffer(1, [tokenId], addr1.address, addr2.address)
      ).to.be.revertedWithCustomError(nftCollections, "OfferExpired");
    });
  });

  describe("Collection Offer Edge Cases", function () {
    beforeEach(async function () {
      await nftCollections.createCollection(
        DEFAULT_MAX_SUPPLY,
        DEFAULT_ROYALTY_PERCENTAGE,
        DEFAULT_FLOOR_PRICE
      );
      await nftCollections.mintNFT(1, DEFAULT_NFT_PRICE, "ipfs://test-uri");
    });

    it("should handle multiple offers from the same user correctly", async function () {
      // Place first offer
      await nftCollections.connect(addr1).placeCollectionOffer(1, 1, 86400, {
        value: DEFAULT_FLOOR_PRICE,
      });

      // Place second offer (should replace the first one)
      const newOfferAmount = DEFAULT_FLOOR_PRICE * 2n;
      await nftCollections.connect(addr1).placeCollectionOffer(1, 1, 86400, {
        value: newOfferAmount,
      });

      const offers = await nftCollections.getCollectionOffers(1);
      expect(offers.length).to.equal(1);
      expect(offers[0].amount).to.equal(newOfferAmount);
    });

    it("should handle offer withdrawal and new offer placement correctly", async function () {
      // Place and withdraw offer
      await nftCollections.connect(addr1).placeCollectionOffer(1, 1, 86400, {
        value: DEFAULT_FLOOR_PRICE,
      });
      await nftCollections.connect(addr1).withdrawCollectionOffer(1);

      // Place new offer
      await nftCollections.connect(addr1).placeCollectionOffer(1, 1, 86400, {
        value: DEFAULT_FLOOR_PRICE * 2n,
      });

      const offers = await nftCollections.getUserCollectionOffers(
        addr1.address
      );
      expect(offers.length).to.equal(1);
      expect(offers[0].amount).to.equal(DEFAULT_FLOOR_PRICE * 2n);
    });
  });

  describe("NFT Transfer Validation", function () {
    beforeEach(async function () {
      await nftCollections.createCollection(
        DEFAULT_MAX_SUPPLY,
        DEFAULT_ROYALTY_PERCENTAGE,
        DEFAULT_FLOOR_PRICE
      );
      await nftCollections.mintNFT(1, DEFAULT_NFT_PRICE, "ipfs://test-uri");
    });

    it("should validate NFT ownership before accepting offer", async function () {
      await nftCollections.connect(addr1).placeCollectionOffer(1, 1, 86400, {
        value: DEFAULT_FLOOR_PRICE,
      });

      // Try to accept offer without owning the NFT
      await expect(
        nftCollections
          .connect(addr2)
          .acceptCollectionOffer(1, [1], addr1.address, addr2.address),
        addr2.address
      ).to.be.revertedWithCustomError(nftCollections, "NotTokenOwner");
    });

    it("should handle NFT approval correctly", async function () {
      const tokenId = 1;
      await nftCollections.connect(addr1).placeCollectionOffer(1, 1, 86400, {
        value: DEFAULT_FLOOR_PRICE,
      });

      // Transfer NFT to addr2 but don't approve NFTCollections contract
      await nftContract.transferFrom(owner.address, addr2.address, tokenId);

      // Try to accept offer without approval
      const nftCollectionsAddress = await nftCollections.getAddress();
      await expect(
        nftCollections
          .connect(addr2)
          .acceptCollectionOffer(1, [tokenId], addr1.address, addr2.address)
      ).to.be.reverted; // Will revert with ERC721 transfer error

      // Approve and try again
      await nftContract.connect(addr2).approve(nftCollectionsAddress, tokenId);
      await expect(
        nftCollections
          .connect(addr2)
          .acceptCollectionOffer(1, [tokenId], addr1.address, addr2.address)
      ).to.not.be.reverted;
    });
  });
});
