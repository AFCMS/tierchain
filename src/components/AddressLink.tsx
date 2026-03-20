import type { Address } from "viem";
import { useConnection } from "wagmi";

export interface AddressLinkProps {
  readonly address: Address;
}

export function AddressLink(props: AddressLinkProps) {
  const { chain } = useConnection();

  const explorerBaseUrl = chain?.blockExplorers?.default?.url;
  const explorerUrl =
    props.address != null && explorerBaseUrl != null
      ? `${explorerBaseUrl}/address/${props.address}`
      : null;

  return explorerUrl != null ? (
    <a
      className="link link-hover font-mono text-sm break-all"
      href={explorerUrl}
      target="_blank"
      rel="noreferrer"
    >
      {props.address}
    </a>
  ) : (
    <span className="font-mono text-sm break-all" aria-live="polite">
      {props.address}
    </span>
  );
}
