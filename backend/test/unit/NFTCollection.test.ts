import { expect } from "chai";
import { ethers } from "hardhat";
import {
  NFT,
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
  let nft: NFT;
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

    // Getting the NFT contract address from the NFTCollection contract
    const nftContractAddress = await nftCollection.nftContract();
    nft = (await ethers.getContractAt(
      "NFT",
      nftContractAddress
    )) as unknown as NFT;

    // Register creators
    await nftCreators.registerCreator(owner);
    await nftCreators.registerCreator(addr1);
    await nftCreators.registerCreator(addr2);
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
      for (let i = 0; i < 3; i++) {
        await nftCollection.mintNFT("uri1", "NFT1", "Description1", []);
      }
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

    it("Should accept a valid collection offer", async function () {
      const nftCount = 1;
      const offerDuration = 3 * 24 * 60 * 60; // 3 days in seconds
      const offerAmount = ethers.parseEther("1");

      // Placing offer from addr1
      await nftCollection
        .connect(addr1)
        .placeCollectionOffer(nftCount, offerDuration, { value: offerAmount });

      const tokenIds = await nftCollection.getMintedNFTs();

      // Approve the NFTCollection contract to transfer the NFT
      await nft
        .connect(owner)
        .setApprovalForAll(await nftCollection.getAddress(), true);

      // Check initial balances
      const initialOwnerBalance = await ethers.provider.getBalance(
        owner.address
      );
      const initialAddr1Balance = await ethers.provider.getBalance(
        addr1.address
      );
      const initialContractBalance = await ethers.provider.getBalance(
        await nftCollection.getAddress()
      );

      // Accept the offer
      const acceptTx = await nftCollection
        .connect(owner)
        .acceptCollectionOffer([tokenIds[0]], addr1.address);
      const acceptReceipt = await acceptTx.wait();
      const gasCost = acceptReceipt!.gasUsed * acceptReceipt!.gasPrice;

      // Check balances after the transaction
      const finalOwnerBalance = await ethers.provider.getBalance(owner.address);
      const finalAddr1Balance = await ethers.provider.getBalance(addr1.address);
      const finalContractBalance = await ethers.provider.getBalance(
        await nftCollection.getAddress()
      );

      // Calculate balance changes
      const ownerBalanceChange =
        finalOwnerBalance - initialOwnerBalance + gasCost;
      const addr1BalanceChange = finalAddr1Balance - initialAddr1Balance;
      const contractBalanceChange =
        finalContractBalance - initialContractBalance;

      // Calculate expected amounts
      const royaltyPercentage = await nftCollection.royaltyPercentage();
      const royaltyAmount =
        (offerAmount * BigInt(royaltyPercentage)) / BigInt(10000);
      const sellerProceeds = offerAmount - royaltyAmount;

      // Check balances
      expect(ownerBalanceChange).to.be.closeTo(
        sellerProceeds + royaltyAmount,
        ethers.parseEther("0.000001")
      );
      expect(addr1BalanceChange).to.equal(BigInt(0)); // Because Addr1's balance didn't change
      expect(contractBalanceChange).to.equal(-offerAmount); // Contract balance decreased by offer amount

      // Check the new owner of the NFT
      const newOwner = await nft.ownerOf(tokenIds[0]);
      expect(newOwner).to.equal(addr1.address);

      // Check that the offer is no longer active
      const offer = await nftCollection.collectionOffers(addr1.address);
      expect(offer.isActive).to.be.false;
    });
  });

  describe("Ownership Updates", function () {
    it("Should correctly update ownership when transferring NFTs", async function () {
      const nftCount = 2;
      const offerDuration = 3 * 24 * 60 * 60; // 3 days in seconds
      const offerAmount = ethers.parseEther("2");

      // Mint 3 NFTs for the owner
      for (let i = 0; i < 4; i++) {
        await nftCollection
          .connect(owner)
          .mintNFT("uri" + i, "NFT" + i, "Description" + i, []);
      }

      // Check initial ownership count
      expect(await nftCollection.owners()).to.equal(1);

      // Place a collection offer from addr1 for 2 NFTs
      await nftCollection
        .connect(addr1)
        .placeCollectionOffer(nftCount, offerDuration, { value: offerAmount });

      // Get minted token IDs
      const tokenIds = await nftCollection.getMintedNFTs();

      // Approve the NFTCollection contract to transfer the NFTs
      await nft
        .connect(owner)
        .setApprovalForAll(await nftCollection.getAddress(), true);

      // Accept the offer for 2 NFTs
      await nftCollection
        .connect(owner)
        .acceptCollectionOffer([tokenIds[0], tokenIds[1]], addr1.address);

      // Check updated ownership count
      expect(await nftCollection.owners()).to.equal(2);

      // Verify ownership status
      expect(await nft.ownerOf(tokenIds[0])).to.equal(addr1.address);
      expect(await nft.ownerOf(tokenIds[1])).to.equal(addr1.address);
      expect(await nft.ownerOf(tokenIds[2])).to.equal(owner.address);

      // Transfer the last NFT from owner to addr2
      await nft
        .connect(owner)
        .transferFrom(owner.address, addr2.address, tokenIds[2]);

      // Check final ownership count
      expect(await nftCollection.owners()).to.equal(2);

      // Place and accept an offer for the last NFT to trigger ownership update
      await nftCollection
        .connect(addr2)
        .placeCollectionOffer(1, offerDuration, {
          value: ethers.parseEther("1"),
        });

      await nft
        .connect(owner)
        .setApprovalForAll(await nftCollection.getAddress(), true);

      await nftCollection
        .connect(owner)
        .acceptCollectionOffer([tokenIds[3]], addr2.address);

      // Check that ownership count decreased
      expect(await nftCollection.owners()).to.equal(2);

      // Verify final ownership status
      expect(await nft.ownerOf(tokenIds[0])).to.equal(addr1.address);
      expect(await nft.ownerOf(tokenIds[1])).to.equal(addr1.address);
      expect(await nft.ownerOf(tokenIds[2])).to.equal(addr2.address);
      expect(await nft.ownerOf(tokenIds[3])).to.equal(addr2.address);
    });
  });
});
