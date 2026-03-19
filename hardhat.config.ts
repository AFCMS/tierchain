import { defineConfig } from "hardhat/config";
import hardhatVerify from "@nomicfoundation/hardhat-verify";
import hardhatIgnitionViemPlugin from "@nomicfoundation/hardhat-ignition-viem";

import "dotenv/config";

export default defineConfig({
  plugins: [hardhatVerify, hardhatIgnitionViemPlugin],
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 50,
      },
    },
  },
  networks: {
    sepolia: {
      type: "http",
      url: process.env.ALCHEMY_URL,
      chainId: 11155111,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
  verify: {
    etherscan: {
      enabled: true,
      apiKey: process.env.ETHERSCAN_API_KEY,
    },
    blockscout: {
      enabled: true,
    },
  },
});
