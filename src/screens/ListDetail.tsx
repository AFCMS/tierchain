import { useMemo } from "react";
import { useParams } from "react-router";
import { useReadContract } from "wagmi";
import type { Address } from "viem";
import { AlertTriangle } from "lucide-react";

import { TierList, type TierListBuckets } from "../components/TierList";
import { type ItemRankingData, type Ranking } from "../components/ItemRankings";

import { abi } from "../../artifacts/contracts/TierList.sol/TierList.json";

const tierListAddress = import.meta.env.VITE_CONTRACT_TIERLIST_ADDRESS as
  | Address
  | undefined;

const RANKS: Ranking[] = ["S", "A", "B", "C", "D"];

function tierIndexToRank(tier: number): Ranking {
  return RANKS[tier] ?? "D";
}

type GetTierListReturn = readonly [string, boolean, bigint];
type GetTierListItemsReturn = readonly [
  readonly bigint[],
  readonly { name: string; active: boolean }[],
];
type GetGlobalVotesReturn = readonly [readonly bigint[], readonly bigint[][]];

export function ListDetail() {
  const { id } = useParams<{ id: string }>();

  const idNum = id ? Number(id) : NaN;
  const _id = Number.isInteger(idNum) && idNum >= 0 ? BigInt(idNum) : undefined;

  const enabled = Boolean(tierListAddress) && _id !== undefined;

  const tierListQuery = useReadContract({
    address: tierListAddress,
    abi,
    functionName: "getTierList",
    args: _id !== undefined ? [_id] : undefined,
    query: { enabled },
  });

  const itemsQuery = useReadContract({
    address: tierListAddress,
    abi,
    functionName: "getTierListItems",
    args: _id !== undefined ? [_id] : undefined,
    query: { enabled },
  });

  const votesQuery = useReadContract({
    address: tierListAddress,
    abi,
    functionName: "getGlobalVotes",
    args: _id !== undefined ? [_id] : undefined,
    query: { enabled },
  });

  // Single-point typing: cast the .data values once.
  const tierListData = tierListQuery.data as GetTierListReturn | undefined;
  const itemsData = itemsQuery.data as GetTierListItemsReturn | undefined;
  const votesData = votesQuery.data as GetGlobalVotesReturn | undefined;

  const derived = useMemo(() => {
    const emptyBuckets: TierListBuckets = {
      S: [],
      A: [],
      B: [],
      C: [],
      D: [],
      POOL: [],
    };

    const emptyTotals: ItemRankingData = { S: 0, A: 0, B: 0, C: 0, D: 0 };

    if (!tierListData || !itemsData || !votesData) {
      return {
        name: "",
        active: false,
        numActiveItems: 0n,
        buckets: emptyBuckets,
        totals: emptyTotals,
      };
    }

    const [name, active, numActiveItems] = tierListData;
    const [itemIds, itemInfos] = itemsData;
    const [voteItemIds, counts] = votesData;

    const buckets: TierListBuckets = {
      S: [],
      A: [],
      B: [],
      C: [],
      D: [],
      POOL: [],
    };

    const totals: ItemRankingData = { S: 0, A: 0, B: 0, C: 0, D: 0 };

    const itemById = new Map<string, { id: number; name: string }>();

    for (let i = 0; i < itemIds.length; i++) {
      const info = itemInfos[i];
      if (!info?.active) continue;

      const itemIdBig = itemIds[i];
      const key = itemIdBig.toString();

      const item = { id: Number(itemIdBig), name: info.name };
      itemById.set(key, item);
      buckets.POOL.push(item);
    }

    for (let i = 0; i < voteItemIds.length; i++) {
      const key = voteItemIds[i].toString();
      const item = itemById.get(key);
      if (!item) continue;

      const perTier = counts[i] ?? [];

      for (let t = 0; t < 5; t++) {
        totals[tierIndexToRank(t)] += Number(perTier[t] ?? 0n);
      }

      let bestTier = 0;
      let bestVotes = -1;
      for (let t = 0; t < 5; t++) {
        const v = Number(perTier[t] ?? 0n);
        if (v > bestVotes) {
          bestVotes = v;
          bestTier = t;
        }
      }

      if (bestVotes > 0) {
        const rank = tierIndexToRank(bestTier);
        buckets.POOL = buckets.POOL.filter((x) => x.id !== item.id);
        buckets[rank].push(item);
      }
    }

    return { name, active, numActiveItems, buckets, totals };
  }, [tierListData, itemsData, votesData]);

  // early returns AFTER hooks
  if (!tierListAddress) {
    return (
      <div role="alert" className="alert alert-error">
        <AlertTriangle className="h-4 w-4" />
        <span>Missing VITE_CONTRACT_TIERLIST_ADDRESS</span>
      </div>
    );
  }

  if (_id === undefined) {
    return (
      <div role="alert" className="alert alert-error">
        <AlertTriangle className="h-4 w-4" />
        <span>Invalid list id: {id ?? "(missing)"}</span>
      </div>
    );
  }

  if (tierListQuery.isLoading || itemsQuery.isLoading || votesQuery.isLoading) {
    return <div className="text-sm text-zinc-600">Loading your tier list…</div>;
  }

  if (tierListQuery.isError) {
    return (
      <div role="alert" className="alert alert-error">
        <AlertTriangle className="h-4 w-4" />
        <span>{tierListQuery.error?.message ?? "Error"}</span>
      </div>
    );
  }

  if (itemsQuery.isError) {
    return (
      <div role="alert" className="alert alert-error">
        <AlertTriangle className="h-4 w-4" />
        <span>{itemsQuery.error?.message ?? "Error"}</span>
      </div>
    );
  }

  if (votesQuery.isError) {
    return (
      <div role="alert" className="alert alert-error">
        <AlertTriangle className="h-4 w-4" />
        <span>{votesQuery.error?.message ?? "Error"}</span>
      </div>
    );
  }

  return (
    <div className="mt-4 flex w-full justify-center">
      <div className="w-full max-w-6xl">
        <div className="mb-8 flex w-full flex-col gap-2">
          <h1 className="flex w-full justify-between text-2xl font-bold">
            {derived.name}
            <div
              className={
                "badge badge-soft" +
                (derived.active ? " badge-success" : " badge-error")
              }
            >
              {derived.active ? "Active" : "Inactive"}
            </div>
          </h1>
          <p className="text-base-content flex justify-between gap-8">
            {"Which browser is the best?"}
            <span>{derived.numActiveItems.toString()} items</span>
          </p>
        </div>

        <TierList
          tlId={Number(_id)}
          items={derived.buckets}
          editable={true}
          globalVotesItemId={1}
          globalVotesItem={derived.totals}
        />
      </div>
    </div>
  );
}
