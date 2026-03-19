import chrome from "./assets/google_chrome_2022.svg";
import brave from "./assets/brave_2022.svg";
import edge from "./assets/microsoft_edge_2019.svg";

export type Ranking = "S" | "A" | "B" | "C" | "D";

export interface TierList {
  readonly [key: number]: {
    readonly [key: string]: string;
  };
}

export const tierlistsAssets = {
  1: {
    chrome: chrome,
    brave: brave,
    edge: edge,
  },
} as const satisfies TierList;
