import { useConnect, useConnection, useDisconnect } from "wagmi";
import { useBalance } from "wagmi";
import { injected } from "wagmi/connectors";
import { formatUnits } from "viem";
import { LogIn, LogOut } from "lucide-react";

import { AddressLink } from "./AddressLink";

/**
 * MetaMask wallet connection + display of the connected Ethereum address
 */
export function HeaderAuth() {
  const { address, chain, chainId } = useConnection();
  const disconnect = useDisconnect();
  const connect = useConnect();
  const balance = useBalance({
    address,
    chainId,
  });

  const formattedBalance =
    balance.data != null
      ? Number(formatUnits(balance.data.value, balance.data.decimals)).toFixed(
          4,
        )
      : null;
  const balanceSymbol =
    balance.data?.symbol ?? chain?.nativeCurrency.symbol ?? "ETH";

  return (
    <div className="flex-none">
      {address != null ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <AddressLink address={address} />
          <span className="opacity-70"> · </span>
          <span className="font-bold">{chain?.name ?? "Unknown network"}</span>
          <span className="badge badge-ghost font-mono">
            {formattedBalance != null
              ? `${formattedBalance} ${balanceSymbol}`
              : "_.____ ETH"}
          </span>
          <button
            className="btn"
            disabled={disconnect.isPending}
            onClick={() => disconnect.mutate()}
          >
            {disconnect.isPending ? (
              <>
                <span className="loading loading-spinner"></span>
                Disconnecting...
              </>
            ) : (
              <>
                <LogOut /> Disconnect
              </>
            )}
          </button>
        </div>
      ) : (
        <button
          className="btn"
          disabled={connect.isPending}
          onClick={() => connect.mutate({ connector: injected() })}
        >
          {connect.isPending ? (
            <>
              <span className="loading loading-spinner"></span>Connecting...
            </>
          ) : (
            <>
              <LogIn /> Connect
            </>
          )}
        </button>
      )}
    </div>
  );
}
