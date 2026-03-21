import { useEffect, useMemo, useState } from "react";
import { useReadContract } from "wagmi";

import { abi } from "../../artifacts/contracts/TierList.sol/TierList.json";
import { TierListItem } from "./TierListItem";
import { getTierListAssets } from "../data/tierlists";
import { AlertTriangle } from "lucide-react";
import {
  useWatchTierListCreated,
  useWatchTierListStatusChanged,
} from "../hooks/contract";

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

  const lists = useMemo(() => (data ?? []) as TierListView[], [data]);

  const [uiLists, setUiLists] = useState<TierListView[]>([]);

  // Seed/refresh from chain reads.
  // Keep newest-first in UI (reverse IDs).
  useEffect(() => {
    const set = async () => {
      setUiLists([...lists].reverse());
    };
    set();
  }, [data, lists]);

  useWatchTierListCreated(
    enabled,
    ({ tierListId, name, description, numActiveItems }) => {
      setUiLists((cur) => {
        const next: TierListView = {
          id: tierListId,
          name,
          description,
          active: true, // createTierList sets active=true
          numActiveItems,
        };

        // prepend newest
        return [next, ...cur];
      });
    },
  );

  useWatchTierListStatusChanged(enabled, ({ tierListId, active }) => {
    setUiLists((cur) => {
      const idx = cur.findIndex((x) => x.id === tierListId);
      if (idx === -1) return cur;

      // if includeInactive=false and it becomes inactive, remove it from the UI list
      if (!includeInactive && !active) {
        return cur.filter((x) => x.id !== tierListId);
      }

      const next = [...cur];
      next[idx] = { ...next[idx]!, active };
      return next;
    });
  });

  if (!tierListAddress) {
    return (
      <div className="text-sm text-zinc-600">
        Missing VITE_CONTRACT_TIERLIST_ADDRESS
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-sm">Loading tier lists...</div>;
  }

  if (isError) {
    return (
      <div role="alert" className="alert alert-error">
        <AlertTriangle className="h-4 w-4" />
        <span>{error?.message ?? "Error"}</span>
      </div>
    );
  }

  if (uiLists.length === 0) {
    return <div className="text-sm text-zinc-600">No tier lists yet.</div>;
  }

  return (
    <div className="flex w-full flex-row flex-wrap gap-4">
      {uiLists.map((tl) => {
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
