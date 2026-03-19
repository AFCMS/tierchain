import { createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { metaMask } from "wagmi/connectors";

const CHAIN_BY_KEY = {
  mainnet,
  sepolia,
} as const;

type ChainKey = keyof typeof CHAIN_BY_KEY;

const chainKey = (
  import.meta.env.VITE_CHAIN ?? "sepolia"
).toLowerCase() as ChainKey;

function createSingleChainConfig(chain: typeof mainnet | typeof sepolia) {
  if (chain.id === mainnet.id) {
    return createConfig({
      ssr: false,
      chains: [mainnet],
      connectors: [metaMask()],
      transports: {
        [mainnet.id]: http(import.meta.env.VITE_MAINNET_RPC_URL),
      },
    });
  }

  return createConfig({
    ssr: false,
    chains: [sepolia],
    connectors: [metaMask()],
    transports: {
      [sepolia.id]: http(import.meta.env.VITE_SEPOLIA_RPC_URL),
    },
  });
}

export const config = createSingleChainConfig(
  CHAIN_BY_KEY[chainKey] ?? sepolia,
);
