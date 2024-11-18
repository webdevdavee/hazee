// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFT is ERC721Enumerable, ERC721URIStorage, Ownable {
    uint256 private _tokenIds;
    address public auctionContract;
    address public marketplaceContract;

    enum NFTStatus {
        NONE,
        SALE,
        AUCTION,
        BOTH
    }

    struct TokenInfo {
        uint256 price;
        uint256 collectionId;
        NFTStatus status;
    }

    mapping(address => uint256[]) private _createdTokens;
    mapping(address => uint256) private _itemsSold;
    mapping(uint256 => TokenInfo) private _tokenInfo;

    // Events
    event NFTMinted(uint256 indexed tokenId, address indexed creator);
    event NFTStatusChanged(uint256 indexed tokenId, NFTStatus newStatus);
    event PriceSet(uint256 indexed tokenId, uint256 price);
    event ItemSold(address indexed seller, uint256 indexed tokenId);

    // Errors
    error InvalidRecipientAddress();
    error EmptyTokenURI();
    error InvalidPrice();
    error TokenNotExists(uint256 tokenId);
    error NotTokenOwner();
    error NotAuthorized();

    constructor(
        string memory name,
        string memory symbol,
        address _auctionContractAddress,
        address _marketplaceContractAddress
    ) ERC721(name, symbol) Ownable(msg.sender) {
        auctionContract = _auctionContractAddress;
        marketplaceContract = _marketplaceContractAddress;
    }

    function updateMarketplaceContract(
        address _marketplaceContractAddress
    ) external onlyOwner {
        marketplaceContract = _marketplaceContractAddress;
    }

    function updateAuctionContract(
        address _auctionContract
    ) external onlyOwner {
        auctionContract = _auctionContract;
    }

    // These overrides are necessary because ERC721Enumerable and ERC721URIStorage
    // both modify some of the same base ERC721 functions
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721Enumerable, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function exists(uint256 tokenId) public view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    function getCurrentOwner(uint256 tokenId) public view returns (address) {
        if (!exists(tokenId)) revert TokenNotExists(tokenId);
        return ownerOf(tokenId);
    }

    function mint(
        address to,
        string calldata theTokenURI,
        uint256 price,
        uint256 _collectionId
    ) public returns (uint256) {
        if (to == address(0)) revert InvalidRecipientAddress();
        if (bytes(theTokenURI).length == 0) revert EmptyTokenURI();
        if (price == 0) revert InvalidPrice();

        unchecked {
            _tokenIds++;
        }
        uint256 newTokenId = _tokenIds;

        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, theTokenURI);

        _tokenInfo[newTokenId] = TokenInfo({
            price: price,
            collectionId: _collectionId,
            status: NFTStatus.NONE
        });

        _createdTokens[to].push(newTokenId);

        emit NFTMinted(newTokenId, to);
        emit PriceSet(newTokenId, price);

        return newTokenId;
    }

    function setNFTStatus(uint256 tokenId, NFTStatus status) external {
        if (!exists(tokenId)) revert TokenNotExists(tokenId);
        if (
            msg.sender != ownerOf(tokenId) &&
            msg.sender != owner() &&
            msg.sender != auctionContract &&
            msg.sender != marketplaceContract
        ) {
            revert NotAuthorized();
        }
        _tokenInfo[tokenId].status = status;
        emit NFTStatusChanged(tokenId, status);
    }

    function recordSale(address seller) external {
        require(
            msg.sender == auctionContract || msg.sender == marketplaceContract,
            "NFT: Not authorized"
        );
        unchecked {
            _itemsSold[seller]++;
        }
        emit ItemSold(seller, _itemsSold[seller]);
    }

    function getPrice(uint256 tokenId) public view returns (uint256) {
        require(exists(tokenId), "NFT: Nonexistent token");
        return _tokenInfo[tokenId].price;
    }

    function getCollection(uint256 tokenId) public view returns (uint256) {
        if (!exists(tokenId)) revert TokenNotExists(tokenId);
        return _tokenInfo[tokenId].collectionId;
    }

    function getTokenStatus(uint256 tokenId) public view returns (NFTStatus) {
        require(exists(tokenId), "NFT: Nonexistent token");
        return _tokenInfo[tokenId].status;
    }

    function getCreatedTokens(
        address creator
    ) public view returns (uint256[] memory) {
        return _createdTokens[creator];
    }

    function getItemsSold(address seller) public view returns (uint256) {
        return _itemsSold[seller];
    }

    function getOwnedTokens(
        address owner
    ) public view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory tokens = new uint256[](balance);

        for (uint256 i = 0; i < balance; ) {
            tokens[i] = tokenOfOwnerByIndex(owner, i);
            unchecked {
                ++i;
            }
        }

        return tokens;
    }
}
