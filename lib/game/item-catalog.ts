/**
 * Item Catalog v1.2 — 116 fixed items + 48 amulet/belt/relic items + 48 legs/necklace/ring items
 *
 * Stats calculated from Item System Design Document:
 * - Base stats at level 30 baseline
 * - Rarity multipliers: Common x1.00, Rare x1.08, Epic x1.15, Legendary x1.22
 * - ±10-15% variation within same rarity for diversity
 * - Legendary items have unique stat distributions per class set
 */

export type ItemSlot = "helmet" | "gloves" | "chest" | "boots" | "weapon" | "amulet" | "belt" | "relic" | "legs" | "necklace" | "ring";

export type ItemStatKey = "ATK" | "DEF" | "HP" | "CRIT" | "SPEED" | "ARMOR";

export type WeaponCategory = "sword" | "dagger" | "mace" | "staff";

export type CatalogItem = {
  catalogId: string;
  name: string;
  slot: ItemSlot;
  rarity: "common" | "rare" | "epic" | "legendary";
  baseStats: Partial<Record<ItemStatKey, number>>;
  classRestriction?: "warrior" | "rogue" | "mage" | "tank";
  setName?: string;
  description?: string;
  /** Unique passive ability text (primarily for amulets and relics) */
  uniquePassive?: string;
  /** Weapon sub-type (only for slot === "weapon") */
  weaponCategory?: WeaponCategory;
  /** Two-handed weapons occupy both weapon + weapon_offhand slots */
  twoHanded?: boolean;
};

/* ================================================================== */
/*  COMMON ITEMS (50)                                                  */
/* ================================================================== */

/*
 * Base stats (level 30):
 *   Helmet: DEF 35, HP 120
 *   Gloves: ATK 45
 *   Chest:  DEF 70, HP 250
 *   Boots:  ATK 15, DEF 15, SPEED 5
 *
 * Common multiplier: x1.00
 * Variation: ±10-15% across items in same slot
 */

const COMMON_HELMETS: CatalogItem[] = [
  { catalogId: "c-helm-01", name: "Rusted Helm", slot: "helmet", rarity: "common", baseStats: { DEF: 30, HP: 105, ARMOR: 22 } },
  { catalogId: "c-helm-02", name: "Iron Cap", slot: "helmet", rarity: "common", baseStats: { DEF: 33, HP: 110, ARMOR: 24 } },
  { catalogId: "c-helm-03", name: "Worn Visor", slot: "helmet", rarity: "common", baseStats: { DEF: 31, HP: 115, ARMOR: 23 } },
  { catalogId: "c-helm-04", name: "Leather Hood", slot: "helmet", rarity: "common", baseStats: { DEF: 28, HP: 125, ARMOR: 21 } },
  { catalogId: "c-helm-05", name: "Guard Helm", slot: "helmet", rarity: "common", baseStats: { DEF: 36, HP: 118, ARMOR: 27 } },
  { catalogId: "c-helm-06", name: "Steel Mask", slot: "helmet", rarity: "common", baseStats: { DEF: 38, HP: 112, ARMOR: 28 } },
  { catalogId: "c-helm-07", name: "Old Battle Helm", slot: "helmet", rarity: "common", baseStats: { DEF: 35, HP: 120, ARMOR: 25 } },
  { catalogId: "c-helm-08", name: "Scout Hood", slot: "helmet", rarity: "common", baseStats: { DEF: 29, HP: 130, ARMOR: 22 } },
  { catalogId: "c-helm-09", name: "Traveler Cap", slot: "helmet", rarity: "common", baseStats: { DEF: 32, HP: 122, ARMOR: 24 } },
  { catalogId: "c-helm-10", name: "Chain Hood", slot: "helmet", rarity: "common", baseStats: { DEF: 37, HP: 108, ARMOR: 27 } },
  { catalogId: "c-helm-11", name: "Bronze Helm", slot: "helmet", rarity: "common", baseStats: { DEF: 34, HP: 116, ARMOR: 26 } },
  { catalogId: "c-helm-12", name: "Training Helm", slot: "helmet", rarity: "common", baseStats: { DEF: 30, HP: 128, ARMOR: 23 } },
  { catalogId: "c-helm-13", name: "Militia Helm", slot: "helmet", rarity: "common", baseStats: { DEF: 35, HP: 120, ARMOR: 25 } },
];

const COMMON_GLOVES: CatalogItem[] = [
  { catalogId: "c-glv-01", name: "Rough Gloves", slot: "gloves", rarity: "common", baseStats: { ATK: 39, ARMOR: 13 } },
  { catalogId: "c-glv-02", name: "Leather Grips", slot: "gloves", rarity: "common", baseStats: { ATK: 41, ARMOR: 14 } },
  { catalogId: "c-glv-03", name: "Iron Knuckles", slot: "gloves", rarity: "common", baseStats: { ATK: 47, ARMOR: 16 } },
  { catalogId: "c-glv-04", name: "Worn Gauntlets", slot: "gloves", rarity: "common", baseStats: { ATK: 43, ARMOR: 15 } },
  { catalogId: "c-glv-05", name: "Battle Wraps", slot: "gloves", rarity: "common", baseStats: { ATK: 45, ARMOR: 15 } },
  { catalogId: "c-glv-06", name: "Steel Gloves", slot: "gloves", rarity: "common", baseStats: { ATK: 48, ARMOR: 17 } },
  { catalogId: "c-glv-07", name: "Training Gloves", slot: "gloves", rarity: "common", baseStats: { ATK: 38, ARMOR: 13 } },
  { catalogId: "c-glv-08", name: "Padded Gloves", slot: "gloves", rarity: "common", baseStats: { ATK: 40, ARMOR: 14 } },
  { catalogId: "c-glv-09", name: "Guard Grips", slot: "gloves", rarity: "common", baseStats: { ATK: 44, ARMOR: 15 } },
  { catalogId: "c-glv-10", name: "Soldier Gauntlets", slot: "gloves", rarity: "common", baseStats: { ATK: 46, ARMOR: 16 } },
  { catalogId: "c-glv-11", name: "Scout Gloves", slot: "gloves", rarity: "common", baseStats: { ATK: 42, ARMOR: 14 } },
  { catalogId: "c-glv-12", name: "Old War Gloves", slot: "gloves", rarity: "common", baseStats: { ATK: 50, ARMOR: 17 } },
];

const COMMON_CHESTS: CatalogItem[] = [
  { catalogId: "c-cst-01", name: "Rusted Armor", slot: "chest", rarity: "common", baseStats: { DEF: 60, HP: 220, ARMOR: 39 } },
  { catalogId: "c-cst-02", name: "Leather Vest", slot: "chest", rarity: "common", baseStats: { DEF: 62, HP: 230, ARMOR: 40 } },
  { catalogId: "c-cst-03", name: "Iron Plate", slot: "chest", rarity: "common", baseStats: { DEF: 72, HP: 240, ARMOR: 47 } },
  { catalogId: "c-cst-04", name: "Guard Chest", slot: "chest", rarity: "common", baseStats: { DEF: 68, HP: 250, ARMOR: 45 } },
  { catalogId: "c-cst-05", name: "Bronze Armor", slot: "chest", rarity: "common", baseStats: { DEF: 65, HP: 255, ARMOR: 43 } },
  { catalogId: "c-cst-06", name: "Soldier Mail", slot: "chest", rarity: "common", baseStats: { DEF: 70, HP: 248, ARMOR: 46 } },
  { catalogId: "c-cst-07", name: "Chain Armor", slot: "chest", rarity: "common", baseStats: { DEF: 74, HP: 235, ARMOR: 48 } },
  { catalogId: "c-cst-08", name: "Battle Vest", slot: "chest", rarity: "common", baseStats: { DEF: 66, HP: 260, ARMOR: 44 } },
  { catalogId: "c-cst-09", name: "Scout Armor", slot: "chest", rarity: "common", baseStats: { DEF: 63, HP: 270, ARMOR: 41 } },
  { catalogId: "c-cst-10", name: "Worn Cuirass", slot: "chest", rarity: "common", baseStats: { DEF: 70, HP: 245, ARMOR: 45 } },
  { catalogId: "c-cst-11", name: "Militia Plate", slot: "chest", rarity: "common", baseStats: { DEF: 75, HP: 225, ARMOR: 49 } },
  { catalogId: "c-cst-12", name: "Training Armor", slot: "chest", rarity: "common", baseStats: { DEF: 60, HP: 275, ARMOR: 38 } },
  { catalogId: "c-cst-13", name: "Steel Breastplate", slot: "chest", rarity: "common", baseStats: { DEF: 78, HP: 215, ARMOR: 52 } },
];

const COMMON_BOOTS: CatalogItem[] = [
  { catalogId: "c-bts-01", name: "Leather Boots", slot: "boots", rarity: "common", baseStats: { ATK: 13, DEF: 13, SPEED: 4, ARMOR: 13 } },
  { catalogId: "c-bts-02", name: "Iron Boots", slot: "boots", rarity: "common", baseStats: { ATK: 14, DEF: 16, SPEED: 4, ARMOR: 15 } },
  { catalogId: "c-bts-03", name: "Guard Greaves", slot: "boots", rarity: "common", baseStats: { ATK: 15, DEF: 15, SPEED: 5, ARMOR: 15 } },
  { catalogId: "c-bts-04", name: "Scout Boots", slot: "boots", rarity: "common", baseStats: { ATK: 13, DEF: 12, SPEED: 6, ARMOR: 13 } },
  { catalogId: "c-bts-05", name: "Steel Boots", slot: "boots", rarity: "common", baseStats: { ATK: 16, DEF: 16, SPEED: 4, ARMOR: 16 } },
  { catalogId: "c-bts-06", name: "Battle Boots", slot: "boots", rarity: "common", baseStats: { ATK: 17, DEF: 14, SPEED: 5, ARMOR: 14 } },
  { catalogId: "c-bts-07", name: "Traveler Boots", slot: "boots", rarity: "common", baseStats: { ATK: 12, DEF: 13, SPEED: 6, ARMOR: 13 } },
  { catalogId: "c-bts-08", name: "Chain Boots", slot: "boots", rarity: "common", baseStats: { ATK: 14, DEF: 17, SPEED: 4, ARMOR: 17 } },
  { catalogId: "c-bts-09", name: "Soldier Greaves", slot: "boots", rarity: "common", baseStats: { ATK: 16, DEF: 15, SPEED: 5, ARMOR: 15 } },
  { catalogId: "c-bts-10", name: "Worn Boots", slot: "boots", rarity: "common", baseStats: { ATK: 13, DEF: 14, SPEED: 5, ARMOR: 14 } },
  { catalogId: "c-bts-11", name: "Bronze Greaves", slot: "boots", rarity: "common", baseStats: { ATK: 15, DEF: 16, SPEED: 5, ARMOR: 16 } },
  { catalogId: "c-bts-12", name: "Training Boots", slot: "boots", rarity: "common", baseStats: { ATK: 14, DEF: 13, SPEED: 5, ARMOR: 14 } },
];

/* ================================================================== */
/*  RARE ITEMS (30)                                                    */
/* ================================================================== */

/*
 * Rare multiplier: x1.08
 *   Helmet: DEF ~38, HP ~130
 *   Gloves: ATK ~49
 *   Chest:  DEF ~76, HP ~270
 *   Boots:  ATK ~16, DEF ~16, SPEED ~5
 */

