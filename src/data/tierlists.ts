// 1

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
import librewolf from "./assets/librewolf_2022.svg";

// 2

import steam from "./assets/steam.svg";
import epic_games from "./assets/epic_games.svg";
import nintendo from "./assets/nintendo.jpg?format=avif&h=80&w=80&imagetools";
import sony from "./assets/sony.jpg?format=avif&h=80&w=80&imagetools";
import microsoft from "./assets/xbox.jpg?format=avif&h=80&w=80&imagetools";
import ea from "./assets/ea.svg";
import ubisoft from "./assets/ubisoft.jpg?format=avif&h=80&w=80&imagetools";
import blizzard from "./assets/blizzard.jpg?format=avif&h=80&w=80&imagetools";

// 3

import red_flag from "./assets/red_flag.svg";
import love_bombing from "./assets/love_bombing.png?format=avif&h=80&w=80&imagetools";
import league_of_legends from "./assets/league_of_legends.svg";
import domestical_violence from "./assets/domestical_violence.svg";
import ghosting from "./assets/ghosting.svg";
import animal_cruelty from "./assets/animal_cruelty.png?format=avif&quality=100&h=80&w=80&imagetools";
import asks_for_money from "./assets/asks_for_money.png?format=avif&quality=100&h=80&w=80&imagetools";
import isolating from "./assets/isolating.png?format=avif&quality=100&h=80&w=80&imagetools";
import valorant from "./assets/valorant.svg";
import insults from "./assets/insults.png?format=avif&quality=100&h=80&w=80&imagetools";

// 4

import umbrella from "./assets/re/umbrella.svg";
import leon from "./assets/re/leon_kenedy.jpg?format=avif&quality=100&h=80&w=80&imagetools";
import claire from "./assets/re/claire_redfield.jpg?format=avif&quality=100&h=80&w=80&imagetools";
import chris from "./assets/re/chris_redfield.jpg?format=avif&quality=100&h=80&w=80&imagetools";
import jill from "./assets/re/jill_valentine.jpg?format=avif&quality=100&h=80&w=80&imagetools";
import ada from "./assets/re/ada_wong.jpg?format=avif&quality=100&h=80&w=80&imagetools";
import ashley from "./assets/re/ashley_graham.jpg?format=avif&quality=100&h=80&w=80&imagetools";
import grace from "./assets/re/grace_ashcroft.jpg?format=avif&quality=100&h=80&w=80&imagetools";
import rebecca from "./assets/re/rebeca_chambers.jpg?format=avif&quality=100&h=80&w=80&imagetools";
import sheva from "./assets/re/sheva_alomar.jpg?format=avif&quality=100&h=80&w=80&imagetools";
import carlos from "./assets/re/carlos_olivera.jpg?format=avif&quality=100&h=80&w=80&imagetools";
import sherry from "./assets/re/sherry_birkin.jpg?format=avif&quality=100&h=80&w=80&imagetools";

// 5

import akarien from "./assets/vibe-coders/akarien.jpg?format=avif&h=80&w=80&imagetools";
import copilot from "./assets/vibe-coders/copilot.svg?format=avif&h=80&w=80&imagetools";
import haven from "./assets/vibe-coders/haven.png?format=avif&h=80&w=80&imagetools";
import kategaia from "./assets/vibe-coders/kategaia.png?format=avif&h=80&w=80&imagetools";
import linus from "./assets/vibe-coders/linus.png?format=avif&h=80&w=80&imagetools";
import puechamp from "./assets/vibe-coders/puechamp.png?format=avif&h=80&w=80&imagetools.png";
import reddji from "./assets/vibe-coders/reddji.png?format=avif&h=80&w=80&imagetools";
import zenkai from "./assets/vibe-coders/zenkai.png?format=avif&h=80&w=80&imagetools";
import afcm from "./assets/vibe-coders/afcm.png?format=avif&h=80&w=80&imagetools";
import parzy from "./assets/vibe-coders/parzy.png?format=avif&h=80&w=80&imagetools"
import bichon from "./assets/vibe-coders/bichon.png?format=avif&h=80&w=80&imagetools"

// 6

import s_rank from "./assets/s-rank.png?format=avif&h=104&w=104&imagetools";

//?format=avif&h=80&w=80&imagetools

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
    librewolf: librewolf,
  },
  2: {
    cover: steam,
    steam: steam,
    epic_games: epic_games,
    nintendo: nintendo,
    sony: sony,
    microsoft: microsoft,
    ea: ea,
    ubisoft: ubisoft,
    blizzard: blizzard,
  },
  3: {
    cover: red_flag,
    love_bombing: love_bombing,
    league_of_legends: league_of_legends,
    domestical_violence: domestical_violence,
    ghosting: ghosting,
    animal_cruelty: animal_cruelty,
    asks_for_money: asks_for_money,
    isolating: isolating,
    valorant: valorant,
    insults: insults,
    loves_chromium: chromium,
  },
  4: {
    cover: umbrella,
    "Leon S. Kennedy": leon,
    "Claire Redfield": claire,
    "Chris Redfield": chris,
    "Jill Valentine": jill,
    "Ada Wong": ada,
    "Ashley Graham": ashley,
    "Grace Ashcroft": grace,
    "Rebecca Chambers": rebecca,
    "Sheva Alomar": sheva,
    "Carlos Oliveira": carlos,
    "Sherry Birkin": sherry,
  },
  5: {
    cover: copilot,
    akarien: akarien,
    afcm: afcm,
    haven: haven,
    kategaia: kategaia,
    puechamp: puechamp,
    reddji: reddji,
    zenkai: zenkai,
    parzy: parzy,
    bichon: bichon,
    linus: linus,
  },
  6: {
    cover: s_rank,
    browsers: chrome,
    gaming_publishers: steam,
    red_flags: red_flag,
    resident_evil: leon,
    vibe_coding: copilot,
    tier_lists: s_rank,
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
