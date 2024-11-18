import { expect } from "chai";
import { ethers, network } from "hardhat";
import {
  MockV3Aggregator,
  MockV3Aggregator__factory,
  PriceFeed,
  PriceFeed__factory,
} from "../../typechain-types";
import { developmentChains } from "../../helper-hardhat-config";

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("PriceFeed Contract", function () {
      let priceFeed: PriceFeed;
      let mockAggregator: MockV3Aggregator;
      const DECIMALS = 8;
      const INITIAL_PRICE = ethers.parseUnits("300", DECIMALS);

      beforeEach(async () => {
        const MockV3Aggregator = (await ethers.getContractFactory(
          "MockV3Aggregator"
        )) as unknown as MockV3Aggregator__factory;

        mockAggregator = await MockV3Aggregator.deploy(DECIMALS, INITIAL_PRICE);
        await mockAggregator.waitForDeployment();

        const PriceFeed = (await ethers.getContractFactory(
          "PriceFeed"
        )) as unknown as PriceFeed__factory;
        priceFeed = await PriceFeed.deploy(mockAggregator);
        await priceFeed.waitForDeployment();
      });

      it("should return the latest price from the mock aggregator", async () => {
        const [price, decimals] = await priceFeed.getLatestPrice();
        expect(price).to.equal(INITIAL_PRICE);
        expect(decimals).to.equal(DECIMALS);
      });

      it("should return the formatted price", async () => {
        const formattedPrice = await priceFeed.getFormattedPrice();
        expect(formattedPrice).to.equal(INITIAL_PRICE);
      });
    });