const RARE_HELMETS: CatalogItem[] = [
  { catalogId: "r-helm-01", name: "Knight Helm", slot: "helmet", rarity: "rare", baseStats: { DEF: 40, HP: 135, ARMOR: 50 } },
  { catalogId: "r-helm-02", name: "Silent Hood", slot: "helmet", rarity: "rare", baseStats: { DEF: 35, HP: 140, ARMOR: 44 } },
  { catalogId: "r-helm-03", name: "Vanguard Helm", slot: "helmet", rarity: "rare", baseStats: { DEF: 42, HP: 125, ARMOR: 52 } },
  { catalogId: "r-helm-04", name: "Storm Visor", slot: "helmet", rarity: "rare", baseStats: { DEF: 38, HP: 130, ARMOR: 48 } },
  { catalogId: "r-helm-05", name: "Battle Crown", slot: "helmet", rarity: "rare", baseStats: { DEF: 36, HP: 138, ARMOR: 46 } },
  { catalogId: "r-helm-06", name: "Assassin Hood", slot: "helmet", rarity: "rare", baseStats: { DEF: 33, HP: 135, CRIT: 3, ARMOR: 42 } },
  { catalogId: "r-helm-07", name: "Mystic Hood", slot: "helmet", rarity: "rare", baseStats: { DEF: 34, HP: 132, ARMOR: 45 } },
  { catalogId: "r-helm-08", name: "War Captain Helm", slot: "helmet", rarity: "rare", baseStats: { DEF: 41, HP: 128, ARMOR: 51 } },
];

const RARE_GLOVES: CatalogItem[] = [
  { catalogId: "r-glv-01", name: "Power Gauntlets", slot: "gloves", rarity: "rare", baseStats: { ATK: 52, ARMOR: 30 } },
  { catalogId: "r-glv-02", name: "Shadow Grips", slot: "gloves", rarity: "rare", baseStats: { ATK: 48, CRIT: 2, ARMOR: 26 } },
  { catalogId: "r-glv-03", name: "Arcane Gloves", slot: "gloves", rarity: "rare", baseStats: { ATK: 46, ARMOR: 25 } },
  { catalogId: "r-glv-04", name: "Swift Gauntlets", slot: "gloves", rarity: "rare", baseStats: { ATK: 47, SPEED: 2, ARMOR: 27 } },
  { catalogId: "r-glv-05", name: "Ironclad Gloves", slot: "gloves", rarity: "rare", baseStats: { ATK: 50, ARMOR: 29 } },
  { catalogId: "r-glv-06", name: "Assassin Wraps", slot: "gloves", rarity: "rare", baseStats: { ATK: 49, CRIT: 2, ARMOR: 28 } },
  { catalogId: "r-glv-07", name: "Storm Grips", slot: "gloves", rarity: "rare", baseStats: { ATK: 51, ARMOR: 30 } },
];

const RARE_CHESTS: CatalogItem[] = [
  { catalogId: "r-cst-01", name: "Knight Armor", slot: "chest", rarity: "rare", baseStats: { DEF: 80, HP: 275, ARMOR: 92 } },
  { catalogId: "r-cst-02", name: "Shadow Vest", slot: "chest", rarity: "rare", baseStats: { DEF: 70, HP: 265, ARMOR: 80 } },
  { catalogId: "r-cst-03", name: "Mystic Robe", slot: "chest", rarity: "rare", baseStats: { DEF: 68, HP: 280, ARMOR: 78 } },
  { catalogId: "r-cst-04", name: "Vanguard Plate", slot: "chest", rarity: "rare", baseStats: { DEF: 82, HP: 260, ARMOR: 94 } },
  { catalogId: "r-cst-05", name: "Ironwall Armor", slot: "chest", rarity: "rare", baseStats: { DEF: 85, HP: 255, ARMOR: 96 } },
  { catalogId: "r-cst-06", name: "Storm Armor", slot: "chest", rarity: "rare", baseStats: { DEF: 76, HP: 270, ARMOR: 87 } },
  { catalogId: "r-cst-07", name: "Warplate", slot: "chest", rarity: "rare", baseStats: { DEF: 78, HP: 268, ARMOR: 88 } },
  { catalogId: "r-cst-08", name: "Assassin Armor", slot: "chest", rarity: "rare", baseStats: { DEF: 72, HP: 272, ARMOR: 82 } },
];

const RARE_BOOTS: CatalogItem[] = [
  { catalogId: "r-bts-01", name: "Swift Boots", slot: "boots", rarity: "rare", baseStats: { ATK: 15, DEF: 14, SPEED: 7, ARMOR: 27 } },
  { catalogId: "r-bts-02", name: "Shadow Boots", slot: "boots", rarity: "rare", baseStats: { ATK: 16, DEF: 15, SPEED: 6, ARMOR: 28 } },
  { catalogId: "r-bts-03", name: "Knight Greaves", slot: "boots", rarity: "rare", baseStats: { ATK: 17, DEF: 18, SPEED: 5, ARMOR: 31 } },
  { catalogId: "r-bts-04", name: "Storm Greaves", slot: "boots", rarity: "rare", baseStats: { ATK: 16, DEF: 16, SPEED: 6, ARMOR: 29 } },
  { catalogId: "r-bts-05", name: "Mystic Sandals", slot: "boots", rarity: "rare", baseStats: { ATK: 14, DEF: 14, SPEED: 7, ARMOR: 25 } },
  { catalogId: "r-bts-06", name: "Vanguard Boots", slot: "boots", rarity: "rare", baseStats: { ATK: 18, DEF: 17, SPEED: 5, ARMOR: 32 } },
  { catalogId: "r-bts-07", name: "Ironstride Boots", slot: "boots", rarity: "rare", baseStats: { ATK: 17, DEF: 18, SPEED: 5, ARMOR: 31 } },
];

/* ================================================================== */
/*  EPIC ITEMS (20)                                                    */
/* ================================================================== */

/*
 * Epic multiplier: x1.15
 *   Helmet: DEF ~40, HP ~138
 *   Gloves: ATK ~52
 *   Chest:  DEF ~81, HP ~288
 *   Boots:  ATK ~17, DEF ~17, SPEED ~6
 */

const EPIC_HELMETS: CatalogItem[] = [
  { catalogId: "e-helm-01", name: "Doom Helm", slot: "helmet", rarity: "epic", baseStats: { DEF: 44, HP: 145, ARMOR: 72 } },
  { catalogId: "e-helm-02", name: "Shadow Crown", slot: "helmet", rarity: "epic", baseStats: { DEF: 38, HP: 140, CRIT: 4, ARMOR: 64 } },
  { catalogId: "e-helm-03", name: "Arcane Diadem", slot: "helmet", rarity: "epic", baseStats: { DEF: 36, HP: 142, CRIT: 3, ARMOR: 62 } },
  { catalogId: "e-helm-04", name: "Titan Helm", slot: "helmet", rarity: "epic", baseStats: { DEF: 46, HP: 135, ARMOR: 75 } },
  { catalogId: "e-helm-05", name: "Blood Visor", slot: "helmet", rarity: "epic", baseStats: { DEF: 40, HP: 138, ATK: 8, ARMOR: 68 } },
];

const EPIC_GLOVES: CatalogItem[] = [
  { catalogId: "e-glv-01", name: "Doom Gauntlets", slot: "gloves", rarity: "epic", baseStats: { ATK: 56, ARMOR: 42 } },
  { catalogId: "e-glv-02", name: "Shadow Claws", slot: "gloves", rarity: "epic", baseStats: { ATK: 52, CRIT: 4, ARMOR: 38 } },
  { catalogId: "e-glv-03", name: "Arcane Grips", slot: "gloves", rarity: "epic", baseStats: { ATK: 50, ARMOR: 36 } },
  { catalogId: "e-glv-04", name: "Titan Fists", slot: "gloves", rarity: "epic", baseStats: { ATK: 58, ARMOR: 44 } },
  { catalogId: "e-glv-05", name: "Blood Knuckles", slot: "gloves", rarity: "epic", baseStats: { ATK: 54, HP: 30, ARMOR: 40 } },
];

const EPIC_CHESTS: CatalogItem[] = [
  { catalogId: "e-cst-01", name: "Doom Armor", slot: "chest", rarity: "epic", baseStats: { DEF: 88, HP: 290, ARMOR: 128 } },
  { catalogId: "e-cst-02", name: "Shadow Plate", slot: "chest", rarity: "epic", baseStats: { DEF: 78, HP: 285, ARMOR: 115 } },
  { catalogId: "e-cst-03", name: "Arcane Vestment", slot: "chest", rarity: "epic", baseStats: { DEF: 75, HP: 300, ARMOR: 110 } },
  { catalogId: "e-cst-04", name: "Titan Plate", slot: "chest", rarity: "epic", baseStats: { DEF: 92, HP: 280, ARMOR: 135 } },
  { catalogId: "e-cst-05", name: "Blood Armor", slot: "chest", rarity: "epic", baseStats: { DEF: 81, HP: 288, ARMOR: 122 } },
];

const EPIC_BOOTS: CatalogItem[] = [
  { catalogId: "e-bts-01", name: "Doom Greaves", slot: "boots", rarity: "epic", baseStats: { ATK: 19, DEF: 19, SPEED: 6, ARMOR: 42 } },
  { catalogId: "e-bts-02", name: "Shadow Steps", slot: "boots", rarity: "epic", baseStats: { ATK: 17, DEF: 16, SPEED: 8, ARMOR: 36 } },
  { catalogId: "e-bts-03", name: "Arcane Boots", slot: "boots", rarity: "epic", baseStats: { ATK: 16, DEF: 16, SPEED: 7, ARMOR: 38 } },
  { catalogId: "e-bts-04", name: "Titan Greaves", slot: "boots", rarity: "epic", baseStats: { ATK: 20, DEF: 20, SPEED: 5, ARMOR: 44 } },
  { catalogId: "e-bts-05", name: "Bloodstride Boots", slot: "boots", rarity: "epic", baseStats: { ATK: 18, DEF: 18, SPEED: 7, ARMOR: 40 } },
];

/* ================================================================== */
/*  LEGENDARY ITEMS (16) — Class Sets                                  */
/* ================================================================== */

/*
 * Legendary multiplier: x1.22
 * Unique stat distributions per class set.
 */

/** Warrior — Crimson Conqueror */
const LEGENDARY_WARRIOR: CatalogItem[] = [
  {
    catalogId: "l-war-helm",
    name: "Crimson War Helm",
    slot: "helmet",
    rarity: "legendary",
    baseStats: { ATK: 25, DEF: 30, ARMOR: 85 },
    classRestriction: "warrior",
    setName: "crimson_conqueror",
    description: "Forged in the blood of a thousand battles.",
  },
  {
    catalogId: "l-war-glv",
    name: "Crimson War Gauntlets",
    slot: "gloves",
    rarity: "legendary",
    baseStats: { ATK: 55, ARMOR: 50 },
    classRestriction: "warrior",
    setName: "crimson_conqueror",
    description: "Each blow carries the weight of conquest.",
  },
  {
    catalogId: "l-war-cst",
    name: "Crimson War Plate",
    slot: "chest",
    rarity: "legendary",
    baseStats: { HP: 305, DEF: 85, ARMOR: 148 },
    classRestriction: "warrior",
    setName: "crimson_conqueror",
    description: "Unyielding armor of the Crimson Legion.",
  },
  {
    catalogId: "l-war-bts",
    name: "Crimson War Greaves",
    slot: "boots",
    rarity: "legendary",
    baseStats: { SPEED: 8, ARMOR: 52 },
    classRestriction: "warrior",
    setName: "crimson_conqueror",
    description: "March forward — never retreat.",
  },
];

