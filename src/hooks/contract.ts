import { useReadContract, useWatchContractEvent, useBlockNumber } from "wagmi";
import { useEffect, useRef } from "react";

import { abi } from "../../artifacts/contracts/TierList.sol/TierList.json";
import type { Address, Log } from "viem";

const tierListAddress = import.meta.env.VITE_CONTRACT_TIERLIST_ADDRESS!;

function getLogBlockNumber(l: Log): bigint | undefined {
  return (l as unknown as { blockNumber?: bigint }).blockNumber;
}

/**
 * Mirrors commit 2a8c7e0a... behavior:
 * - capture a "start block" once
 * - only enable the watcher after we have it
 * - ignore logs whose blockNumber <= startBlockExclusive
 */
function useTierListEventWatcher<TArgs>(params: {
  enabled: boolean;
  eventName: string;
  parseArgs: (l: Log) => TArgs | undefined;
  onEvent: (args: TArgs) => void;
}) {
  const { enabled, eventName, parseArgs, onEvent } = params;

  // same as commit: just grab a block number snapshot
  const { data: bn } = useBlockNumber({ watch: false });

  // stable "everything <= this is past"
  const startBlockRef = useRef<bigint | null>(null);

  // reset behavior when disabled, so re-enabling acts like "from now"
  useEffect(() => {
    if (!enabled) {
      startBlockRef.current = null;
      return;
    }

    if (startBlockRef.current !== null) return;
    if (bn === undefined) return;

    startBlockRef.current = bn;
  }, [enabled, bn]);

  const startBlockExclusive = startBlockRef.current ?? undefined;

  // critical: don't subscribe until we have a startBlockExclusive,
  // otherwise we can receive the last event before we can filter it.
  const watchEnabled = enabled && startBlockExclusive !== undefined;

  return useWatchContractEvent({
    address: tierListAddress,
    abi,
    eventName,
    enabled: watchEnabled,
    strict: true,
    onLogs: (logs: Log[]) => {
      for (const l of logs) {
        const blockNumber = getLogBlockNumber(l);

        if (
          startBlockExclusive !== undefined &&
          blockNumber !== undefined &&
          blockNumber <= startBlockExclusive
        ) {
          continue;
        }

        const args = parseArgs(l);
        if (!args) continue;

        onEvent(args);
      }
    },
  });
}

export type GetTierListReturn = readonly [string, string, boolean, bigint];

export function useGetTierList(id: bigint | undefined, enabled: boolean) {
  const tierListQuery = useReadContract({
    address: tierListAddress,
    abi,
    functionName: "getTierList",
    args: id !== undefined ? [id] : undefined,
    query: { enabled },
  });

  return {
    ...tierListQuery,
    data: tierListQuery.data as GetTierListReturn | undefined,
  };
}

export type GetTierListItemsReturn = readonly [
  readonly bigint[],
  readonly { readonly name: string; readonly active: boolean }[],
];

export function useGetTierListItems(id: bigint | undefined, enabled: boolean) {
  const itemsQuery = useReadContract({
    address: tierListAddress,
    abi,
    functionName: "getTierListItems",
    args: id !== undefined ? [id] : undefined,
    query: { enabled },
  });

  return {
    ...itemsQuery,
    data: itemsQuery.data as GetTierListItemsReturn | undefined,
  };
}

export function useGetLatestSubmissions(
  id: bigint | undefined,
  enabled: boolean,
  pageSize: bigint = 20n,
  offset: bigint = 0n,
) {
  const submissionsQuery = useReadContract({
    address: tierListAddress,
    abi,
    functionName: "getLatestSubmissions",
    args: id !== undefined ? [id, pageSize, offset] : undefined,
    query: { enabled },
  });

  return {
    ...submissionsQuery,
    data: submissionsQuery.data as Address[] | undefined,
  };
}

export function useGetItemVoteCounts(
  tlId: bigint | undefined,
  itemId: bigint | undefined,
  enabled: boolean,
) {
  const voteCountsQuery = useReadContract({
    address: tierListAddress,
    abi,
    functionName: "getItemVoteCounts",
    args:
      tlId !== undefined && itemId !== undefined ? [tlId, itemId] : undefined,
    query: { enabled: enabled && tlId !== undefined && itemId !== undefined },
  });

  return {
    ...voteCountsQuery,
    data: voteCountsQuery.data as readonly bigint[] | undefined,
  };
}

