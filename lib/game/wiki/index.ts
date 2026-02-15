/**
 * Wiki data layer — single entry point for all game lore and catalog data.
 * Re-exports and composes from existing modules; no data duplication.
 */

import {
  WORLD,
  ARENA_LORE,
  HUB_BUILDING_LORE,
  CLASS_LORE,
  NPC_QUOTES,
  SEASON_TEMPLATES,
  ORIGIN_LORE,
} from "@/lib/game/lore";
import type { CharacterOrigin } from "@/lib/game/types";
import { ABILITIES } from "@/lib/game/abilities";
import type { CharacterClass } from "@/lib/game/types";
import { ORIGIN_DEFS, type OriginDef } from "@/lib/game/origins";
import { DUNGEONS, getDungeonById } from "@/lib/game/dungeon-data";
import {
  BOSS_CATALOG,
  getBossCatalogEntry,
  getBossImagePath,
} from "@/lib/game/boss-catalog";
import { getBossAbilityById } from "@/lib/game/boss-abilities";
import type { AbilityDef } from "@/lib/game/abilities";
import {
  ITEM_CATALOG,
  getCatalogItemById,
  getItemImagePath,
} from "@/lib/game/item-catalog";
import type { CatalogItem, ItemSlot } from "@/lib/game/item-catalog";
import { CONSUMABLE_CATALOG } from "@/lib/game/consumable-catalog";
import { STAMINA_POTIONS } from "@/lib/game/potion-catalog";
import { TAVERN_ACTIVITIES_AVAILABLE } from "@/lib/game/tavern-activities";
import { DUMMY_CLASS_WEIGHTS, TRAINING_DUMMY_PRESET_IDS } from "@/lib/game/training-dummies";

/* ─── Hub location routes (from docs/stray-city-hub.md) ─── */

const HUB_ROUTES: Record<string, string> = {
  arena: "/arena",
  dungeon: "/dungeon",
  shop: "/shop",
  tavern: "/minigames",
  training: "/combat",
  leaderboard: "/leaderboard",
  blacksmith: "/inventory",
  warehouse: "/inventory",
};

/* ─── World ─── */

export const getWikiWorld = () => ({
  world: WORLD,
  arena: ARENA_LORE,
  seasons: SEASON_TEMPLATES,
});

/* ─── Classes ─── */

export type WikiClass = {
  id: CharacterClass;
  name: string;
  tagline: string;
  abilities: AbilityDef[];
};

const CLASS_IDS: CharacterClass[] = ["warrior", "rogue", "mage", "tank"];
const CLASS_NAMES: Record<CharacterClass, string> = {
  warrior: "Warrior",
  rogue: "Rogue",
  mage: "Mage",
  tank: "Tank",
};

export const getWikiClasses = (): WikiClass[] =>
  CLASS_IDS.map((id) => ({
    id,
    name: CLASS_NAMES[id],
    tagline: CLASS_LORE[id]?.tagline ?? "",
    abilities: ABILITIES[id] ?? [],
  }));

export const getWikiClass = (id: string): WikiClass | undefined => {
  if (!CLASS_IDS.includes(id as CharacterClass)) return undefined;
  const cls = id as CharacterClass;
  return {
    id: cls,
    name: CLASS_NAMES[cls],
    tagline: CLASS_LORE[cls]?.tagline ?? "",
    abilities: ABILITIES[cls] ?? [],
  };
};

/* ─── Origins ─── */

export type WikiOrigin = OriginDef & {
  tagline: string;
  loreDescription: string;
  prologueText: string;
};

export const getWikiOrigins = (): WikiOrigin[] =>
  (Object.keys(ORIGIN_DEFS) as CharacterOrigin[]).map((id) => {
    const def = ORIGIN_DEFS[id];
    const lore = ORIGIN_LORE[id];
    return {
      ...def,
      tagline: lore?.tagline ?? "",
      loreDescription: lore?.loreDescription ?? "",
      prologueText: lore?.prologueSlide?.text ?? "",
    };
  });

export const getWikiOrigin = (id: string): WikiOrigin | undefined => {
  const origin = id as CharacterOrigin;
  if (!ORIGIN_DEFS[origin]) return undefined;
  const def = ORIGIN_DEFS[origin];
  const lore = ORIGIN_LORE[origin];
  return {
    ...def,
    tagline: lore?.tagline ?? "",
    loreDescription: lore?.loreDescription ?? "",
    prologueText: lore?.prologueSlide?.text ?? "",
  };
};