/** Rogue — Shadow Reaper */
const LEGENDARY_ROGUE: CatalogItem[] = [
  {
    catalogId: "l-rog-helm",
    name: "Shadow Reaper Hood",
    slot: "helmet",
    rarity: "legendary",
    baseStats: { CRIT: 12, ARMOR: 60 },
    classRestriction: "rogue",
    setName: "shadow_reaper",
    description: "See every weakness before the strike.",
  },
  {
    catalogId: "l-rog-glv",
    name: "Shadow Reaper Gloves",
    slot: "gloves",
    rarity: "legendary",
    baseStats: { ATK: 55, ARMOR: 35 },
    classRestriction: "rogue",
    setName: "shadow_reaper",
    description: "Silent hands that end lives.",
  },
  {
    catalogId: "l-rog-cst",
    name: "Shadow Reaper Vest",
    slot: "chest",
    rarity: "legendary",
    baseStats: { DEF: 50, ARMOR: 110 },
    classRestriction: "rogue",
    setName: "shadow_reaper",
    description: "Light enough to vanish, tough enough to survive.",
  },
  {
    catalogId: "l-rog-bts",
    name: "Shadow Reaper Boots",
    slot: "boots",
    rarity: "legendary",
    baseStats: { SPEED: 12, ARMOR: 40 },
    classRestriction: "rogue",
    setName: "shadow_reaper",
    description: "Move like a shadow, strike like lightning.",
  },
];

/** Mage — Arcane Dominion */
const LEGENDARY_MAGE: CatalogItem[] = [
  {
    catalogId: "l-mag-helm",
    name: "Arcane Dominion Crown",
    slot: "helmet",
    rarity: "legendary",
    baseStats: { CRIT: 10, ARMOR: 55 },
    classRestriction: "mage",
    setName: "arcane_dominion",
    description: "Channel the raw essence of the arcane.",
  },
  {
    catalogId: "l-mag-glv",
    name: "Arcane Dominion Grips",
    slot: "gloves",
    rarity: "legendary",
    baseStats: { ATK: 50, ARMOR: 30 },
    classRestriction: "mage",
    setName: "arcane_dominion",
    description: "Every gesture unleashes devastation.",
  },
  {
    catalogId: "l-mag-cst",
    name: "Arcane Dominion Robe",
    slot: "chest",
    rarity: "legendary",
    baseStats: { HP: 305, ARMOR: 100 },
    classRestriction: "mage",
    setName: "arcane_dominion",
    description: "Woven from threads of pure mana.",
  },
  {
    catalogId: "l-mag-bts",
    name: "Arcane Dominion Sandals",
    slot: "boots",
    rarity: "legendary",
    baseStats: { SPEED: 8, ARMOR: 35 },
    classRestriction: "mage",
    setName: "arcane_dominion",
    description: "Walk between worlds.",
  },
];

/** Tank — Iron Bastion */
const LEGENDARY_TANK: CatalogItem[] = [
  {
    catalogId: "l-tnk-helm",
    name: "Iron Bastion Helm",
    slot: "helmet",
    rarity: "legendary",
    baseStats: { DEF: 55, ARMOR: 95 },
    classRestriction: "tank",
    setName: "iron_bastion",
    description: "An immovable wall begins at the head.",
  },
  {
    catalogId: "l-tnk-glv",
    name: "Iron Bastion Gauntlets",
    slot: "gloves",
    rarity: "legendary",
    baseStats: { DEF: 45, ARMOR: 60 },
    classRestriction: "tank",
    setName: "iron_bastion",
    description: "Grip the enemy and never let go.",
  },
  {
    catalogId: "l-tnk-cst",
    name: "Iron Bastion Plate",
    slot: "chest",
    rarity: "legendary",
    baseStats: { HP: 380, ARMOR: 165 },
    classRestriction: "tank",
    setName: "iron_bastion",
    description: "The fortress walks among mortals.",
  },
  {
    catalogId: "l-tnk-bts",
    name: "Iron Bastion Greaves",
    slot: "boots",
    rarity: "legendary",
    baseStats: { DEF: 25, HP: 100, ARMOR: 60 },
    classRestriction: "tank",
    setName: "iron_bastion",
    description: "Each step shakes the earth.",
  },
];

/* ================================================================== */
/*  WEAPON CATALOG — COMMON (50)                                       */
/* ================================================================== */

/*
 * Base weapon stats (level 30):
 *   Swords:        ATK 55, CRIT 3
 *   Daggers:       ATK 42, CRIT 8, SPEED 3
 *   Maces/Hammers: ATK 62, DEF 8
 *   Staffs:        ATK 48, CRIT 5
 *
 * Common multiplier: x1.00
 * Variation: ±10-15%
 */

const COMMON_SWORDS: CatalogItem[] = [
  { catalogId: "cw-swd-01", name: "Rusted Sword", slot: "weapon", rarity: "common", baseStats: { ATK: 48, CRIT: 2 }, weaponCategory: "sword", description: "Sword" },
  { catalogId: "cw-swd-02", name: "Iron Blade", slot: "weapon", rarity: "common", baseStats: { ATK: 52, CRIT: 3 }, weaponCategory: "sword", description: "Sword" },
  { catalogId: "cw-swd-03", name: "Short Sword", slot: "weapon", rarity: "common", baseStats: { ATK: 50, CRIT: 3 }, weaponCategory: "sword", description: "Sword" },
  { catalogId: "cw-swd-04", name: "Guard Sword", slot: "weapon", rarity: "common", baseStats: { ATK: 55, CRIT: 3 }, weaponCategory: "sword", description: "Sword" },
  { catalogId: "cw-swd-05", name: "Bronze Saber", slot: "weapon", rarity: "common", baseStats: { ATK: 53, CRIT: 2 }, weaponCategory: "sword", description: "Sword" },
  { catalogId: "cw-swd-06", name: "Militia Blade", slot: "weapon", rarity: "common", baseStats: { ATK: 56, CRIT: 3 }, weaponCategory: "sword", description: "Sword" },
  { catalogId: "cw-swd-07", name: "Steel Cutter", slot: "weapon", rarity: "common", baseStats: { ATK: 58, CRIT: 2 }, weaponCategory: "sword", description: "Sword" },
  { catalogId: "cw-swd-08", name: "Old War Sword", slot: "weapon", rarity: "common", baseStats: { ATK: 54, CRIT: 4 }, weaponCategory: "sword", description: "Sword" },
  { catalogId: "cw-swd-09", name: "Training Blade", slot: "weapon", rarity: "common", baseStats: { ATK: 47, CRIT: 3 }, weaponCategory: "sword", description: "Sword" },
  { catalogId: "cw-swd-10", name: "Broad Sword", slot: "weapon", rarity: "common", baseStats: { ATK: 60, CRIT: 2 }, weaponCategory: "sword", description: "Sword" },
  { catalogId: "cw-swd-11", name: "Soldier Sword", slot: "weapon", rarity: "common", baseStats: { ATK: 55, CRIT: 3 }, weaponCategory: "sword", description: "Sword" },
  { catalogId: "cw-swd-12", name: "Chainblade", slot: "weapon", rarity: "common", baseStats: { ATK: 57, CRIT: 3 }, weaponCategory: "sword", description: "Sword" },
  { catalogId: "cw-swd-13", name: "Traveler Sword", slot: "weapon", rarity: "common", baseStats: { ATK: 51, CRIT: 4 }, weaponCategory: "sword", description: "Sword" },
];

const COMMON_DAGGERS: CatalogItem[] = [
  { catalogId: "cw-dgr-01", name: "Rusted Dagger", slot: "weapon", rarity: "common", baseStats: { ATK: 36, CRIT: 7, SPEED: 2 }, weaponCategory: "dagger", description: "Dagger" },
  { catalogId: "cw-dgr-02", name: "Iron Dagger", slot: "weapon", rarity: "common", baseStats: { ATK: 40, CRIT: 8, SPEED: 3 }, weaponCategory: "dagger", description: "Dagger" },
  { catalogId: "cw-dgr-03", name: "Scout Knife", slot: "weapon", rarity: "common", baseStats: { ATK: 38, CRIT: 7, SPEED: 4 }, weaponCategory: "dagger", description: "Dagger" },
  { catalogId: "cw-dgr-04", name: "Bronze Dagger", slot: "weapon", rarity: "common", baseStats: { ATK: 41, CRIT: 8, SPEED: 3 }, weaponCategory: "dagger", description: "Dagger" },
  { catalogId: "cw-dgr-05", name: "Steel Shiv", slot: "weapon", rarity: "common", baseStats: { ATK: 44, CRIT: 9, SPEED: 2 }, weaponCategory: "dagger", description: "Dagger" },
  { catalogId: "cw-dgr-06", name: "Silent Knife", slot: "weapon", rarity: "common", baseStats: { ATK: 39, CRIT: 8, SPEED: 4 }, weaponCategory: "dagger", description: "Dagger" },
  { catalogId: "cw-dgr-07", name: "Guard Dagger", slot: "weapon", rarity: "common", baseStats: { ATK: 42, CRIT: 7, SPEED: 3 }, weaponCategory: "dagger", description: "Dagger" },
  { catalogId: "cw-dgr-08", name: "War Knife", slot: "weapon", rarity: "common", baseStats: { ATK: 45, CRIT: 8, SPEED: 2 }, weaponCategory: "dagger", description: "Dagger" },
  { catalogId: "cw-dgr-09", name: "Training Dagger", slot: "weapon", rarity: "common", baseStats: { ATK: 37, CRIT: 7, SPEED: 3 }, weaponCategory: "dagger", description: "Dagger" },
  { catalogId: "cw-dgr-10", name: "Twin Blade", slot: "weapon", rarity: "common", baseStats: { ATK: 43, CRIT: 9, SPEED: 3 }, weaponCategory: "dagger", description: "Dagger" },
  { catalogId: "cw-dgr-11", name: "Short Fang", slot: "weapon", rarity: "common", baseStats: { ATK: 40, CRIT: 8, SPEED: 3 }, weaponCategory: "dagger", description: "Dagger" },
  { catalogId: "cw-dgr-12", name: "Militia Knife", slot: "weapon", rarity: "common", baseStats: { ATK: 42, CRIT: 8, SPEED: 3 }, weaponCategory: "dagger", description: "Dagger" },
];

