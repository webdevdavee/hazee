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

  const PLATFORM_FEE_PERCENTAGE = 250; // 2.5%
  const INITIAL_PRICE = ethers.parseEther("1");
  const COLLECTION_ROYALTY = 1000; // 10%
  const TOKEN_ID = 1;
  const COLLECTION_ID = 1;
  const STARTING_PRICE = ethers.parseEther("1");
  const RESERVE_PRICE = ethers.parseEther("2");
  const AUCTION_DURATION = 7 * 24 * 60 * 60; // 7 days

  enum ListingType {
    NONE,
    SALE,
    AUCTION,
    BOTH,
  }

  beforeEach(async function () {
    [owner, seller, buyer, creator] = await ethers.getSigners();

    const NFTFactory = (await ethers.getContractFactory(
      "NFT"
    )) as unknown as NFT__factory;
    nft = await NFTFactory.deploy(
      "Test NFT",
      "TNFT",
      ethers.ZeroAddress, // Temporary auction address
      ethers.ZeroAddress // Temporary marketplace address
    );
    await nft.waitForDeployment();
    const nftAddress = await nft.getAddress();

    const NFTCollectionsFacory = (await ethers.getContractFactory(
      "NFTCollections"
    )) as unknown as NFTCollections__factory;
    nftCollections = await NFTCollectionsFacory.deploy(nftAddress);
    await nftCollections.waitForDeployment();
    const nftCollectionsAddress = await nftCollections.getAddress();

    const NFTAuctionFactory = (await ethers.getContractFactory(
      "NFTAuction"
    )) as unknown as NFTAuction__factory;
    nftAuction = await NFTAuctionFactory.deploy(nftAddress, ethers.ZeroAddress);
    await nftAuction.waitForDeployment();
    const nftAuctionAddress = await nftAuction.getAddress();

    const NFTMarketplaceFactory = (await ethers.getContractFactory(
      "NFTMarketplace"
    )) as unknown as NFTMarketplace__factory;
    nftMarketplace = await NFTMarketplaceFactory.deploy(
      nftAddress,
      nftCollectionsAddress,
      nftAuctionAddress
    );
    await nftMarketplace.waitForDeployment();
    const nftMarketplaceAddress = await nftMarketplace.getAddress();

    // 5. Update NFT contract with correct addresses
    await nft.updateAuctionContract(nftAuctionAddress);
    await nft.updateMarketplaceContract(nftMarketplaceAddress);

    await nftAuction.updateMarketplaceContract(nftMarketplaceAddress);

    // Setup test conditions
    await nftCollections.connect(seller).createCollection(
      100, // max supply
      COLLECTION_ROYALTY,
      ethers.parseEther("0.1") // floor price
    );

    await nft
      .connect(seller)
      .mint(seller.address, "tokenURI", INITIAL_PRICE, COLLECTION_ID);

    const approveTx = await nft
      .connect(seller)
      .setApprovalForAll(nftMarketplaceAddress, true);
    await approveTx.wait();

    const approveAuctionContractTx = await nft
      .connect(seller)
      .setApprovalForAll(nftAuctionAddress, true);
    await approveAuctionContractTx.wait();

    const approveCollectionContractTx = await nft
      .connect(seller)
      .setApprovalForAll(nftCollectionsAddress, true);
    await approveCollectionContractTx.wait();
  });

  describe("listNFT", function () {
    it("should list an NFT for sale successfully", async function () {
      await expect(
        nftMarketplace
          .connect(seller)
          .listNFT(
            TOKEN_ID,
            INITIAL_PRICE,
            ListingType.SALE,
            0,
            0,
            AUCTION_DURATION
          )
      )
        .to.emit(nftMarketplace, "NFTListed")
        .withArgs(
          1,
          seller.address,
          TOKEN_ID,
          INITIAL_PRICE,
          COLLECTION_ID,
          ListingType.SALE,
          0
        );

      const listing = await nftMarketplace.getListingDetails(1);
      expect(listing.seller).to.equal(seller.address);
      expect(listing.tokenId).to.equal(TOKEN_ID);
      expect(listing.price).to.equal(INITIAL_PRICE);
      expect(listing.isActive).to.be.true;
      expect(listing.listingType).to.equal(ListingType.SALE);
    });

    it("should list an NFT for auction successfully", async function () {
      await expect(
        nftMarketplace
          .connect(seller)
          .listNFT(
            TOKEN_ID,
            0,
            ListingType.AUCTION,
            STARTING_PRICE,
            RESERVE_PRICE,
            AUCTION_DURATION
          )
      ).to.emit(nftMarketplace, "NFTListed");

      const listing = await nftMarketplace.getListingDetails(1);
      expect(listing.listingType).to.equal(ListingType.AUCTION);
      expect(listing.auctionId).to.not.equal(0);
    });

    it("should list an NFT for both sale and auction", async function () {
      await expect(
        nftMarketplace
          .connect(seller)
          .listNFT(
            TOKEN_ID,
            INITIAL_PRICE,
            ListingType.BOTH,
            STARTING_PRICE,
            RESERVE_PRICE,
            AUCTION_DURATION
          )
      ).to.emit(nftMarketplace, "NFTListed");

      const listing = await nftMarketplace.getListingDetails(1);
      expect(listing.listingType).to.equal(ListingType.BOTH);
      expect(listing.price).to.equal(INITIAL_PRICE);
      expect(listing.auctionId).to.not.equal(0);
    });

    it("should revert if invalid listing type", async function () {
      await expect(
        nftMarketplace
          .connect(seller)
          .listNFT(TOKEN_ID, INITIAL_PRICE, ListingType.NONE, 0, 0, 0)
      ).to.be.revertedWithCustomError(nftMarketplace, "InvalidListingType");
    });

    it("should revert if auction parameters are invalid", async function () {
      await expect(
        nftMarketplace
          .connect(seller)
          .listNFT(TOKEN_ID, INITIAL_PRICE, ListingType.AUCTION, 0, 0, 0)
      ).to.be.revertedWithCustomError(
        nftMarketplace,
        "InvalidAuctionParameters"
      );
    });
  });

  describe("updateListingType", function () {
    beforeEach(async function () {
      await nftMarketplace
        .connect(seller)
        .listNFT(TOKEN_ID, INITIAL_PRICE, ListingType.SALE, 0, 0, 0);
    });

    it("should update listing type from sale to auction", async function () {
      await expect(
        nftMarketplace
          .connect(seller)
          .updateListingType(
            1,
            ListingType.AUCTION,
            STARTING_PRICE,
            RESERVE_PRICE,
            AUCTION_DURATION
          )
      )
        .to.emit(nftMarketplace, "ListingTypeUpdated")
        .withArgs(1, ListingType.AUCTION);

      const listing = await nftMarketplace.getListingDetails(1);
      expect(listing.listingType).to.equal(ListingType.AUCTION);
      expect(listing.auctionId).to.not.equal(0);
    });

    it("should update listing type from sale to both", async function () {
      await expect(
        nftMarketplace
          .connect(seller)
          .updateListingType(
            1,
            ListingType.BOTH,
            STARTING_PRICE,
            RESERVE_PRICE,
            AUCTION_DURATION
          )
      )
        .to.emit(nftMarketplace, "ListingTypeUpdated")
        .withArgs(1, ListingType.BOTH);

      const listing = await nftMarketplace.getListingDetails(1);
      expect(listing.listingType).to.equal(ListingType.BOTH);
      expect(listing.price).to.equal(INITIAL_PRICE);
      expect(listing.auctionId).to.not.equal(0);
    });

    it("should revert if invalid listing type", async function () {
      await expect(
        nftMarketplace
          .connect(seller)
          .updateListingType(1, ListingType.NONE, 0, 0, 0)
      ).to.be.revertedWithCustomError(nftMarketplace, "InvalidListingType");
    });

    it("should revert if caller is not seller", async function () {
      await expect(
        nftMarketplace
          .connect(buyer)
          .updateListingType(
            1,
            ListingType.AUCTION,
            STARTING_PRICE,
            RESERVE_PRICE,
            AUCTION_DURATION
          )
      ).to.be.revertedWithCustomError(nftMarketplace, "NotSeller");
    });
  });

  describe("cancelListing", function () {
    beforeEach(async function () {
      await nftMarketplace
        .connect(seller)
        .listNFT(TOKEN_ID, INITIAL_PRICE, ListingType.SALE, 0, 0, 0);
    });

    it("should cancel a listing successfully", async function () {
      await expect(nftMarketplace.connect(seller).cancelListing(1))
        .to.emit(nftMarketplace, "ListingCancelled")
        .withArgs(1);

      const listing = await nftMarketplace.getListingDetails(1);
      expect(listing.isActive).to.be.false;
    });

    it("should revert if caller is not the seller", async function () {
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

  describe("finalizeAuctionAndDelist", function () {
    it("should finalize auction and delist successfully when auction has ended", async function () {
      await nftMarketplace
        .connect(seller)
        .listNFT(
          TOKEN_ID,
          INITIAL_PRICE,
          ListingType.AUCTION,
          STARTING_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );

      const listing = await nftMarketplace.getListingDetails(1);

      // Place a bid
      await nftAuction.connect(buyer).placeBid(listing.auctionId, {
        value: STARTING_PRICE,
      });

      // Fast forward time to after auction end
      await ethers.provider.send("evm_increaseTime", [AUCTION_DURATION + 1]);
      await ethers.provider.send("evm_mine");

      // Finalize auction
      await expect(nftMarketplace.finalizeAuctionAndDelist(1))
        .to.emit(nftMarketplace, "ListingCancelled")
        .withArgs(1);

      // Check listing status
      const updatedListing = await nftMarketplace.getListingDetails(1);
      expect(updatedListing.isActive).to.be.false;
      expect(updatedListing.auctionId).to.equal(0);

      // Verify NFT status is reset
      const nftStatus = await nft.getTokenStatus(TOKEN_ID);
      expect(nftStatus).to.equal(0); // NFTStatus.NONE
    });

    it("should revert if listing is not active", async function () {
      await nftMarketplace
        .connect(seller)
        .listNFT(
          TOKEN_ID,
          INITIAL_PRICE,
          ListingType.AUCTION,
          STARTING_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );

      await nftMarketplace.connect(seller).cancelListing(1);

      await expect(
        nftMarketplace.finalizeAuctionAndDelist(1)
      ).to.be.revertedWithCustomError(nftMarketplace, "ListingNotActive");
    });

    it("should revert if listing type is not AUCTION or BOTH", async function () {
      await nftMarketplace
        .connect(seller)
        .listNFT(TOKEN_ID, INITIAL_PRICE, ListingType.SALE, 0, 0, 0);

      // Create a sale-only listing
      await nftMarketplace.connect(seller).cancelListing(1);

      await nftMarketplace
        .connect(seller)
        .listNFT(TOKEN_ID, INITIAL_PRICE, ListingType.SALE, 0, 0, 0);

      await expect(
        nftMarketplace.finalizeAuctionAndDelist(2)
      ).to.be.revertedWithCustomError(nftMarketplace, "InvalidListingType");
    });

    it("should revert if auction cannot be ended", async function () {
      await nftMarketplace
        .connect(seller)
        .listNFT(
          TOKEN_ID,
          INITIAL_PRICE,
          ListingType.AUCTION,
          STARTING_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );

      // Try to end auction before duration has passed
      await expect(
        nftMarketplace.finalizeAuctionAndDelist(1)
      ).to.be.revertedWithCustomError(nftMarketplace, "InvalidAuctionState");
    });
  });

  describe("canEndAuction", function () {
    beforeEach(async function () {
      await nftMarketplace
        .connect(seller)
        .listNFT(
          TOKEN_ID,
          INITIAL_PRICE,
          ListingType.AUCTION,
          STARTING_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );
    });

    it("should return true when auction can be ended", async function () {
      const listing = await nftMarketplace.getListingDetails(1);

      // Place a bid
      await nftAuction.connect(buyer).placeBid(listing.auctionId, {
        value: STARTING_PRICE,
      });

      // Fast forward time to after auction end
      await ethers.provider.send("evm_increaseTime", [AUCTION_DURATION + 1]);
      await ethers.provider.send("evm_mine");

      const canEnd = await nftMarketplace.canEndAuction(1);
      expect(canEnd).to.be.true;
    });

    it("should return false when auction duration hasn't passed", async function () {
      const canEnd = await nftMarketplace.canEndAuction(1);
      expect(canEnd).to.be.false;
    });

    it("should return false when listing is not active", async function () {
      await nftMarketplace.connect(seller).cancelListing(1);

      const canEnd = await nftMarketplace.canEndAuction(1);
      expect(canEnd).to.be.false;
    });

    it("should return false when auction ID is 0", async function () {
      // Create a listing with no auction
      await nftMarketplace.connect(seller).cancelListing(1);
      await nftMarketplace
        .connect(seller)
        .listNFT(
          TOKEN_ID,
          INITIAL_PRICE,
          ListingType.BOTH,
          STARTING_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );

      const canEnd = await nftMarketplace.canEndAuction(1);
      expect(canEnd).to.be.false;
    });

    it("should return false when auction has already ended", async function () {
      const listing = await nftMarketplace.getListingDetails(1);

      // Place a bid
      await nftAuction.connect(buyer).placeBid(listing.auctionId, {
        value: STARTING_PRICE,
      });

      // Fast forward time to after auction end
      await ethers.provider.send("evm_increaseTime", [AUCTION_DURATION + 1]);
      await ethers.provider.send("evm_mine");

      // End the auction
      await nftMarketplace.finalizeAuctionAndDelist(1);

      const canEnd = await nftMarketplace.canEndAuction(1);
      expect(canEnd).to.be.false;
    });
  });

  describe("updateListingPrice", function () {
    beforeEach(async function () {
      await nftMarketplace
        .connect(seller)
        .listNFT(TOKEN_ID, INITIAL_PRICE, ListingType.SALE, 0, 0, 0);
    });

    it("should update listing price successfully", async function () {
      const newPrice = ethers.parseEther("2");
      await expect(
        nftMarketplace.connect(seller).updateListingPrice(1, newPrice)
      )
        .to.emit(nftMarketplace, "ListingPriceUpdated")
        .withArgs(1, newPrice);

      const listing = await nftMarketplace.getListingDetails(1);
      expect(listing.price).to.equal(newPrice);
    });

    it("should revert if new price is zero", async function () {
      await expect(
        nftMarketplace.connect(seller).updateListingPrice(1, 0)
      ).to.be.revertedWithCustomError(
        nftMarketplace,
        "PriceMustBeGreaterThanZero"
      );
    });

    it("should revert if caller is not the seller", async function () {
      await expect(
        nftMarketplace
          .connect(buyer)
          .updateListingPrice(1, ethers.parseEther("2"))
      ).to.be.revertedWithCustomError(nftMarketplace, "NotSeller");
    });

    it("should revert if listing is not active", async function () {
      await nftMarketplace.connect(seller).cancelListing(1);
      await expect(
        nftMarketplace
          .connect(seller)
          .updateListingPrice(1, ethers.parseEther("2"))
      ).to.be.revertedWithCustomError(nftMarketplace, "ListingNotActive");
    });

    it("should revert if seller no longer owns the NFT", async function () {
      // Transfer NFT to another address
      await nft
        .connect(seller)
        .transferFrom(seller.address, buyer.address, TOKEN_ID);

      await expect(
        nftMarketplace
          .connect(seller)
          .updateListingPrice(1, ethers.parseEther("2"))
      ).to.be.revertedWithCustomError(nftMarketplace, "NotNFTOwner");
    });
  });

  describe("buyNFT", function () {
    beforeEach(async function () {
      await nftMarketplace
        .connect(seller)
        .listNFT(TOKEN_ID, INITIAL_PRICE, ListingType.SALE, 0, 0, 0);
    });

    it("should revert if listing is auction only", async function () {
      await nftMarketplace
        .connect(seller)
        .updateListingType(
          1,
          ListingType.AUCTION,
          STARTING_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );

      await expect(
        nftMarketplace.connect(buyer).buyNFT(1, { value: INITIAL_PRICE })
      ).to.be.revertedWithCustomError(nftMarketplace, "AuctionOnlyListing");
    });

    it("should cancel auction if buying from BOTH type listing", async function () {
      await nftMarketplace
        .connect(seller)
        .updateListingType(
          1,
          ListingType.BOTH,
          STARTING_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );

      await nftMarketplace.connect(buyer).buyNFT(1, { value: INITIAL_PRICE });

      const listing = await nftMarketplace.getListingDetails(1);
      expect(listing.isActive).to.be.false;
      expect(listing.auctionId).to.equal(0);
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await nftMarketplace
        .connect(seller)
        .listNFT(TOKEN_ID, INITIAL_PRICE, ListingType.SALE, 0, 0, 0);
    });

    it("should return correct listing details", async function () {
      const listing = await nftMarketplace.getListingDetails(1);
      expect(listing.seller).to.equal(seller.address);
      expect(listing.tokenId).to.equal(TOKEN_ID);
      expect(listing.price).to.equal(INITIAL_PRICE);
      expect(listing.collectionId).to.equal(COLLECTION_ID);
      expect(listing.isActive).to.be.true;
    });

    it("should return correct active listings", async function () {
      const listings = await nftMarketplace.getActiveListings(0, 10);
      expect(listings.length).to.equal(1);
      expect(listings[0]).to.equal(1);
    });

    it("should return correct collection listings", async function () {
      const listings = await nftMarketplace.getCollectionListings(
        COLLECTION_ID
      );
      expect(listings.length).to.equal(1);
      expect(listings[0]).to.equal(1);
    });

    it("should correctly check if NFT is listed and return listing ID", async function () {
      // Check when NFT is listed
      const [isListed, listingId] = await nftMarketplace.isNFTListed(TOKEN_ID);
      expect(isListed).to.be.true;
      expect(listingId).to.equal(1);

      // Check after cancelling the listing
      await nftMarketplace.connect(seller).cancelListing(1);
      const [isListedAfterCancel, listingIdAfterCancel] =
        await nftMarketplace.isNFTListed(TOKEN_ID);
      expect(isListedAfterCancel).to.be.false;
      expect(listingIdAfterCancel).to.equal(0);

      // Check for non-existent NFT
      const [isListedNonExistent, listingIdNonExistent] =
        await nftMarketplace.isNFTListed(999);
      expect(isListedNonExistent).to.be.false;
      expect(listingIdNonExistent).to.equal(0);
    });
  });

  describe("getFilteredListings", function () {
    // Additional NFTs and listings for testing
    beforeEach(async function () {
      // Create multiple NFTs with different prices
      for (let i = 2; i <= 5; i++) {
        await nft
          .connect(seller)
          .mint(
            seller.address,
            `tokenURI${i}`,
            ethers.parseEther(`${i}`),
            COLLECTION_ID
          );
      }

      // Create a second collection
      await nftCollections.connect(seller).createCollection(
        100, // max supply
        COLLECTION_ROYALTY,
        ethers.parseEther("0.1") // floor price
      );

      // Mint NFTs for second collection
      for (let i = 6; i <= 8; i++) {
        await nft
          .connect(seller)
          .mint(seller.address, `tokenURI${i}`, ethers.parseEther(`${i}`), 2);
      }

      // List NFTs with different configurations
      await nftMarketplace
        .connect(seller)
        .listNFT(1, ethers.parseEther("1"), ListingType.SALE, 0, 0, 0);

      await nftMarketplace
        .connect(seller)
        .listNFT(
          2,
          ethers.parseEther("2"),
          ListingType.AUCTION,
          STARTING_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );

      await nftMarketplace
        .connect(seller)
        .listNFT(
          3,
          ethers.parseEther("3"),
          ListingType.BOTH,
          STARTING_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );

      await nftMarketplace
        .connect(seller)
        .listNFT(4, ethers.parseEther("4"), ListingType.SALE, 0, 0, 0);

      // List NFTs from second collection
      await nftMarketplace
        .connect(seller)
        .listNFT(6, ethers.parseEther("6"), ListingType.SALE, 0, 0, 0);

      await nftMarketplace
        .connect(seller)
        .listNFT(
          7,
          ethers.parseEther("7"),
          ListingType.AUCTION,
          STARTING_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );
    });

    it("should return all active listings when no filters are applied", async function () {
      const filterParams = {
        listingType: ListingType.NONE,
        collectionId: 0,
        minPrice: 0,
        maxPrice: 0,
        sortOrder: 0, // NONE
        offset: 0,
        limit: 10,
      };

      const [listings, totalCount] = await nftMarketplace.getFilteredListings(
        filterParams
      );
      expect(totalCount).to.equal(6); // Total active listings
      expect(listings.length).to.equal(6);
    });

    it("should filter by listing type correctly", async function () {
      const filterParams = {
        listingType: ListingType.SALE,
        collectionId: 0,
        minPrice: 0,
        maxPrice: 0,
        sortOrder: 0,
        offset: 0,
        limit: 10,
      };

      const [listings, totalCount] = await nftMarketplace.getFilteredListings(
        filterParams
      );
      expect(totalCount).to.equal(3); // Only SALE type listings
      expect(
        listings.every(
          (l) => Number(l.listingType.toString()) === ListingType.SALE
        )
      ).to.be.true;
    });

    it("should filter by collection ID correctly", async function () {
      const filterParams = {
        listingType: ListingType.NONE,
        collectionId: 2, // Second collection
        minPrice: 0,
        maxPrice: 0,
        sortOrder: 0,
        offset: 0,
        limit: 10,
      };

      const [listings, totalCount] = await nftMarketplace.getFilteredListings(
        filterParams
      );
      expect(totalCount).to.equal(2); // Listings from collection 2
      expect(listings.every((l) => Number(l.collectionId.toString()) === 2)).to
        .be.true;
    });

    it("should filter by price range correctly", async function () {
      const filterParams = {
        listingType: ListingType.NONE,
        collectionId: 0,
        minPrice: ethers.parseEther("2"),
        maxPrice: ethers.parseEther("4"),
        sortOrder: 0,
        offset: 0,
        limit: 10,
      };

      const [listings, totalCount] = await nftMarketplace.getFilteredListings(
        filterParams
      );
      expect(
        listings.every(
          (l) =>
            l.price >= ethers.parseEther("2") &&
            l.price <= ethers.parseEther("4")
        )
      ).to.be.true;
    });

    it("should sort by price high to low correctly", async function () {
      const filterParams = {
        listingType: ListingType.NONE,
        collectionId: 0,
        minPrice: 0,
        maxPrice: 0,
        sortOrder: 1, // PRICE_HIGH_TO_LOW
        offset: 0,
        limit: 10,
      };

      const [listings, _] = await nftMarketplace.getFilteredListings(
        filterParams
      );
      for (let i = 1; i < listings.length; i++) {
        expect(listings[i - 1].price >= listings[i].price).to.be.true;
      }
    });

    it("should sort by price low to high correctly", async function () {
      const filterParams = {
        listingType: ListingType.NONE,
        collectionId: 0,
        minPrice: 0,
        maxPrice: 0,
        sortOrder: 2, // PRICE_LOW_TO_HIGH
        offset: 0,
        limit: 10,
      };

      const [listings, _] = await nftMarketplace.getFilteredListings(
        filterParams
      );
      for (let i = 1; i < listings.length; i++) {
        expect(listings[i - 1].price <= listings[i].price).to.be.true;
      }
    });

    it("should handle pagination correctly", async function () {
      const limit = 2;

      const filterParams = {
        listingType: ListingType.NONE,
        collectionId: 0,
        minPrice: 0,
        maxPrice: 0,
        sortOrder: 0,
        offset: 0,
        limit,
      };

      const [firstPage, totalCount] = await nftMarketplace.getFilteredListings(
        filterParams
      );
      expect(firstPage.length).to.equal(limit);

      // Get second page
      filterParams.offset = 2;
      const [secondPage, _] = await nftMarketplace.getFilteredListings(
        filterParams
      );
      expect(secondPage.length).to.equal(limit);

      // Ensure no duplicate listings between pages
      const firstPageIds = firstPage.map((l) => l.listingId);
      const secondPageIds = secondPage.map((l) => l.listingId);
      const uniqueIds = new Set([...firstPageIds, ...secondPageIds]);
      expect(uniqueIds.size).to.equal(
        firstPageIds.length + secondPageIds.length
      );
    });

    it("should return empty array when offset is beyond total count", async function () {
      const filterParams = {
        listingType: ListingType.NONE,
        collectionId: 0,
        minPrice: 0,
        maxPrice: 0,
        sortOrder: 0,
        offset: 100,
        limit: 10,
      };

      const [listings, totalCount] = await nftMarketplace.getFilteredListings(
        filterParams
      );
      expect(listings.length).to.equal(0);
      expect(totalCount).to.be.greaterThan(0); // Should still return total count
    });

    it("should revert with invalid page size", async function () {
      const filterParams = {
        listingType: ListingType.NONE,
        collectionId: 0,
        minPrice: 0,
        maxPrice: 0,
        sortOrder: 0,
        offset: 0,
        limit: 0, // Invalid limit
      };

      await expect(
        nftMarketplace.getFilteredListings(filterParams)
      ).to.be.revertedWithCustomError(nftMarketplace, "InvalidPageSize");

      filterParams.limit = 101; // Beyond max limit

      await expect(
        nftMarketplace.getFilteredListings(filterParams)
      ).to.be.revertedWithCustomError(nftMarketplace, "InvalidPageSize");
    });

    it("should revert with price filter mismatch", async function () {
      const filterParams = {
        listingType: ListingType.NONE,
        collectionId: 0,
        minPrice: ethers.parseEther("5"),
        maxPrice: ethers.parseEther("3"), // Invalid: max < min
        sortOrder: 0,
        offset: 0,
        limit: 10,
      };

      await expect(
        nftMarketplace.getFilteredListings(filterParams)
      ).to.be.revertedWithCustomError(nftMarketplace, "PriceFilterMismatch");
    });
  });

  describe("acceptCollectionOfferAndDelist", function () {
    it("should accept collection offer and deactivate all listed tokens", async function () {
      const tokenIdForSale = 2;
      const tokenIdForAuction = 3;

      // Mint collection tokens and list for sale/auction
      await nftCollections
        .connect(seller)
        .mintNFT(COLLECTION_ID, INITIAL_PRICE, "tokenURI");
      await nftMarketplace
        .connect(seller)
        .listNFT(tokenIdForSale, INITIAL_PRICE, ListingType.SALE, 0, 0, 0);

      await nftCollections
        .connect(seller)
        .mintNFT(COLLECTION_ID, INITIAL_PRICE, "tokenURI");
      await nftMarketplace
        .connect(seller)
        .listNFT(
          tokenIdForAuction,
          0,
          ListingType.AUCTION,
          STARTING_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );

      await nftCollections
        .connect(buyer)
        .placeCollectionOffer(COLLECTION_ID, 2, 86400, {
          value: ethers.parseEther("0.2"),
        });

      // Accept the collection offer with correct tokenIds
      await nftMarketplace
        .connect(seller)
        .acceptCollectionOfferAndDelist(
          COLLECTION_ID,
          [tokenIdForSale, tokenIdForAuction],
          buyer.address
        );

      // Verify listings are inactive
      const saleListing = await nftMarketplace.getListingDetails(1);
      expect(saleListing.isActive).to.be.false;

      const auctionListing = await nftMarketplace.getListingDetails(2);
      expect(auctionListing.isActive).to.be.false;
    });

    it("should not deactivate listings for tokens not in the collection offer", async function () {
      const tokenIdForSale = 2;

      // Mint collection tokens and list for sale
      await nftCollections
        .connect(seller)
        .mintNFT(COLLECTION_ID, INITIAL_PRICE, "tokenURI");
      await nftMarketplace
        .connect(seller)
        .listNFT(tokenIdForSale, INITIAL_PRICE, ListingType.SALE, 0, 0, 0);

      await nftCollections
        .connect(buyer)
        .placeCollectionOffer(COLLECTION_ID, 1, 86400, {
          value: ethers.parseEther("0.1"),
        });

      await nftMarketplace
        .connect(seller)
        .acceptCollectionOfferAndDelist(
          COLLECTION_ID,
          [TOKEN_ID],
          buyer.address
        );

      const listing = await nftMarketplace.getListingDetails(1);
      expect(listing.isActive).to.be.true;
    });
  });
});
