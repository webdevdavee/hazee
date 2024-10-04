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

    nftCollectionsFactory = (await ethers.getContractFactory(
      "NFTCollections"
    )) as unknown as NFTCollections__factory;
    nftCollections = await nftCollectionsFactory.deploy(
      await nftCreators.getAddress(),
      await nftAuction.getAddress(),
      await nftMarketplace.getAddress()
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

    // Register seller as a creator
    await nftCreators.connect(seller).registerCreator();

    // Create a collection
    await nftCollections.connect(seller).createCollection(
      "Test Collection",
      100,
      1000, // 10% royalty
      ethers.parseEther("0.1")
    );

    // Mint an NFT for the seller
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
    const name = "Initial NFT";
    const description = "This is the initial description";
    const attributes = [{ key: "rarity", value: "common" }];

    it("should list an NFT successfully", async function () {
      // Check NFT ownership
      expect(await nft.ownerOf(1)).to.equal(seller.address);

      await nft
        .connect(seller)
        .setApprovalForAll(await nftMarketplace.getAddress(), true);

      // Check collection exists
      const collectionInfo = await nftCollections.getCollectionInfo(1);
      expect(collectionInfo.isActive).to.be.true;

      await expect(
        nftMarketplace
          .connect(seller)
          .listNFT(
            await nft.getAddress(),
            1,
            INITIAL_PRICE,
            1,
            name,
            description,
            attributes
          )
      )
        .to.emit(nftMarketplace, "NFTListed")
        .withArgs(
          1,
          seller.address,
          await nft.getAddress(),
          1,
          INITIAL_PRICE,
          1 // NFT.NFTStatus.SALE
        );

      // Verify listing
      const listing = await nftMarketplace.listings(1);
      expect(listing.isActive).to.be.true;
      expect(listing.seller).to.equal(seller.address);
      expect(listing.nftContract).to.equal(await nft.getAddress());
      expect(listing.tokenId).to.equal(1);
      expect(listing.price).to.equal(INITIAL_PRICE);
    });

    it("should revert if price is zero", async function () {
      await expect(
        nftMarketplace
          .connect(seller)
          .listNFT(
            await nft.getAddress(),
            1,
            0,
            1,
            name,
            description,
            attributes
          )
      ).to.be.revertedWith("Price must be greater than zero");
    });

    it("should revert if seller doesn't own the NFT", async function () {
      await expect(
        nftMarketplace
          .connect(buyer)
          .listNFT(
            await nft.getAddress(),
            1,
            INITIAL_PRICE,
            1,
            name,
            description,
            attributes
          )
      ).to.be.revertedWith("You don't own this NFT");
    });

    it("should revert if contract is not approved", async function () {
      await expect(
        nftMarketplace
          .connect(seller)
          .listNFT(
            await nft.getAddress(),
            1,
            INITIAL_PRICE,
            1,
            name,
            description,
            attributes
          )
      ).to.be.revertedWith("Contract not approved");
    });

    it("should revert if NFT is on auction", async function () {
      await nft
        .connect(seller)
        .setApprovalForAll(await nftAuction.getAddress(), true);
      await nftAuction
        .connect(seller)
        .createAuction(await nft.getAddress(), 1, INITIAL_PRICE, 86400);

      await nft
        .connect(seller)
        .setApprovalForAll(await nftMarketplace.getAddress(), true);
      await expect(
        nftMarketplace
          .connect(seller)
          .listNFT(
            await nft.getAddress(),
            1,
            INITIAL_PRICE,
            1,
            name,
            description,
            attributes
          )
      ).to.be.revertedWith("NFT is currently on auction");
    });
  });

  describe("cancelListing", function () {
    const name = "Initial NFT";
    const description = "This is the initial description";
    const attributes = [{ key: "rarity", value: "common" }];

    beforeEach(async function () {
      await nft
        .connect(seller)
        .setApprovalForAll(await nftMarketplace.getAddress(), true);
      await nftMarketplace
        .connect(seller)
        .listNFT(
          await nft.getAddress(),
          1,
          INITIAL_PRICE,
          1,
          name,
          description,
          attributes
        );
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
    const name = "Initial NFT";
    const description = "This is the initial description";
    const attributes = [{ key: "rarity", value: "common" }];

    beforeEach(async function () {
      await nft
        .connect(seller)
        .setApprovalForAll(await nftMarketplace.getAddress(), true);
      await nftMarketplace
        .connect(seller)
        .listNFT(
          await nft.getAddress(),
          1,
          INITIAL_PRICE,
          1,
          name,
          description,
          attributes
        );
    });

    it("should update listing price successfully", async function () {
      const newPrice = ethers.parseEther("2");
      await expect(
        nftMarketplace.connect(seller).updateListingPrice(1, newPrice)
      )
        .to.emit(nftMarketplace, "NFTListed")
        .withArgs(1, seller.address, await nft.getAddress(), 1, newPrice, 0);
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
    const name = "Initial NFT";
    const description = "This is the initial description";
    const attributes = [{ key: "rarity", value: "common" }];

    beforeEach(async function () {
      await nft
        .connect(seller)
        .setApprovalForAll(await nftMarketplace.getAddress(), true);
      await nftMarketplace
        .connect(seller)
        .listNFT(
          await nft.getAddress(),
          1,
          INITIAL_PRICE,
          1,
          name,
          description,
          attributes
        );
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

      const tx = await nftMarketplace
        .connect(buyer)
        .buyNFT(1, { value: INITIAL_PRICE });
      await tx.wait();

      const finalSellerBalance = await ethers.provider.getBalance(
        seller.address
      );
      const finalFeeRecipientBalance = await ethers.provider.getBalance(
        feeRecipient.address
      );

      const platformFee =
        (INITIAL_PRICE * BigInt(PLATFORM_FEE_PERCENTAGE)) / 10000n;
      const royaltyFee = (INITIAL_PRICE * 1000n) / 10000n; // 10% royalty
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

    it("should revert if NFT is on auction", async function () {
      await nft
        .connect(seller)
        .setApprovalForAll(await nftAuction.getAddress(), true);
      await nftAuction
        .connect(seller)
        .createAuction(await nft.getAddress(), 1, INITIAL_PRICE, 86400);

      await expect(
        nftMarketplace.connect(buyer).buyNFT(1, { value: INITIAL_PRICE })
      ).to.be.revertedWith("NFT is currently on auction");
    });
  });

  describe("isNFTListed", function () {
    const name = "Initial NFT";
    const description = "This is the initial description";
    const attributes = [{ key: "rarity", value: "common" }];

    it("should return true for a listed NFT", async function () {
      await nft
        .connect(seller)
        .setApprovalForAll(await nftMarketplace.getAddress(), true);
      await nftMarketplace
        .connect(seller)
        .listNFT(
          await nft.getAddress(),
          1,
          INITIAL_PRICE,
          1,
          name,
          description,
          attributes
        );
      expect(await nftMarketplace.isNFTListed(await nft.getAddress(), 1)).to.be
        .true;
    });

    it("should return false for an unlisted NFT", async function () {
      expect(await nftMarketplace.isNFTListed(await nft.getAddress(), 1)).to.be
        .false;
    });
  });
});
