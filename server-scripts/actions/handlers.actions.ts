"use server";

import {
  checkNFTAuctionStatus,
  getAuctionDetails,
} from "./auction.contract.action";
import { fetchFilteredListings } from "./marketplace.contract.actions";
import { getFullTokenInfo } from "./nft.contract.actions";
import { getUserCreatedCollections } from "@/server-scripts/actions/collection.contract.actions";
import {
  checkNFTListing,
  getListingDetails,
} from "@/server-scripts/actions/marketplace.contract.actions";
import {
  getCreatedTokens,
  getItemsSold,
  getOwnedTokens,
  verifyNFTOwnership,
} from "@/server-scripts/actions/nft.contract.actions";
import { getUserByWalletAddress } from "@/server-scripts/database/actions/user.action";

enum ListingType {
  NONE,
  SALE,
  AUCTION,
  BOTH,
}

enum SortOrder {
  NONE,
  PRICE_HIGH_TO_LOW,
  PRICE_LOW_TO_HIGH,
}

interface FilterParams {
  listingType: ListingType;
  collectionId: number;
  minPrice: number;
  maxPrice: number;
  sortOrder: SortOrder;
  offset: number;
  limit: number;
}

export const fetchFilteredListingsData = async (
  params: FilterParams
): Promise<{
  success: boolean;
  data?: EnrichedNFTListing[];
  error?: string;
  partialErrors?: string[];
}> => {
  try {
    const response = await fetchFilteredListings({
      listingType: params.listingType,
      collectionId: params.collectionId,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      sortOrder: params.sortOrder,
      offset: params.offset,
      limit: params.limit,
    });

    if (!response.data?.formattedListing?.length) {
      return { success: true, data: [] };
    }

    const partialErrors: string[] = [];

    // Use Promise.allSettled for more robust handling
    const listings = await Promise.allSettled(
      response.data.formattedListing.map(async (d) => {
        try {
          const [tokenInfo, isOnAuction] = await Promise.all([
            getFullTokenInfo(d.tokenId),
            checkNFTAuctionStatus(d.tokenId),
          ]);

          const enrichedListing: EnrichedNFTListing = {
            ...d,
            name: tokenInfo.data?.metadata?.name,
            imageUrl: tokenInfo.data?.metadata?.image,
          };

          if (isOnAuction.data?.isOnAuction) {
            const auctionResponse = await getAuctionDetails(
              isOnAuction.data.auctionId
            );

            if (auctionResponse.data) {
              return {
                ...enrichedListing,
                isAuctionActive: auctionResponse.data.active,
                startingPrice: auctionResponse.data.startingPrice,
                reservePrice: auctionResponse.data.reservePrice,
                startTime: auctionResponse.data.startTime,
                endTime: auctionResponse.data.endTime,
                highestBidder: auctionResponse.data.highestBidder,
                highestBid: auctionResponse.data.highestBid,
              };
            }
          }

          return enrichedListing;
        } catch (error: any) {
          partialErrors.push(
            `Error processing listing ${d.tokenId}: ${error.message}`
          );
          return d;
        }
      })
    );

    // Filter out rejected promises and extract their values
    const successfulListings = listings
      .filter((result) => result.status === "fulfilled")
      .map(
        (result) => (result as PromiseFulfilledResult<EnrichedNFTListing>).value
      );

    return {
      success: true,
      data: successfulListings,
      partialErrors: partialErrors.length ? partialErrors : undefined,
    };
  } catch (error: any) {
    console.error("Error fetching listings:", error.message);
    return { success: false, error: error.message };
  }
};