const COMMON_MACES: CatalogItem[] = [
  { catalogId: "cw-mac-01", name: "Iron Mace", slot: "weapon", rarity: "common", baseStats: { ATK: 58, DEF: 7 }, weaponCategory: "mace", description: "Mace" },
  { catalogId: "cw-mac-02", name: "Bronze Hammer", slot: "weapon", rarity: "common", baseStats: { ATK: 60, DEF: 8 }, weaponCategory: "mace", description: "Mace" },
  { catalogId: "cw-mac-03", name: "Guard Hammer", slot: "weapon", rarity: "common", baseStats: { ATK: 62, DEF: 9 }, weaponCategory: "mace", description: "Mace" },
  { catalogId: "cw-mac-04", name: "Rusted Mace", slot: "weapon", rarity: "common", baseStats: { ATK: 54, DEF: 7 }, weaponCategory: "mace", description: "Mace" },
  { catalogId: "cw-mac-05", name: "Soldier Hammer", slot: "weapon", rarity: "common", baseStats: { ATK: 63, DEF: 8 }, weaponCategory: "mace", description: "Mace" },
  { catalogId: "cw-mac-06", name: "War Mace", slot: "weapon", rarity: "common", baseStats: { ATK: 65, DEF: 7 }, weaponCategory: "mace", description: "Mace" },
  { catalogId: "cw-mac-07", name: "Steel Crusher", slot: "weapon", rarity: "common", baseStats: { ATK: 66, DEF: 8 }, weaponCategory: "mace", description: "Mace" },
  { catalogId: "cw-mac-08", name: "Training Hammer", slot: "weapon", rarity: "common", baseStats: { ATK: 55, DEF: 6 }, weaponCategory: "mace", description: "Mace" },
  { catalogId: "cw-mac-09", name: "Old Maul", slot: "weapon", rarity: "common", baseStats: { ATK: 57, DEF: 9 }, weaponCategory: "mace", description: "Mace" },
  { catalogId: "cw-mac-10", name: "Heavy Club", slot: "weapon", rarity: "common", baseStats: { ATK: 68, DEF: 6 }, weaponCategory: "mace", description: "Mace" },
  { catalogId: "cw-mac-11", name: "Chain Mace", slot: "weapon", rarity: "common", baseStats: { ATK: 61, DEF: 8 }, weaponCategory: "mace", description: "Mace" },
  { catalogId: "cw-mac-12", name: "Militia Hammer", slot: "weapon", rarity: "common", baseStats: { ATK: 62, DEF: 8 }, weaponCategory: "mace", description: "Mace" },
  { catalogId: "cw-mac-13", name: "Iron Maul", slot: "weapon", rarity: "common", baseStats: { ATK: 64, DEF: 7 }, weaponCategory: "mace", description: "Mace" },
];

const COMMON_STAFFS: CatalogItem[] = [
  { catalogId: "cw-stf-01", name: "Wooden Staff", slot: "weapon", rarity: "common", baseStats: { ATK: 42, CRIT: 4 }, weaponCategory: "staff", twoHanded: true, description: "Staff" },
  { catalogId: "cw-stf-02", name: "Iron Staff", slot: "weapon", rarity: "common", baseStats: { ATK: 46, CRIT: 5 }, weaponCategory: "staff", twoHanded: true, description: "Staff" },
  { catalogId: "cw-stf-03", name: "Training Staff", slot: "weapon", rarity: "common", baseStats: { ATK: 41, CRIT: 4 }, weaponCategory: "staff", twoHanded: true, description: "Staff" },
  { catalogId: "cw-stf-04", name: "Bronze Rod", slot: "weapon", rarity: "common", baseStats: { ATK: 45, CRIT: 5 }, weaponCategory: "staff", twoHanded: true, description: "Staff" },
  { catalogId: "cw-stf-05", name: "Guard Staff", slot: "weapon", rarity: "common", baseStats: { ATK: 48, CRIT: 5 }, weaponCategory: "staff", twoHanded: true, description: "Staff" },
  { catalogId: "cw-stf-06", name: "War Staff", slot: "weapon", rarity: "common", baseStats: { ATK: 50, CRIT: 4 }, weaponCategory: "staff", twoHanded: true, description: "Staff" },
  { catalogId: "cw-stf-07", name: "Mystic Rod", slot: "weapon", rarity: "common", baseStats: { ATK: 44, CRIT: 6 }, weaponCategory: "staff", twoHanded: true, description: "Staff" },
  { catalogId: "cw-stf-08", name: "Old Staff", slot: "weapon", rarity: "common", baseStats: { ATK: 43, CRIT: 5 }, weaponCategory: "staff", twoHanded: true, description: "Staff" },
  { catalogId: "cw-stf-09", name: "Traveler Staff", slot: "weapon", rarity: "common", baseStats: { ATK: 47, CRIT: 5 }, weaponCategory: "staff", twoHanded: true, description: "Staff" },
  { catalogId: "cw-stf-10", name: "Chain Rod", slot: "weapon", rarity: "common", baseStats: { ATK: 49, CRIT: 4 }, weaponCategory: "staff", twoHanded: true, description: "Staff" },
  { catalogId: "cw-stf-11", name: "Soldier Staff", slot: "weapon", rarity: "common", baseStats: { ATK: 48, CRIT: 5 }, weaponCategory: "staff", twoHanded: true, description: "Staff" },
  { catalogId: "cw-stf-12", name: "Steel Rod", slot: "weapon", rarity: "common", baseStats: { ATK: 52, CRIT: 5 }, weaponCategory: "staff", twoHanded: true, description: "Staff" },
];

/* ================================================================== */
/*  WEAPON CATALOG — RARE (30)                                         */
/* ================================================================== */

/*
 * Rare multiplier: x1.08
 *   Swords:  ATK ~59, CRIT ~3
 *   Daggers: ATK ~45, CRIT ~9, SPEED ~3
 *   Maces:   ATK ~67, DEF ~9
 *   Staffs:  ATK ~52, CRIT ~5
 */

const RARE_SWORDS: CatalogItem[] = [
  { catalogId: "rw-swd-01", name: "Knight Blade", slot: "weapon", rarity: "rare", baseStats: { ATK: 60, CRIT: 4 }, weaponCategory: "sword", description: "Sword" },
  { catalogId: "rw-swd-02", name: "Storm Saber", slot: "weapon", rarity: "rare", baseStats: { ATK: 58, CRIT: 5 }, weaponCategory: "sword", description: "Sword" },
  { catalogId: "rw-swd-03", name: "Vanguard Sword", slot: "weapon", rarity: "rare", baseStats: { ATK: 62, CRIT: 3 }, weaponCategory: "sword", description: "Sword" },
  { catalogId: "rw-swd-04", name: "Blood Saber", slot: "weapon", rarity: "rare", baseStats: { ATK: 59, CRIT: 4 }, weaponCategory: "sword", description: "Sword" },
  { catalogId: "rw-swd-05", name: "Silver Edge", slot: "weapon", rarity: "rare", baseStats: { ATK: 57, CRIT: 5 }, weaponCategory: "sword", description: "Sword" },
  { catalogId: "rw-swd-06", name: "War Captain Blade", slot: "weapon", rarity: "rare", baseStats: { ATK: 63, CRIT: 3 }, weaponCategory: "sword", description: "Sword" },
  { catalogId: "rw-swd-07", name: "Assassin Sword", slot: "weapon", rarity: "rare", baseStats: { ATK: 56, CRIT: 6 }, weaponCategory: "sword", description: "Sword" },
  { catalogId: "rw-swd-08", name: "Mystic Saber", slot: "weapon", rarity: "rare", baseStats: { ATK: 58, CRIT: 4 }, weaponCategory: "sword", description: "Sword" },
];

const RARE_DAGGERS: CatalogItem[] = [
  { catalogId: "rw-dgr-01", name: "Shadow Fang", slot: "weapon", rarity: "rare", baseStats: { ATK: 44, CRIT: 10, SPEED: 4 }, weaponCategory: "dagger", description: "Dagger" },
  { catalogId: "rw-dgr-02", name: "Swift Blade", slot: "weapon", rarity: "rare", baseStats: { ATK: 43, CRIT: 9, SPEED: 5 }, weaponCategory: "dagger", description: "Dagger" },
  { catalogId: "rw-dgr-03", name: "Silver Dagger", slot: "weapon", rarity: "rare", baseStats: { ATK: 46, CRIT: 9, SPEED: 3 }, weaponCategory: "dagger", description: "Dagger" },
  { catalogId: "rw-dgr-04", name: "Blood Knife", slot: "weapon", rarity: "rare", baseStats: { ATK: 47, CRIT: 10, SPEED: 3 }, weaponCategory: "dagger", description: "Dagger" },
  { catalogId: "rw-dgr-05", name: "Silent Edge", slot: "weapon", rarity: "rare", baseStats: { ATK: 42, CRIT: 9, SPEED: 5 }, weaponCategory: "dagger", description: "Dagger" },
  { catalogId: "rw-dgr-06", name: "Assassin Fang", slot: "weapon", rarity: "rare", baseStats: { ATK: 45, CRIT: 10, SPEED: 4 }, weaponCategory: "dagger", description: "Dagger" },
  { catalogId: "rw-dgr-07", name: "Storm Knife", slot: "weapon", rarity: "rare", baseStats: { ATK: 48, CRIT: 8, SPEED: 3 }, weaponCategory: "dagger", description: "Dagger" },
];

const RARE_MACES: CatalogItem[] = [
  { catalogId: "rw-mac-01", name: "Ironclad Mace", slot: "weapon", rarity: "rare", baseStats: { ATK: 67, DEF: 10 }, weaponCategory: "mace", description: "Mace" },
  { catalogId: "rw-mac-02", name: "Vanguard Hammer", slot: "weapon", rarity: "rare", baseStats: { ATK: 68, DEF: 9 }, weaponCategory: "mace", description: "Mace" },
  { catalogId: "rw-mac-03", name: "Storm Maul", slot: "weapon", rarity: "rare", baseStats: { ATK: 65, DEF: 10 }, weaponCategory: "mace", description: "Mace" },
  { catalogId: "rw-mac-04", name: "Blood Crusher", slot: "weapon", rarity: "rare", baseStats: { ATK: 70, DEF: 8 }, weaponCategory: "mace", description: "Mace" },
  { catalogId: "rw-mac-05", name: "Knight Hammer", slot: "weapon", rarity: "rare", baseStats: { ATK: 66, DEF: 11 }, weaponCategory: "mace", description: "Mace" },
  { catalogId: "rw-mac-06", name: "War Mace II", slot: "weapon", rarity: "rare", baseStats: { ATK: 69, DEF: 9 }, weaponCategory: "mace", description: "Mace" },
  { catalogId: "rw-mac-07", name: "Silver Maul", slot: "weapon", rarity: "rare", baseStats: { ATK: 64, DEF: 10 }, weaponCategory: "mace", description: "Mace" },
  { catalogId: "rw-mac-08", name: "Titan Hammer", slot: "weapon", rarity: "rare", baseStats: { ATK: 72, DEF: 8 }, weaponCategory: "mace", description: "Mace" },
];

