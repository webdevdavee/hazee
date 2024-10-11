import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("NFTMarketplaceModule", (m) => {
  // Deploy NFTCreators first as it doesn't depend on other contracts
  const nftCreators = m.contract("NFTCreators");

  // Deploy NFTCollections with only NFTCreators address
  const nftCollections = m.contract("NFTCollections", [nftCreators]);

  // Deploy NFTAuction, which depends on NFTCreators and NFTCollections
  const nftAuction = m.contract("NFTAuction", [nftCreators, nftCollections]);

  // Set the auction contract address in NFTCollections
  m.call(nftCollections, "setAuctionContract", [nftAuction]);

  // Deploy NFTMarketplace, which depends on NFTCreators, NFTAuction, and NFTCollections
  const nftMarketplace = m.contract("NFTMarketplace", [
    nftCreators,
    nftAuction,
    nftCollections,
  ]);

  // Set the marketplace contract address in NFTCollections
  m.call(nftCollections, "setMarketplaceContract", [nftMarketplace]);

  // Deploy NFT contract last, as it depends on all other contracts
  const nft = m.contract("NFT", [
    "Hazee NFT",
    "HNFT",
    nftCreators,
    nftAuction,
    nftMarketplace,
  ]);

  return { nftCreators, nftCollections, nftAuction, nftMarketplace, nft };
});
