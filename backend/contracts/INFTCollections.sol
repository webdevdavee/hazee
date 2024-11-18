// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface INFTCollections {
    struct CollectionInfo {
        address creator;
        address currentOwner;
        string name;
        address nftContract;
        uint256 maxSupply;
        uint256 mintedSupply;
        uint256 royaltyPercentage;
        uint256 floorPrice;
        uint256 owners;
        bool isActive;
    }

    function getCollectionInfo(
        uint256 _collectionId
    ) external view returns (CollectionInfo memory);
}
