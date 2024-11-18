import { expect } from "chai";
import { ethers, network } from "hardhat";
import { PriceFeed, PriceFeed__factory } from "../../typechain-types";
import { developmentChains } from "../../helper-hardhat-config";

// This test is meant to run on Sepolia only
developmentChains.includes(network.name)
  ? describe.skip
  : describe("PriceFeed Contract", function () {
      let priceFeedLive: PriceFeed;
      const livePriceFeedAddress = "0x694AA1769357215DE4FAC081bf1f309aDC325306"; // ETH/USD price feed on Sepolia

      beforeEach(async () => {
        const PriceFeedLive = (await ethers.getContractFactory(
          "PriceFeed"
        )) as unknown as PriceFeed__factory;
        priceFeedLive = await PriceFeedLive.deploy(livePriceFeedAddress);
        await priceFeedLive.waitForDeployment();
      });

      describe("Integration with Live Network", function () {
        it("should use the live price feed on Sepolia", async function () {
          // Check that the deployed PriceFeed can get the latest price
          const [livePrice] = await priceFeedLive.getLatestPrice();
          const livePriceToNumber = Number(livePrice);
          expect(livePriceToNumber).to.be.a("number"); // Ensure we received a number
          console.log("Live Price:", livePriceToNumber);
        });
      });
    });
