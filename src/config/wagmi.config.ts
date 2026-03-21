import { createConfig, fallback, http, webSocket } from "wagmi";
import { hardhat, mainnet, sepolia } from "wagmi/chains";
import { metaMask } from "wagmi/connectors";

const CHAIN_BY_KEY = {
  hardhat,
  mainnet,
  sepolia,
} as const;

type ChainKey = keyof typeof CHAIN_BY_KEY;

const chainKey = (
  import.meta.env.VITE_CHAIN ?? "sepolia"
).toLowerCase() as ChainKey;

function createSingleChainConfig(
  chain: typeof hardhat | typeof mainnet | typeof sepolia,
) {
  if (chain.id === hardhat.id) {
    return createConfig({
      ssr: false,
      chains: [hardhat],
      connectors: [metaMask()],
      transports: {
        [hardhat.id]: fallback([
          webSocket(
            import.meta.env.VITE_HARDHAT_WS_RPC_URL ?? "ws://127.0.0.1:8545",
          ),
          http(import.meta.env.VITE_HARDHAT_RPC_URL ?? "http://127.0.0.1:8545"),
        ]),
      },
    });
  }

  if (chain.id === mainnet.id) {
    return createConfig({
      ssr: false,
      chains: [mainnet],
      connectors: [metaMask()],
      transports: {
        [mainnet.id]: fallback([
          webSocket(import.meta.env.VITE_MAINNET_WS_RPC_URL),
          http(import.meta.env.VITE_MAINNET_RPC_URL),
        ]),
      },
    });
  }

  return createConfig({
    ssr: false,
    chains: [sepolia],
    connectors: [metaMask()],
    transports: {
      [sepolia.id]: fallback([
        webSocket(import.meta.env.VITE_SEPOLIA_WS_RPC_URL),
        http(import.meta.env.VITE_SEPOLIA_RPC_URL),
      ]),
    },
  });
}

export const config = createSingleChainConfig(
  CHAIN_BY_KEY[chainKey] ?? sepolia,
);