export function useGetSubmissionsNextIndex(id: bigint | undefined, enabled: boolean) {
  const q = useReadContract({
    address: tierListAddress,
    abi,
    functionName: "getSubmissionsNextIndex",
    args: id !== undefined ? [id] : undefined,
    query: { enabled },
  });

  return {
    ...q,
    data: q.data as bigint | undefined,
  };
}

export type RankingSubmittedLogArgs = {
  voter: Address;
  tierListId: bigint;
  submissionIndex: bigint;
};

type OnRankingSubmitted = (args: RankingSubmittedLogArgs) => void;

export function useWatchRankingSubmitted(
  enabled: boolean,
  onRankingSubmitted: OnRankingSubmitted,
) {
  return useTierListEventWatcher<RankingSubmittedLogArgs>({
    enabled,
    eventName: "RankingSubmitted",
    parseArgs: (l) => {
      const args = (l as unknown as { args: RankingSubmittedLogArgs }).args;
      if (!args?.voter) return;
      if (args.tierListId === undefined) return;
      if (args.submissionIndex === undefined) return;
      return args;
    },
    onEvent: (args) => onRankingSubmitted(args),
  });
}

export type ItemsAddedLogArgs = {
  tierListId: bigint;
  itemIds: readonly bigint[];
  names: readonly string[];
};

type OnItemsAdded = (args: ItemsAddedLogArgs) => void;

export function useWatchItemsAdded(enabled: boolean, onItemsAdded: OnItemsAdded) {
  return useTierListEventWatcher<ItemsAddedLogArgs>({
    enabled,
    eventName: "ItemsAdded",
    parseArgs: (l) => {
      const args = (l as unknown as { args: ItemsAddedLogArgs }).args;
      if (!args) return;
      if (args.tierListId === undefined) return;
      if (!args.itemIds || !args.names) return;
      return args;
    },
    onEvent: (args) => onItemsAdded(args),
  });
}

export type ItemRemovedLogArgs = {
  tierListId: bigint;
  itemId: bigint;
  name: string;
};

type OnItemRemoved = (args: ItemRemovedLogArgs) => void;

export function useWatchItemRemoved(enabled: boolean, onItemRemoved: OnItemRemoved) {
  return useTierListEventWatcher<ItemRemovedLogArgs>({
    enabled,
    eventName: "ItemRemoved",
    parseArgs: (l) => {
      const args = (l as unknown as { args: ItemRemovedLogArgs }).args;
      if (!args) return;
      if (args.tierListId === undefined) return;
      if (args.itemId === undefined) return;
      if (args.name === undefined) return;
      return args;
    },
    onEvent: (args) => onItemRemoved(args),
  });
}

export type TierListCreatedLogArgs = {
  tierListId: bigint;
  name: string;
  description: string;
  numActiveItems: bigint;
};

type OnTierListCreated = (args: TierListCreatedLogArgs) => void;

export function useWatchTierListCreated(
  enabled: boolean,
  onTierListCreated: OnTierListCreated,
) {
  return useTierListEventWatcher<TierListCreatedLogArgs>({
    enabled,
    eventName: "TierListCreated",
    parseArgs: (l) => {
      const args = (l as unknown as { args: TierListCreatedLogArgs }).args;
      if (!args) return;
      if (args.tierListId === undefined) return;
      if (args.name === undefined) return;
      return args;
    },
    onEvent: (args) => onTierListCreated(args),
  });
}

export type TierListStatusChangedLogArgs = {
  tierListId: bigint;
  active: boolean;
};

type OnTierListStatusChanged = (args: TierListStatusChangedLogArgs) => void;

export function useWatchTierListStatusChanged(
  enabled: boolean,
  onTierListStatusChanged: OnTierListStatusChanged,
) {
  return useTierListEventWatcher<TierListStatusChangedLogArgs>({
    enabled,
    eventName: "TierListStatusChanged",
    parseArgs: (l) => {
      const args = (l as unknown as { args: TierListStatusChangedLogArgs }).args;
      if (!args) return;
      if (args.tierListId === undefined) return;
      if (args.active === undefined) return;
      return args;
    },
    onEvent: (args) => onTierListStatusChanged(args),
  });
}