export const getCreatorPageData = async (
  address: string
): Promise<CreatorPageData> => {
  try {
    // First fetch user data and items sold count
    const [userResponse, itemsSoldResponse, collectionsResponse] =
      await Promise.all([
        getUserByWalletAddress(address),
        getItemsSold(address),
        getUserCreatedCollections(address),
      ]);

    // If user doesn't exist, we should stop here
    if (!userResponse) {
      throw new Error(`No user found for address: ${address}`);
    }

    // Get initial token lists
    const [createdTokensResponse, ownedTokensResponse] = await Promise.all([
      getCreatedTokens(address),
      getOwnedTokens(address),
    ]);

    if (
      !createdTokensResponse.success ||
      !ownedTokensResponse.success ||
      !itemsSoldResponse.success ||
      !collectionsResponse.success
    ) {
      throw new Error("Failed to fetch creator data");
    }

    // Process created tokens
    let processedCreatedTokens: TokenInfo[] = [];
    if (createdTokensResponse.data) {
      processedCreatedTokens = await Promise.all(
        createdTokensResponse.data.map(async (token) => {
          const listingStatus = await checkNFTListing(token.tokenId);
          if (listingStatus.success && listingStatus.data.isListed) {
            const listingDetails = await getListingDetails(
              listingStatus.data.listingId
            );
            if (listingDetails.success && listingDetails.data) {
              return {
                ...token,
                price: listingDetails.data.price,
                status: listingDetails.data.listingType, // Use the listing type directly
              } as TokenInfo;
            }
          }
          return token;
        })
      );
    }

    // Process owned tokens
    let processedOwnedTokens: TokenInfo[] = [];
    if (ownedTokensResponse.data) {
      processedOwnedTokens = await Promise.all(
        ownedTokensResponse.data.map(async (token) => {
          const listingStatus = await checkNFTListing(token.tokenId);
          if (listingStatus.success && listingStatus.data.isListed) {
            const listingDetails = await getListingDetails(
              listingStatus.data.listingId
            );
            if (listingDetails.success && listingDetails.data) {
              return {
                ...token,
                price: listingDetails.data.price,
                status: listingDetails.data.listingType, // Use the listing type directly
              } as TokenInfo;
            }
          }
          return token;
        })
      );
    }

    // Get all unique token IDs to fetch their statuses
    const allTokens = [...processedCreatedTokens, ...processedOwnedTokens];
    const uniqueTokenIds = [
      ...new Set(allTokens.map((token) => token.tokenId)),
    ];

    // Fetch all NFT statuses in parallel
    const statusPromises = uniqueTokenIds.map(async (tokenId) => {
      const [auctionStatusResponse, listingStatus, isOwner] = await Promise.all(
        [
          checkNFTAuctionStatus(tokenId),
          checkNFTListing(tokenId),
          verifyNFTOwnership(tokenId, address),
        ]
      );

      let auctionDetails: AuctionDetails | undefined;

      // Check auction status and details
      const isOnAuction =
        (auctionStatusResponse.success &&
          auctionStatusResponse.data?.isOnAuction) ||
        false;

      if (isOnAuction) {
        const auctionDetailsResponse = await getAuctionDetails(
          auctionStatusResponse.data?.auctionId!
        );
        if (auctionDetailsResponse.success) {
          auctionDetails = auctionDetailsResponse.data;
        }
      }

      return {
        tokenId,
        status: {
          isOnAuction,
          auctionDetails,
          isListed: listingStatus.success
            ? !!listingStatus.data.isListed
            : false,
          isOwner: isOwner.success ? !!isOwner.data : false,
        },
      };
    });

    const tokenStatuses = await Promise.all(statusPromises);

    // Convert array of statuses to Record object
    const nftStatuses = tokenStatuses.reduce((acc, { tokenId, status }) => {
      acc[tokenId.toString()] = status;
      return acc;
    }, {} as CreatorPageData["nftStatuses"]);

    // Construct the final response object
    const creatorPageData: CreatorPageData = {
      user: userResponse,
      tokens: {
        created: processedCreatedTokens,
        owned: processedOwnedTokens,
        sold: itemsSoldResponse.data,
      },
      collections: collectionsResponse.data,
      nftStatuses,
    };

    return creatorPageData;
  } catch (error: any) {
    console.error("Error fetching creator page data:", error.message);
    throw error.message;
  }
};
