import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import {
  NFTCreators,
  NFTCreators__factory,
  NFTMarketplace,
  NFTMarketplace__factory,
  NFTAuction,
  NFTAuction__factory,
  NFTCollections,
  NFTCollections__factory,
  NFT,
  NFT__factory,
} from "../../typechain-types";

describe("NFTMarketplace", function () {
  let nftAuctionFactory: NFTAuction__factory;
  let nftAuction: NFTAuction;
  let nftFactory: NFT__factory;
  let nft: NFT;
  let nftCreatorsFactory: NFTCreators__factory;
  let nftCreators: NFTCreators;
  let nftCollections: NFTCollections;
  let nftCollectionsFactory: NFTCollections__factory;
  let nftMarketplace: NFTMarketplace;
  let nftMarketplaceFactory: NFTMarketplace__factory;
  let owner: SignerWithAddress;
  let seller: SignerWithAddress;
  let buyer: SignerWithAddress;
  let feeRecipient: SignerWithAddress;

  const PLATFORM_FEE_PERCENTAGE = 250; // 2.5%
  const INITIAL_PRICE = ethers.parseEther("1");

  beforeEach(async function () {
    [owner, seller, buyer, feeRecipient] = await ethers.getSigners();

    nftCreatorsFactory = (await ethers.getContractFactory(
      "NFTCreators"
    )) as unknown as NFTCreators__factory;
    nftCreators = await nftCreatorsFactory.deploy();

    nftAuctionFactory = (await ethers.getContractFactory(
      "NFTAuction"
    )) as unknown as NFTAuction__factory;
    nftAuction = await nftAuctionFactory.deploy(
      feeRecipient.address,
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

    nftFactory = (await ethers.getContractFactory(
      "NFT"
    )) as unknown as NFT__factory;
    nft = await nftFactory.deploy(
      "TestNFT",
      "TNFT",
      await nftCreators.getAddress(),
      await nftAuction.getAddress(),
      await nftMarketplace.getAddress()
    );

    nftCollectionsFactory = (await ethers.getContractFactory(
      "NFTCollections"
    )) as unknown as NFTCollections__factory;
    nftCollections = await nftCollectionsFactory.deploy(
      await nftCreators.getAddress(),
      await nftAuction.getAddress()
    );

    // Mint an NFT for the seller
    await nftCreators.connect(seller).registerCreator();

    await nftCollections.connect(seller).createCollection(
      "Test Collection",
      "Test Description",
      100,
      1000, // 10% royalty
      ethers.parseEther("0.1")
    );

    const tokenURI = "https://example.com/token/1";
    const name = "Test NFT";
    const description = "This is a test NFT";
    const price = ethers.parseEther("1");
    const attributes = [{ key: "rarity", value: "rare" }];
    const collectionId = 1;

    await nft
      .connect(seller)
      .mint(
        seller.address,
        tokenURI,
        name,
        description,
        price,
        attributes,
        collectionId
      );
  });

  describe("listNFT", function () {
    it("should list an NFT successfully", async function () {
      await nft
        .connect(seller)
        .setApprovalForAll(await nftMarketplace.getAddress(), true);
      await expect(
        nftMarketplace
          .connect(seller)
          .listNFT(await nft.getAddress(), 1, INITIAL_PRICE, 1)
      )
        .to.emit(nftMarketplace, "NFTListed")
        .withArgs(
          1,
          seller.address,
          await nft.getAddress(),
          1,
          INITIAL_PRICE,
          1
        );
    });

    it("should revert if price is zero", async function () {
      await expect(
        nftMarketplace.connect(seller).listNFT(await nft.getAddress(), 1, 0, 1)
      ).to.be.revertedWith("Price must be greater than zero");
    });

    it("should revert if seller doesn't own the NFT", async function () {
      await expect(
        nftMarketplace
          .connect(buyer)
          .listNFT(await nft.getAddress(), 1, INITIAL_PRICE, 1)
      ).to.be.revertedWith("You don't own this NFT");
    });

    it("should revert if contract is not approved", async function () {
      await expect(
        nftMarketplace
          .connect(seller)
          .listNFT(await nft.getAddress(), 1, INITIAL_PRICE, 1)
      ).to.be.revertedWith("Contract not approved");
    });
  });

  describe("cancelListing", function () {
    beforeEach(async function () {
      await nft
        .connect(seller)
        .setApprovalForAll(await nftMarketplace.getAddress(), true);
      await nftMarketplace
        .connect(seller)
        .listNFT(await nft.getAddress(), 1, INITIAL_PRICE, 1);
    });

    it("should cancel a listing successfully", async function () {
      await expect(nftMarketplace.connect(seller).cancelListing(1))
        .to.emit(nftMarketplace, "ListingCancelled")
        .withArgs(1);
    });

    it("should revert if non-seller tries to cancel", async function () {
      await expect(
        nftMarketplace.connect(buyer).cancelListing(1)
      ).to.be.revertedWith("You're not the seller");
    });

    it("should revert if listing is not active", async function () {
      await nftMarketplace.connect(seller).cancelListing(1);
      await expect(
        nftMarketplace.connect(seller).cancelListing(1)
      ).to.be.revertedWith("Listing is not active");
    });
  });

  describe("updateListingPrice", function () {
    beforeEach(async function () {
      await nft
        .connect(seller)
        .setApprovalForAll(await nftMarketplace.getAddress(), true);
      await nftMarketplace
        .connect(seller)
        .listNFT(await nft.getAddress(), 1, INITIAL_PRICE, 1);
    });

    it("should update listing price successfully", async function () {
      const newPrice = ethers.parseEther("2");
      await expect(
        nftMarketplace.connect(seller).updateListingPrice(1, newPrice)
      )
        .to.emit(nftMarketplace, "NFTListed")
        .withArgs(1, seller.address, await nft.getAddress(), 1, newPrice, 1);
    });

    it("should revert if non-seller tries to update price", async function () {
      await expect(
        nftMarketplace
          .connect(buyer)
          .updateListingPrice(1, ethers.parseEther("2"))
      ).to.be.revertedWith("You're not the seller");
    });

    it("should revert if new price is zero", async function () {
      await expect(
        nftMarketplace.connect(seller).updateListingPrice(1, 0)
      ).to.be.revertedWith("Price must be greater than zero");
    });
  });

  describe("buyNFT", function () {
    beforeEach(async function () {
      await nft
        .connect(seller)
        .setApprovalForAll(await nftMarketplace.getAddress(), true);
      await nftMarketplace
        .connect(seller)
        .listNFT(await nft.getAddress(), 1, INITIAL_PRICE, 1);
    });

    it("should allow buying an NFT successfully", async function () {
      await expect(
        nftMarketplace.connect(buyer).buyNFT(1, { value: INITIAL_PRICE })
      )
        .to.emit(nftMarketplace, "NFTSold")
        .withArgs(
          1,
          buyer.address,
          seller.address,
          await nft.getAddress(),
          1,
          INITIAL_PRICE
        );

      expect(await nft.ownerOf(1)).to.equal(buyer.address);
    });

    it("should distribute funds correctly", async function () {
      const initialSellerBalance = await ethers.provider.getBalance(
        seller.address
      );
      const initialFeeRecipientBalance = await ethers.provider.getBalance(
        feeRecipient.address
      );

      await nftMarketplace.connect(buyer).buyNFT(1, { value: INITIAL_PRICE });

      const finalSellerBalance = await ethers.provider.getBalance(
        seller.address
      );
      const finalFeeRecipientBalance = await ethers.provider.getBalance(
        feeRecipient.address
      );

      const platformFee =
        (INITIAL_PRICE * BigInt(PLATFORM_FEE_PERCENTAGE)) / 10000n;
      const royaltyFee = (INITIAL_PRICE * 500n) / 10000n; // 5% royalty
      const sellerProceeds = INITIAL_PRICE - platformFee - royaltyFee;

      expect(finalSellerBalance - initialSellerBalance).to.equal(
        sellerProceeds
      );
      expect(finalFeeRecipientBalance - initialFeeRecipientBalance).to.equal(
        platformFee
      );
    });

    it("should revert if payment is insufficient", async function () {
      await expect(
        nftMarketplace
          .connect(buyer)
          .buyNFT(1, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("should revert if NFT is not for sale", async function () {
      await nftMarketplace.connect(seller).cancelListing(1);
      await expect(
        nftMarketplace.connect(buyer).buyNFT(1, { value: INITIAL_PRICE })
      ).to.be.revertedWith("Listing is not active");
    });
  });

  describe("isNFTListed", function () {
    it("should return true for a listed NFT", async function () {
      await nft
        .connect(seller)
        .setApprovalForAll(await nftMarketplace.getAddress(), true);
      await nftMarketplace
        .connect(seller)
        .listNFT(await nft.getAddress(), 1, INITIAL_PRICE, 1);
      expect(await nftMarketplace.isNFTListed(await nft.getAddress(), 1)).to.be
        .true;
    });

    it("should return false for an unlisted NFT", async function () {
      expect(await nftMarketplace.isNFTListed(await nft.getAddress(), 1)).to.be
        .false;
    });
  });
});
