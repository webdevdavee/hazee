// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract PriceFeed {
    AggregatorV3Interface internal priceFeed;

    constructor(address _priceFeed) {
        priceFeed = AggregatorV3Interface(_priceFeed);
    }

    function getLatestPrice() public view returns (int256, uint8) {
        // Getting price from the Chainlink price feed
        (
            ,
            /* uint80 roundID */ int256 price /* uint startedAt */ /* uint timeStamp */ /* uint80 answeredInRound */,
            ,
            ,

        ) = priceFeed.latestRoundData();

        return (price, priceFeed.decimals());
    }

    // Helper function to get formatted price with 8 decimals
    function getFormattedPrice() public view returns (uint256) {
        (int256 price, ) = getLatestPrice();
        // Convert to positive number and adjust decimals if needed
        return uint256(price);
    }
}
