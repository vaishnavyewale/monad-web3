import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("CampusHubModule", (m) => {
  const campusHub = m.contract("CampusHub");

  return {
    campusHub,
  };
});