const RARE_STAFFS: CatalogItem[] = [
  { catalogId: "rw-stf-01", name: "Mystic Staff", slot: "weapon", rarity: "rare", baseStats: { ATK: 52, CRIT: 6 }, weaponCategory: "staff", twoHanded: true, description: "Staff" },
  { catalogId: "rw-stf-02", name: "Arcane Rod", slot: "weapon", rarity: "rare", baseStats: { ATK: 50, CRIT: 7 }, weaponCategory: "staff", twoHanded: true, description: "Staff" },
  { catalogId: "rw-stf-03", name: "Storm Staff", slot: "weapon", rarity: "rare", baseStats: { ATK: 54, CRIT: 5 }, weaponCategory: "staff", twoHanded: true, description: "Staff" },
  { catalogId: "rw-stf-04", name: "Blood Staff", slot: "weapon", rarity: "rare", baseStats: { ATK: 53, CRIT: 6 }, weaponCategory: "staff", twoHanded: true, description: "Staff" },
  { catalogId: "rw-stf-05", name: "Silver Staff", slot: "weapon", rarity: "rare", baseStats: { ATK: 51, CRIT: 7 }, weaponCategory: "staff", twoHanded: true, description: "Staff" },
  { catalogId: "rw-stf-06", name: "Warlock Rod", slot: "weapon", rarity: "rare", baseStats: { ATK: 55, CRIT: 5 }, weaponCategory: "staff", twoHanded: true, description: "Staff" },
  { catalogId: "rw-stf-07", name: "Vanguard Staff", slot: "weapon", rarity: "rare", baseStats: { ATK: 53, CRIT: 6 }, weaponCategory: "staff", twoHanded: true, description: "Staff" },
];

/* ================================================================== */
/*  WEAPON CATALOG — EPIC (20)                                         */
/* ================================================================== */

/*
 * Epic multiplier: x1.15
 *   Swords:  ATK ~63, CRIT ~3-5
 *   Daggers: ATK ~48, CRIT ~10-12, SPEED ~4
 *   Maces:   ATK ~71, DEF ~10-12
 *   Staffs:  ATK ~55, CRIT ~6-7
 */

const EPIC_SWORDS: CatalogItem[] = [
  { catalogId: "ew-swd-01", name: "Doom Blade", slot: "weapon", rarity: "epic", baseStats: { ATK: 66, CRIT: 5 }, weaponCategory: "sword", description: "Sword" },
  { catalogId: "ew-swd-02", name: "Blood Reaver", slot: "weapon", rarity: "epic", baseStats: { ATK: 64, CRIT: 6 }, weaponCategory: "sword", description: "Sword" },
  { catalogId: "ew-swd-03", name: "Titan Edge", slot: "weapon", rarity: "epic", baseStats: { ATK: 68, CRIT: 4 }, weaponCategory: "sword", description: "Sword" },
  { catalogId: "ew-swd-04", name: "Stormbringer", slot: "weapon", rarity: "epic", baseStats: { ATK: 63, CRIT: 6 }, weaponCategory: "sword", description: "Sword" },
  { catalogId: "ew-swd-05", name: "Shadowfang", slot: "weapon", rarity: "epic", baseStats: { ATK: 62, CRIT: 7 }, weaponCategory: "sword", description: "Sword" },
];

const EPIC_DAGGERS: CatalogItem[] = [
  { catalogId: "ew-dgr-01", name: "Nightpiercer", slot: "weapon", rarity: "epic", baseStats: { ATK: 50, CRIT: 12, SPEED: 4 }, weaponCategory: "dagger", description: "Dagger" },
  { catalogId: "ew-dgr-02", name: "Soul Fang", slot: "weapon", rarity: "epic", baseStats: { ATK: 48, CRIT: 11, SPEED: 5 }, weaponCategory: "dagger", description: "Dagger" },
  { catalogId: "ew-dgr-03", name: "Blood Talon", slot: "weapon", rarity: "epic", baseStats: { ATK: 51, CRIT: 11, SPEED: 4 }, weaponCategory: "dagger", description: "Dagger" },
  { catalogId: "ew-dgr-04", name: "Silent Doom", slot: "weapon", rarity: "epic", baseStats: { ATK: 47, CRIT: 12, SPEED: 5 }, weaponCategory: "dagger", description: "Dagger" },
  { catalogId: "ew-dgr-05", name: "Shadow Claw", slot: "weapon", rarity: "epic", baseStats: { ATK: 49, CRIT: 10, SPEED: 5 }, weaponCategory: "dagger", description: "Dagger" },
];

const EPIC_MACES: CatalogItem[] = [
  { catalogId: "ew-mac-01", name: "Doom Maul", slot: "weapon", rarity: "epic", baseStats: { ATK: 74, DEF: 11 }, weaponCategory: "mace", twoHanded: true, description: "Mace" },
  { catalogId: "ew-mac-02", name: "Titan Crusher", slot: "weapon", rarity: "epic", baseStats: { ATK: 76, DEF: 10 }, weaponCategory: "mace", twoHanded: true, description: "Mace" },
  { catalogId: "ew-mac-03", name: "Bloodbreaker", slot: "weapon", rarity: "epic", baseStats: { ATK: 72, DEF: 12 }, weaponCategory: "mace", twoHanded: true, description: "Mace" },
  { catalogId: "ew-mac-04", name: "Storm Hammer", slot: "weapon", rarity: "epic", baseStats: { ATK: 70, DEF: 13 }, weaponCategory: "mace", twoHanded: true, description: "Mace" },
  { catalogId: "ew-mac-05", name: "Skull Mace", slot: "weapon", rarity: "epic", baseStats: { ATK: 75, DEF: 11 }, weaponCategory: "mace", twoHanded: true, description: "Mace" },
];

const EPIC_STAFFS: CatalogItem[] = [
  { catalogId: "ew-stf-01", name: "Arcane Oblivion", slot: "weapon", rarity: "epic", baseStats: { ATK: 57, CRIT: 7 }, weaponCategory: "staff", twoHanded: true, description: "Staff" },
  { catalogId: "ew-stf-02", name: "Doom Staff", slot: "weapon", rarity: "epic", baseStats: { ATK: 58, CRIT: 6 }, weaponCategory: "staff", twoHanded: true, description: "Staff" },
  { catalogId: "ew-stf-03", name: "Stormcaller", slot: "weapon", rarity: "epic", baseStats: { ATK: 55, CRIT: 8 }, weaponCategory: "staff", twoHanded: true, description: "Staff" },
  { catalogId: "ew-stf-04", name: "Blood Channeler", slot: "weapon", rarity: "epic", baseStats: { ATK: 56, CRIT: 7 }, weaponCategory: "staff", twoHanded: true, description: "Staff" },
  { catalogId: "ew-stf-05", name: "Titan Staff", slot: "weapon", rarity: "epic", baseStats: { ATK: 59, CRIT: 6 }, weaponCategory: "staff", twoHanded: true, description: "Staff" },
];

/* ================================================================== */
/*  WEAPON CATALOG — LEGENDARY (16) — Class Sets                       */
/* ================================================================== */

/** Warrior — Crimson Conqueror (Swords) */
const LEGENDARY_WARRIOR_WEAPONS: CatalogItem[] = [
  {
    catalogId: "lw-war-01",
    name: "Crimson Warblade",
    slot: "weapon",
    rarity: "legendary",
    baseStats: { ATK: 72, CRIT: 5 },
    weaponCategory: "sword",
    classRestriction: "warrior",
    setName: "crimson_conqueror",
    description: "The blade that carved an empire.",
  },
  {
    catalogId: "lw-war-02",
    name: "Crimson Destroyer",
    slot: "weapon",
    rarity: "legendary",
    baseStats: { ATK: 70, CRIT: 6 },
    weaponCategory: "sword",
    classRestriction: "warrior",
    setName: "crimson_conqueror",
    description: "Nothing stands before its edge.",
  },
  {
    catalogId: "lw-war-03",
    name: "Crimson Greatsword",
    slot: "weapon",
    rarity: "legendary",
    baseStats: { ATK: 68, CRIT: 4 },
    weaponCategory: "sword",
    twoHanded: true,
    classRestriction: "warrior",
    setName: "crimson_conqueror",
    description: "Forged from the heart of a dying star.",
  },
  {
    catalogId: "lw-war-04",
    name: "Crimson Executioner",
    slot: "weapon",
    rarity: "legendary",
    baseStats: { ATK: 67, CRIT: 7 },
    weaponCategory: "sword",
    classRestriction: "warrior",
    setName: "crimson_conqueror",
    description: "Judgment delivered in crimson steel.",
  },
];

/** Rogue — Shadow Reaper (Daggers) */
const LEGENDARY_ROGUE_WEAPONS: CatalogItem[] = [
  {
    catalogId: "lw-rog-01",
    name: "Shadow Reaper Fang",
    slot: "weapon",
    rarity: "legendary",
    baseStats: { ATK: 55, CRIT: 12, SPEED: 5 },
    weaponCategory: "dagger",
    classRestriction: "rogue",
    setName: "shadow_reaper",
    description: "One bite is all it takes.",
  },
  {
    catalogId: "lw-rog-02",
    name: "Shadow Reaper Twinblades",
    slot: "weapon",
    rarity: "legendary",
    baseStats: { ATK: 53, CRIT: 11, SPEED: 5 },
    weaponCategory: "dagger",
    classRestriction: "rogue",
    setName: "shadow_reaper",
    description: "Two strikes, one death.",
  },
  {
    catalogId: "lw-rog-03",
    name: "Shadow Reaper Knife",
    slot: "weapon",
    rarity: "legendary",
    baseStats: { ATK: 51, CRIT: 12, SPEED: 4 },
    weaponCategory: "dagger",
    classRestriction: "rogue",
    setName: "shadow_reaper",
    description: "The last thing they never saw.",
  },
  {
    catalogId: "lw-rog-04",
    name: "Shadow Reaper Talon",
    slot: "weapon",
    rarity: "legendary",
    baseStats: { ATK: 54, CRIT: 10, SPEED: 5 },
    weaponCategory: "dagger",
    classRestriction: "rogue",
    setName: "shadow_reaper",
    description: "Tears through armor like paper.",
  },
];

/** Mage — Arcane Dominion (Staffs) */
const LEGENDARY_MAGE_WEAPONS: CatalogItem[] = [
  {
    catalogId: "lw-mag-01",
    name: "Arcane Dominion Staff",
    slot: "weapon",
    rarity: "legendary",
    baseStats: { ATK: 62, CRIT: 8 },
    weaponCategory: "staff",
    twoHanded: true,
    classRestriction: "mage",
    setName: "arcane_dominion",
    description: "Channels the raw fabric of reality.",
  },
  {
    catalogId: "lw-mag-02",
    name: "Arcane Dominion Rod",
    slot: "weapon",
    rarity: "legendary",
    baseStats: { ATK: 60, CRIT: 7 },
    weaponCategory: "staff",
    twoHanded: true,
    classRestriction: "mage",
    setName: "arcane_dominion",
    description: "Bends the arcane to its wielder's will.",
  },
  {
    catalogId: "lw-mag-03",
    name: "Arcane Dominion Scepter",
    slot: "weapon",
    rarity: "legendary",
    baseStats: { ATK: 58, CRIT: 8 },
    weaponCategory: "staff",
    twoHanded: true,
    classRestriction: "mage",
    setName: "arcane_dominion",
    description: "A conduit of infinite power.",
  },
  {
    catalogId: "lw-mag-04",
    name: "Arcane Dominion Channeler",
    slot: "weapon",
    rarity: "legendary",
    baseStats: { ATK: 61, CRIT: 6 },
    weaponCategory: "staff",
    twoHanded: true,
    classRestriction: "mage",
    setName: "arcane_dominion",
    description: "Whispers spells that shatter worlds.",
  },
];

