import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("NFTMarketplaceModule", (m) => {
  const nft = m.contract("NFT", [
    "Test NFT",
    "TNFT",
    "0x0000000000000000000000000000000000000000", // temporary auction address. Will update these later
    "0x0000000000000000000000000000000000000000", // temporary marketplace address. Will update these later
  ]);

  // Deploy NFTAuction contract
  const nftAuction = m.contract("NFTAuction", [nft]);

  // Deploy NFTCollections with auction and marketplace (temporary) addresses
  const nftCollections = m.contract("NFTCollections", [
    nftAuction,
    "0x0000000000000000000000000000000000000000", // temporary marketplace address. Will update this later
  ]);

  // Deploy NFTMarketplace with required dependencies
  const nftMarketplace = m.contract("NFTMarketplace", [
    nftCollections,
    nftAuction,
  ]);

  // Update the marketplace address in NFTCollections
  m.call(nftCollections, "setMarketplaceContract", [nftMarketplace]);

  // Update the auction and marketplace addresses in the NFT contract
  m.call(nft, "setAuctionContract", [nftAuction]);
  m.call(nft, "setMarketplaceContract", [nftMarketplace]);

  return {
    nft,
    nftAuction,
    nftCollections,
    nftMarketplace,
  };
});
