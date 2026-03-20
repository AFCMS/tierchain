import { useEffect, useMemo, useState } from "react";
import { DragDropContext, type DraggableLocation } from "@hello-pangea/dnd";
import { useReadContract, useWriteContract, useConnection } from "wagmi";
import type { Address } from "viem";

import { abi } from "../../artifacts/contracts/TierList.sol/TierList.json";

import type { Ranking } from "./ItemRankings";
import { TierListTier } from "./TierListTier";

export interface TierItemDef {
  readonly id: number;
  readonly name: string;
}

export type TierListBuckets = Record<Ranking | "POOL", TierItemDef[]>;

export interface TierListProps {
  readonly tlId: number;
  readonly items: TierListBuckets;
  readonly editable?: boolean;
}

const TIER_NAMES: Array<Ranking | "POOL"> = ["S", "A", "B", "C", "D", "POOL"];

function cloneBuckets(items: TierListBuckets): TierListBuckets {
  return {
    S: [...items.S],
    A: [...items.A],
    B: [...items.B],
    C: [...items.C],
    D: [...items.D],
    POOL: [...items.POOL],
  };
}

function areBucketsEqual(
  left: TierListBuckets,
  right: TierListBuckets,
): boolean {
  return TIER_NAMES.every((tierName) => {
    const leftTier = left[tierName];
    const rightTier = right[tierName];

    if (leftTier.length !== rightTier.length) {
      return false;
    }

    return leftTier.every(
      (item, index) =>
        item.id === rightTier[index]?.id &&
        item.name === rightTier[index]?.name,
    );
  });
}

function isTierName(value: string): value is Ranking | "POOL" {
  return TIER_NAMES.includes(value as Ranking | "POOL");
}

const tierListAddress = import.meta.env.VITE_CONTRACT_TIERLIST_ADDRESS as
  | Address
  | undefined;

function emptyBuckets(): TierListBuckets {
  return { S: [], A: [], B: [], C: [], D: [], POOL: [] };
}

function bucketsFromUserVotes(
  allItems: TierListBuckets,
  userVotes: readonly (readonly bigint[])[],
): TierListBuckets {
  const out = emptyBuckets();

  const byId = new Map<number, TierItemDef>();
  for (const tierName of TIER_NAMES) {
    for (const item of allItems[tierName]) {
      byId.set(item.id, item);
    }
  }

  const seen = new Set<number>();

  const tiers: Ranking[] = ["S", "A", "B", "C", "D"];
  for (let t = 0; t < tiers.length; t++) {
    const tierName = tiers[t];
    const ids = userVotes[t] ?? [];

    for (const idBig of ids) {
      const id = Number(idBig);
      const item = byId.get(id);
      if (!item) continue; // item removed / not in current dataset
      if (seen.has(id)) continue; // contract allows dups; UI will ignore repeats
      seen.add(id);
      out[tierName].push(item);
    }
  }

  // Remaining items go into POOL, preserve incoming POOL order as fallback
  for (const tierName of TIER_NAMES) {
    for (const item of allItems[tierName]) {
      if (!seen.has(item.id)) out.POOL.push(item);
    }
  }

  return out;
}

