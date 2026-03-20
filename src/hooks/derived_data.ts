import { useMemo } from "react";

import type { ItemRankingData } from "../components/ItemRankings";
import type { TierListBuckets } from "../components/TierList";
import type { GetTierListItemsReturn, GetTierListReturn } from "./contract";

export interface DerivedData {
  readonly name: string;
  readonly description: string;
  readonly active: boolean;
  readonly numActiveItems: bigint;
  readonly buckets: TierListBuckets;
  readonly totals: ItemRankingData;
}

export function useDerivedData(
  tierListData: GetTierListReturn | undefined,
  itemsData: GetTierListItemsReturn | undefined,
): DerivedData {
  return useMemo<DerivedData>(() => {
    const emptyBuckets: TierListBuckets = {
      S: [],
      A: [],
      B: [],
      C: [],
      D: [],
      POOL: [],
    };

    const emptyTotals: ItemRankingData = { S: 0, A: 0, B: 0, C: 0, D: 0 };

    if (!tierListData || !itemsData) {
      return {
        name: "",
        description: "",
        active: false,
        numActiveItems: 0n,
        buckets: emptyBuckets,
        totals: emptyTotals,
      };
    }

    const [name, description, active, numActiveItems] = tierListData;
    const [itemIds, itemInfos] = itemsData;

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

    return { name, description, active, numActiveItems, buckets, totals };
  }, [tierListData, itemsData]);
}
