import chrome from "./assets/google_chrome_2022.svg";
import brave from "./assets/brave_2022.svg";
import edge from "./assets/microsoft_edge_2019.svg";

export type Ranking = "S" | "A" | "B" | "C" | "D";

export interface TierListAssetsItem {
  readonly cover: string;
  readonly [key: string]: string;
}

export interface TierListAssets {
  readonly [key: number]: TierListAssetsItem;
}

export const tierlistsAssets = {
  1: {
    cover: chrome,
    chrome: chrome,
    brave: brave,
    edge: edge,
  },
} as const satisfies TierListAssets;

export function hasTierListAssets(
  id: number,
): id is keyof typeof tierlistsAssets {
  return id in tierlistsAssets;
}

export function getTierListAssets(id: number): TierListAssetsItem | undefined {
  if (hasTierListAssets(id)) {
    return tierlistsAssets[id];
  }
  return undefined;
}

export function getTierListItemAsset(
  id: number,
  item: string,
): string | undefined {
  const assets = getTierListAssets(id);
  return assets?.[item];
}