/* ─── Locations (hub buildings) ─── */

export type WikiLocation = {
  id: string;
  name: string;
  description: string;
  href: string;
  imagePath: string;
};

export const getWikiLocations = (): WikiLocation[] =>
  Object.entries(HUB_BUILDING_LORE).map(([id, lore]) => ({
    id,
    name: lore.name,
    description: lore.description,
    href: HUB_ROUTES[id] ?? "#",
    imagePath: lore.imagePath,
  }));

export const getWikiLocation = (id: string): WikiLocation | undefined => {
  const lore = HUB_BUILDING_LORE[id as keyof typeof HUB_BUILDING_LORE];
  if (!lore) return undefined;
  return {
    id,
    name: lore.name,
    description: lore.description,
    href: HUB_ROUTES[id] ?? "#",
    imagePath: lore.imagePath,
  };
};

/* ─── Dungeons ─── */

export const getWikiDungeons = () => DUNGEONS;

export const getWikiDungeon = (id: string) => getDungeonById(id);

/* ─── Bosses ─── */

export type WikiBossDetail = {
  dungeonId: string;
  bossIndex: number;
  slug: string;
  name: string;
  description: string;
  imagePath: string;
  level: number;
  dungeonName: string;
  abilities: AbilityDef[];
};

export const getWikiBosses = () => BOSS_CATALOG;

export const getBossSlug = (dungeonId: string, bossIndex: number): string =>
  `${dungeonId}-${bossIndex}`;

export const parseBossSlug = (
  slug: string
): { dungeonId: string; bossIndex: number } | null => {
  const lastDash = slug.lastIndexOf("-");
  if (lastDash <= 0) return null;
  const dungeonId = slug.slice(0, lastDash);
  const bossIndex = parseInt(slug.slice(lastDash + 1), 10);
  if (Number.isNaN(bossIndex) || bossIndex < 0 || bossIndex > 9) return null;
  return { dungeonId, bossIndex };
};

export const getWikiBossBySlug = (slug: string): WikiBossDetail | undefined => {
  const parsed = parseBossSlug(slug);
  if (!parsed) return undefined;
  const { dungeonId, bossIndex } = parsed;
  const entry = getBossCatalogEntry(dungeonId, bossIndex);
  const dungeon = getDungeonById(dungeonId);
  if (!entry || !dungeon) return undefined;
  const bossDef = dungeon.bosses[bossIndex];
  const abilities = entry.abilityIds
    .map((id) => getBossAbilityById(id))
    .filter((a): a is AbilityDef => a != null);
  return {
    dungeonId,
    bossIndex,
    slug: getBossSlug(dungeonId, bossIndex),
    name: entry.name,
    description: entry.description,
    imagePath: getBossImagePath(entry.name),
    level: bossDef?.level ?? 1,
    dungeonName: dungeon.name,
    abilities,
  };
};

/* ─── Items ─── */

export type WikiItemFilters = {
  slot?: ItemSlot;
  rarity?: CatalogItem["rarity"];
  classRestriction?: CharacterClass;
};

export const getWikiItems = (filters?: WikiItemFilters): CatalogItem[] => {
  if (!filters) return ITEM_CATALOG;
  return ITEM_CATALOG.filter((i) => {
    if (filters.slot && i.slot !== filters.slot) return false;
    if (filters.rarity && i.rarity !== filters.rarity) return false;
    if (
      filters.classRestriction &&
      i.classRestriction &&
      i.classRestriction !== filters.classRestriction
    )
      return false;
    return true;
  });
};

export const getWikiItem = (catalogId: string): CatalogItem | undefined =>
  getCatalogItemById(catalogId);

export { getItemImagePath };

/* ─── Consumables ─── */

export const getWikiConsumables = () => ({
  inventory: CONSUMABLE_CATALOG,
  shop: STAMINA_POTIONS,
});

/* ─── Minigames ─── */

export const getWikiMinigames = () => TAVERN_ACTIVITIES_AVAILABLE;

/* ─── Training dummies ─── */

export const getWikiTraining = () =>
  TRAINING_DUMMY_PRESET_IDS.map((id) => DUMMY_CLASS_WEIGHTS[id]).filter(Boolean);

/* ─── NPCs ─── */

export const getWikiNpcs = () => NPC_QUOTES;

/* ─── Seasons ─── */

export const getWikiSeasons = () => SEASON_TEMPLATES;
