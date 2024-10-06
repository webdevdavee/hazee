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
  let dummyAddress: SignerWithAddress;

  const PLATFORM_FEE_PERCENTAGE = 250; // 2.5%
  const INITIAL_PRICE = ethers.parseEther("1");

  beforeEach(async function () {
    [owner, seller, buyer, feeRecipient, dummyAddress] =
      await ethers.getSigners();

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

    nftCollectionsFactory = (await ethers.getContractFactory(
      "NFTCollections"
    )) as unknown as NFTCollections__factory;
    nftCollections = await nftCollectionsFactory.deploy(
      await nftCreators.getAddress(),
      await nftAuction.getAddress(),
      dummyAddress
    );

    nftMarketplaceFactory = (await ethers.getContractFactory(
      "NFTMarketplace"
    )) as unknown as NFTMarketplace__factory;
    nftMarketplace = await nftMarketplaceFactory.deploy(
      feeRecipient.address,
      await nftCreators.getAddress(),
      await nftAuction.getAddress(),
      await nftCollections.getAddress()
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
    const price = ethers.parseEther("1");
    const collectionId = 1;

    await nft
      .connect(seller)
      .mint(seller.address, tokenURI, price, collectionId);
  });

  describe("listNFT", function () {
    it("should list an NFT successfully", async function () {
      expect(await nft.ownerOf(1)).to.equal(seller.address);

      await nft
        .connect(seller)
        .setApprovalForAll(await nftMarketplace.getAddress(), true);

      const collectionInfo = await nftCollections.getCollectionInfo(1);
      expect(collectionInfo.isActive).to.be.true;

      await expect(
        nftMarketplace
          .connect(seller)
          .listNFT(await nft.getAddress(), 1, INITIAL_PRICE, 1) // NFT.NFTStatus.SALE
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

      const listing = await nftMarketplace.listings(1);
      expect(listing.isActive).to.be.true;
      expect(listing.seller).to.equal(seller.address);
      expect(listing.nftContract).to.equal(await nft.getAddress());
      expect(listing.tokenId).to.equal(1);
      expect(listing.price).to.equal(INITIAL_PRICE);
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

    it("should revert if NFT is on auction", async function () {
      const TOKEN_ID = 1;
      const STARTING_PRICE = ethers.parseEther("1");
      const RESERVE_PRICE = ethers.parseEther("2");
      const AUCTION_DURATION = 7 * 24 * 60 * 60; // 7 days

      await nft
        .connect(seller)
        .setApprovalForAll(await nftAuction.getAddress(), true);
      await nftAuction
        .connect(seller)
        .createAuction(
          TOKEN_ID,
          STARTING_PRICE,
          RESERVE_PRICE,
          AUCTION_DURATION
        );

      await nft
        .connect(seller)
        .setApprovalForAll(await nftMarketplace.getAddress(), true);
      await expect(
        nftMarketplace
          .connect(seller)
          .listNFT(await nft.getAddress(), 1, INITIAL_PRICE, 1)
      ).to.be.revertedWith("NFT is currently on auction");
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
        .to.emit(nftMarketplace, "ListingPriceUpdated")
        .withArgs(1, newPrice);
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
      const STARTING_PRICE = ethers.parseEther("1");
      const RESERVE_PRICE = ethers.parseEther("2");
      const AUCTION_DURATION = 7 * 24 * 60 * 60; // 7 days

      await nft
        .connect(seller)
        .setApprovalForAll(await nftAuction.getAddress(), true);
      await nftAuction
        .connect(seller)
        .createAuction(1, STARTING_PRICE, RESERVE_PRICE, AUCTION_DURATION);

      await expect(
        nftMarketplace.connect(buyer).buyNFT(1, { value: INITIAL_PRICE })
      ).to.be.revertedWith("NFT is currently on auction");
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

  describe("getListingDetails", function () {
    beforeEach(async function () {
      await nft
        .connect(seller)
        .setApprovalForAll(await nftMarketplace.getAddress(), true);
      await nftMarketplace
        .connect(seller)
        .listNFT(await nft.getAddress(), 1, INITIAL_PRICE, 1);
    });

    it("should return correct listing details", async function () {
      const [
        listedSeller,
        listedNftContract,
        listedTokenId,
        listedPrice,
        isActive,
        saleType,
      ] = await nftMarketplace.getListingDetails(1);

      expect(listedSeller).to.equal(seller.address);
      expect(listedNftContract).to.equal(await nft.getAddress());
      expect(listedTokenId).to.equal(1);
      expect(listedPrice).to.equal(INITIAL_PRICE);
      expect(isActive).to.be.true;
      expect(saleType).to.equal(1); // NFT.NFTStatus.SALE
    });
  });

  describe("getActiveListings", function () {
    const tokenURI = "https://example.com/token/1";
    const price = ethers.parseEther("1");
    const collectionId = 1;

    beforeEach(async function () {
      await nft
        .connect(seller)
        .setApprovalForAll(await nftMarketplace.getAddress(), true);

      // Create multiple listings
      for (let i = 1; i <= 5; i++) {
        await nft
          .connect(seller)
          .mint(seller.address, tokenURI, price, collectionId);
        await nftMarketplace
          .connect(seller)
          .listNFT(await nft.getAddress(), i, INITIAL_PRICE, 1);
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

  describe("Edge cases and additional scenarios", function () {
    it("should handle listing and buying NFT with different sale types", async function () {
      await nft
        .connect(seller)
        .setApprovalForAll(await nftMarketplace.getAddress(), true);

      // List NFT for both sale and auction (NFT.NFTStatus.BOTH)
      await nftMarketplace
        .connect(seller)
        .listNFT(await nft.getAddress(), 1, INITIAL_PRICE, 2); // 2 represents NFT.NFTStatus.BOTH

      // Buyer should be able to purchase directly
      await expect(
        nftMarketplace.connect(buyer).buyNFT(1, { value: INITIAL_PRICE })
      ).to.emit(nftMarketplace, "NFTSold");

      expect(await nft.ownerOf(1)).to.equal(buyer.address);
    });

    it("should not allow listing with invalid sale type", async function () {
      await nft
        .connect(seller)
        .setApprovalForAll(await nftMarketplace.getAddress(), true);

      // Try to list with an invalid sale type
      await expect(
        nftMarketplace
          .connect(seller)
          .listNFT(await nft.getAddress(), 1, INITIAL_PRICE, 3) // 3 is not a valid NFT.NFTStatus
      ).to.be.revertedWith("Invalid sale type");
    });

    it("should handle multiple listings and cancellations correctly", async function () {
      const tokenURI = "https://example.com/token/1";
      const price = ethers.parseEther("1");
      const collectionId = 1;

      await nft
        .connect(seller)
        .setApprovalForAll(await nftMarketplace.getAddress(), true);

      // Create multiple listings
      for (let i = 1; i <= 3; i++) {
        await nft
          .connect(seller)
          .mint(seller.address, tokenURI, price, collectionId);
        await nftMarketplace
          .connect(seller)
          .listNFT(await nft.getAddress(), i, INITIAL_PRICE, 1);
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
      ).to.be.revertedWith("Listing is not active");

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
        .listNFT(await nft.getAddress(), 1, INITIAL_PRICE, 1);

      const newPrice = ethers.parseEther("2");
      await nftMarketplace.connect(seller).updateListingPrice(1, newPrice);

      // Try to buy with old price
      await expect(
        nftMarketplace.connect(buyer).buyNFT(1, { value: INITIAL_PRICE })
      ).to.be.revertedWith("Insufficient payment");

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
        .listNFT(await nft.getAddress(), 1, INITIAL_PRICE, 1);

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
  });
});
