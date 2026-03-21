import { useEffect, useMemo, useRef, useState } from "react";
import { DragDropContext, type DraggableLocation } from "@hello-pangea/dnd";
import {
  useReadContract,
  useWriteContract,
  useConnection,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import type { Address } from "viem";
import { Link } from "react-router";
import { ChevronLeft, Eye, ListCheck, ListRestart, Share } from "lucide-react";

import { useWatchItemRemoved, useWatchItemsAdded } from "../hooks/contract";

import { abi } from "../../artifacts/contracts/TierList.sol/TierList.json";

import { type Ranking } from "./ItemRankings";
import { TierListTier } from "./TierListTier";
import { TierListScores } from "./TierListScores";

import { AddressLink } from "./AddressLink";

export interface TierItemDef {
  readonly id: number;
  readonly name: string;
}

export type TierListBuckets = Record<Ranking | "POOL", TierItemDef[]>;

export interface TierListProps {
  readonly tlId: number;
  readonly items: TierListBuckets;
  readonly editable?: boolean;
  readonly userAddress?: string | null;
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

function removeItemEverywhere(
  buckets: TierListBuckets,
  itemId: number,
): TierListBuckets {
  const next = cloneBuckets(buckets);

  next.S = next.S.filter((x) => x.id !== itemId);
  next.A = next.A.filter((x) => x.id !== itemId);
  next.B = next.B.filter((x) => x.id !== itemId);
  next.C = next.C.filter((x) => x.id !== itemId);
  next.D = next.D.filter((x) => x.id !== itemId);
  next.POOL = next.POOL.filter((x) => x.id !== itemId);

  return next;
}

function addItemsToPool(
  buckets: TierListBuckets,
  newItems: readonly TierItemDef[],
): TierListBuckets {
  const next = cloneBuckets(buckets);

  const seen = new Set<number>();
  for (const tierName of TIER_NAMES) {
    for (const it of next[tierName]) seen.add(it.id);
  }

  for (const it of newItems) {
    if (seen.has(it.id)) continue;
    next.POOL = [it, ...next.POOL]; // prepend newest items to POOL
    seen.add(it.id);
  }

  return next;
}

function moveAllItemsToPool(buckets: TierListBuckets): TierListBuckets {
  const next = cloneBuckets(buckets);

  const allRanked = [...next.S, ...next.A, ...next.B, ...next.C, ...next.D];
  next.S = [];
  next.A = [];
  next.B = [];
  next.C = [];
  next.D = [];

  // Put ranked items back at the front of the pool, preserving their relative order
  // (top-to-bottom tier order, then existing order within each tier)
  next.POOL = [...allRanked, ...next.POOL];

  return next;
}

export function TierList(props: TierListProps) {
  const { tlId, items, editable = true, userAddress } = props;

  const { address } = useConnection();
  const write = useWriteContract();
  const queryClient = useQueryClient();

  const resetModalRef = useRef<HTMLDialogElement | null>(null);

  // When viewing someone else's submission, use their address; otherwise use connected wallet
  const votesAddress =
    !editable && userAddress ? (userAddress as Address) : address;

  const userVotesQuery = useReadContract({
    address: tierListAddress,
    abi,
    functionName: "getUserVotes",
    args:
      tierListAddress && votesAddress
        ? [BigInt(tlId), votesAddress]
        : undefined,
    query: { enabled: Boolean(tierListAddress && votesAddress) },
  });

  const [originalItems, setOriginalItems] = useState<TierListBuckets>(() =>
    cloneBuckets(items),
  );
  const [updatedItems, setUpdatedItems] = useState<TierListBuckets>(() =>
    cloneBuckets(items),
  );

  const [globalVotesItemId, setGlobalVotesItemId] = useState<number | null>(
    null,
  );

  const [globalVotesItemName, setGlobalVotesItemName] = useState<string | null>(
    null,
  );

  function setGlobalVotesItem(id: number | null, name: string | null) {
    setGlobalVotesItemId(id);
    setGlobalVotesItemName(name);
  }

  // If the user has an existing ranking, use it as the initial state.
  // Also re-run when tlId/address changes.
  useEffect(() => {
    // When we don't have a target address to load votes for, fall back to passed-in buckets.
    if (!votesAddress) {
      const next = cloneBuckets(items);
      setOriginalItems(next);
      setUpdatedItems(next);
      return;
    }

    const votes = userVotesQuery.data as
      | readonly (readonly bigint[])[]
      | undefined;
    if (!votes) return;

    const next = bucketsFromUserVotes(items, votes);
    setOriginalItems(next);
    setUpdatedItems(next);
  }, [tlId, votesAddress, items, userVotesQuery.data]);
  
  const hasPendingChanges = useMemo(
    () => !areBucketsEqual(originalItems, updatedItems),
    [originalItems, updatedItems],
  );

  useWatchItemsAdded(true, ({ tierListId, itemIds, names }) => {
    if (Number(tierListId) !== tlId) return;

    // defensive: contract should keep lengths aligned, but don't assume
    const n = Math.min(itemIds.length, names.length);
    if (n === 0) return;

    const newItems: TierItemDef[] = [];
    for (let i = 0; i < n; i++) {
      newItems.push({ id: Number(itemIds[i]!), name: names[i]! });
    }

    // Add to both original + updated so "pending changes" doesn't flicker
    setOriginalItems((cur) => addItemsToPool(cur, newItems));
    setUpdatedItems((cur) => addItemsToPool(cur, newItems));
  });

  useWatchItemRemoved(true, ({ tierListId, itemId }) => {
    if (Number(tierListId) !== tlId) return;

    const id = Number(itemId);

    setOriginalItems((cur) => removeItemEverywhere(cur, id));
    setUpdatedItems((cur) => removeItemEverywhere(cur, id));
  });

  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: write.data, // The transaction hash from the mutation
  });

  // Log on mutation error
  useEffect(() => {
    if (write.error) {
      console.log(
        "Mutation error:",
        write.error.name,
        ":",
        write.error.message,
      );
    }
  }, [write.error]);

  // Log on transaction success (confirmation) and refresh contract data
  useEffect(() => {
    if (isConfirmed) {
      console.log("Transaction confirmed successfully!");
      // Invalidate getUserVotes to refetch the user's ranking and reset buckets
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "readContract" &&
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (query.queryKey[1] as any)?.functionName === "getUserVotes",
      });
      // Invalidate getItemVoteCounts queries to refresh global scores
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "readContract" &&
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (query.queryKey[1] as any)?.functionName === "getItemVoteCounts",
      });
    }
  }, [isConfirmed, queryClient]);

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

  function handleResetClick() {
    resetModalRef.current?.showModal();
  }

  function handleConfirmReset() {
    setUpdatedItems((cur) => moveAllItemsToPool(cur));
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

    write.mutate({
      address: tierListAddress,
      abi,
      functionName: "submitRanking",
      args: [BigInt(tlId), ranked],
    });
  }

  return (
    <div className="w-full select-none" draggable={false}>
      <dialog ref={resetModalRef} className="modal">
        <div className="modal-box">
          <h3 className="text-lg font-bold">Are you sure?</h3>
          <p className="py-4">This will move every item back into the pool.</p>
          <div className="modal-action">
            <form method="dialog" className="flex gap-2">
              <button type="submit" className="btn">
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-secondary"
                onClick={handleConfirmReset}
              >
                Reset
              </button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      <DragDropContext
        onDragEnd={(result) => {
          if (!result.destination || !editable) {
            return;
          }

          reorderTierList(result.source, result.destination);
        }}
      >
        <div className="flex w-full flex-row gap-0.5">
          <div className="bg-base-100 mb-0.5 grid w-3xl grid-cols-[5rem_1fr] gap-0.5 select-none">
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
              setGlobalVotesItem={setGlobalVotesItem}
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
              setGlobalVotesItem={setGlobalVotesItem}
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
              setGlobalVotesItem={setGlobalVotesItem}
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
              setGlobalVotesItem={setGlobalVotesItem}
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
              setGlobalVotesItem={setGlobalVotesItem}
            />
          </div>
          <TierListScores
            tlId={props.tlId}
            globalVotesItemId={globalVotesItemId}
            globalVotesItemName={globalVotesItemName}
          />
        </div>

        <TierListTier
          tlId={tlId}
          tierName="POOL"
          items={updatedItems.POOL}
          editable={editable}
          setGlobalVotesItem={setGlobalVotesItem}
        />

        <div className="my-4 flex w-full items-center justify-between gap-2">
          <div className="flex gap-2">
            {!props.editable ? (
              <>
                <Link to={`/list/${props.tlId}`} className="btn btn-secondary">
                  <ChevronLeft />
                  View List
                </Link>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    const url = window.location.href;

                    if ("share" in window.navigator) {
                      window.navigator.share({
                        url: url,
                      });
                    } else {
                      navigator.clipboard.writeText(url);
                      alert("Link copied to clipboard");
                    }
                  }}
                >
                  <Share />
                  Share
                </button>
              </>
            ) : address ? (
              <Link
                to={`/list/${props.tlId}/address/${address ?? ""}`}
                className="btn btn-secondary"
              >
                <Eye />
                View my submission
              </Link>
            ) : (
              <div className="btn btn-secondary btn-disabled">
                <Eye />
                View my submission
              </div>
            )}
          </div>
          <div className="flex flex-row gap-2">
            {props.editable ? (
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleResetClick}
                  disabled={!editable || write.isPending}
                >
                  <ListRestart />
                  Reset
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleUpdateUserData}
                  disabled={
                    !editable ||
                    !address ||
                    !hasPendingChanges ||
                    write.isPending
                  }
                >
                  <ListCheck />
                  {address ? "Save" : "Connect wallet to be able to save"}
                </button>
              </>
            ) : (
              <>
                <span className="font-mono text-sm">Rankings by</span>
                <span className="font-mono text-sm">·</span>
                <AddressLink address={votesAddress!} />
              </>
            )}
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}
