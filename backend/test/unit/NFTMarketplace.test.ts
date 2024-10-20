import { expect } from "chai";
import { ethers } from "hardhat";
import {
  NFTMarketplace,
  NFTMarketplace__factory,
  NFTAuction,
  NFTAuction__factory,
  NFTCollections,
  NFTCollections__factory,
  NFT,
  NFT__factory,
} from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("NFTMarketplace", function () {
  let nftAuction: NFTAuction;
  let nft: NFT;
  let nftCollections: NFTCollections;
  let nftMarketplace: NFTMarketplace;
  let owner: HardhatEthersSigner;
  let seller: HardhatEthersSigner;
  let buyer: HardhatEthersSigner;
  let creator: HardhatEthersSigner;
  let fakeContractAddress: HardhatEthersSigner;

  const PLATFORM_FEE_PERCENTAGE = 250; // 2.5%
  const INITIAL_PRICE = ethers.parseEther("1");
  const COLLECTION_ROYALTY = 1000; // 10%
  const TOKEN_ID = 1;
  const RESERVE_PRICE = ethers.parseEther("2");
  const AUCTION_DURATION = 7 * 24 * 60 * 60; // 7 days
  const COLLECTION_ID = 1;

  beforeEach(async function () {
    [owner, seller, buyer, creator, fakeContractAddress] =
      await ethers.getSigners();

    const NFTAuctionFactory = (await ethers.getContractFactory(
      "NFTAuction"
    )) as unknown as NFTAuction__factory;
    nftAuction = await NFTAuctionFactory.deploy(fakeContractAddress);

    const NFTCollectionsFactory = (await ethers.getContractFactory(
      "NFTCollections"
    )) as unknown as NFTCollections__factory;
    nftCollections = await NFTCollectionsFactory.deploy(
      nftAuction.getAddress(),
      fakeContractAddress
    );

    const NFTMarketplaceFactory = (await ethers.getContractFactory(
      "NFTMarketplace"
    )) as unknown as NFTMarketplace__factory;
    nftMarketplace = await NFTMarketplaceFactory.deploy(
      await nftCollections.getAddress(),
      await nftAuction.getAddress()
    );

    const NFTFactory = (await ethers.getContractFactory(
      "NFT"
    )) as unknown as NFT__factory;
    nft = await NFTFactory.deploy(
      "TestNFT",
      "TNFT",
      await nftAuction.getAddress(),
      await nftMarketplace.getAddress()
    );

    // Create a collection
    await nftCollections
      .connect(creator)
      .createCollection(100, COLLECTION_ROYALTY, ethers.parseEther("0.1"));

    // Mint an NFT for the seller
    await nft
      .connect(seller)
      .mint(seller.address, "tokenURI", COLLECTION_ID, INITIAL_PRICE);
  });

  describe("listNFT", function () {
    it("should list an NFT successfully", async function () {
      await nft
        .connect(seller)
        .setApprovalForAll(await nftMarketplace.getAddress(), true);

      await nft
        .connect(seller)
        .mint(seller.address, "tokenURI", COLLECTION_ID, INITIAL_PRICE);

      await expect(
        nftMarketplace
          .connect(seller)
          .listNFT(await nft.getAddress(), TOKEN_ID, INITIAL_PRICE)
      )
        .to.emit(nftMarketplace, "NFTListed")
        .withArgs(
          1,
          seller.address,
          await nft.getAddress(),
          TOKEN_ID,
          INITIAL_PRICE,
          COLLECTION_ID,
          1 // NFT.NFTStatus.SALE
        );

      const listing = await nftMarketplace.listings(1);
      expect(listing.isActive).to.be.true;
      expect(listing.seller).to.equal(seller.address);
      expect(listing.nftContract).to.equal(await nft.getAddress());
      expect(listing.tokenId).to.equal(TOKEN_ID);
      expect(listing.price).to.equal(INITIAL_PRICE);
      expect(listing.collectionId).to.equal(COLLECTION_ID);
    });

    it("should revert if price is zero", async function () {
      await expect(
        nftMarketplace
          .connect(seller)
          .listNFT(await nft.getAddress(), TOKEN_ID, 0)
      ).to.be.revertedWithCustomError(
        nftMarketplace,
        "PriceMustBeGreaterThanZero"
      );
    });

    it("should revert if seller doesn't own the NFT", async function () {
      await expect(
        nftMarketplace
          .connect(buyer)
          .listNFT(await nft.getAddress(), TOKEN_ID, INITIAL_PRICE)
      ).to.be.revertedWithCustomError(nftMarketplace, "NotNFTOwner");
    });

    it("should revert if contract is not approved", async function () {
      await expect(
        nftMarketplace
          .connect(seller)
          .listNFT(await nft.getAddress(), TOKEN_ID, INITIAL_PRICE)
      ).to.be.revertedWithCustomError(nftMarketplace, "ContractNotApproved");
    });

    it("should revert if NFT is on auction", async function () {
      await nft
        .connect(seller)
        .setApprovalForAll(await nftAuction.getAddress(), true);
      await nftAuction
        .connect(seller)
        .createAuction(
          TOKEN_ID,
          INITIAL_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );

      await nft
        .connect(seller)
        .setApprovalForAll(await nftMarketplace.getAddress(), true);
      await expect(
        nftMarketplace
          .connect(seller)
          .listNFT(await nft.getAddress(), TOKEN_ID, INITIAL_PRICE)
      ).to.be.revertedWithCustomError(nftMarketplace, "NFTOnAuction");
    });
  });

  describe("cancelListing", function () {
    beforeEach(async function () {
      await nft
        .connect(seller)
        .setApprovalForAll(await nftMarketplace.getAddress(), true);
      await nftMarketplace
        .connect(seller)
        .listNFT(await nft.getAddress(), TOKEN_ID, INITIAL_PRICE);
    });

    it("should cancel a listing successfully", async function () {
      await expect(nftMarketplace.connect(seller).cancelListing(1))
        .to.emit(nftMarketplace, "ListingCancelled")
        .withArgs(1);

      const listing = await nftMarketplace.listings(1);
      expect(listing.isActive).to.be.false;
    });

    it("should revert if non-seller tries to cancel", async function () {
      await expect(
        nftMarketplace.connect(buyer).cancelListing(1)
      ).to.be.revertedWithCustomError(nftMarketplace, "NotSeller");
    });

    it("should revert if listing is not active", async function () {
      await nftMarketplace.connect(seller).cancelListing(1);
      await expect(
        nftMarketplace.connect(seller).cancelListing(1)
      ).to.be.revertedWithCustomError(nftMarketplace, "ListingNotActive");
    });
  });

  describe("updateListingPrice", function () {
    beforeEach(async function () {
      await nft
        .connect(seller)
        .setApprovalForAll(await nftMarketplace.getAddress(), true);
      await nftMarketplace
        .connect(seller)
        .listNFT(await nft.getAddress(), TOKEN_ID, INITIAL_PRICE);
    });

    it("should update listing price successfully", async function () {
      const newPrice = ethers.parseEther("2");
      await expect(
        nftMarketplace.connect(seller).updateListingPrice(1, newPrice)
      )
        .to.emit(nftMarketplace, "ListingPriceUpdated")
        .withArgs(1, newPrice);

      const listing = await nftMarketplace.listings(1);
      expect(listing.price).to.equal(newPrice);
    });

    it("should revert if non-seller tries to update price", async function () {
      await expect(
        nftMarketplace
          .connect(buyer)
          .updateListingPrice(1, ethers.parseEther("2"))
      ).to.be.revertedWithCustomError(nftMarketplace, "NotSeller");
    });

    it("should revert if new price is zero", async function () {
      await expect(
        nftMarketplace.connect(seller).updateListingPrice(1, 0)
      ).to.be.revertedWithCustomError(
        nftMarketplace,
        "PriceMustBeGreaterThanZero"
      );
    });
  });

  describe("buyNFT", function () {
    beforeEach(async function () {
      await nft
        .connect(seller)
        .setApprovalForAll(await nftMarketplace.getAddress(), true);
      await nftMarketplace
        .connect(seller)
        .listNFT(await nft.getAddress(), TOKEN_ID, INITIAL_PRICE);
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
          TOKEN_ID,
          INITIAL_PRICE,
          COLLECTION_ID
        );

      expect(await nft.ownerOf(TOKEN_ID)).to.equal(buyer.address);
    });

    it("should distribute funds correctly", async function () {
      const initialSellerBalance = await ethers.provider.getBalance(
        seller.address
      );
      const initialMarketplaceBalance = await ethers.provider.getBalance(
        await nftMarketplace.getAddress()
      );
      const initialCreatorBalance = await ethers.provider.getBalance(
        creator.address
      );

      await nftMarketplace.connect(buyer).buyNFT(1, { value: INITIAL_PRICE });

      const finalSellerBalance = await ethers.provider.getBalance(
        seller.address
      );
      const finalMarketplaceBalance = await ethers.provider.getBalance(
        await nftMarketplace.getAddress()
      );
      const finalCreatorBalance = await ethers.provider.getBalance(
        creator.address
      );

      const platformFee =
        (INITIAL_PRICE * BigInt(PLATFORM_FEE_PERCENTAGE)) / 10000n;
      const royaltyFee = (INITIAL_PRICE * BigInt(COLLECTION_ROYALTY)) / 10000n;
      const sellerProceeds = INITIAL_PRICE - platformFee - royaltyFee;

      expect(finalSellerBalance - initialSellerBalance).to.equal(
        sellerProceeds
      );
      expect(finalMarketplaceBalance - initialMarketplaceBalance).to.equal(
        platformFee
      );
      expect(finalCreatorBalance - initialCreatorBalance).to.equal(royaltyFee);
    });

    it("should revert if payment is insufficient", async function () {
      await expect(
        nftMarketplace
          .connect(buyer)
          .buyNFT(1, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWithCustomError(nftMarketplace, "InsufficientPayment");
    });

    it("should revert if NFT is not for sale", async function () {
      await nftMarketplace.connect(seller).cancelListing(1);
      await expect(
        nftMarketplace.connect(buyer).buyNFT(1, { value: INITIAL_PRICE })
      ).to.be.revertedWithCustomError(nftMarketplace, "ListingNotActive");
    });

    it("should revert if NFT is on auction", async function () {
      await nft
        .connect(seller)
        .setApprovalForAll(await nftAuction.getAddress(), true);
      await nftAuction
        .connect(seller)
        .createAuction(
          TOKEN_ID,
          INITIAL_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );

      await expect(
        nftMarketplace.connect(buyer).buyNFT(1, { value: INITIAL_PRICE })
      ).to.be.revertedWithCustomError(nftMarketplace, "NFTOnAuction");
    });
  });

  describe("getListingDetails", function () {
    beforeEach(async function () {
      await nft
        .connect(seller)
        .setApprovalForAll(await nftMarketplace.getAddress(), true);
      await nftMarketplace
        .connect(seller)
        .listNFT(await nft.getAddress(), TOKEN_ID, INITIAL_PRICE);
    });

    it("should return correct listing details", async function () {
      const [
        listedSeller,
        listedNftContract,
        listedTokenId,
        listedPrice,
        listedCollectionId,
        isActive,
        saleType,
      ] = await nftMarketplace.getListingDetails(1);

      expect(listedSeller).to.equal(seller.address);
      expect(listedNftContract).to.equal(await nft.getAddress());
      expect(listedTokenId).to.equal(TOKEN_ID);
      expect(listedPrice).to.equal(INITIAL_PRICE);
      expect(listedCollectionId).to.equal(COLLECTION_ID);
      expect(isActive).to.be.true;
      expect(saleType).to.equal(1); // NFT.NFTStatus.SALE
    });
  });

  describe("getActiveListings", function () {
    beforeEach(async function () {
      await nft
        .connect(seller)
        .setApprovalForAll(await nftMarketplace.getAddress(), true);

      // Create multiple listings
      for (let i = 1; i <= 5; i++) {
        await nft
          .connect(seller)
          .mint(seller, "tokenURI", ethers.parseEther("1"), 1);
        await nftMarketplace
          .connect(seller)
          .listNFT(await nft.getAddress(), i, INITIAL_PRICE);
      }
    });

    it("should return correct active listings", async function () {
      const activeListings = await nftMarketplace.getActiveListings(0, 10);
      expect(activeListings.length).to.equal(5);
      expect(activeListings[0]).to.equal(1);
      expect(activeListings[4]).to.equal(5);
    });

    it("should return correct active listings with offset and limit", async function () {
      const activeListings = await nftMarketplace.getActiveListings(2, 2);
      expect(activeListings.length).to.equal(2);
      expect(activeListings[0]).to.equal(3);
      expect(activeListings[1]).to.equal(4);
    });

    it("should return empty array if no active listings in range", async function () {
      const activeListings = await nftMarketplace.getActiveListings(10, 5);
      expect(activeListings.length).to.equal(0);
    });

    it("should not include cancelled listings", async function () {
      await nftMarketplace.connect(seller).cancelListing(3);
      const activeListings = await nftMarketplace.getActiveListings(0, 10);
      expect(activeListings.length).to.equal(4);
      expect(activeListings).to.not.include(3);
    });
  });

  describe("getCollectionListings", function () {
    beforeEach(async function () {
      await nft
        .connect(seller)
        .setApprovalForAll(await nftMarketplace.getAddress(), true);

      // Create multiple listings for different collections
      // First collection (ID: 1)
      for (let i = 1; i <= 3; i++) {
        await nft
          .connect(seller)
          .mint(seller.address, "tokenURI", INITIAL_PRICE, COLLECTION_ID);
        await nftMarketplace
          .connect(seller)
          .listNFT(await nft.getAddress(), i, INITIAL_PRICE);
      }

      // Create a second collection
      await nftCollections
        .connect(creator)
        .createCollection(100, COLLECTION_ROYALTY, ethers.parseEther("0.1"));

      // Second collection (ID: 2)
      for (let i = 4; i <= 5; i++) {
        await nft
          .connect(seller)
          .mint(seller.address, "tokenURI", INITIAL_PRICE, 2);
        await nftMarketplace
          .connect(seller)
          .listNFT(await nft.getAddress(), i, INITIAL_PRICE);
      }
    });

    it("should return all active listings for a specific collection", async function () {
      const collectionListings = await nftMarketplace.getCollectionListings(
        COLLECTION_ID
      );
      expect(collectionListings.length).to.equal(3);

      // Verify each listing belongs to the correct collection
      for (const listingId of collectionListings) {
        const listing = await nftMarketplace.listings(listingId);
        expect(listing.collectionId).to.equal(COLLECTION_ID);
        expect(listing.isActive).to.be.true;
      }
    });

    it("should not include cancelled listings in collection listings", async function () {
      // Cancel one listing from collection 1
      await nftMarketplace.connect(seller).cancelListing(2);

      const collectionListings = await nftMarketplace.getCollectionListings(
        COLLECTION_ID
      );
      expect(collectionListings.length).to.equal(2);
      expect(collectionListings).to.not.include(2);
    });

    it("should return empty array for collection with no listings", async function () {
      // Create a new collection with no listings
      await nftCollections
        .connect(creator)
        .createCollection(100, COLLECTION_ROYALTY, ethers.parseEther("0.1"));

      const collectionListings = await nftMarketplace.getCollectionListings(3);
      expect(collectionListings.length).to.equal(0);
    });

    it("should return correct listings after multiple operations", async function () {
      // Cancel a listing
      await nftMarketplace.connect(seller).cancelListing(1);

      // Buy a listing
      await nftMarketplace.connect(buyer).buyNFT(2, { value: INITIAL_PRICE });

      // Create a new listing
      await nft
        .connect(seller)
        .mint(seller.address, "tokenURI", INITIAL_PRICE, COLLECTION_ID);
      await nftMarketplace
        .connect(seller)
        .listNFT(await nft.getAddress(), 6, INITIAL_PRICE);

      const collectionListings = await nftMarketplace.getCollectionListings(
        COLLECTION_ID
      );
      expect(collectionListings.length).to.equal(2);
      expect(collectionListings).to.include(3);
      expect(collectionListings).to.include(6);
    });
  });

  describe("getCreatorListings", function () {
    beforeEach(async function () {
      await nft
        .connect(seller)
        .setApprovalForAll(await nftMarketplace.getAddress(), true);

      // Create NFTs by creator
      for (let i = 1; i <= 3; i++) {
        await nft
          .connect(creator)
          .mint(seller.address, "tokenURI", INITIAL_PRICE, COLLECTION_ID);
        await nftMarketplace
          .connect(seller)
          .listNFT(await nft.getAddress(), i, INITIAL_PRICE);
      }

      // Create NFTs by seller (different creator)
      for (let i = 4; i <= 5; i++) {
        await nft
          .connect(seller)
          .mint(seller.address, "tokenURI", INITIAL_PRICE, COLLECTION_ID);
        await nftMarketplace
          .connect(seller)
          .listNFT(await nft.getAddress(), i, INITIAL_PRICE);
      }
    });

    it("should return all active listings for a specific creator", async function () {
      const creatorListings = await nftMarketplace.getCreatorListings(
        creator.address
      );
      expect(creatorListings.length).to.equal(3);

      // Verify each listing was created by the creator
      for (const listingId of creatorListings) {
        const listing = await nftMarketplace.listings(listingId);
        const nftContract = NFT__factory.connect(listing.nftContract, owner);
        const createdTokens = await nftContract.getCreatedTokens(
          creator.address
        );
        expect(createdTokens).to.include(listing.tokenId);
      }
    });

    it("should not include cancelled listings in creator listings", async function () {
      // Cancel one listing from creator's NFTs
      await nftMarketplace.connect(seller).cancelListing(2);

      const creatorListings = await nftMarketplace.getCreatorListings(
        creator.address
      );
      expect(creatorListings.length).to.equal(2);
      expect(creatorListings).to.not.include(2);
    });

    it("should return empty array for creator with no listings", async function () {
      const creatorListings = await nftMarketplace.getCreatorListings(
        buyer.address
      );
      expect(creatorListings.length).to.equal(0);
    });

    it("should return correct listings after multiple operations", async function () {
      // Cancel a listing
      await nftMarketplace.connect(seller).cancelListing(1);

      // Buy a listing
      await nftMarketplace.connect(buyer).buyNFT(2, { value: INITIAL_PRICE });

      // Create and list a new NFT by creator
      await nft
        .connect(creator)
        .mint(seller.address, "tokenURI", INITIAL_PRICE, COLLECTION_ID);
      await nftMarketplace
        .connect(seller)
        .listNFT(await nft.getAddress(), 6, INITIAL_PRICE);

      const creatorListings = await nftMarketplace.getCreatorListings(
        creator.address
      );
      expect(creatorListings.length).to.equal(2);
      expect(creatorListings).to.include(3);
      expect(creatorListings).to.include(6);
    });

    it("should handle multiple creators correctly", async function () {
      const creatorListings = await nftMarketplace.getCreatorListings(
        creator.address
      );
      const sellerListings = await nftMarketplace.getCreatorListings(
        seller.address
      );

      expect(creatorListings.length).to.equal(3);
      expect(sellerListings.length).to.equal(2);

      // Verify no overlap between creator and seller listings
      for (const listingId of creatorListings) {
        expect(sellerListings).to.not.include(listingId);
      }
    });
  });

  describe("isNFTListed", function () {
    it("should return true for a listed NFT", async function () {
      await nft
        .connect(seller)
        .setApprovalForAll(await nftMarketplace.getAddress(), true);
      await nftMarketplace
        .connect(seller)
        .listNFT(await nft.getAddress(), 1, INITIAL_PRICE);
      expect(await nftMarketplace.isNFTListed(await nft.getAddress(), 1)).to.be
        .true;
    });

    it("should return false for an unlisted NFT", async function () {
      expect(await nftMarketplace.isNFTListed(await nft.getAddress(), 1)).to.be
        .false;
    });

    it("should return false for a cancelled listing", async function () {
      await nft
        .connect(seller)
        .setApprovalForAll(await nftMarketplace.getAddress(), true);
      await nftMarketplace
        .connect(seller)
        .listNFT(await nft.getAddress(), 1, INITIAL_PRICE);
      await nftMarketplace.connect(seller).cancelListing(1);
      expect(await nftMarketplace.isNFTListed(await nft.getAddress(), 1)).to.be
        .false;
    });
  });

  describe("Edge cases and additional scenarios", function () {
    it("should handle listing and buying NFT with different sale types", async function () {
      await nft
        .connect(seller)
        .setApprovalForAll(await nftMarketplace.getAddress(), true);

      // List NFT for sale
      await nftMarketplace
        .connect(seller)
        .listNFT(await nft.getAddress(), 1, INITIAL_PRICE);

      // Buyer should be able to purchase directly
      await expect(
        nftMarketplace.connect(buyer).buyNFT(1, { value: INITIAL_PRICE })
      ).to.emit(nftMarketplace, "NFTSold");

      expect(await nft.ownerOf(1)).to.equal(buyer.address);
    });

    it("should handle multiple listings and cancellations correctly", async function () {
      await nft
        .connect(seller)
        .setApprovalForAll(await nftMarketplace.getAddress(), true);

      // Create multiple listings
      for (let i = 1; i <= 3; i++) {
        await nft.connect(seller).mint(seller, "tokenURI", INITIAL_PRICE, 1);
        await nftMarketplace
          .connect(seller)
          .listNFT(await nft.getAddress(), i, INITIAL_PRICE);
      }

      // Cancel the second listing
      await nftMarketplace.connect(seller).cancelListing(2);

      // Check active listings
      const activeListings = await nftMarketplace.getActiveListings(0, 10);
      expect(activeListings.length).to.equal(2);
      expect(activeListings).to.include(1);
      expect(activeListings).to.include(3);
      expect(activeListings).to.not.include(2);

      // Try to buy cancelled listing
      await expect(
        nftMarketplace.connect(buyer).buyNFT(2, { value: INITIAL_PRICE })
      ).to.be.revertedWithCustomError(nftMarketplace, "ListingNotActive");

      // Buy active listing
      await expect(
        nftMarketplace.connect(buyer).buyNFT(3, { value: INITIAL_PRICE })
      ).to.emit(nftMarketplace, "NFTSold");
    });

    it("should handle listing price updates correctly", async function () {
      await nft
        .connect(seller)
        .setApprovalForAll(await nftMarketplace.getAddress(), true);
      await nftMarketplace
        .connect(seller)
        .listNFT(await nft.getAddress(), 1, INITIAL_PRICE);

      const newPrice = ethers.parseEther("2");
      await nftMarketplace.connect(seller).updateListingPrice(1, newPrice);

      // Try to buy with old price
      await expect(
        nftMarketplace.connect(buyer).buyNFT(1, { value: INITIAL_PRICE })
      ).to.be.revertedWithCustomError(nftMarketplace, "InsufficientPayment");

      // Buy with new price
      await expect(
        nftMarketplace.connect(buyer).buyNFT(1, { value: newPrice })
      ).to.emit(nftMarketplace, "NFTSold");
    });

    it("should refund excess payment when buying NFT", async function () {
      await nft
        .connect(seller)
        .setApprovalForAll(await nftMarketplace.getAddress(), true);
      await nftMarketplace
        .connect(seller)
        .listNFT(await nft.getAddress(), 1, INITIAL_PRICE);

      const excessPayment = INITIAL_PRICE + ethers.parseEther("0.5");
      const initialBuyerBalance = await ethers.provider.getBalance(
        buyer.address
      );

      const tx = await nftMarketplace
        .connect(buyer)
        .buyNFT(1, { value: excessPayment });
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const finalBuyerBalance = await ethers.provider.getBalance(buyer.address);
      const expectedBalance = initialBuyerBalance - INITIAL_PRICE - gasUsed;

      expect(finalBuyerBalance).to.be.closeTo(
        expectedBalance,
        ethers.parseEther("0.001")
      );
    });

    it("should handle relisting of an NFT", async function () {
      await nft
        .connect(seller)
        .setApprovalForAll(await nftMarketplace.getAddress(), true);
      await nftMarketplace
        .connect(seller)
        .listNFT(await nft.getAddress(), 1, INITIAL_PRICE);
      await nftMarketplace.connect(seller).cancelListing(1);

      // Relist the NFT
      await expect(
        nftMarketplace
          .connect(seller)
          .listNFT(await nft.getAddress(), 1, INITIAL_PRICE)
      ).to.emit(nftMarketplace, "NFTListed");

      expect(await nftMarketplace.isNFTListed(await nft.getAddress(), 1)).to.be
        .true;
    });

    it("should not allow buying an NFT that was transferred after listing", async function () {
      await nft
        .connect(seller)
        .setApprovalForAll(await nftMarketplace.getAddress(), true);
      await nftMarketplace
        .connect(seller)
        .listNFT(await nft.getAddress(), 1, INITIAL_PRICE);

      // Transfer the NFT to another address
      await nft.connect(seller).transferFrom(seller.address, owner.address, 1);

      await expect(
        nftMarketplace.connect(buyer).buyNFT(1, { value: INITIAL_PRICE })
      ).to.be.revertedWithCustomError(nftMarketplace, "SellerNoLongerOwnsNFT");
    });

    it("should handle concurrent buys correctly", async function () {
      await nft
        .connect(seller)
        .setApprovalForAll(await nftMarketplace.getAddress(), true);
      await nftMarketplace
        .connect(seller)
        .listNFT(await nft.getAddress(), 1, INITIAL_PRICE);

      const buyerPromises = [
        nftMarketplace.connect(buyer).buyNFT(1, { value: INITIAL_PRICE }),
        nftMarketplace.connect(owner).buyNFT(1, { value: INITIAL_PRICE }),
      ];

      const results = await Promise.allSettled(buyerPromises);

      // One transaction should succeed, the other should fail
      expect(results).to.satisfy(
        (res: PromiseSettledResult<any>[]) =>
          res.filter((r) => r.status === "fulfilled").length === 1 &&
          res.filter((r) => r.status === "rejected").length === 1
      );
    });
  });
});
