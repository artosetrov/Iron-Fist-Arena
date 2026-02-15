/**
 * Central registry of all game assets that can be overridden via Wiki Asset Manager.
 * Keys match storage paths (no leading /images/, no .png) for asset_overrides table.
 */

import { BOSS_CATALOG, getBossImagePath } from "@/lib/game/boss-catalog";
import {
  ITEM_CATALOG,
  getItemImagePath,
  type CatalogItem,
} from "@/lib/game/item-catalog";
import {
  CONSUMABLE_CATALOG,
  getConsumableImagePath,
} from "@/lib/game/consumable-catalog";
import { DUNGEONS } from "@/lib/game/dungeon-data";
import { TAVERN_ACTIVITIES } from "@/lib/game/tavern-activities";
import { ALL_ORIGINS } from "@/lib/game/origins";
import { NPC_QUOTES } from "@/lib/game/lore";
import type { CharacterClass } from "@/lib/game/types";

export type AssetEntry = {
  key: string;
  label: string;
  category: string;
  defaultPath: string;
};

/** Path to asset key: /images/foo/bar.png -> foo/bar */
export const pathToAssetKey = (path: string): string =>
  path.replace(/^\/images\//, "").replace(/\.png$/i, "");

/** Asset key to default path: foo/bar -> /images/foo/bar.png */
export const assetKeyToDefaultPath = (key: string): string =>
  `/images/${key}.png`;

export const ASSET_CATEGORIES = [
  "bosses",
  "items",
  "consumables",
  "classes",
  "origins",
  "dungeons",
  "buildings",
  "npcs",
  "minigames",
  "skills",
  "ui",
] as const;

export type AssetCategory = (typeof ASSET_CATEGORIES)[number];

const CLASS_IDS: CharacterClass[] = ["warrior", "rogue", "mage", "tank"];
const HUB_BUILDING_IDS = [
  "arena",
  "dungeon",
  "shop",
  "tavern",
  "training",
  "leaderboard",
  "blacksmith",
  "warehouse",
];

/** Build full registry from game catalogs. */
export function getAssetRegistry(): AssetEntry[] {
  const entries: AssetEntry[] = [];
  const seenKeys = new Set<string>();

  const add = (key: string, label: string, category: string, defaultPath: string) => {
    if (seenKeys.has(key)) return;
    seenKeys.add(key);
    entries.push({ key, label, category, defaultPath });
  };

  // Bosses
  for (const boss of BOSS_CATALOG) {
    const defaultPath = getBossImagePath(boss.name);
    const key = pathToAssetKey(defaultPath);
    add(key, boss.name, "bosses", defaultPath);
  }

  // Items — unique image paths (many items share same sprite)
  const itemPaths = new Map<string, { label: string }>();
  for (const item of ITEM_CATALOG) {
    const defaultPath = getItemImagePath(item);
    const key = pathToAssetKey(defaultPath);
    if (!itemPaths.has(key))
      itemPaths.set(key, { label: `${item.name} (${item.rarity})` });
  }
  itemPaths.forEach((v, key) =>
    add(key, v.label, "items", assetKeyToDefaultPath(key))
  );

  // Consumables
  for (const c of CONSUMABLE_CATALOG) {
    const defaultPath = getConsumableImagePath(c.type);
    const key = pathToAssetKey(defaultPath);
    add(key, c.name, "consumables", defaultPath);
  }

  // Classes — portrait + bg
  for (const id of CLASS_IDS) {
    add(
      `classes/class-${id}`,
      `Class: ${id.charAt(0).toUpperCase() + id.slice(1)}`,
      "classes",
      `/images/classes/class-${id}.png`
    );
    add(
      `classes/class-${id}-bg`,
      `Class BG: ${id.charAt(0).toUpperCase() + id.slice(1)}`,
      "classes",
      `/images/classes/class-${id}-bg.png`
    );
  }

  // Origins — avatars + onboarding portraits
  for (const id of ALL_ORIGINS) {
    const capName = id.charAt(0).toUpperCase() + id.slice(1);
    // Avatar (small square icon)
    const avatarPath = `/images/origins/Avatar/origin-${id}_avatar_1.png`;
    const avatarKey = pathToAssetKey(avatarPath);
    add(avatarKey, `Origin: ${capName}`, "origins", avatarPath);
    // Onboarding portrait (hero creation screen)
    const portraitPath = `/images/origins/origin-${id}.png`;
    const portraitKey = pathToAssetKey(portraitPath);
    add(portraitKey, `Origin Portrait: ${capName}`, "origins", portraitPath);
  }

  // Dungeons
  for (const d of DUNGEONS) {
    const slug = d.id.replace(/_/g, "-");
    const defaultPath = `/images/dungeons/dungeon-${slug}.png`;
    const key = pathToAssetKey(defaultPath);
    add(key, d.name, "dungeons", defaultPath);
  }

  // Hub building pins
  for (const id of HUB_BUILDING_IDS) {
    const defaultPath = `/images/buildings/pins/pin-${id}.png`;
    const key = pathToAssetKey(defaultPath);
    const label = id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, " ");
    add(key, `Hub: ${label}`, "buildings", defaultPath);
  }

  // Hub building location scenes (background images)
  for (const id of HUB_BUILDING_IDS) {
    const defaultPath = `/images/buildings/location-${id}.png`;
    const key = pathToAssetKey(defaultPath);
    const label = id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, " ");
    add(key, `Location: ${label}`, "buildings", defaultPath);
  }

  // NPCs
  for (const npc of NPC_QUOTES) {
    const key = pathToAssetKey(npc.imagePath);
    add(key, `NPC: ${npc.name}`, "npcs", npc.imagePath);
  }

  // Minigame pins + tavern interior
  add(
    "minigames/tavern-interior",
    "Tavern interior",
    "minigames",
    "/images/minigames/tavern-interior.png"
  );
  for (const a of TAVERN_ACTIVITIES) {
    const key = pathToAssetKey(a.pinIcon);
    add(key, a.label, "minigames", a.pinIcon);
  }

  // UI — fixed set
  const uiAssets: { key: string; label: string }[] = [
    ["ui/arena-background", "Arena background"],
    ["ui/hub-bg", "Hub background"],
    ["ui/logo", "Logo"],
    ["ui/404", "404 page"],
    ["ui/wrong", "Error icon"],
    ["ui/placeholder-silhouette", "Placeholder silhouette"],
    ["ui/icon-potion-shop", "Potion shop icon"],
    ["ui/icon-world-info", "World info icon"],
    ["ui/inventory-bag-bg-desktop", "Inventory bag (desktop)"],
    ["ui/inventory-bag-bg-mobile", "Inventory bag (mobile)"],
    ["ui/onboarding/prologue-1", "Onboarding: Prologue 1"],
    ["ui/onboarding/prologue-2", "Onboarding: Prologue 2"],
    ["ui/onboarding/prologue-3", "Onboarding: Prologue 3"],
  ].map(([key, label]) => ({ key, label }));

  for (const { key, label } of uiAssets) {
    add(key, label, "ui", assetKeyToDefaultPath(key));
  }

  // Minigame assets (shell game, etc.)
  add(
    "minigames/shell-game-ball",
    "Shell Game: Ball",
    "minigames",
    "/images/minigames/shell-game-ball.png"
  );
  add(
    "minigames/shell-game-cup",
    "Shell Game: Cup",
    "minigames",
    "/images/minigames/shell-game-cup.png"
  );

  return entries;
}

