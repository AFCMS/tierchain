import { defineConfig } from "hardhat/config";
import hardhatVerify from "@nomicfoundation/hardhat-verify";

import "dotenv/config";

export default defineConfig({
  plugins: [hardhatVerify],
  solidity: {
    version: "0.8.28",
  },
});
