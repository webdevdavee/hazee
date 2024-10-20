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
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("NFTCollections", function () {
  let nftCollections: NFTCollections;
  let nftAuction: NFTAuction;
  let nftMarketplace: NFTMarketplace;
  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;
  let fakeNftContractAddress: HardhatEthersSigner;
  let fakeContractAddress: HardhatEthersSigner;

  const TWELVE_HOURS = 12 * 60 * 60;
  const ONE_WEEK = 7 * 24 * 60 * 60;

  beforeEach(async function () {
    [owner, addr1, addr2, fakeNftContractAddress, fakeContractAddress] =
      await ethers.getSigners();

    const NFTAuctionFactory = (await ethers.getContractFactory(
      "NFTAuction"
    )) as unknown as NFTAuction__factory;
    nftAuction = await NFTAuctionFactory.deploy(fakeNftContractAddress.address);

    const NFTCollectionsFactory = (await ethers.getContractFactory(
      "NFTCollections"
    )) as unknown as NFTCollections__factory;
    nftCollections = await NFTCollectionsFactory.deploy(
      await nftAuction.getAddress(),
      fakeContractAddress
    );

    const NFTMarketplaceFactory = (await ethers.getContractFactory(
      "NFTMarketplace"
    )) as unknown as NFTMarketplace__factory;
    nftMarketplace = await NFTMarketplaceFactory.deploy(
      await nftCollections.getAddress(),
      await nftAuction.getAddress()
    );
  });

  describe("Collection Creation", function () {
    it("should create a new collection", async function () {
      const tx = await nftCollections.createCollection(
        100,
        1000,
        ethers.parseEther("0.1")
      );
      await expect(tx).to.emit(nftCollections, "CollectionAdded");

      const collectionInfo = await nftCollections.getCollectionInfo(1);
      expect(collectionInfo.maxSupply).to.equal(100);
      expect(collectionInfo.royaltyPercentage).to.equal(1000);
      expect(collectionInfo.floorPrice).to.equal(ethers.parseEther("0.1"));
    });

    it("should not allow royalty percentage over 40%", async function () {
      await expect(
        nftCollections.createCollection(100, 4100, ethers.parseEther("0.1"))
      ).to.be.revertedWithCustomError(
        nftCollections,
        "RoyaltyPercentageTooHigh"
      );
    });
  });

  describe("NFT Minting", function () {
    let collectionId = 1;

    beforeEach(async function () {
      await nftCollections.createCollection(10, 1000, ethers.parseEther("0.1"));
    });

    it("should mint an NFT", async function () {
      const tx = await nftCollections.mintNFT(
        collectionId,
        ethers.parseEther("0.2"),
        "ipfs://testURI"
      );
      await expect(tx).to.emit(nftCollections, "NFTMinted");

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
          `ipfs://testURI${i}`
        );
      }

      await expect(
        nftCollections.mintNFT(
          collectionId,
          ethers.parseEther("0.2"),
          "ipfs://testURIExtra"
        )
      ).to.be.revertedWithCustomError(nftCollections, "MaximumSupplyReached");
    });
  });

  describe("Collection Offers", function () {
    let collectionId = 1;

    beforeEach(async function () {
      await nftCollections.createCollection(10, 1000, ethers.parseEther("0.1"));

      for (let i = 0; i < 5; i++) {
        await nftCollections.mintNFT(
          collectionId,
          ethers.parseEther("0.2"),
          `ipfs://testURI${i}`
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

      await expect(tx)
        .to.emit(nftCollections, "CollectionOfferPlaced")
        .withArgs(
          collectionId,
          addr1.address,
          offerAmount,
          nftCount,
          (await time.latest()) + duration
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

      const tokenIds = [1n, 2n];

      const collectionInfo = await nftCollections.getCollectionInfo(
        collectionId
      );
      const nftContract = NFT__factory.connect(
        collectionInfo.nftContract,
        owner
      );

      await nftContract.setApprovalForAll(
        await nftCollections.getAddress(),
        true
      );

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
      const tx = await nftCollections.createCollection(
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

      const collectionInfo = await nftCollections.getCollectionInfo(
        collectionId
      );
      expect(collectionInfo.floorPrice).to.equal(newFloorPrice);
    });

    it("should update royalty percentage", async function () {
      const newRoyaltyPercentage = 2000;
      const tx = await nftCollections.updateRoyaltyPercentage(
        collectionId,
        newRoyaltyPercentage
      );

      await expect(tx)
        .to.emit(nftCollections, "RoyaltyPercentageUpdated")
        .withArgs(collectionId, newRoyaltyPercentage);

      const collectionInfo = await nftCollections.getCollectionInfo(
        collectionId
      );
      expect(collectionInfo.royaltyPercentage).to.equal(newRoyaltyPercentage);
    });

    it("should not allow updating royalty percentage above 40%", async function () {
      const invalidRoyaltyPercentage = 4100;
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

  describe("Ownership and Permissions", function () {
    let collectionId = 1;

    beforeEach(async function () {
      const tx = await nftCollections.createCollection(
        10,
        1000,
        ethers.parseEther("0.1")
      );
    });

    it("should not allow non-owners to mint NFTs", async function () {
      await expect(
        nftCollections
          .connect(addr1)
          .mintNFT(collectionId, ethers.parseEther("0.2"), "ipfs://testURI")
      ).to.be.revertedWithCustomError(nftCollections, "Unauthorized");
    });

    it("should not allow non-owners to update floor price", async function () {
      await expect(
        nftCollections
          .connect(addr1)
          .updateFloorPrice(collectionId, ethers.parseEther("0.2"))
      ).to.be.revertedWithCustomError(nftCollections, "Unauthorized");
    });

    it("should not allow non-owners to update royalty percentage", async function () {
      await expect(
        nftCollections
          .connect(addr1)
          .updateRoyaltyPercentage(collectionId, 2000)
      ).to.be.revertedWithCustomError(nftCollections, "Unauthorized");
    });
  });

  describe("Edge Cases and Error Handling", function () {
    let collectionId = 1;

    beforeEach(async function () {
      await nftCollections.createCollection(10, 1000, ethers.parseEther("0.1"));

      await nftCollections.mintNFT(
        collectionId,
        ethers.parseEther("0.1"),
        "ipfs://test1"
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
      await nftCollections
        .connect(addr1)
        .placeCollectionOffer(collectionId, 1, TWELVE_HOURS, {
          value: ethers.parseEther("0.2"),
        });

      await expect(
        nftCollections.acceptCollectionOffer(
          collectionId,
          [1n, 2n],
          addr1.address
        )
      ).to.be.revertedWithCustomError(nftCollections, "InvalidNumberOfTokens");
    });

    it("should not allow accepting an expired offer", async function () {
      await nftCollections
        .connect(addr1)
        .placeCollectionOffer(collectionId, 1, TWELVE_HOURS, {
          value: ethers.parseEther("0.1"),
        });

      await nftCollections.mintNFT(
        collectionId,
        ethers.parseEther("0.1"),
        "ipfs://test1"
      );

      await time.increase(TWELVE_HOURS + 1);

      await expect(
        nftCollections.acceptCollectionOffer(collectionId, [1n], addr1.address)
      ).to.be.revertedWithCustomError(nftCollections, "OfferExpired");
    });

    it("should not allow placing an offer with invalid duration", async function () {
      const offerAmount = ethers.parseEther("0.2");
      const invalidDuration = TWELVE_HOURS - 1;
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
      await nftCollections
        .connect(addr1)
        .placeCollectionOffer(collectionId, 1, TWELVE_HOURS, {
          value: ethers.parseEther("0.2"),
        });

      await expect(
        nftCollections
          .connect(addr2)
          .acceptCollectionOffer(collectionId, [1n], addr1.address)
      ).to.be.revertedWithCustomError(nftCollections, "NotTokenOwner");
    });

    it("should not allow getting info for an invalid collection ID", async function () {
      const invalidCollectionId = 1000n;
      await expect(
        nftCollections.getCollectionInfo(invalidCollectionId)
      ).to.be.revertedWithCustomError(nftCollections, "InvalidCollectionID");
    });
  });

  describe("View Functions", function () {
    let collectionId = 1;

    beforeEach(async function () {
      await nftCollections.createCollection(10, 1000, ethers.parseEther("0.1"));

      // Mint one NFT
      await nftCollections.mintNFT(
        collectionId,
        ethers.parseEther("0.1"),
        "ipfs://test1"
      );
    });

    it("should return user created collections", async function () {
      const userCollections = await nftCollections.getUserCreatedCollections(
        owner.address
      );
      expect(userCollections).to.deep.equal([collectionId]);
    });

    it("should return user collection offers", async function () {
      await nftCollections
        .connect(addr1)
        .placeCollectionOffer(collectionId, 1, TWELVE_HOURS, {
          value: ethers.parseEther("0.1"),
        });
      const userOffers = await nftCollections.getUserCollectionOffers(
        addr1.address
      );
      expect(userOffers).to.deep.equal([collectionId]);
    });

    it("should return correct collection info", async function () {
      const collectionInfo = await nftCollections.getCollectionInfo(
        collectionId
      );
      expect(collectionInfo.creator).to.equal(owner.address);
      expect(collectionInfo.maxSupply).to.equal(10);
      expect(collectionInfo.royaltyPercentage).to.equal(1000);
      expect(collectionInfo.floorPrice).to.equal(ethers.parseEther("0.1"));
      expect(collectionInfo.isActive).to.be.true;
    });
  });

  describe("Integration with NFT Contract", function () {
    let collectionId = 1;
    let nftContract: NFT;

    beforeEach(async function () {
      const tx = await nftCollections.createCollection(
        10,
        1000,
        ethers.parseEther("0.1")
      );

      const collectionInfo = await nftCollections.getCollectionInfo(
        collectionId
      );
      nftContract = NFT__factory.connect(collectionInfo.nftContract, owner);
    });

    it("should mint NFT with correct metadata", async function () {
      const tokenURI = "ipfs://test1";
      const price = ethers.parseEther("0.2");
      await nftCollections.mintNFT(collectionId, price, tokenURI);

      expect(await nftContract.tokenURI(1)).to.equal(tokenURI);
      expect(await nftContract.getPrice(1)).to.equal(price);
    });

    it("should transfer NFT ownership when accepting offer", async function () {
      await nftCollections.mintNFT(
        collectionId,
        ethers.parseEther("0.1"),
        "ipfs://test1"
      );
      await nftCollections
        .connect(addr1)
        .placeCollectionOffer(collectionId, 1, TWELVE_HOURS, {
          value: ethers.parseEther("0.1"),
        });

      await nftContract.setApprovalForAll(
        await nftCollections.getAddress(),
        true
      );
      await nftCollections.acceptCollectionOffer(
        collectionId,
        [1n],
        addr1.address
      );

      expect(await nftContract.ownerOf(1)).to.equal(addr1.address);
    });
  });

  describe("Gas Usage", function () {
    it("should have reasonable gas costs for collection creation", async function () {
      const tx = await nftCollections.createCollection(
        100,
        1000,
        ethers.parseEther("0.1")
      );
      const receipt = await tx.wait();
      expect(receipt?.gasUsed).to.be.lessThan(3000000);
    });

    it("should have reasonable gas costs for NFT minting", async function () {
      await nftCollections.createCollection(10, 1000, ethers.parseEther("0.1"));

      const collectionId = 1;

      const mintTx = await nftCollections.mintNFT(
        collectionId,
        ethers.parseEther("0.2"),
        "ipfs://testURI"
      );
      const mintReceipt = await mintTx.wait();
      expect(mintReceipt?.gasUsed).to.be.lessThan(3000000);
    });
  });
});
