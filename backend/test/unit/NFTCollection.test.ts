import { expect } from "chai";
import { ethers } from "hardhat";
import {
  NFT,
  NFT__factory,
  NFTAuction,
  NFTAuction__factory,
  NFTCollections,
  NFTCollections__factory,
  NFTCreators,
  NFTCreators__factory,
  NFTMarketplace,
  NFTMarketplace__factory,
} from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("NFTCollections", function () {
  let nftAuction: NFTAuction;
  let nftCollections: NFTCollections;
  let nftCreators: NFTCreators;
  let nftMarketplace: NFTMarketplace;
  let nftMarketplaceFactory: NFTMarketplace__factory;
  let nft: NFT;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let nftContractAddress: SignerWithAddress;
  let feeRecipient: SignerWithAddress;

  const TWELVE_HOURS = 12 * 60 * 60;
  const ONE_WEEK = 7 * 24 * 60 * 60;

  beforeEach(async function () {
    [owner, addr1, addr2, nftContractAddress, feeRecipient] =
      await ethers.getSigners();

    // Deploy NFTCreators
    const nftCreatorsFactory = (await ethers.getContractFactory(
      "NFTCreators"
    )) as unknown as NFTCreators__factory;
    nftCreators = await nftCreatorsFactory.deploy();

    // Deploy NFTAuction
    const nftAuctionFactory = (await ethers.getContractFactory(
      "NFTAuction"
    )) as unknown as NFTAuction__factory;
    nftAuction = await nftAuctionFactory.deploy(
      nftContractAddress,
      await nftCreators.getAddress()
    );

    nftMarketplaceFactory = (await ethers.getContractFactory(
      "NFTMarketplace"
    )) as unknown as NFTMarketplace__factory;
    nftMarketplace = await nftMarketplaceFactory.deploy(
      feeRecipient.address,
      await nftCreators.getAddress(),
      await nftAuction.getAddress()
    );

    // Deploy NFTCollections
    const nftCollectionsFactory = (await ethers.getContractFactory(
      "NFTCollections"
    )) as unknown as NFTCollections__factory;
    nftCollections = await nftCollectionsFactory.deploy(
      await nftCreators.getAddress(),
      await nftAuction.getAddress(),
      await nftMarketplace.getAddress()
    );

    // Register creators
    await nftCreators.connect(owner).registerCreator();
    await nftCreators.connect(addr1).registerCreator();
    await nftCreators.connect(addr2).registerCreator();
  });

  describe("Collection Creation", function () {
    it("should create a new collection", async function () {
      const tx = await nftCollections.createCollection(
        "Test Collection",
        100,
        1000,
        ethers.parseEther("0.1")
      );

      await expect(tx)
        .to.emit(nftCollections, "CollectionAdded")
        .withArgs(
          1,
          await nftCollections.getAddress(),
          owner.address,
          "Test Collection"
        );

      // Verify collection details
      const collectionInfo = await nftCollections.getCollectionInfo(1);
      expect(collectionInfo.name).to.equal("Test Collection");
      expect(collectionInfo.maxSupply).to.equal(100);
      expect(collectionInfo.royaltyPercentage).to.equal(1000);
      expect(collectionInfo.floorPrice).to.equal(ethers.parseEther("0.1"));
    });

    it("should not allow royalty percentage over 40%", async function () {
      await expect(
        nftCollections.createCollection(
          "Invalid Collection",
          100,
          4100,
          ethers.parseEther("0.1")
        )
      ).to.be.revertedWithCustomError(
        nftCollections,
        "RoyaltyPercentageTooHigh"
      );
    });
  });

  describe("NFT Minting", function () {
    const collectionId = 1;

    beforeEach(async function () {
      await nftCollections.createCollection(
        "Mint Test Collection",
        10,
        1000,
        ethers.parseEther("0.1")
      );
    });

    it("should mint an NFT", async function () {
      const tx = await nftCollections.mintNFT(
        collectionId,
        ethers.parseEther("0.2"),
        "ipfs://testURI",
        "Test NFT",
        "Test NFT Description",
        []
      );

      await expect(tx)
        .to.emit(nftCollections, "NFTMinted")
        .withArgs(1, 1, owner.address);

      // Verify minted NFT count
      const collectionInfo = await nftCollections.getCollectionInfo(
        collectionId
      );
      expect(collectionInfo.mintedSupply).to.equal(1);
    });

    it("should not allow minting beyond max supply", async function () {
      for (let i = 0; i < 10; i++) {
        await nftCollections.mintNFT(
          collectionId,
          ethers.parseEther("0.2"),
          `ipfs://testURI${i}`,
          `Test NFT ${i}`,
          `Test NFT Description ${i}`,
          []
        );
      }

      await expect(
        nftCollections.mintNFT(
          collectionId,
          ethers.parseEther("0.2"),
          "ipfs://testURIExtra",
          "Extra NFT",
          "Should Fail",
          []
        )
      ).to.be.revertedWithCustomError(nftCollections, "MaximumSupplyReached");
    });
  });

  describe("Collection Offers", function () {
    let collectionId = 1;

    beforeEach(async function () {
      await nftCollections.createCollection(
        "Offer Test Collection",
        10,
        1000,
        ethers.parseEther("0.1")
      );

      // Mint some NFTs
      for (let i = 0; i < 5; i++) {
        await nftCollections.mintNFT(
          collectionId,
          ethers.parseEther("0.2"),
          `ipfs://testURI${i}`,
          `Test NFT ${i}`,
          `Test NFT Description ${i}`,
          []
        );
      }
    });

    it("should place a collection offer", async function () {
      const offerAmount = ethers.parseEther("0.5");
      const nftCount = 2;
      const duration = TWELVE_HOURS;

      const tx = await nftCollections
        .connect(addr1)
        .placeCollectionOffer(collectionId, nftCount, duration, {
          value: offerAmount,
        });

      // Get the current block timestamp
      const block = await ethers.provider.getBlock("latest");
      const expirationTime = block!.timestamp + duration;

      await expect(tx)
        .to.emit(nftCollections, "CollectionOfferPlaced")
        .withArgs(
          collectionId,
          addr1.address,
          offerAmount,
          nftCount,
          expirationTime
        );
    });

    it("should withdraw a collection offer", async function () {
      const offerAmount = ethers.parseEther("0.5");
      const nftCount = 2;
      const duration = TWELVE_HOURS;

      await nftCollections
        .connect(addr1)
        .placeCollectionOffer(collectionId, nftCount, duration, {
          value: offerAmount,
        });

      const withdrawTx = await nftCollections
        .connect(addr1)
        .withdrawCollectionOffer(collectionId);

      await expect(withdrawTx)
        .to.emit(nftCollections, "CollectionOfferWithdrawn")
        .withArgs(collectionId, addr1.address, offerAmount);
    });

    it("should accept a collection offer", async function () {
      const offerAmount = ethers.parseEther("0.5");
      const nftCount = 2;
      const duration = TWELVE_HOURS;

      await nftCollections
        .connect(addr1)
        .placeCollectionOffer(collectionId, nftCount, duration, {
          value: offerAmount,
        });

      const tokenIds = [1, 2]; // Assuming these are the first two minted NFTs

      // Verify ownership transfer
      const nftAddress = (await nftCollections.getCollectionInfo(collectionId))
        .nftContract;
      const nftContract = (await ethers.getContractAt(
        "NFT",
        nftAddress
      )) as unknown as NFT;

      await nftContract.setApprovalForAll(nftCollections.getAddress(), true);

      const acceptTx = await nftCollections.acceptCollectionOffer(
        collectionId,
        tokenIds,
        addr1.address
      );

      await expect(acceptTx)
        .to.emit(nftCollections, "CollectionOfferAccepted")
        .withArgs(
          collectionId,
          tokenIds,
          owner.address,
          addr1.address,
          offerAmount
        );

      expect(await nftContract.ownerOf(tokenIds[0])).to.equal(addr1.address);
      expect(await nftContract.ownerOf(tokenIds[1])).to.equal(addr1.address);
    });
  });

  describe("Collection Management", function () {
    let collectionId = 1;

    beforeEach(async function () {
      await nftCollections.createCollection(
        "Management Test Collection",
        10,
        1000,
        ethers.parseEther("0.1")
      );
    });

    it("should update floor price", async function () {
      const newFloorPrice = ethers.parseEther("0.2");
      const tx = await nftCollections.updateFloorPrice(
        collectionId,
        newFloorPrice
      );

      await expect(tx)
        .to.emit(nftCollections, "FloorPriceUpdated")
        .withArgs(collectionId, newFloorPrice);

      // Verify updated floor price
      const collectionInfo = await nftCollections.getCollectionInfo(
        collectionId
      );
      expect(collectionInfo.floorPrice).to.equal(newFloorPrice);
    });

    it("should update royalty percentage", async function () {
      const newRoyaltyPercentage = 2000; // 20%
      const tx = await nftCollections.updateRoyaltyPercentage(
        collectionId,
        newRoyaltyPercentage
      );

      await expect(tx)
        .to.emit(nftCollections, "RoyaltyPercentageUpdated")
        .withArgs(collectionId, newRoyaltyPercentage);

      // Verify updated royalty percentage
      const collectionInfo = await nftCollections.getCollectionInfo(
        collectionId
      );
      expect(collectionInfo.royaltyPercentage).to.equal(newRoyaltyPercentage);
    });

    it("should not allow updating royalty percentage above 40%", async function () {
      const invalidRoyaltyPercentage = 4100; // 41%
      await expect(
        nftCollections.updateRoyaltyPercentage(
          collectionId,
          invalidRoyaltyPercentage
        )
      ).to.be.revertedWithCustomError(
        nftCollections,
        "RoyaltyPercentageTooHigh"
      );
    });
  });

  describe("Collection Querying", function () {
    beforeEach(async function () {
      // Create multiple collections
      for (let i = 0; i < 5; i++) {
        await nftCollections.createCollection(
          `Test Collection ${i}`,
          100,
          1000,
          ethers.parseEther("0.1")
        );
      }
    });

    it("should get collections with pagination", async function () {
      const collections = await nftCollections.getCollections(0, 3);
      expect(collections.length).to.equal(3);
      expect(collections[0].name).to.equal("Test Collection 0");
      expect(collections[2].name).to.equal("Test Collection 2");
    });

    it("should get collection info", async function () {
      const collectionInfo = await nftCollections.getCollectionInfo(1);
      expect(collectionInfo.name).to.equal("Test Collection 0");
      expect(collectionInfo.maxSupply).to.equal(100);
      expect(collectionInfo.royaltyPercentage).to.equal(1000);
      expect(collectionInfo.floorPrice).to.equal(ethers.parseEther("0.1"));
    });
  });

  describe("Ownership and Permissions", function () {
    let collectionId = 1;

    beforeEach(async function () {
      await nftCollections.createCollection(
        "Ownership Test Collection",
        10,
        1000,
        ethers.parseEther("0.1")
      );
    });

    it("should not allow non-owners to mint NFTs", async function () {
      await expect(
        nftCollections
          .connect(addr1)
          .mintNFT(
            collectionId,
            ethers.parseEther("0.2"),
            "ipfs://testURI",
            "Test NFT",
            "Test NFT Description",
            []
          )
      ).to.be.revertedWithCustomError(
        nftCollections,
        "OnlyCurrentOwnerAllowed"
      );
    });

    it("should not allow non-owners to update floor price", async function () {
      await expect(
        nftCollections
          .connect(addr1)
          .updateFloorPrice(collectionId, ethers.parseEther("0.2"))
      ).to.be.revertedWithCustomError(
        nftCollections,
        "OnlyCurrentOwnerAllowed"
      );
    });

    it("should not allow non-owners to update royalty percentage", async function () {
      await expect(
        nftCollections
          .connect(addr1)
          .updateRoyaltyPercentage(collectionId, 2000)
      ).to.be.revertedWithCustomError(
        nftCollections,
        "OnlyCurrentOwnerAllowed"
      );
    });
  });

  describe("Edge Cases and Error Handling", function () {
    let collectionId = 1;

    beforeEach(async function () {
      await nftCollections.createCollection(
        "Edge Case Test Collection",
        10,
        1000,
        ethers.parseEther("0.1")
      );

      // Mint one NFT
      await nftCollections.mintNFT(
        collectionId,
        ethers.parseEther("0.1"),
        "ipfs://test1",
        "Test 1",
        "Desc 1",
        []
      );
    });

    it("should not allow placing an offer below floor price", async function () {
      const belowFloorPrice = ethers.parseEther("0.05");
      await expect(
        nftCollections
          .connect(addr1)
          .placeCollectionOffer(collectionId, 1, TWELVE_HOURS, {
            value: belowFloorPrice,
          })
      ).to.be.revertedWithCustomError(nftCollections, "OfferBelowFloorPrice");
    });

    it("should not allow placing an offer for more NFTs than minted", async function () {
      const offerAmount = ethers.parseEther("1");
      await expect(
        nftCollections
          .connect(addr1)
          .placeCollectionOffer(collectionId, 2, TWELVE_HOURS, {
            value: offerAmount,
          })
      ).to.be.revertedWithCustomError(nftCollections, "InvalidNFTCount");
    });

    it("should not allow accepting an offer with incorrect number of tokens", async function () {
      // Place an offer
      await nftCollections
        .connect(addr1)
        .placeCollectionOffer(collectionId, 1, TWELVE_HOURS, {
          value: ethers.parseEther("0.2"),
        });

      // Try to accept with incorrect number of tokens
      await expect(
        nftCollections.acceptCollectionOffer(
          collectionId,
          [1, 2],
          addr1.address
        )
      ).to.be.revertedWithCustomError(nftCollections, "InvalidNumberOfTokens");
    });

    it("should not allow accepting an expired offer", async function () {
      // Place an offer
      await nftCollections
        .connect(addr1)
        .placeCollectionOffer(collectionId, 1, TWELVE_HOURS, {
          value: ethers.parseEther("0.1"),
        });

      // Mint an NFT
      await nftCollections.mintNFT(
        collectionId,
        ethers.parseEther("0.1"),
        "ipfs://test1",
        "Test 1",
        "Desc 1",
        []
      );

      // Fast forward time
      await time.increase(TWELVE_HOURS + 1);

      // Try to accept the expired offer
      await expect(
        nftCollections.acceptCollectionOffer(collectionId, [1], addr1.address)
      ).to.be.revertedWithCustomError(nftCollections, "OfferExpired");
    });

    it("should not allow placing an offer with invalid duration", async function () {
      const offerAmount = ethers.parseEther("0.2");
      const invalidDuration = TWELVE_HOURS - 1; // Just below the minimum duration
      await expect(
        nftCollections
          .connect(addr1)
          .placeCollectionOffer(collectionId, 1, invalidDuration, {
            value: offerAmount,
          })
      ).to.be.revertedWithCustomError(nftCollections, "InvalidOfferDuration");
    });

    it("should not allow withdrawing a non-existent offer", async function () {
      await expect(
        nftCollections.connect(addr1).withdrawCollectionOffer(collectionId)
      ).to.be.revertedWithCustomError(
        nftCollections,
        "NoActiveCollectionOffer"
      );
    });

    it("should not allow accepting an offer for tokens not owned by the accepter", async function () {
      // Place an offer
      await nftCollections
        .connect(addr1)
        .placeCollectionOffer(collectionId, 1, TWELVE_HOURS, {
          value: ethers.parseEther("0.2"),
        });

      // Try to accept the offer with a token owned by the contract creator (owner)
      await expect(
        nftCollections
          .connect(addr2)
          .acceptCollectionOffer(collectionId, [1], addr1.address)
      ).to.be.revertedWithCustomError(nftCollections, "NotTokenOwner");
    });

    it("should not allow getting collections with invalid offset", async function () {
      await expect(
        nftCollections.getCollections(100, 10) // Assuming there are fewer than 100 collections
      ).to.be.revertedWithCustomError(nftCollections, "OffsetOutOfBounds");
    });

    it("should not allow getting info for an invalid collection ID", async function () {
      const invalidCollectionId = 1000; // Assuming this ID doesn't exist
      await expect(
        nftCollections.getCollectionInfo(invalidCollectionId)
      ).to.be.revertedWithCustomError(nftCollections, "InvalidCollectionID");
    });
  });
});
