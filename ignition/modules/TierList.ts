import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("TierListModule", (m) => {
  const tierList = m.contract("TierList");

  return { tierList };
});