/** Tank — Iron Bastion (Maces) */
const LEGENDARY_TANK_WEAPONS: CatalogItem[] = [
  {
    catalogId: "lw-tnk-01",
    name: "Iron Bastion Hammer",
    slot: "weapon",
    rarity: "legendary",
    baseStats: { ATK: 60, DEF: 15, HP: 50 },
    weaponCategory: "mace",
    twoHanded: true,
    classRestriction: "tank",
    setName: "iron_bastion",
    description: "The mountain strikes back.",
  },
  {
    catalogId: "lw-tnk-02",
    name: "Iron Bastion Maul",
    slot: "weapon",
    rarity: "legendary",
    baseStats: { ATK: 58, DEF: 14, HP: 40 },
    weaponCategory: "mace",
    twoHanded: true,
    classRestriction: "tank",
    setName: "iron_bastion",
    description: "Crush all who dare approach.",
  },
  {
    catalogId: "lw-tnk-03",
    name: "Iron Bastion Crusher",
    slot: "weapon",
    rarity: "legendary",
    baseStats: { ATK: 55, DEF: 13, HP: 45 },
    weaponCategory: "mace",
    twoHanded: true,
    classRestriction: "tank",
    setName: "iron_bastion",
    description: "Weight of a fortress in one swing.",
  },
  {
    catalogId: "lw-tnk-04",
    name: "Iron Bastion Warhammer",
    slot: "weapon",
    rarity: "legendary",
    baseStats: { ATK: 57, DEF: 12, HP: 30 },
    weaponCategory: "mace",
    twoHanded: true,
    classRestriction: "tank",
    setName: "iron_bastion",
    description: "Unyielding iron, unbreakable will.",
  },
];

/* ================================================================== */
/*  AMULETS (16)                                                       */
/* ================================================================== */

const COMMON_AMULETS: CatalogItem[] = [
  { catalogId: "c-amu-01", name: "Wooden Pendant", slot: "amulet", rarity: "common", baseStats: { HP: 40, DEF: 8 }, description: "A simple talisman carved from oak." },
  { catalogId: "c-amu-02", name: "Bone Charm", slot: "amulet", rarity: "common", baseStats: { HP: 35, DEF: 10 }, description: "Rattles softly in the wind." },
  { catalogId: "c-amu-03", name: "Copper Locket", slot: "amulet", rarity: "common", baseStats: { HP: 45, DEF: 7 }, description: "Holds a faded portrait inside." },
  { catalogId: "c-amu-04", name: "Stone Talisman", slot: "amulet", rarity: "common", baseStats: { HP: 38, DEF: 9 }, description: "Heavy but reassuring." },
];

const RARE_AMULETS: CatalogItem[] = [
  { catalogId: "r-amu-01", name: "Silver Moon Pendant", slot: "amulet", rarity: "rare", baseStats: { HP: 75, DEF: 18, SPEED: 3 }, uniquePassive: "+5% healing received", description: "Glows faintly under moonlight." },
  { catalogId: "r-amu-02", name: "Wolfang Necklace", slot: "amulet", rarity: "rare", baseStats: { HP: 65, DEF: 22 }, uniquePassive: "+3% lifesteal on hit", description: "Carved from a dire wolf fang." },
  { catalogId: "r-amu-03", name: "Jade Amulet", slot: "amulet", rarity: "rare", baseStats: { HP: 80, DEF: 16, CRIT: 4 }, uniquePassive: "+8% poison resistance", description: "Cool to the touch, always." },
  { catalogId: "r-amu-04", name: "Ember Medallion", slot: "amulet", rarity: "rare", baseStats: { HP: 70, DEF: 20 }, uniquePassive: "+5% fire damage", description: "Warm metal, never burns." },
];

const EPIC_AMULETS: CatalogItem[] = [
  { catalogId: "e-amu-01", name: "Amulet of Vitality", slot: "amulet", rarity: "epic", baseStats: { HP: 140, DEF: 32, SPEED: 5 }, uniquePassive: "Regenerate 3% HP per turn", description: "Pulses with life energy." },
  { catalogId: "e-amu-02", name: "Shadowheart Pendant", slot: "amulet", rarity: "epic", baseStats: { HP: 120, DEF: 38, CRIT: 8 }, uniquePassive: "+12% damage in the dark", description: "Absorbs light around it." },
  { catalogId: "e-amu-03", name: "Stormcaller Torc", slot: "amulet", rarity: "epic", baseStats: { HP: 130, DEF: 35, ATK: 15 }, uniquePassive: "10% chance to stun on hit for 1 turn", description: "Crackles with static." },
  { catalogId: "e-amu-04", name: "Blessed Ankh", slot: "amulet", rarity: "epic", baseStats: { HP: 160, DEF: 28 }, uniquePassive: "Survive lethal blow with 1 HP once per battle", description: "Ancient symbol of eternal life." },
];

const LEGENDARY_AMULETS: CatalogItem[] = [
  { catalogId: "l-amu-01", name: "Crimson Heart Amulet", slot: "amulet", rarity: "legendary", baseStats: { HP: 220, DEF: 45, ATK: 20 }, uniquePassive: "On kill: restore 15% HP", classRestriction: "warrior", setName: "crimson_conqueror", description: "Beats with the fury of a thousand battles." },
  { catalogId: "l-amu-02", name: "Shadow Reaper Locket", slot: "amulet", rarity: "legendary", baseStats: { HP: 180, DEF: 35, CRIT: 18 }, uniquePassive: "Critical hits heal for 8% of damage dealt", classRestriction: "rogue", setName: "shadow_reaper", description: "Contains a fragment of living shadow." },
  { catalogId: "l-amu-03", name: "Arcane Dominion Amulet", slot: "amulet", rarity: "legendary", baseStats: { HP: 200, DEF: 40, SPEED: 8 }, uniquePassive: "Spells cost 20% less stamina", classRestriction: "mage", setName: "arcane_dominion", description: "Hums with concentrated arcane energy." },
  { catalogId: "l-amu-04", name: "Iron Bastion Medal", slot: "amulet", rarity: "legendary", baseStats: { HP: 280, DEF: 55 }, uniquePassive: "Reduce all incoming damage by 8%", classRestriction: "tank", setName: "iron_bastion", description: "Awarded to the unbreakable." },
];

/* ================================================================== */
/*  BELTS (16)                                                         */
/* ================================================================== */

const COMMON_BELTS: CatalogItem[] = [
  { catalogId: "c-blt-01", name: "Leather Belt", slot: "belt", rarity: "common", baseStats: { DEF: 12, ARMOR: 8 }, description: "Sturdy and reliable." },
  { catalogId: "c-blt-02", name: "Rope Sash", slot: "belt", rarity: "common", baseStats: { DEF: 10, ARMOR: 6, SPEED: 2 }, description: "Light and flexible." },
  { catalogId: "c-blt-03", name: "Chain Link Belt", slot: "belt", rarity: "common", baseStats: { DEF: 14, ARMOR: 10 }, description: "Clinks with every step." },
  { catalogId: "c-blt-04", name: "Cloth Sash", slot: "belt", rarity: "common", baseStats: { DEF: 8, ARMOR: 5, SPEED: 3 }, description: "Simple but comfortable." },
];

const RARE_BELTS: CatalogItem[] = [
  { catalogId: "r-blt-01", name: "Reinforced War Belt", slot: "belt", rarity: "rare", baseStats: { DEF: 24, ARMOR: 18, HP: 30 }, description: "Plated with iron studs." },
  { catalogId: "r-blt-02", name: "Ranger's Utility Belt", slot: "belt", rarity: "rare", baseStats: { DEF: 18, ARMOR: 14, SPEED: 5 }, description: "Full of useful pockets." },
  { catalogId: "r-blt-03", name: "Scaled Girdle", slot: "belt", rarity: "rare", baseStats: { DEF: 22, ARMOR: 20 }, description: "Dragon-scale pattern, impressive craftsmanship." },
  { catalogId: "r-blt-04", name: "Spiked Belt", slot: "belt", rarity: "rare", baseStats: { DEF: 20, ARMOR: 16, ATK: 8 }, description: "Intimidating and functional." },
];

const EPIC_BELTS: CatalogItem[] = [
  { catalogId: "e-blt-01", name: "Titan's Cinch", slot: "belt", rarity: "epic", baseStats: { DEF: 42, ARMOR: 32, HP: 60 }, description: "Forged for giants, sized for heroes." },
  { catalogId: "e-blt-02", name: "Windrunner Sash", slot: "belt", rarity: "epic", baseStats: { DEF: 30, ARMOR: 22, SPEED: 10 }, description: "Light as air, tough as steel." },
  { catalogId: "e-blt-03", name: "Bloodforged Girdle", slot: "belt", rarity: "epic", baseStats: { DEF: 38, ARMOR: 28, ATK: 15 }, description: "Tempered in battle blood." },
  { catalogId: "e-blt-04", name: "Guardian's Waistguard", slot: "belt", rarity: "epic", baseStats: { DEF: 45, ARMOR: 35 }, description: "Protects the vital core." },
];

const LEGENDARY_BELTS: CatalogItem[] = [
  { catalogId: "l-blt-01", name: "Crimson Conqueror Belt", slot: "belt", rarity: "legendary", baseStats: { DEF: 55, ARMOR: 42, ATK: 20, HP: 80 }, classRestriction: "warrior", setName: "crimson_conqueror", description: "A warrior's second spine." },
  { catalogId: "l-blt-02", name: "Shadow Reaper Cord", slot: "belt", rarity: "legendary", baseStats: { DEF: 40, ARMOR: 30, SPEED: 12, CRIT: 10 }, classRestriction: "rogue", setName: "shadow_reaper", description: "Holds a dozen hidden blades." },
  { catalogId: "l-blt-03", name: "Arcane Dominion Cincture", slot: "belt", rarity: "legendary", baseStats: { DEF: 45, ARMOR: 35, HP: 100, SPEED: 6 }, classRestriction: "mage", setName: "arcane_dominion", description: "Woven from solidified mana threads." },
  { catalogId: "l-blt-04", name: "Iron Bastion Waistplate", slot: "belt", rarity: "legendary", baseStats: { DEF: 65, ARMOR: 55, HP: 120 }, classRestriction: "tank", setName: "iron_bastion", description: "An immovable foundation." },
];

/* ================================================================== */
/*  RELICS (16)                                                        */
/* ================================================================== */

const COMMON_RELICS: CatalogItem[] = [
  { catalogId: "c-rel-01", name: "Cracked Orb", slot: "relic", rarity: "common", baseStats: { ATK: 10, CRIT: 2 }, description: "Still glimmers faintly." },
  { catalogId: "c-rel-02", name: "Old Figurine", slot: "relic", rarity: "common", baseStats: { ATK: 8, CRIT: 3 }, description: "Crudely carved but oddly powerful." },
  { catalogId: "c-rel-03", name: "Dusty Prism", slot: "relic", rarity: "common", baseStats: { ATK: 12, CRIT: 1 }, description: "Refracts light in strange ways." },
  { catalogId: "c-rel-04", name: "Worn Fetish", slot: "relic", rarity: "common", baseStats: { ATK: 9, CRIT: 2 }, description: "Smells faintly of incense." },
];

