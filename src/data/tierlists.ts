import chrome from "./assets/google_chrome_2022.svg";
import chromium from "./assets/chromium_2022.svg";
import brave from "./assets/brave_2022.svg";
import edge from "./assets/microsoft_edge_2019.svg";
import firefox from "./assets/firefox_2019.svg";
import opera from "./assets/opera_2015.svg";
import opera_gx from "./assets/opera_gx_2019.svg";
import vivaldi from "./assets/vivaldi_2015.svg";
import safari from "./assets/safari_2018.svg";
import arc from "./assets/arc_2024.svg";
import internet_explorer from "./assets/internet_explorer_2011.svg";

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
    firefox: firefox,
    opera: opera,
    opera_gx: opera_gx,
    vivaldi: vivaldi,
    safari: safari,
    arc: arc,
    internet_explorer: internet_explorer,
    chromium: chromium,
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
