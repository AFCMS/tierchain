import { useReadContract } from "wagmi";

import { abi } from "../../artifacts/contracts/TierList.sol/TierList.json";
import { TierListItem } from "./TierListItem";
import { getTierListAssets } from "../data/tierlists";

const tierListAddress = import.meta.env.VITE_CONTRACT_TIERLIST_ADDRESS;

interface TierListView {
  id: bigint;
  name: string;
  description: string;
  active: boolean;
  numActiveItems: bigint;
}

interface AllListsProps {
  readonly includeInactive?: boolean;
}

export function AllLists({ includeInactive = false }: AllListsProps) {
  const enabled = Boolean(tierListAddress);

  const { data, isLoading, isError, error } = useReadContract({
    address: tierListAddress,
    abi: abi,
    functionName: "getTierLists",
    args: [includeInactive],
    query: { enabled },
  });

  const lists = (data ?? []) as TierListView[];

  if (!tierListAddress) {
    return (
      <div className="text-sm text-zinc-600">
        Missing VITE_CONTRACT_TIERLIST_ADDRESS
      </div>
    );
  }

  if (isLoading)
    return <div className="text-sm text-zinc-600">Loading tier lists…</div>;
  if (isError)
    return (
      <div className="text-sm text-red-600">{error?.message ?? "Error"}</div>
    );

  if (lists.length === 0) {
    return <div className="text-sm text-zinc-600">No tier lists yet.</div>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {lists.map((tl) => {
        const id = Number(tl.id);
        const assets = getTierListAssets(id);

        return (
          <TierListItem
            key={tl.id.toString()}
            id={id}
            name={tl.name}
            description={tl.description}
            active={tl.active}
            cover={assets?.cover}
          />
        );
      })}
    </div>
  );
}
