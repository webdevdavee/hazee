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
  let nftMarketplace: SignerWithAddress;

  beforeEach(async function () {
    [owner, addr1, addr2, nftAuction, nftMarketplace] =
      await ethers.getSigners();

    // NFT Creators Contract
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
      nftAuction.address,
      nftMarketplace.address
    );

    // Register creators
    await nftCreators.connect(owner).registerCreator();
    await nftCreators.connect(addr1).registerCreator();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await nft.owner()).to.equal(owner.address);
    });

    it("Should set the correct name and symbol", async function () {
      expect(await nft.name()).to.equal("TestNFT");
      expect(await nft.symbol()).to.equal("TNFT");
    });

    it("Should set the correct creators contract", async function () {
      expect(await nft.creatorsContract()).to.equal(
        await nftCreators.getAddress()
      );
    });
  });

  describe("Minting", function () {
    it("Should allow registered creators to mint NFTs", async function () {
      const tokenURI = "https://example.com/token/1";
      const price = ethers.parseEther("1");
      const collectionId = 1;

      await expect(
        nft.connect(addr1).mint(addr1.address, tokenURI, price, collectionId)
      )
        .to.emit(nft, "NFTMinted")
        .withArgs(1, addr1.address);

      expect(await nft.ownerOf(1)).to.equal(addr1.address);
      expect(await nft.tokenURI(1)).to.equal(tokenURI);
      expect(await nft.getPrice(1)).to.equal(price);
      expect(await nft.getCollection(1)).to.equal(collectionId);
    });

    it("Should not allow unregistered creators to mint NFTs", async function () {
      const tokenURI = "https://example.com/token/1";
      const price = ethers.parseEther("1");
      const collectionId = 1;

      await expect(
        nft
          .connect(nftAuction)
          .mint(nftAuction.address, tokenURI, price, collectionId)
      ).to.be.revertedWith("Creator not registered");
    });
  });

  describe("NFT Status", function () {
    beforeEach(async function () {
      await nft
        .connect(addr1)
        .mint(addr1.address, "tokenURI", ethers.parseEther("1"), 1);
    });

    it("Should allow owner to set NFT status", async function () {
      await expect(nft.connect(addr1).setNFTStatus(1, 1)) // 1 = NFTStatus.SALE
        .to.emit(nft, "NFTStatusChanged")
        .withArgs(1, 1);

      expect(await nft.getTokenStatus(1)).to.equal(1);
    });

    it("Should allow contract owner to set NFT status", async function () {
      await expect(nft.connect(owner).setNFTStatus(1, 2)) // 2 = NFTStatus.AUCTION
        .to.emit(nft, "NFTStatusChanged")
        .withArgs(1, 2);

      expect(await nft.getTokenStatus(1)).to.equal(2);
    });

    it("Should allow auction contract to set NFT status", async function () {
      await expect(nft.connect(nftAuction).setNFTStatus(1, 3)) // 3 = NFTStatus.BOTH
        .to.emit(nft, "NFTStatusChanged")
        .withArgs(1, 3);

      expect(await nft.getTokenStatus(1)).to.equal(3);
    });

    it("Should not allow non-authorized addresses to set NFT status", async function () {
      await expect(nft.connect(addr2).setNFTStatus(1, 1)).to.be.revertedWith(
        "NFT: Only owner, contract owner, auction contract or marketplace contract can set status"
      );
    });
  });

  describe("Activities", function () {
    it("Should add and retrieve activities correctly", async function () {
      await nft
        .connect(addr1)
        .mint(addr1.address, "tokenURI", ethers.parseEther("1"), 1);

      await nft.connect(addr1).setNFTStatus(1, 1); // Set status to SALE

      const activities = await nft.getActivities(1);
      expect(activities.length).to.equal(2); // Including the "Minted" activity
      expect(activities[1].action).to.equal("Status Changed");
      expect(activities[1].value).to.equal(1);
    });
  });

  describe("Price Updates", function () {
    beforeEach(async function () {
      await nft
        .connect(addr1)
        .mint(addr1.address, "tokenURI", ethers.parseEther("1"), 1);
    });

    it("Should allow owner to set price", async function () {
      const newPrice = ethers.parseEther("2");
      await expect(nft.connect(addr1).setPrice(1, newPrice))
        .to.emit(nft, "PriceSet")
        .withArgs(1, newPrice);

      expect(await nft.getPrice(1)).to.equal(newPrice);
    });

    it("Should allow owner to update price", async function () {
      const newPrice = ethers.parseEther("2");
      await expect(nft.connect(addr1).updatePrice(1, newPrice))
        .to.emit(nft, "PriceUpdated")
        .withArgs(1, newPrice);

      expect(await nft.getPrice(1)).to.equal(newPrice);
    });

    it("Should not allow non-owners to update price", async function () {
      await expect(
        nft.connect(addr2).updatePrice(1, ethers.parseEther("2"))
      ).to.be.revertedWith("NFT: Only owner can update price");
    });
  });

  describe("Collection", function () {
    it("Should set and retrieve collection correctly", async function () {
      await nft
        .connect(addr1)
        .mint(addr1.address, "tokenURI", ethers.parseEther("1"), 42);

      const collectionId = await nft.getCollection(1);
      expect(collectionId).to.equal(42);
    });

    it("Should revert when querying collection for non-existent token", async function () {
      await expect(nft.getCollection(999)).to.be.revertedWith(
        "NFT: Collection query for nonexistent token"
      );
    });
  });

  describe("Token Existence", function () {
    it("Should correctly report token existence", async function () {
      await nft
        .connect(addr1)
        .mint(addr1.address, "tokenURI", ethers.parseEther("1"), 1);

      expect(await nft.exists(1)).to.be.true;
      expect(await nft.exists(2)).to.be.false;
    });
  });
});
