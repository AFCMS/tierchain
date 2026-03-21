import { useReadContract, useWatchContractEvent } from "wagmi";

import { abi } from "../../artifacts/contracts/TierList.sol/TierList.json";
import type { Address, Log } from "viem";

const tierListAddress = import.meta.env.VITE_CONTRACT_TIERLIST_ADDRESS!;

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

export function useGetSubmissionsNextIndex(
  id: bigint | undefined,
  enabled: boolean,
) {
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
  return useWatchContractEvent({
    address: tierListAddress,
    abi: abi,
    eventName: "RankingSubmitted",
    enabled,
    strict: true,
    onLogs: (logs: Log[]) => {
      for (const l of logs) {
        // wagmi/viem types here can be annoying; keep it tight but not magical
        const args = (l as unknown as {args: RankingSubmittedLogArgs}).args;
        if (!args) continue;
        if (!args.voter) continue;
        if (args.tierListId === undefined) continue;
        if (args.submissionIndex === undefined) continue;
        onRankingSubmitted(args);
      }
    },
  });
}

export type ItemsAddedLogArgs = {
  tierListId: bigint;
  itemIds: readonly bigint[];
  names: readonly string[];
};

type OnItemsAdded = (args: ItemsAddedLogArgs) => void;

export function useWatchItemsAdded(enabled: boolean, onItemsAdded: OnItemsAdded) {
  return useWatchContractEvent({
    address: tierListAddress,
    abi: abi,
    eventName: "ItemsAdded",
    enabled,
    strict: true,
    onLogs: (logs: Log[]) => {
      for (const l of logs) {
        const args = (l as unknown as {args : ItemsAddedLogArgs}).args;
        if (!args) continue;
        if (args.tierListId === undefined) continue;
        if (!args.itemIds || !args.names) continue;
        onItemsAdded(args);
      }
    },
  });
}

export type ItemRemovedLogArgs = {
  tierListId: bigint;
  itemId: bigint;
  name: string;
};

type OnItemRemoved = (args: ItemRemovedLogArgs) => void;

export function useWatchItemRemoved(
  enabled: boolean,
  onItemRemoved: OnItemRemoved,
) {
  return useWatchContractEvent({
    address: tierListAddress,
    abi: abi,
    eventName: "ItemRemoved",
    enabled,
    strict: true,
    onLogs: (logs: Log[]) => {
      for (const l of logs) {
        const args = (l as unknown as {args: ItemRemovedLogArgs}).args;
        if (!args) continue;
        if (args.tierListId === undefined) continue;
        if (args.itemId === undefined) continue;
        if (args.name === undefined) continue;
        onItemRemoved(args);
      }
    },
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
  return useWatchContractEvent({
    address: tierListAddress,
    abi: abi,
    eventName: "TierListCreated",
    enabled,
    strict: true,
    onLogs: (logs: Log[]) => {
      for (const l of logs) {
        const args = (l as unknown as {args: TierListCreatedLogArgs}).args;
        if (!args) continue;
        if (args.tierListId === undefined) continue;
        if (args.name === undefined) continue;
        onTierListCreated(args);
      }
    },
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
  return useWatchContractEvent({
    address: tierListAddress,
    abi: abi,
    eventName: "TierListStatusChanged",
    enabled,
    strict: true,
    onLogs: (logs: Log[]) => {
      for (const l of logs) {
        const args = (l as unknown as {args: TierListStatusChangedLogArgs}).args;
        if (!args) continue;
        if (args.tierListId === undefined) continue;
        if (args.active === undefined) continue;
        onTierListStatusChanged(args);
      }
    },
  });
}