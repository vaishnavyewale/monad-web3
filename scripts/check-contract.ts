import { ethers } from "ethers";

const RPC_URL = "https://testnet-rpc.monad.xyz";

const CONTRACT_ADDRESS =
  "0x30a8EdB4E99456e9961af4cecEE36543507Dcf68";

const ABI = [
  "function eventCount() view returns (uint256)",
  "function events(uint256) view returns (uint256 id, string title, uint256 date, uint256 maxSeats, uint256 registeredCount)",
  "function registered(uint256,address) view returns (bool)",
];

const WALLET =
  "0xb85310b7298796f4FD4CA08fd9f07b0B0Eb62817";

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    ABI,
    provider
  );

  console.log("\n=== CampusHub Contract Check ===\n");

  const count = await contract.eventCount();

  console.log("Event count:", count.toString());

  const event = await contract.events(1);

  console.log("\nEvent #1:");
  console.log("ID:", event.id.toString());
  console.log("Title:", event.title);
  console.log("Date:", event.date.toString());
  console.log("Max seats:", event.maxSeats.toString());
  console.log("Registered count:", event.registeredCount.toString());

  const isRegistered = await contract.registered(1, WALLET);

  console.log("\nWallet registered:", isRegistered);

  console.log("\n===============================\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});