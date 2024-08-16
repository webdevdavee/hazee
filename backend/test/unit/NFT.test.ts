import { expect } from "chai";
import { ethers } from "hardhat";
import {
  NFT,
  NFT__factory,
  NFTCreators,
  NFTCreators__factory,
  NFTCollection,
  NFTCollection__factory,
} from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("NFT", function () {
  let nftFactory: NFT__factory;
  let nft: NFT;
  let nftCreatorsFactory: NFTCreators__factory;
  let nftCreators: NFTCreators;
  let nftCollectionFactory: NFTCollection__factory;
  let nftCollection: NFTCollection;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    nftCreatorsFactory = (await ethers.getContractFactory(
      "NFTCreators"
    )) as unknown as NFTCreators__factory;
    nftCreators = await nftCreatorsFactory.deploy();

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

    nftFactory = (await ethers.getContractFactory(
      "NFT"
    )) as unknown as NFT__factory;
    nft = await nftFactory.deploy(
      "TestNFT",
      "TNFT",
      await nftCollection.getAddress(),
      await nftCreators.getAddress()
    );

    // Register creators
    await nftCreators.registerCreator(await owner.getAddress());
    await nftCreators.registerCreator(await addr1.getAddress());
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await nft.owner()).to.equal(await nftCollection.getAddress());
    });

    it("Should have the correct name and symbol", async function () {
      expect(await nft.name()).to.equal("TestNFT");
      expect(await nft.symbol()).to.equal("TNFT");
    });
  });

  describe("Minting", function () {
    it("Should mint a new token", async function () {
      expect(
        nft.mint(await nft.getAddress(), "uri1", "NFT1", "Description1", [])
      );

      expect(await nft.ownerOf(1)).to.equal(await addr1.getAddress());
      expect(await nft.tokenURI(1)).to.equal("uri1");
    });

    it("Should fail if minter is not registered", async function () {
      await expect(
        nft.mint(addr2.address, "uri2", "NFT2", "Description2", [])
      ).to.be.revertedWith("Creator not registered");
    });
  });

  describe("Metadata", function () {
    beforeEach(async function () {
      await nft.mint(addr1.address, "uri1", "NFT1", "Description1", [
        { key: "trait1", value: "value1" },
        { key: "trait2", value: "value2" },
      ]);
    });

    it("Should return correct metadata", async function () {
      const metadata = await nft.getMetadata(1);
      expect(metadata.name).to.equal("NFT1");
      expect(metadata.description).to.equal("Description1");
      expect(metadata.creator).to.equal(addr1.address);
      expect(metadata.attributes.length).to.equal(2);
      expect(metadata.attributes[0].key).to.equal("trait1");
      expect(metadata.attributes[0].value).to.equal("value1");
    });

    it("Should return correct attribute", async function () {
      expect(await nft.getAttribute(1, "trait1")).to.equal("value1");
      expect(await nft.getAttribute(1, "trait2")).to.equal("value2");
      expect(await nft.getAttribute(1, "nonexistent")).to.equal("");
    });
  });

  describe("NFT Status", function () {
    beforeEach(async function () {
      await nft.mint(addr1.address, "uri1", "NFT1", "Description1", []);
    });

    it("Should set and get NFT status correctly", async function () {
      await nft.connect(addr1).setNFTStatus(1, 1); // Set to SALE
      expect(await nft.nftStatus(1)).to.equal(1);

      await nft.connect(addr1).setNFTStatus(1, 2); // Set to AUCTION
      expect(await nft.nftStatus(1)).to.equal(2);
    });

    it("Should fail if non-owner tries to set status", async function () {
      await expect(nft.connect(addr2).setNFTStatus(1, 1)).to.be.revertedWith(
        "NFT: Only owner or contract owner can set status"
      );
    });
  });

  describe("Activities", function () {
    beforeEach(async function () {
      await nft.mint(addr1.address, "uri1", "NFT1", "Description1", []);
    });

    it("Should add and retrieve activities", async function () {
      await nft
        .connect(addr1)
        .addActivity(
          1,
          "Listed",
          ethers.parseEther("1"),
          await ethers.provider.getBlock("latest").then((b) => b!.timestamp)
        );

      const activities = await nft.getActivities(1);
      expect(activities.length).to.equal(1);
      expect(activities[0].action).to.equal("Listed");
      expect(activities[0].value).to.equal(ethers.parseEther("1"));
    });

    it("Should fail if non-owner tries to add activity", async function () {
      await expect(
        nft
          .connect(addr2)
          .addActivity(
            1,
            "Listed",
            ethers.parseEther("1"),
            await ethers.provider.getBlock("latest").then((b) => b!.timestamp)
          )
      ).to.be.revertedWith(
        "NFT: Only owner or contract owner can add activity"
      );
    });
  });

  describe("Collection", function () {
    beforeEach(async function () {
      await nft.mint(addr1.address, "uri1", "NFT1", "Description1", []);
    });

    it("Should return correct collection address", async function () {
      expect(await nft.getCollection(1)).to.equal(owner.address);
    });

    it("Should fail for non-existent token", async function () {
      await expect(nft.getCollection(999)).to.be.revertedWith(
        "NFT: Collection query for nonexistent token"
      );
    });
  });

  describe("Token Existence", function () {
    it("Should correctly report token existence", async function () {
      expect(await nft.exists(1)).to.be.false;

      await nft.mint(addr1.address, "uri1", "NFT1", "Description1", []);

      expect(await nft.exists(1)).to.be.true;
      expect(await nft.exists(2)).to.be.false;
    });
  });
});
