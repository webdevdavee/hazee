import { expect } from "chai";
import { ethers } from "hardhat";
import {
  NFTCollection,
  NFTCollection__factory,
  NFTCreators,
  NFTCreators__factory,
} from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("NFTCollection", function () {
  let nftCollectionFactory: NFTCollection__factory;
  let nftCollection: NFTCollection;
  let nftCreatorsFactory: NFTCreators__factory;
  let nftCreators: NFTCreators;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // NFT Contract
    nftCreatorsFactory = (await ethers.getContractFactory(
      "NFTCreators"
    )) as unknown as NFTCreators__factory;

    nftCreators = await nftCreatorsFactory.deploy();

    // NFT Collection
    nftCollectionFactory = (await ethers.getContractFactory(
      "NFTCollection"
    )) as unknown as NFTCollection__factory;

    nftCollection = await nftCollectionFactory.deploy(
      "TestCollection",
      "The test collection",
      1000,
      3000,
      ethers.parseEther("0.8"),
      await nftCreators.getAddress(),
      "1"
    );

    // Register creators
    await nftCreators.registerCreator(owner);
    await nftCreators.registerCreator(addr1);
  });

  describe("Deployment", function () {
    it("Should set the right owner for the collection contract", async function () {
      expect(await nftCollection.owner()).to.equal(owner);
    });
  });

  describe("Minting", function () {
    beforeEach(async function () {
      await nftCollection.mintNFT("uri1", "NFT1", "Description1", []);
    });

    it("Should mint a new token", async function () {
      expect(nftCollection.mintNFT("uri1", "NFT1", "Description1", []));
    });

    it("Should get minted nfts", async function () {
      nftCollection.getMintedNFTs();
    });
  });

  describe("Floor Price", function () {
    it("Should update collection's floor price", async function () {
      nftCollection.updateFloorPrice(ethers.parseEther("0.4"));
    });
  });

  describe("Royalty", function () {
    it("Should update collection's royalty percentage", async function () {
      // Update the royalty percentage
      await nftCollection.updateRoyaltyPercentage(3000);

      // Retrieve the updated royalty percentage using the getter function
      const royaltyPercentage = await nftCollection.royaltyPercentage();

      // Check that the updated royalty matches the expected value
      expect(royaltyPercentage).to.equal(3000);
    });

    it("Should fail if percentage is more than 40%", async function () {
      await expect(
        nftCollection.updateRoyaltyPercentage(5000)
      ).to.be.revertedWith("Royalty percentage must be 40% or less");
    });
  });

  describe("Collection Offers", function () {
    beforeEach(async function () {
      await nftCollection.mintNFT("uri1", "NFT1", "Description1", []);
    });

    it("Should place a valid collection offer", async function () {
      const nftCount = 1;
      const offerDuration = 3 * 24 * 60 * 60; // 3 days in seconds

      await nftCollection.placeCollectionOffer(
        nftCount,
        offerDuration,
        { value: ethers.parseEther("2") } // 2 ETH for 2 NFTs
      );

      const offer = await nftCollection.collectionOffers(owner.address);

      expect(offer.isActive).to.be.true;
      expect(offer.amount).to.equal(ethers.parseEther("2"));
      expect(offer.nftCount).to.equal(nftCount);
    });

    it("Should withdraw a collection offer", async function () {
      const nftCount = 1;
      const offerDuration = 3 * 24 * 60 * 60; // 3 days in seconds

      await nftCollection.placeCollectionOffer(
        nftCount,
        offerDuration,
        { value: ethers.parseEther("2") } // 2 ETH for 2 NFTs
      );

      await nftCollection.withdrawCollectionOffer();

      const offer = await nftCollection.collectionOffers(owner.address);

      expect(offer.isActive).to.be.false;
      expect(offer.amount).to.equal(0);
    });

    // it("Should accept a valid collection offer", async function () {
    //   const nftCount = 1;
    //   const offerDuration = 3 * 24 * 60 * 60; // 3 days in seconds

    //   // Mint an NFT to owner (to sell later)
    //   await nftCollection
    //     .connect(owner)
    //     .mintNFT("https://example.com/nft1", "NFT 1", "First NFT", []);

    //   await nftCollection.connect(addr1).placeCollectionOffer(
    //     nftCount,
    //     offerDuration,
    //     { value: ethers.parseEther("1") } // 1 ETH for 1 NFT
    //   );

    //   const tokenIds = await nftCollection.getMintedNFTs();
    //   await nftCollection
    //     .connect(owner)
    //     .acceptCollectionOffer(tokenIds, addr1.address);

    //   //   const newOwner = await nftCollection.connect(addr1).ownerOf(tokenIds[0]);
    //   //   expect(newOwner).to.equal(addr1.address);

    //   const offer = await nftCollection.collectionOffers(addr1.address);
    //   expect(offer.isActive).to.be.false;
    // });
  });
});