const RARE_RELICS: CatalogItem[] = [
  { catalogId: "r-rel-01", name: "Crimson Eye", slot: "relic", rarity: "rare", baseStats: { ATK: 22, CRIT: 6 }, uniquePassive: "+5% damage to bleeding targets", description: "Weeps red tears." },
  { catalogId: "r-rel-02", name: "Frost Shard", slot: "relic", rarity: "rare", baseStats: { ATK: 18, CRIT: 8, SPEED: 3 }, uniquePassive: "+8% slow chance on hit", description: "Never melts, always cold." },
  { catalogId: "r-rel-03", name: "Thunder Tooth", slot: "relic", rarity: "rare", baseStats: { ATK: 25, CRIT: 5 }, uniquePassive: "+6% chance to chain lightning on hit", description: "Sparks on contact." },
  { catalogId: "r-rel-04", name: "Venom Gland", slot: "relic", rarity: "rare", baseStats: { ATK: 20, CRIT: 7 }, uniquePassive: "+10% poison damage", description: "Extracted from a giant spider." },
];

const EPIC_RELICS: CatalogItem[] = [
  { catalogId: "e-rel-01", name: "Relic of Fury", slot: "relic", rarity: "epic", baseStats: { ATK: 42, CRIT: 12 }, uniquePassive: "+10% damage to stunned targets", description: "Channels pure rage." },
  { catalogId: "e-rel-02", name: "Void Fragment", slot: "relic", rarity: "epic", baseStats: { ATK: 38, CRIT: 15, SPEED: 5 }, uniquePassive: "Ignore 15% of target armor", description: "A piece of nothing, impossibly solid." },
  { catalogId: "e-rel-03", name: "Phoenix Feather", slot: "relic", rarity: "epic", baseStats: { ATK: 35, CRIT: 10, HP: 50 }, uniquePassive: "+20% damage when below 30% HP", description: "Burns brighter as hope fades." },
  { catalogId: "e-rel-04", name: "Demon Horn", slot: "relic", rarity: "epic", baseStats: { ATK: 45, CRIT: 14 }, uniquePassive: "Every 5th hit deals 50% bonus damage", description: "Torn from a pit fiend." },
];

const LEGENDARY_RELICS: CatalogItem[] = [
  { catalogId: "l-rel-01", name: "Crimson Conqueror Sigil", slot: "relic", rarity: "legendary", baseStats: { ATK: 60, CRIT: 18, HP: 80 }, uniquePassive: "Every 3rd hit deals 2x damage", classRestriction: "warrior", setName: "crimson_conqueror", description: "Emblem of unstoppable conquest." },
  { catalogId: "l-rel-02", name: "Shadow Reaper Effigy", slot: "relic", rarity: "legendary", baseStats: { ATK: 55, CRIT: 25, SPEED: 8 }, uniquePassive: "Critical hits have 30% chance to reset cooldowns", classRestriction: "rogue", setName: "shadow_reaper", description: "A perfect replica of death itself." },
  { catalogId: "l-rel-03", name: "Arcane Dominion Core", slot: "relic", rarity: "legendary", baseStats: { ATK: 50, CRIT: 20, HP: 60 }, uniquePassive: "Spells deal 25% bonus damage to targets below 50% HP", classRestriction: "mage", setName: "arcane_dominion", description: "The heart of a collapsed arcane tower." },
  { catalogId: "l-rel-04", name: "Iron Bastion Anvil", slot: "relic", rarity: "legendary", baseStats: { ATK: 45, CRIT: 12, DEF: 30, HP: 100 }, uniquePassive: "Reflect 15% of damage taken back to attacker", classRestriction: "tank", setName: "iron_bastion", description: "Unbreakable as the forge that made it." },
];

/* ================================================================== */
/*  LEGS / LEGGINGS (16)                                               */
/* ================================================================== */

/*
 * Base stats (level 30):
 *   Legs: DEF 50, HP 180, ARMOR 35
 *
 * Common x1.00, Rare x1.08, Epic x1.15, Legendary x1.22
 * ±10-15% variation
 */

const COMMON_LEGS: CatalogItem[] = [
  { catalogId: "c-leg-01", name: "Leather Trousers", slot: "legs", rarity: "common", baseStats: { DEF: 42, HP: 160, ARMOR: 28 }, description: "Worn but functional." },
  { catalogId: "c-leg-02", name: "Iron Greaves Pants", slot: "legs", rarity: "common", baseStats: { DEF: 48, HP: 165, ARMOR: 32 }, description: "Sturdy iron-plated legwear." },
  { catalogId: "c-leg-03", name: "Chain Leggings", slot: "legs", rarity: "common", baseStats: { DEF: 52, HP: 155, ARMOR: 35 }, description: "Chainmail from knee to waist." },
  { catalogId: "c-leg-04", name: "Cloth Pants", slot: "legs", rarity: "common", baseStats: { DEF: 38, HP: 185, ARMOR: 25 }, description: "Light and comfortable." },
];

const RARE_LEGS: CatalogItem[] = [
  { catalogId: "r-leg-01", name: "Knight Legguards", slot: "legs", rarity: "rare", baseStats: { DEF: 58, HP: 195, ARMOR: 55 }, description: "Part of a knight's full plate." },
  { catalogId: "r-leg-02", name: "Shadow Leggings", slot: "legs", rarity: "rare", baseStats: { DEF: 50, HP: 190, SPEED: 3, ARMOR: 48 }, description: "Silent steps, deadly strikes." },
  { catalogId: "r-leg-03", name: "Mystic Leg Wraps", slot: "legs", rarity: "rare", baseStats: { DEF: 48, HP: 200, ARMOR: 45 }, description: "Inscribed with protective runes." },
  { catalogId: "r-leg-04", name: "Storm Legplates", slot: "legs", rarity: "rare", baseStats: { DEF: 55, HP: 188, ARMOR: 52 }, description: "Crackling with residual energy." },
];

const EPIC_LEGS: CatalogItem[] = [
  { catalogId: "e-leg-01", name: "Doom Legplates", slot: "legs", rarity: "epic", baseStats: { DEF: 65, HP: 210, ARMOR: 85 }, description: "Heavy as fate itself." },
  { catalogId: "e-leg-02", name: "Shadow Legguards", slot: "legs", rarity: "epic", baseStats: { DEF: 56, HP: 205, SPEED: 5, ARMOR: 72 }, description: "Phase between shadows." },
  { catalogId: "e-leg-03", name: "Arcane Leggings", slot: "legs", rarity: "epic", baseStats: { DEF: 54, HP: 220, ARMOR: 68 }, description: "Woven from mana threads." },
  { catalogId: "e-leg-04", name: "Titan Legplates", slot: "legs", rarity: "epic", baseStats: { DEF: 68, HP: 200, ARMOR: 90 }, description: "Built for giants." },
];

const LEGENDARY_LEGS: CatalogItem[] = [
  { catalogId: "l-leg-01", name: "Crimson Conqueror Legplates", slot: "legs", rarity: "legendary", baseStats: { DEF: 72, HP: 240, ARMOR: 110, ATK: 15 }, classRestriction: "warrior", setName: "crimson_conqueror", description: "Stride into battle unbroken." },
  { catalogId: "l-leg-02", name: "Shadow Reaper Leggings", slot: "legs", rarity: "legendary", baseStats: { DEF: 55, HP: 200, ARMOR: 80, SPEED: 10, CRIT: 8 }, classRestriction: "rogue", setName: "shadow_reaper", description: "Silent steps leave no trace." },
  { catalogId: "l-leg-03", name: "Arcane Dominion Legwraps", slot: "legs", rarity: "legendary", baseStats: { DEF: 58, HP: 230, ARMOR: 75, SPEED: 6 }, classRestriction: "mage", setName: "arcane_dominion", description: "Enchanted fabric defies gravity." },
  { catalogId: "l-leg-04", name: "Iron Bastion Legplates", slot: "legs", rarity: "legendary", baseStats: { DEF: 80, HP: 280, ARMOR: 130 }, classRestriction: "tank", setName: "iron_bastion", description: "Roots you to the earth like a mountain." },
];

/* ================================================================== */
/*  NECKLACES (16)                                                     */
/* ================================================================== */

/*
 * Base stats (level 30):
 *   Necklace: HP 50, DEF 12, CRIT 4
 *
 * Unique passives on rare+ necklaces
 */

const COMMON_NECKLACES: CatalogItem[] = [
  { catalogId: "c-nck-01", name: "Copper Chain", slot: "necklace", rarity: "common", baseStats: { HP: 42, DEF: 10, CRIT: 2 }, description: "A simple copper chain." },
  { catalogId: "c-nck-02", name: "Leather Cord", slot: "necklace", rarity: "common", baseStats: { HP: 48, DEF: 8, CRIT: 3 }, description: "Braided from sturdy leather." },
  { catalogId: "c-nck-03", name: "Bone Necklace", slot: "necklace", rarity: "common", baseStats: { HP: 38, DEF: 12, CRIT: 2 }, description: "Tribal ornament of unknown origin." },
  { catalogId: "c-nck-04", name: "Iron Choker", slot: "necklace", rarity: "common", baseStats: { HP: 45, DEF: 11, CRIT: 3 }, description: "Cold iron protects the throat." },
];

const RARE_NECKLACES: CatalogItem[] = [
  { catalogId: "r-nck-01", name: "Ruby Pendant", slot: "necklace", rarity: "rare", baseStats: { HP: 80, DEF: 20, CRIT: 6 }, uniquePassive: "+4% critical damage", description: "A flawless ruby set in silver." },
  { catalogId: "r-nck-02", name: "Sapphire Chain", slot: "necklace", rarity: "rare", baseStats: { HP: 90, DEF: 18, CRIT: 5, SPEED: 3 }, uniquePassive: "+6% mana efficiency", description: "Cool blue light pulses within." },
  { catalogId: "r-nck-03", name: "Emerald Necklace", slot: "necklace", rarity: "rare", baseStats: { HP: 85, DEF: 22, CRIT: 5 }, uniquePassive: "+5% healing received", description: "The jewel of the forest kings." },
  { catalogId: "r-nck-04", name: "Onyx Gorget", slot: "necklace", rarity: "rare", baseStats: { HP: 75, DEF: 24, CRIT: 7 }, uniquePassive: "+3% damage reduction at night", description: "Black as midnight, hard as stone." },
];

const EPIC_NECKLACES: CatalogItem[] = [
  { catalogId: "e-nck-01", name: "Necklace of Wrath", slot: "necklace", rarity: "epic", baseStats: { HP: 145, DEF: 35, CRIT: 10, ATK: 12 }, uniquePassive: "+8% damage when below 50% HP", description: "Fury crystallized in gemstone." },
  { catalogId: "e-nck-02", name: "Dragonscale Collar", slot: "necklace", rarity: "epic", baseStats: { HP: 160, DEF: 40, CRIT: 8 }, uniquePassive: "Reduce fire damage taken by 15%", description: "Scales of an ancient drake." },
  { catalogId: "e-nck-03", name: "Starfall Pendant", slot: "necklace", rarity: "epic", baseStats: { HP: 135, DEF: 32, CRIT: 12, SPEED: 5 }, uniquePassive: "10% chance to dodge next attack after a crit", description: "A fragment of a fallen star." },
  { catalogId: "e-nck-04", name: "Lifeblood Choker", slot: "necklace", rarity: "epic", baseStats: { HP: 180, DEF: 38 }, uniquePassive: "Regenerate 2% HP per turn", description: "Pulses in rhythm with your heart." },
];

