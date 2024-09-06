import { expect } from "chai";
import { ethers } from "hardhat";
import {
  NFT,
  NFT__factory,
  NFTCreators,
  NFTCreators__factory,
} from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("NFT", function () {
  let nftFactory: NFT__factory;
  let nft: NFT;
  let nftCreatorsFactory: NFTCreators__factory;
  let nftCreators: NFTCreators;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let nftAuction: SignerWithAddress;

  beforeEach(async function () {
    [owner, addr1, addr2, nftAuction] = await ethers.getSigners();

    // NFT Contract
    nftCreatorsFactory = (await ethers.getContractFactory(
      "NFTCreators"
    )) as unknown as NFTCreators__factory;

    nftCreators = await nftCreatorsFactory.deploy();

    // NFT Contract
    nftFactory = (await ethers.getContractFactory(
      "NFT"
    )) as unknown as NFT__factory;

    nft = await nftFactory.deploy(
      "TestNFT",
      "TNFT",
      await nftCreators.getAddress(),
      nftAuction.address
    );

    // Register creators
    await nftCreators.registerCreator(owner);
    await nftCreators.registerCreator(addr1);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await nft.owner()).to.equal(owner);
    });

    it("Should have the correct name and symbol", async function () {
      expect(await nft.name()).to.equal("TestNFT");
      expect(await nft.symbol()).to.equal("TNFT");
    });
  });

  describe("Minting", function () {
    it("Should mint a new token", async function () {
      // Call mint function from the owner's account
      await expect(
        nft
          .connect(owner)
          .mint(addr1.address, "uri1", "NFT1", "Description1", [])
      ).to.not.be.reverted;

      expect(await nft.ownerOf(1)).to.equal(addr1.address);
      expect(await nft.tokenURI(1)).to.equal("uri1");
    });

    it("Should fail if minter is not registered", async function () {
      await expect(
        nft
          .connect(owner)
          .mint(addr2.address, "uri2", "NFT2", "Description2", [])
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

    it("Should set NFT status correctly when called by owner", async function () {
      await expect(nft.connect(owner).setNFTStatus(1, 1)).to.not.be.reverted;
      expect(await nft.nftStatus(1)).to.equal(1);
    });

    it("Should set NFT status correctly when called by NFT owner", async function () {
      await expect(nft.connect(addr1).setNFTStatus(1, 2)).to.not.be.reverted;
      expect(await nft.nftStatus(1)).to.equal(2);
    });

    it("Should set NFT status correctly when called by auction contract", async function () {
      await expect(nft.connect(nftAuction).setNFTStatus(1, 3)).to.not.be
        .reverted;
      expect(await nft.nftStatus(1)).to.equal(3);
    });

    it("Should fail if non-authorized address tries to set status", async function () {
      await expect(nft.connect(addr2).setNFTStatus(1, 1)).to.be.revertedWith(
        "NFT: Only owner, contract owner, or auction contract can set status"
      );
    });
  });

  describe("Activities", function () {
    beforeEach(async function () {
      await nft.mint(addr1.address, "uri1", "NFT1", "Description1", []);
      await nft.addActivity(
        1,
        "Listed",
        ethers.parseEther("1"),
        await ethers.provider.getBlock("latest").then((b) => b!.timestamp)
      );
    });

    it("Should add activities", async function () {
      await nft.addActivity(
        1,
        "Listed",
        ethers.parseEther("1"),
        await ethers.provider.getBlock("latest").then((b) => b!.timestamp)
      );
    });

    it("should retrieve activities", async function () {
      const activities = await nft.connect(owner).getActivities(1);
      expect(activities.length).to.equal(2);
      expect(activities[0].action).to.equal("Minted");
      expect(activities[0].value).to.equal(0);
      expect(activities[1].action).to.equal("Listed");
      expect(activities[1].value).to.equal(ethers.parseEther("1"));
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
