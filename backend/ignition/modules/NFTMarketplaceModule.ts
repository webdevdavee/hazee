import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("NFTMarketplaceModule", (m) => {
  // Deploy NFT contract first with temporary addresses
  const nft = m.contract("NFT", [
    "Hazee",
    "HNM",
    "0x0000000000000000000000000000000000000000", // temporary auction address
    "0x0000000000000000000000000000000000000000", // temporary marketplace address
  ]);

  // Deploy NFTAuction with NFT contract address
  const nftAuction = m.contract("NFTAuction", [
    nft,
    "0x0000000000000000000000000000000000000000", // temporary marketplace address
  ]);

  // Deploy NFTCollections with NFT contract
  const nftCollections = m.contract("NFTCollections", [nft]);

  // Deploy NFTMarketplace with all required contract addresses
  const nftMarketplace = m.contract("NFTMarketplace", [
    nft,
    nftCollections,
    nftAuction,
  ]);

  // Update the auction and marketplace addresses in the NFT and Auction contracts
  m.call(nft, "updateAuctionContract", [nftAuction]);
  m.call(nft, "updateMarketplaceContract", [nftMarketplace]);
  m.call(nftAuction, "updateMarketplaceContract", [nftMarketplace]);

  return {
    nft,
    nftAuction,
    nftCollections,
    nftMarketplace,
  };
});
