import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { network } from "hardhat";
import { developmentChains, networkConfig } from "../../helper-hardhat-config";

const DECIMALS = 8;
const INITIAL_PRICE = "300000000000"; // Mock initial price for local testing

const chainId = network.config.chainId;

const PriceFeedDeployment = buildModule("PriceFeedDeployment", (m) => {
  let priceFeedAddress;

  if (developmentChains.includes(network.name)) {
    // Deploy MockV3Aggregator for local testing
    const mockAggregator = m.contract("MockV3Aggregator", [
      DECIMALS,
      INITIAL_PRICE,
    ]);
    priceFeedAddress = mockAggregator;
  } else if (!developmentChains.includes(network.name) && chainId) {
    // Use live Chainlink feed on Sepolia
    priceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
  } else {
    throw new Error(`Unsupported network: ${network.name}`);
  }

  // Deploy PriceFeed, using the mock or live address based on network
  const priceFeed = m.contract("PriceFeed", [priceFeedAddress]);

  return { priceFeed };
});

export default PriceFeedDeployment;
