import { expect } from "chai";
import { ethers } from "hardhat";
import { NFT, NFT__factory } from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("NFT", function () {
  let nftFactory: NFT__factory;
  let nft: NFT;
  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;
  let auctionContract: HardhatEthersSigner;
  let marketplaceContract: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, addr1, addr2, auctionContract, marketplaceContract] =
      await ethers.getSigners();

    nftFactory = (await ethers.getContractFactory(
      "NFT"
    )) as unknown as NFT__factory;
    nft = await nftFactory.deploy(
      "TestNFT",
      "TNFT",
      auctionContract,
      marketplaceContract
    );
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await nft.owner()).to.equal(owner.address);
    });

    it("Should set the correct name and symbol", async function () {
      expect(await nft.name()).to.equal("TestNFT");
      expect(await nft.symbol()).to.equal("TNFT");
    });

    it("Should set the correct auction and marketplace contracts", async function () {
      expect(await nft.auctionContract()).to.equal(auctionContract.address);
      expect(await nft.marketplaceContract()).to.equal(
        marketplaceContract.address
      );
    });
  });

  describe("Minting", function () {
    it("Should allow users to mint NFTs", async function () {
      const tokenURI = "https://example.com/token/1";
      const price = ethers.parseEther("1");
      const collectionId = 1;

      await expect(
        nft.connect(addr1).mint(addr1, tokenURI, price, collectionId)
      )
        .to.emit(nft, "NFTMinted")
        .withArgs(1, addr1.address);

      expect(await nft.ownerOf(1)).to.equal(addr1.address);
      expect(await nft.tokenURI(1)).to.equal(tokenURI);
      expect(await nft.getPrice(1)).to.equal(price);
      expect(await nft.getCollection(1)).to.equal(collectionId);
    });

    it("Should revert when minting with zero address", async function () {
      await expect(
        nft.mint(ethers.ZeroAddress, "tokenURI", ethers.parseEther("1"), 1)
      ).to.be.revertedWithCustomError(nft, "InvalidRecipientAddress");
    });

    it("Should revert when minting with empty URI", async function () {
      await expect(
        nft.mint(addr1.address, "", ethers.parseEther("1"), 1)
      ).to.be.revertedWithCustomError(nft, "EmptyTokenURI");
    });

    it("Should revert when minting with zero price", async function () {
      await expect(
        nft.mint(addr1.address, "tokenURI", 0, 1)
      ).to.be.revertedWithCustomError(nft, "InvalidPrice");
    });
  });

  describe("NFT Status", function () {
    beforeEach(async function () {
      await nft
        .connect(addr1)
        .mint(addr1, "tokenURI", ethers.parseEther("1"), 1);
    });

    it("Should allow owner to set NFT status", async function () {
      await expect(nft.connect(addr1).setNFTStatus(1, 1))
        .to.emit(nft, "NFTStatusChanged")
        .withArgs(1, 1);

      expect(await nft.getTokenStatus(1)).to.equal(1);
    });

    it("Should allow contract owner to set NFT status", async function () {
      await expect(nft.connect(owner).setNFTStatus(1, 2))
        .to.emit(nft, "NFTStatusChanged")
        .withArgs(1, 2);

      expect(await nft.getTokenStatus(1)).to.equal(2);
    });

    it("Should allow auction contract to set NFT status", async function () {
      await expect(nft.connect(auctionContract).setNFTStatus(1, 3))
        .to.emit(nft, "NFTStatusChanged")
        .withArgs(1, 3);

      expect(await nft.getTokenStatus(1)).to.equal(3);
    });

    it("Should allow marketplace contract to set NFT status", async function () {
      await expect(nft.connect(marketplaceContract).setNFTStatus(1, 1))
        .to.emit(nft, "NFTStatusChanged")
        .withArgs(1, 1);

      expect(await nft.getTokenStatus(1)).to.equal(1);
    });

    it("Should not allow non-authorized addresses to set NFT status", async function () {
      await expect(
        nft.connect(addr2).setNFTStatus(1, 1)
      ).to.be.revertedWithCustomError(nft, "NotAuthorized");
    });

    it("Should revert when setting status for non-existent token", async function () {
      await expect(
        nft.connect(addr1).setNFTStatus(999, 1)
      ).to.be.revertedWithCustomError(nft, "TokenNotExists");
    });
  });

  describe("Collection", function () {
    it("Should set and retrieve collection correctly", async function () {
      await nft
        .connect(addr1)
        .mint(addr1, "tokenURI", ethers.parseEther("1"), 42);

      const collectionId = await nft.getCollection(1);
      expect(collectionId).to.equal(42);
    });

    it("Should revert when querying collection for non-existent token", async function () {
      await expect(nft.getCollection(999)).to.be.revertedWithCustomError(
        nft,
        "TokenNotExists"
      );
    });
  });

  describe("Token Existence", function () {
    it("Should correctly report token existence", async function () {
      await nft
        .connect(addr1)
        .mint(addr1, "tokenURI", ethers.parseEther("1"), 1);

      expect(await nft.exists(1)).to.be.true;
      expect(await nft.exists(2)).to.be.false;
    });
  });

  describe("Created Tokens", function () {
    it("Should correctly track and retrieve created tokens", async function () {
      await nft
        .connect(addr1)
        .mint(addr1, "tokenURI1", ethers.parseEther("1"), 1);
      await nft
        .connect(addr1)
        .mint(addr1, "tokenURI2", ethers.parseEther("2"), 1);

      const createdTokens = await nft.getCreatedTokens(addr1.address);
      expect(createdTokens.length).to.equal(2);
      expect(createdTokens[0]).to.equal(1);
      expect(createdTokens[1]).to.equal(2);
    });
  });

  describe("Items Sold", function () {
    it("Should correctly record and retrieve items sold", async function () {
      await nft
        .connect(addr1)
        .mint(addr1, "tokenURI", ethers.parseEther("1"), 1);
      await nft.connect(marketplaceContract).recordSale(addr1.address);

      expect(await nft.getItemsSold(addr1.address)).to.equal(1);
    });

    it("Should only allow auction or marketplace contracts to record sales", async function () {
      await expect(
        nft.connect(addr2).recordSale(addr1.address)
      ).to.be.revertedWith("NFT: Not authorized"); // Note: This one still uses require in the contract
    });
  });

  describe("Owned Tokens", function () {
    it("Should correctly retrieve owned tokens", async function () {
      await nft
        .connect(addr1)
        .mint(addr1, "tokenURI1", ethers.parseEther("1"), 1);
      await nft
        .connect(addr1)
        .mint(addr1, "tokenURI2", ethers.parseEther("2"), 1);
      await nft
        .connect(addr2)
        .mint(addr2, "tokenURI3", ethers.parseEther("3"), 2);

      const addr1OwnedTokens = await nft.getOwnedTokens(addr1.address);
      expect(addr1OwnedTokens.length).to.equal(2);
      expect(addr1OwnedTokens[0]).to.equal(1);
      expect(addr1OwnedTokens[1]).to.equal(2);

      const addr2OwnedTokens = await nft.getOwnedTokens(addr2.address);
      expect(addr2OwnedTokens.length).to.equal(1);
      expect(addr2OwnedTokens[0]).to.equal(3);
    });
  });
});
