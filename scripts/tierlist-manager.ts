import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Command } from "commander";
import {
  createPublicClient,
  createWalletClient,
  getAddress,
  http,
  type Chain,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { hardhat, sepolia } from "viem/chains";

type TierlistDefinition = {
  name: string;
  description?: string;
  items: string[];
};

type CliContext = {
  publicClient: ReturnType<typeof createPublicClient>;
  walletClient: ReturnType<typeof createWalletClient>;
  chain: Chain;
  contractAddress: `0x${string}`;
  abi: readonly unknown[];
  accountAddress: `0x${string}`;
};

type CliMode = "hardhat" | "sepolia";

const ARTIFACT_PATH = "artifacts/contracts/TierList.sol/TierList.json";
const LOCAL_DEPLOYMENT_PATH =
  "ignition/deployments/chain-31337/deployed_addresses.json";

function readArtifactAbi(): readonly unknown[] {
  const artifact = JSON.parse(
    readFileSync(resolve(ARTIFACT_PATH), "utf-8"),
  ) as { abi?: readonly unknown[] };

  if (!artifact.abi || !Array.isArray(artifact.abi)) {
    throw new Error(`Invalid artifact ABI in ${ARTIFACT_PATH}`);
  }

  return artifact.abi;
}

function readLocalDeployedAddress(): string | undefined {
  try {
    const raw = readFileSync(resolve(LOCAL_DEPLOYMENT_PATH), "utf-8");
    const deployed = JSON.parse(raw) as Record<string, string>;
    return deployed["TierListModule#TierList"];
  } catch {
    return undefined;
  }
}

function normalizePrivateKey(value: string): `0x${string}` {
  const normalized = value.startsWith("0x") ? value : `0x${value}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(normalized)) {
    throw new Error("PRIVATE_KEY must be a 32-byte hex value");
  }
  return normalized as `0x${string}`;
}

function parseTierListId(value: string): bigint {
  if (!/^\d+$/.test(value)) {
    throw new Error("tierListId must be a positive integer");
  }

  const parsed = BigInt(value);
  if (parsed <= 0n) {
    throw new Error("tierListId must be greater than 0");
  }

  return parsed;
}

function parseItemId(value: string): bigint {
  if (!/^\d+$/.test(value)) {
    throw new Error("itemId must be a positive integer");
  }

  const parsed = BigInt(value);
  if (parsed <= 0n) {
    throw new Error("itemId must be greater than 0");
  }

  return parsed;
}

function loadTierlistDefinition(filePath: string): TierlistDefinition {
  const absolutePath = resolve(filePath);
  const raw = readFileSync(absolutePath, "utf-8");
  const parsed = JSON.parse(raw) as Partial<TierlistDefinition>;

  if (typeof parsed.name !== "string" || parsed.name.trim().length === 0) {
    throw new Error("Invalid tierlist JSON: 'name' must be a non-empty string");
  }

  const description =
    typeof parsed.description === "string" ? parsed.description : "";

  if (!Array.isArray(parsed.items)) {
    throw new Error(
      "Invalid tierlist JSON: 'items' must be an array of strings",
    );
  }

  const items = parsed.items
    .map((item) => {
      if (typeof item !== "string") {
        throw new Error("Invalid tierlist JSON: each item must be a string");
      }
      return item.trim();
    })
    .filter((item) => item.length > 0);

  return {
    name: parsed.name.trim(),
    description,
    items,
  };
}

function parseCliMode(value: string): CliMode {
  if (value === "hardhat" || value === "sepolia") {
    return value;
  }

  throw new Error("Invalid --mode. Use either 'hardhat' or 'sepolia'.");
}

async function createCliContext(options: {
  mode: string;
  address?: string;
  rpcUrl?: string;
}): Promise<CliContext> {
  const mode = parseCliMode(options.mode);

  const privateKey =
    mode === "hardhat"
      ? process.env.HARDHAT_PRIVATE_KEY
      : process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error(
      mode === "hardhat"
        ? "Missing HARDHAT_PRIVATE_KEY in .env"
        : "Missing PRIVATE_KEY in .env",
    );
  }

  const rpcUrl =
    options.rpcUrl ||
    (mode === "hardhat"
      ? process.env.HARDHAT_RPC_URL || "http://127.0.0.1:8545"
      : process.env.SEPOLIA_RPC_URL || process.env.ALCHEMY_URL);
  if (!rpcUrl) {
    throw new Error(
      mode === "hardhat"
        ? "Missing hardhat RPC URL. Set HARDHAT_RPC_URL or use --rpc-url"
        : "Missing Sepolia RPC URL. Set SEPOLIA_RPC_URL (or ALCHEMY_URL) or use --rpc-url",
    );
  }

  const fromEnv =
    mode === "hardhat"
      ? process.env.HARDHAT_TIERLIST_CONTRACT_ADDRESS ||
        process.env.TIERLIST_CONTRACT_ADDRESS
      : process.env.SEPOLIA_TIERLIST_CONTRACT_ADDRESS ||
        process.env.TIERLIST_CONTRACT_ADDRESS;
  const fromLocalDeployment = readLocalDeployedAddress();
  const rawAddress =
    mode === "hardhat"
      ? options.address || fromEnv || fromLocalDeployment
      : options.address || fromEnv;
  if (!rawAddress) {
    throw new Error(
      mode === "hardhat"
        ? "Missing contract address. Use --address, HARDHAT_TIERLIST_CONTRACT_ADDRESS/TIERLIST_CONTRACT_ADDRESS, or deploy locally with ignition first"
        : "Missing contract address. Use --address or set SEPOLIA_TIERLIST_CONTRACT_ADDRESS/TIERLIST_CONTRACT_ADDRESS in .env",
    );
  }

  const normalizedPrivateKey = normalizePrivateKey(privateKey);
  const account = privateKeyToAccount(normalizedPrivateKey);
  const abi = readArtifactAbi();
  const chain = mode === "hardhat" ? hardhat : sepolia;

  const publicClient = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  if (mode !== "hardhat" && rawAddress === fromLocalDeployment) {
    throw new Error(
      "Using local deployment fallback address on a non-local chain. Set --address or TIERLIST_CONTRACT_ADDRESS for your target network.",
    );
  }

  const contractAddress = getAddress(rawAddress);

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(rpcUrl),
  });

  return {
    publicClient,
    walletClient,
    chain,
    contractAddress,
    abi,
    accountAddress: account.address,
  };
}

async function executeTransaction(params: {
  context: CliContext;
  functionName:
    | "createTierList"
    | "addItem"
    | "removeItem"
    | "setTierListActive";
  args: readonly unknown[];
  actionLabel: string;
}) {
  const owner = (await params.context.publicClient.readContract({
    address: params.context.contractAddress,
    abi: params.context.abi,
    functionName: "owner",
  })) as `0x${string}`;

  if (owner.toLowerCase() !== params.context.accountAddress.toLowerCase()) {
    throw new Error(
      `Only owner can execute this command. Contract owner is ${owner}, current sender is ${params.context.accountAddress}.`,
    );
  }

  console.log(`Using account: ${params.context.accountAddress}`);
  console.log(`Contract: ${params.context.contractAddress}`);
  console.log(params.actionLabel);

  const hash = await params.context.walletClient.writeContract({
    address: params.context.contractAddress,
    abi: params.context.abi,
    account: params.context.accountAddress,
    chain: params.context.chain,
    functionName: params.functionName,
    args: params.args,
  });

  console.log(`Transaction sent: ${hash}`);
  const receipt = await params.context.publicClient.waitForTransactionReceipt({
    hash,
  });
  console.log(`Confirmed in block ${receipt.blockNumber}`);
}

const program = new Command();

program
  .name("tierlist-manager")
  .description("Commander + Viem CLI for TierList smart contract management")
  .requiredOption("--mode <mode>", "Execution mode: hardhat | sepolia")
  .option("--address <address>", "TierList contract address")
  .option("--rpc-url <url>", "JSON-RPC URL (overrides .env)")
  .showHelpAfterError();

program
  .command("create")
  .description(
    "Create a tierlist from a JSON definition file (name, description, items)",
  )
  .requiredOption("--file <path>", "Path to the tierlist JSON file")
  .action(async (options: { file: string }) => {
    const rootOptions = program.opts<{
      mode: string;
      address?: string;
      rpcUrl?: string;
    }>();
    const definition = loadTierlistDefinition(options.file);
    const context = await createCliContext(rootOptions);

    await executeTransaction({
      context,
      functionName: "createTierList",
      args: [definition.name, definition.description ?? "", definition.items],
      actionLabel: `Creating tierlist "${definition.name}" with ${definition.items.length} item(s)...`,
    });
  });

program
  .command("add-item")
  .description("Add one item by name to a tierlist")
  .requiredOption("--tierlist-id <id>", "Tierlist id")
  .requiredOption("--name <name>", "Item name")
  .action(async (options: { tierlistId: string; name: string }) => {
    const rootOptions = program.opts<{
      mode: string;
      address?: string;
      rpcUrl?: string;
    }>();
    const tierListId = parseTierListId(options.tierlistId);
    const itemName = options.name.trim();

    if (itemName.length === 0) {
      throw new Error("--name cannot be empty");
    }

    const context = await createCliContext(rootOptions);

    await executeTransaction({
      context,
      functionName: "addItem",
      args: [tierListId, [itemName]],
      actionLabel: `Adding item "${itemName}" to tierlist ${tierListId.toString()}...`,
    });
  });

program
  .command("remove-item")
  .description("Remove one item from a tierlist by item id")
  .requiredOption("--tierlist-id <id>", "Tierlist id")
  .requiredOption("--item-id <id>", "Item id to remove")
  .action(async (options: { tierlistId: string; itemId: string }) => {
    const rootOptions = program.opts<{
      mode: string;
      address?: string;
      rpcUrl?: string;
    }>();
    const tierListId = parseTierListId(options.tierlistId);
    const itemId = parseItemId(options.itemId);
    const context = await createCliContext(rootOptions);

    await executeTransaction({
      context,
      functionName: "removeItem",
      args: [tierListId, itemId],
      actionLabel: `Removing item ${itemId.toString()} from tierlist ${tierListId.toString()}...`,
    });
  });

program
  .command("remove-tierlist")
  .description("Disable a tierlist")
  .requiredOption("--tierlist-id <id>", "Tierlist id")
  .action(async (options: { tierlistId: string }) => {
    const rootOptions = program.opts<{
      mode: string;
      address?: string;
      rpcUrl?: string;
    }>();
    const tierListId = parseTierListId(options.tierlistId);
    const context = await createCliContext(rootOptions);

    await executeTransaction({
      context,
      functionName: "setTierListActive",
      args: [tierListId, false],
      actionLabel: `Disabling tierlist ${tierListId.toString()}...`,
    });
  });

program
  .command("list")
  .description("List all tierlists")
  .option("--include-inactive", "Include inactive tierlists (default: false)")
  .action(async (options: { includeInactive?: boolean }) => {
    const rootOptions = program.opts<{
      mode: string;
      address?: string;
      rpcUrl?: string;
    }>();
    const context = await createCliContext(rootOptions);

    console.log(`Contract: ${context.contractAddress}`);
    console.log(
      `Fetching tierlists${options.includeInactive ? " (including inactive)" : ""}...`,
    );

    const tierlists = (await context.publicClient.readContract({
      address: context.contractAddress,
      abi: context.abi,
      functionName: "getTierLists",
      args: [options.includeInactive ?? false],
    })) as Array<{
      name: string;
      description: string;
      active: boolean;
      numActiveItems: bigint;
    }>;

    if (tierlists.length === 0) {
      console.log("No tierlists found.");
      return;
    }

    console.log(`\nFound ${tierlists.length} tierlist(s):\n`);

    tierlists.forEach((tl, idx) => {
      const status = tl.active ? "✓ active" : "✗ inactive";
      console.log(`[${idx + 1}]  ${tl.name}`);
      console.log(`     Status: ${status}`);
      console.log(`     Items: ${tl.numActiveItems.toString()}`);
      if (tl.description) {
        console.log(`     Description: ${tl.description}`);
      }
      console.log();
    });
  });

program.parseAsync(process.argv).catch((error: unknown) => {
  console.error("Tierlist manager failed:");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