const LEGENDARY_NECKLACES: CatalogItem[] = [
  { catalogId: "l-nck-01", name: "Crimson Conqueror Chain", slot: "necklace", rarity: "legendary", baseStats: { HP: 230, DEF: 50, ATK: 25, CRIT: 10 }, uniquePassive: "Every kill grants +5% ATK for 3 turns (stacks)", classRestriction: "warrior", setName: "crimson_conqueror", description: "Links forged from battlefield trophies." },
  { catalogId: "l-nck-02", name: "Shadow Reaper Torque", slot: "necklace", rarity: "legendary", baseStats: { HP: 190, DEF: 38, CRIT: 20, SPEED: 8 }, uniquePassive: "Critical hits apply 3-turn bleed (2% max HP/turn)", classRestriction: "rogue", setName: "shadow_reaper", description: "Whispers the name of the next victim." },
  { catalogId: "l-nck-03", name: "Arcane Dominion Collar", slot: "necklace", rarity: "legendary", baseStats: { HP: 210, DEF: 45, CRIT: 15, SPEED: 6 }, uniquePassive: "Spell crits restore 10% stamina", classRestriction: "mage", setName: "arcane_dominion", description: "Channels raw arcane through the wearer." },
  { catalogId: "l-nck-04", name: "Iron Bastion Gorget", slot: "necklace", rarity: "legendary", baseStats: { HP: 290, DEF: 60 }, uniquePassive: "Block incoming critical hits (reduce crit damage by 40%)", classRestriction: "tank", setName: "iron_bastion", description: "An impenetrable collar of living iron." },
];

/* ================================================================== */
/*  RINGS (16)                                                         */
/* ================================================================== */

/*
 * Base stats (level 30):
 *   Ring: ATK 15, CRIT 5, SPEED 2
 *
 * Unique passives on rare+ rings
 */

const COMMON_RINGS: CatalogItem[] = [
  { catalogId: "c-rng-01", name: "Copper Ring", slot: "ring", rarity: "common", baseStats: { ATK: 12, CRIT: 3, SPEED: 2 }, description: "A simple band of copper." },
  { catalogId: "c-rng-02", name: "Iron Band", slot: "ring", rarity: "common", baseStats: { ATK: 14, CRIT: 4, SPEED: 1 }, description: "Cold iron, warm hands." },
  { catalogId: "c-rng-03", name: "Bronze Signet", slot: "ring", rarity: "common", baseStats: { ATK: 16, CRIT: 3, SPEED: 2 }, description: "Bears an unknown seal." },
  { catalogId: "c-rng-04", name: "Bone Ring", slot: "ring", rarity: "common", baseStats: { ATK: 13, CRIT: 5, SPEED: 1 }, description: "Carved from a beast's fang." },
];

const RARE_RINGS: CatalogItem[] = [
  { catalogId: "r-rng-01", name: "Ruby Ring", slot: "ring", rarity: "rare", baseStats: { ATK: 24, CRIT: 7, SPEED: 3 }, uniquePassive: "+3% fire damage", description: "Burns with inner fire." },
  { catalogId: "r-rng-02", name: "Sapphire Ring", slot: "ring", rarity: "rare", baseStats: { ATK: 20, CRIT: 8, SPEED: 4 }, uniquePassive: "+5% mana regeneration", description: "Cool to the touch, always." },
  { catalogId: "r-rng-03", name: "Emerald Band", slot: "ring", rarity: "rare", baseStats: { ATK: 22, CRIT: 6, SPEED: 3, HP: 30 }, uniquePassive: "+4% nature damage", description: "Vines grow from the stone." },
  { catalogId: "r-rng-04", name: "Onyx Seal", slot: "ring", rarity: "rare", baseStats: { ATK: 26, CRIT: 9, SPEED: 2 }, uniquePassive: "+5% damage to weakened targets", description: "Absorbs the light around it." },
];

const EPIC_RINGS: CatalogItem[] = [
  { catalogId: "e-rng-01", name: "Ring of Fury", slot: "ring", rarity: "epic", baseStats: { ATK: 38, CRIT: 14, SPEED: 4 }, uniquePassive: "+12% damage on next attack after taking a hit", description: "Rage forged into metal." },
  { catalogId: "e-rng-02", name: "Voidstone Ring", slot: "ring", rarity: "epic", baseStats: { ATK: 35, CRIT: 16, SPEED: 5 }, uniquePassive: "Ignore 10% of target armor", description: "Contains a shard of the void." },
  { catalogId: "e-rng-03", name: "Phoenix Signet", slot: "ring", rarity: "epic", baseStats: { ATK: 32, CRIT: 12, SPEED: 4, HP: 50 }, uniquePassive: "On death: 15% chance to revive with 20% HP (once per battle)", description: "The phoenix never dies forever." },
  { catalogId: "e-rng-04", name: "Dragonheart Ring", slot: "ring", rarity: "epic", baseStats: { ATK: 40, CRIT: 15, SPEED: 3 }, uniquePassive: "Every 4th attack deals 30% bonus fire damage", description: "A dragon's heartbeat in a ring." },
];

const LEGENDARY_RINGS: CatalogItem[] = [
  { catalogId: "l-rng-01", name: "Crimson Conqueror Seal", slot: "ring", rarity: "legendary", baseStats: { ATK: 55, CRIT: 15, SPEED: 4, HP: 60 }, uniquePassive: "ATK increases by 2% per consecutive hit (resets on miss)", classRestriction: "warrior", setName: "crimson_conqueror", description: "Seal of the undefeated champion." },
  { catalogId: "l-rng-02", name: "Shadow Reaper Ring", slot: "ring", rarity: "legendary", baseStats: { ATK: 48, CRIT: 22, SPEED: 10 }, uniquePassive: "First attack each battle is guaranteed critical", classRestriction: "rogue", setName: "shadow_reaper", description: "One ring, one kill." },
  { catalogId: "l-rng-03", name: "Arcane Dominion Band", slot: "ring", rarity: "legendary", baseStats: { ATK: 45, CRIT: 18, SPEED: 6, HP: 50 }, uniquePassive: "Spell damage +15% against targets with active debuffs", classRestriction: "mage", setName: "arcane_dominion", description: "A circle of infinite arcane loops." },
  { catalogId: "l-rng-04", name: "Iron Bastion Band", slot: "ring", rarity: "legendary", baseStats: { ATK: 40, CRIT: 10, DEF: 25, HP: 80 }, uniquePassive: "Taunt all enemies for 2 turns at battle start", classRestriction: "tank", setName: "iron_bastion", description: "The ring that binds the frontline." },
];

/* ================================================================== */
/*  FULL CATALOG                                                       */
/* ================================================================== */

export const ITEM_CATALOG: CatalogItem[] = [
  // --- Armor (116) ---
  // Common (50)
  ...COMMON_HELMETS,
  ...COMMON_GLOVES,
  ...COMMON_CHESTS,
  ...COMMON_BOOTS,
  // Rare (30)
  ...RARE_HELMETS,
  ...RARE_GLOVES,
  ...RARE_CHESTS,
  ...RARE_BOOTS,
  // Epic (20)
  ...EPIC_HELMETS,
  ...EPIC_GLOVES,
  ...EPIC_CHESTS,
  ...EPIC_BOOTS,
  // Legendary (16)
  ...LEGENDARY_WARRIOR,
  ...LEGENDARY_ROGUE,
  ...LEGENDARY_MAGE,
  ...LEGENDARY_TANK,

  // --- Weapons (116) ---
  // Common (50)
  ...COMMON_SWORDS,
  ...COMMON_DAGGERS,
  ...COMMON_MACES,
  ...COMMON_STAFFS,
  // Rare (30)
  ...RARE_SWORDS,
  ...RARE_DAGGERS,
  ...RARE_MACES,
  ...RARE_STAFFS,
  // Epic (20)
  ...EPIC_SWORDS,
  ...EPIC_DAGGERS,
  ...EPIC_MACES,
  ...EPIC_STAFFS,
  // Legendary (16)
  ...LEGENDARY_WARRIOR_WEAPONS,
  ...LEGENDARY_ROGUE_WEAPONS,
  ...LEGENDARY_MAGE_WEAPONS,
  ...LEGENDARY_TANK_WEAPONS,

  // --- Amulets (16) ---
  ...COMMON_AMULETS,
  ...RARE_AMULETS,
  ...EPIC_AMULETS,
  ...LEGENDARY_AMULETS,

  // --- Belts (16) ---
  ...COMMON_BELTS,
  ...RARE_BELTS,
  ...EPIC_BELTS,
  ...LEGENDARY_BELTS,

  // --- Relics (16) ---
  ...COMMON_RELICS,
  ...RARE_RELICS,
  ...EPIC_RELICS,
  ...LEGENDARY_RELICS,

  // --- Legs (16) ---
  ...COMMON_LEGS,
  ...RARE_LEGS,
  ...EPIC_LEGS,
  ...LEGENDARY_LEGS,

  // --- Necklaces (16) ---
  ...COMMON_NECKLACES,
  ...RARE_NECKLACES,
  ...EPIC_NECKLACES,
  ...LEGENDARY_NECKLACES,

  // --- Rings (16) ---
  ...COMMON_RINGS,
  ...RARE_RINGS,
  ...EPIC_RINGS,
  ...LEGENDARY_RINGS,
];

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

export const getCatalogItemById = (catalogId: string): CatalogItem | undefined =>
  ITEM_CATALOG.find((i) => i.catalogId === catalogId);

export const getCatalogItemsByRarity = (rarity: CatalogItem["rarity"]): CatalogItem[] =>
  ITEM_CATALOG.filter((i) => i.rarity === rarity);

export const getCatalogItemsBySlot = (slot: ItemSlot): CatalogItem[] =>
  ITEM_CATALOG.filter((i) => i.slot === slot);

export const getSetItems = (setName: string): CatalogItem[] =>
  ITEM_CATALOG.filter((i) => i.setName === setName);

/** Check if a weapon catalog item is two-handed by catalogId */
export const isWeaponTwoHanded = (catalogId: string): boolean => {
  const item = getCatalogItemById(catalogId);
  return item?.twoHanded === true;
};

export const SET_NAMES = [
  "crimson_conqueror",
  "shadow_reaper",
  "arcane_dominion",
  "iron_bastion",
] as const;

export type SetName = (typeof SET_NAMES)[number];

/** Rarity drop rates from Item System Design */
export const RARITY_DROP_RATES: Record<CatalogItem["rarity"], number> = {
  common: 0.60,
  rare: 0.30,
  epic: 0.09,
  legendary: 0.01,
};

/** Rarity stat multipliers */
export const RARITY_STAT_MULTIPLIERS: Record<CatalogItem["rarity"], number> = {
  common: 1.00,
  rare: 1.08,
  epic: 1.15,
  legendary: 1.22,
};

/** Sell value multipliers (percentage of base) */
export const RARITY_SELL_MULTIPLIERS: Record<CatalogItem["rarity"], number> = {
  common: 1.00,
  rare: 1.20,
  epic: 1.50,
  legendary: 2.20,
};