let registryCache: AssetEntry[] | null = null;

/** Cached registry (same array reference, safe to use in components). */
export function getCachedAssetRegistry(): AssetEntry[] {
  if (!registryCache) registryCache = getAssetRegistry();
  return registryCache;
}

export function getAssetByKey(key: string): AssetEntry | undefined {
  return getCachedAssetRegistry().find((e) => e.key === key);
}

/** Get asset key for a boss by name. */
export function getBossAssetKey(name: string): string {
  return pathToAssetKey(getBossImagePath(name));
}

/** Get asset key for a catalog item. */
export function getItemAssetKey(item: CatalogItem): string {
  return pathToAssetKey(getItemImagePath(item));
}

/** Get asset key for consumable type. */
export function getConsumableAssetKey(type: string): string {
  return pathToAssetKey(
    getConsumableImagePath(type as Parameters<typeof getConsumableImagePath>[0])
  );
}

/** Get asset key for class portrait. */
export function getClassPortraitAssetKey(classId: CharacterClass): string {
  return `classes/class-${classId}`;
}

/** Get asset key for class background. */
export function getClassBgAssetKey(classId: CharacterClass): string {
  return `classes/class-${classId}-bg`;
}

/** Get asset key for origin avatar. */
export function getOriginAvatarAssetKey(originId: string): string {
  return pathToAssetKey(
    `/images/origins/Avatar/origin-${originId}_avatar_1.png`
  );
}

/** Get asset key for origin onboarding portrait (hero creation screen). */
export function getOriginPortraitAssetKey(originId: string): string {
  return pathToAssetKey(`/images/origins/origin-${originId}.png`);
}

/** Get asset key for dungeon background. */
export function getDungeonAssetKey(dungeonId: string): string {
  const slug = dungeonId.replace(/_/g, "-");
  return pathToAssetKey(`/images/dungeons/dungeon-${slug}.png`);
}

/** Get asset key for hub building pin. */
export function getBuildingPinAssetKey(buildingId: string): string {
  return pathToAssetKey(`/images/buildings/pins/pin-${buildingId}.png`);
}

/** Get asset key for NPC portrait. */
export function getNpcAssetKey(npcId: string): string {
  return pathToAssetKey(`/images/npcs/npc-${npcId}.png`);
}

/** Get asset key for location scene image. */
export function getLocationAssetKey(buildingId: string): string {
  return pathToAssetKey(`/images/buildings/location-${buildingId}.png`);
}

/** Get asset key for minigame pin (from pinIcon path). */
export function getMinigamePinAssetKey(pinIconPath: string): string {
  return pathToAssetKey(pinIconPath);
}
