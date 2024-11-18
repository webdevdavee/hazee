export const SUPPORTED_NETWORKS: NetworkConfigs = {
  1: {
    chainId: 1,
    name: "Ethereum Mainnet",
    rpcUrl: process.env.ETHEREUM_RPC_URL!,
    isTestnet: false,
  },
  11155111: {
    chainId: 11155111,
    name: "Sepolia",
    rpcUrl: process.env.SEPOLIA_RPC_URL!,
    isTestnet: true,
  },
  31337: {
    chainId: 31337,
    name: "Hardhat",
    rpcUrl: "http://127.0.0.1:8545",
    isTestnet: true,
  },
};
