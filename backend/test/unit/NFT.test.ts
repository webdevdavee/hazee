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
      nftAuction.address
    );

    // Register creators
    await nftCreators.connect(addr1).registerCreator();
    await nftCreators.connect(addr2).registerCreator();
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
      const name = "Test NFT";
      const description = "This is a test NFT";
      const price = ethers.parseEther("1");
      const attributes = [{ key: "rarity", value: "rare" }];
      const collectionId = 1;

      await expect(
        nft
          .connect(addr1)
          .mint(
            addr1.address,
            tokenURI,
            name,
            description,
            price,
            attributes,
            collectionId
          )
      )
        .to.emit(nft, "NFTMinted")
        .withArgs(1, addr1.address, name);

      const [tokenId, , , , creator, , ,] = await nft.getMetadata(1);
      expect(tokenId).to.equal(1);
      expect(creator).to.equal(addr1.address);
    });

    it("Should not allow unregistered creators to mint NFTs", async function () {
      const tokenURI = "https://example.com/token/1";
      const name = "Test NFT";
      const description = "This is a test NFT";
      const price = ethers.parseEther("1");
      const attributes = [{ key: "rarity", value: "rare" }];
      const collectionId = 1;

      await expect(
        nft
          .connect(owner)
          .mint(
            owner.address,
            tokenURI,
            name,
            description,
            price,
            attributes,
            collectionId
          )
      ).to.be.revertedWith("Creator not registered");
    });
  });

  describe("Metadata", function () {
    it("Should return correct metadata for minted NFTs", async function () {
      const tokenURI = "https://example.com/token/1";
      const name = "Test NFT";
      const description = "This is a test NFT";
      const price = ethers.parseEther("1");
      const attributes = [{ key: "rarity", value: "rare" }];
      const collectionId = 1;

      await nft
        .connect(addr1)
        .mint(
          addr1.address,
          tokenURI,
          name,
          description,
          price,
          attributes,
          collectionId
        );

      const [
        tokenId,
        returnedName,
        returnedDescription,
        creationDate,
        creator,
        returnedPrice,
        status,
        returnedAttributes,
      ] = await nft.getMetadata(1);

      expect(tokenId).to.equal(1);
      expect(returnedName).to.equal(name);
      expect(returnedDescription).to.equal(description);
      expect(creator).to.equal(addr1.address);
      expect(returnedPrice).to.equal(price);
      expect(status).to.equal(0); // NFTStatus.NONE

      // Handle the returned attributes
      expect(returnedAttributes.length).to.equal(attributes.length);
      for (let i = 0; i < attributes.length; i++) {
        expect(returnedAttributes[i].key).to.equal(attributes[i].key);
        expect(returnedAttributes[i].value).to.equal(attributes[i].value);
      }
    });

    it("Should revert when querying metadata for non-existent token", async function () {
      await expect(nft.getMetadata(999)).to.be.revertedWith(
        "NFT: Metadata query for nonexistent token"
      );
    });
  });

  describe("NFT Status", function () {
    it("Should allow owner to set NFT status", async function () {
      await nft
        .connect(addr1)
        .mint(
          addr1.address,
          "tokenURI",
          "name",
          "description",
          ethers.parseEther("1"),
          [],
          1
        );

      await expect(nft.connect(addr1).setNFTStatus(1, 1)) // 1 = NFTStatus.SALE
        .to.emit(nft, "NFTStatusChanged")
        .withArgs(1, 1);

      const [, , , , , , status] = await nft.getMetadata(1);
      expect(status).to.equal(1);
    });

    it("Should allow contract owner to set NFT status", async function () {
      await nft
        .connect(addr1)
        .mint(
          addr1.address,
          "tokenURI",
          "name",
          "description",
          ethers.parseEther("1"),
          [],
          1
        );

      await expect(nft.connect(owner).setNFTStatus(1, 2)) // 2 = NFTStatus.AUCTION
        .to.emit(nft, "NFTStatusChanged")
        .withArgs(1, 2);

      const [, , , , , , status] = await nft.getMetadata(1);
      expect(status).to.equal(2);
    });

    it("Should allow auction contract to set NFT status", async function () {
      await nft
        .connect(addr1)
        .mint(
          addr1.address,
          "tokenURI",
          "name",
          "description",
          ethers.parseEther("1"),
          [],
          1
        );

      await expect(nft.connect(nftAuction).setNFTStatus(1, 3)) // 3 = NFTStatus.BOTH
        .to.emit(nft, "NFTStatusChanged")
        .withArgs(1, 3);

      const [, , , , , , status] = await nft.getMetadata(1);
      expect(status).to.equal(3);
    });

    it("Should not allow non-authorized addresses to set NFT status", async function () {
      await nft
        .connect(addr1)
        .mint(
          addr1.address,
          "tokenURI",
          "name",
          "description",
          ethers.parseEther("1"),
          [],
          1
        );

      await expect(nft.connect(addr2).setNFTStatus(1, 1)).to.be.revertedWith(
        "NFT: Only owner, contract owner, or auction contract can set status"
      );
    });
  });

  describe("Activities", function () {
    it("Should add and retrieve activities correctly", async function () {
      await nft
        .connect(addr1)
        .mint(
          addr1.address,
          "tokenURI",
          "name",
          "description",
          ethers.parseEther("1"),
          [],
          1
        );

      await expect(
        nft.connect(addr1).addActivity(1, "Listed", ethers.parseEther("2"))
      )
        .to.emit(nft, "NFTActivityAdded")
        .withArgs(1, "Listed", ethers.parseEther("2"));

      const activities = await nft.getActivities(1);
      expect(activities.length).to.equal(2); // Including the "Minted" activity
      expect(activities[1].action).to.equal("Listed");
      expect(activities[1].value).to.equal(ethers.parseEther("2"));
    });

    it("Should not allow non-authorized addresses to add activities", async function () {
      await nft
        .connect(addr1)
        .mint(
          addr1.address,
          "tokenURI",
          "name",
          "description",
          ethers.parseEther("1"),
          [],
          1
        );

      await expect(
        nft.connect(addr2).addActivity(1, "Listed", ethers.parseEther("2"))
      ).to.be.revertedWith(
        "NFT: Only owner, contract owner, or auction contract can add activity"
      );
    });
  });

  describe("Price Updates", function () {
    it("Should allow owner to update price", async function () {
      await nft
        .connect(addr1)
        .mint(
          addr1.address,
          "tokenURI",
          "name",
          "description",
          ethers.parseEther("1"),
          [],
          1
        );

      const newPrice = ethers.parseEther("2");
      await nft.connect(addr1).updatePrice(1, newPrice);

      const [, , , , , price, ,] = await nft.getMetadata(1);
      expect(price).to.equal(newPrice);
    });

    it("Should not allow non-owners to update price", async function () {
      await nft
        .connect(addr1)
        .mint(
          addr1.address,
          "tokenURI",
          "name",
          "description",
          ethers.parseEther("1"),
          [],
          1
        );

      await expect(
        nft.connect(addr2).updatePrice(1, ethers.parseEther("2"))
      ).to.be.revertedWith("NFT: Only owner can update price");
    });
  });

  describe("Token Queries", function () {
    it("Should return all tokens", async function () {
      await nft
        .connect(addr1)
        .mint(
          addr1.address,
          "tokenURI1",
          "name1",
          "description1",
          ethers.parseEther("1"),
          [],
          1
        );

      await nft
        .connect(addr2)
        .mint(
          addr2.address,
          "tokenURI2",
          "name2",
          "description2",
          ethers.parseEther("2"),
          [],
          2
        );

      const allTokens = await nft.getAllTokens();
      expect(allTokens.length).to.equal(2);
      expect(allTokens[0].name).to.equal("name1");
      expect(allTokens[1].name).to.equal("name2");
    });

    it("Should return tokens by owner", async function () {
      await nft
        .connect(addr1)
        .mint(
          addr1.address,
          "tokenURI1",
          "name1",
          "description1",
          ethers.parseEther("1"),
          [],
          1
        );

      await nft
        .connect(addr1)
        .mint(
          addr1.address,
          "tokenURI2",
          "name2",
          "description2",
          ethers.parseEther("2"),
          [],
          2
        );

      await nft
        .connect(addr2)
        .mint(
          addr2.address,
          "tokenURI3",
          "name3",
          "description3",
          ethers.parseEther("3"),
          [],
          3
        );

      const addr1Tokens = await nft.getTokensByOwner(addr1.address);
      expect(addr1Tokens.length).to.equal(2);
      expect(addr1Tokens[0].name).to.equal("name1");
      expect(addr1Tokens[1].name).to.equal("name2");

      const addr2Tokens = await nft.getTokensByOwner(addr2.address);
      expect(addr2Tokens.length).to.equal(1);
      expect(addr2Tokens[0].name).to.equal("name3");
    });
  });

  describe("Collection", function () {
    it("Should set and retrieve collection correctly", async function () {
      await nft
        .connect(addr1)
        .mint(
          addr1.address,
          "tokenURI",
          "name",
          "description",
          ethers.parseEther("1"),
          [],
          42
        );

      const collectionId = await nft.getCollection(1);
      expect(collectionId).to.equal(42);
    });

    it("Should revert when querying collection for non-existent token", async function () {
      await expect(nft.getCollection(999)).to.be.revertedWith(
        "NFT: Collection query for nonexistent token"
      );
    });
  });
});