export function TierList(props: TierListProps) {
  const { tlId, items, editable = true } = props;

  const { address } = useConnection();
  const write = useWriteContract();

  const userVotesQuery = useReadContract({
    address: tierListAddress,
    abi,
    functionName: "getUserVotes",
    args:
      tierListAddress && address
        ? [BigInt(tlId), address]
        : undefined,
    query: { enabled: Boolean(tierListAddress && address) },
  });

  const [originalItems, setOriginalItems] = useState<TierListBuckets>(() =>
    cloneBuckets(items),
  );
  const [updatedItems, setUpdatedItems] = useState<TierListBuckets>(() =>
    cloneBuckets(items),
  );

  // If the user has an existing ranking, use it as the initial state.
  // Also re-run when tlId/address changes.
  useEffect(() => {
    // When not connected, fall back to the passed-in buckets.
    if (!address) {
      const next = cloneBuckets(items);
      setOriginalItems(next);
      setUpdatedItems(next);
      return;
    }

    const votes = userVotesQuery.data as readonly (readonly bigint[])[] | undefined;
    if (!votes) return;

    const next = bucketsFromUserVotes(items, votes);
    setOriginalItems(next);
    setUpdatedItems(next);
  }, [tlId, address, items, userVotesQuery.data]);

  const hasPendingChanges = useMemo(
    () => !areBucketsEqual(originalItems, updatedItems),
    [originalItems, updatedItems],
  );

  function reorderTierList(
    source: DraggableLocation<string>,
    destination: DraggableLocation<string>,
  ) {
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceTierName = source.droppableId;
    const destinationTierName = destination.droppableId;

    if (!isTierName(sourceTierName) || !isTierName(destinationTierName)) {
      return;
    }

    setUpdatedItems((currentItems) => {
      const nextItems = cloneBuckets(currentItems);
      const sourceTier = [...nextItems[sourceTierName]];
      const [movedItem] = sourceTier.splice(source.index, 1);

      if (!movedItem) {
        return currentItems;
      }

      if (sourceTierName === destinationTierName) {
        sourceTier.splice(destination.index, 0, movedItem);
        nextItems[sourceTierName] = sourceTier;
        return nextItems;
      }

      const destinationTier = [...nextItems[destinationTierName]];
      destinationTier.splice(destination.index, 0, movedItem);
      nextItems[sourceTierName] = sourceTier;
      nextItems[destinationTierName] = destinationTier;

      return nextItems;
    });
  }

  function handleUpdateUserData() {
    if (!tierListAddress) {
      console.error("Missing VITE_CONTRACT_TIERLIST_ADDRESS");
      return;
    }
    if (!address) {
      console.error("Wallet not connected");
      return;
    }

    const ranked: bigint[][] = [
      updatedItems.S.map((x) => BigInt(x.id)),
      updatedItems.A.map((x) => BigInt(x.id)),
      updatedItems.B.map((x) => BigInt(x.id)),
      updatedItems.C.map((x) => BigInt(x.id)),
      updatedItems.D.map((x) => BigInt(x.id)),
    ];

    const hasAny = ranked.some((arr) => arr.length > 0);
    if (!hasAny) {
      console.error("Empty ranking (contract will revert)");
      return;
    }

    write.writeContract({
      address: tierListAddress,
      abi,
      functionName: "submitRanking",
      args: [BigInt(tlId), ranked],
    });
  }

  return (
    <div className="w-full select-none" draggable={false}>
      <DragDropContext
        onDragEnd={(result) => {
          if (!result.destination || !editable) {
            return;
          }

          reorderTierList(result.source, result.destination);
        }}
      >
        <div className="bg-base-100 mb-0.5 grid max-w-3xl grid-cols-[5rem_1fr] gap-0.5 select-none">
          <div
            className="flex size-20 items-center justify-center text-black"
            data-rank-bg="S"
          >
            S
          </div>
          <TierListTier
            tlId={tlId}
            tierName="S"
            items={updatedItems.S}
            editable={editable}
          />

          <div
            className="flex size-20 items-center justify-center text-black"
            data-rank-bg="A"
          >
            A
          </div>
          <TierListTier
            tlId={tlId}
            tierName="A"
            items={updatedItems.A}
            editable={editable}
          />

          <div
            className="flex size-20 items-center justify-center text-black"
            data-rank-bg="B"
          >
            B
          </div>
          <TierListTier
            tlId={tlId}
            tierName="B"
            items={updatedItems.B}
            editable={editable}
          />

          <div
            className="flex size-20 items-center justify-center text-black"
            data-rank-bg="C"
          >
            C
          </div>
          <TierListTier
            tlId={tlId}
            tierName="C"
            items={updatedItems.C}
            editable={editable}
          />

          <div
            className="flex size-20 items-center justify-center text-black"
            data-rank-bg="D"
          >
            D
          </div>
          <TierListTier
            tlId={tlId}
            tierName="D"
            items={updatedItems.D}
            editable={editable}
          />
        </div>

        <TierListTier
          tlId={tlId}
          tierName="POOL"
          items={updatedItems.POOL}
          editable={editable}
        />

        {hasPendingChanges ? (
          <div className="my-4 flex w-full justify-end">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleUpdateUserData}
            >
              Update user data
            </button>
          </div>
        ) : undefined}
      </DragDropContext>
    </div>
  );
}