type CacheEntry = {
  value: number;
  timestamp: number;
};

type CacheStore = {
  [key: string]: CacheEntry;
};

// Cache configuration
const CACHE_DURATION = 15 * 1000; // 15 seconds in milliseconds
const cache: CacheStore = {};

/**
 * Converts ETH amount to USD using current market price
 * @param ethAmount - Amount in ETH as string
 * @returns Promise<string> - USD amount as string with 2 decimal places
 * @throws Error if conversion fails or invalid input
 */
export async function ethToUsd(ethAmount: string): Promise<string> {
  try {
    // Validate and parse input
    const ethValue = parseFloat(ethAmount);
    if (isNaN(ethValue) || ethValue < 0) {
      throw new Error("Invalid ETH amount");
    }

    // Get ETH price with caching
    const ethPrice = await getEthPrice();

    // Calculate USD value
    const usdValue = ethValue * ethPrice;

    // Return formatted string with 2 decimal places
    return usdValue.toFixed(2);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`ETH to USD conversion failed: ${error.message}`);
    }
    throw new Error("ETH to USD conversion failed");
  }
}

/**
 * Fetches current ETH price in USD with caching
 * @returns Promise<number> - Current ETH price
 * @throws Error if fetch fails
 */
async function getEthPrice(): Promise<number> {
  const CACHE_KEY = "ethPrice";
  const now = Date.now();

  // Check cache
  const cachedData = cache[CACHE_KEY];
  if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
    return cachedData.value;
  }

  try {
    // Fetch new price
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
    );

    if (!response.ok) {
      throw new Error("Failed to fetch ETH price");
    }

    const data = await response.json();
    const price = data.ethereum.usd;

    // Update cache
    cache[CACHE_KEY] = {
      value: price,
      timestamp: now,
    };

    return price;
  } catch (error) {
    // If cache exists but is expired, return stale data rather than failing
    if (cachedData) {
      return cachedData.value;
    }
    throw error;
  }
}
