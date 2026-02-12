/**
 * Item Catalog v1.0 — 116 fixed items
 *
 * Stats calculated from Item System Design Document:
 * - Base stats at level 30 baseline
 * - Rarity multipliers: Common x1.00, Rare x1.08, Epic x1.15, Legendary x1.22
 * - ±10-15% variation within same rarity for diversity
 * - Legendary items have unique stat distributions per class set
 */

export type ItemSlot = "helmet" | "gloves" | "chest" | "boots" | "weapon";

export type ItemStatKey = "ATK" | "DEF" | "HP" | "CRIT" | "SPEED";

export type CatalogItem = {
  catalogId: string;
  name: string;
  slot: ItemSlot;
  rarity: "common" | "rare" | "epic" | "legendary";
  baseStats: Partial<Record<ItemStatKey, number>>;
  classRestriction?: "warrior" | "rogue" | "mage" | "tank";
  setName?: string;
  description?: string;
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
  { catalogId: "c-helm-01", name: "Rusted Helm", slot: "helmet", rarity: "common", baseStats: { DEF: 30, HP: 105 } },
  { catalogId: "c-helm-02", name: "Iron Cap", slot: "helmet", rarity: "common", baseStats: { DEF: 33, HP: 110 } },
  { catalogId: "c-helm-03", name: "Worn Visor", slot: "helmet", rarity: "common", baseStats: { DEF: 31, HP: 115 } },
  { catalogId: "c-helm-04", name: "Leather Hood", slot: "helmet", rarity: "common", baseStats: { DEF: 28, HP: 125 } },
  { catalogId: "c-helm-05", name: "Guard Helm", slot: "helmet", rarity: "common", baseStats: { DEF: 36, HP: 118 } },
  { catalogId: "c-helm-06", name: "Steel Mask", slot: "helmet", rarity: "common", baseStats: { DEF: 38, HP: 112 } },
  { catalogId: "c-helm-07", name: "Old Battle Helm", slot: "helmet", rarity: "common", baseStats: { DEF: 35, HP: 120 } },
  { catalogId: "c-helm-08", name: "Scout Hood", slot: "helmet", rarity: "common", baseStats: { DEF: 29, HP: 130 } },
  { catalogId: "c-helm-09", name: "Traveler Cap", slot: "helmet", rarity: "common", baseStats: { DEF: 32, HP: 122 } },
  { catalogId: "c-helm-10", name: "Chain Hood", slot: "helmet", rarity: "common", baseStats: { DEF: 37, HP: 108 } },
  { catalogId: "c-helm-11", name: "Bronze Helm", slot: "helmet", rarity: "common", baseStats: { DEF: 34, HP: 116 } },
  { catalogId: "c-helm-12", name: "Training Helm", slot: "helmet", rarity: "common", baseStats: { DEF: 30, HP: 128 } },
  { catalogId: "c-helm-13", name: "Militia Helm", slot: "helmet", rarity: "common", baseStats: { DEF: 35, HP: 120 } },
];

const COMMON_GLOVES: CatalogItem[] = [
  { catalogId: "c-glv-01", name: "Rough Gloves", slot: "gloves", rarity: "common", baseStats: { ATK: 39 } },
  { catalogId: "c-glv-02", name: "Leather Grips", slot: "gloves", rarity: "common", baseStats: { ATK: 41 } },
  { catalogId: "c-glv-03", name: "Iron Knuckles", slot: "gloves", rarity: "common", baseStats: { ATK: 47 } },
  { catalogId: "c-glv-04", name: "Worn Gauntlets", slot: "gloves", rarity: "common", baseStats: { ATK: 43 } },
  { catalogId: "c-glv-05", name: "Battle Wraps", slot: "gloves", rarity: "common", baseStats: { ATK: 45 } },
  { catalogId: "c-glv-06", name: "Steel Gloves", slot: "gloves", rarity: "common", baseStats: { ATK: 48 } },
  { catalogId: "c-glv-07", name: "Training Gloves", slot: "gloves", rarity: "common", baseStats: { ATK: 38 } },
  { catalogId: "c-glv-08", name: "Padded Gloves", slot: "gloves", rarity: "common", baseStats: { ATK: 40 } },
  { catalogId: "c-glv-09", name: "Guard Grips", slot: "gloves", rarity: "common", baseStats: { ATK: 44 } },
  { catalogId: "c-glv-10", name: "Soldier Gauntlets", slot: "gloves", rarity: "common", baseStats: { ATK: 46 } },
  { catalogId: "c-glv-11", name: "Scout Gloves", slot: "gloves", rarity: "common", baseStats: { ATK: 42 } },
  { catalogId: "c-glv-12", name: "Old War Gloves", slot: "gloves", rarity: "common", baseStats: { ATK: 50 } },
];

const COMMON_CHESTS: CatalogItem[] = [
  { catalogId: "c-cst-01", name: "Rusted Armor", slot: "chest", rarity: "common", baseStats: { DEF: 60, HP: 220 } },
  { catalogId: "c-cst-02", name: "Leather Vest", slot: "chest", rarity: "common", baseStats: { DEF: 62, HP: 230 } },
  { catalogId: "c-cst-03", name: "Iron Plate", slot: "chest", rarity: "common", baseStats: { DEF: 72, HP: 240 } },
  { catalogId: "c-cst-04", name: "Guard Chest", slot: "chest", rarity: "common", baseStats: { DEF: 68, HP: 250 } },
  { catalogId: "c-cst-05", name: "Bronze Armor", slot: "chest", rarity: "common", baseStats: { DEF: 65, HP: 255 } },
  { catalogId: "c-cst-06", name: "Soldier Mail", slot: "chest", rarity: "common", baseStats: { DEF: 70, HP: 248 } },
  { catalogId: "c-cst-07", name: "Chain Armor", slot: "chest", rarity: "common", baseStats: { DEF: 74, HP: 235 } },
  { catalogId: "c-cst-08", name: "Battle Vest", slot: "chest", rarity: "common", baseStats: { DEF: 66, HP: 260 } },
  { catalogId: "c-cst-09", name: "Scout Armor", slot: "chest", rarity: "common", baseStats: { DEF: 63, HP: 270 } },
  { catalogId: "c-cst-10", name: "Worn Cuirass", slot: "chest", rarity: "common", baseStats: { DEF: 70, HP: 245 } },
  { catalogId: "c-cst-11", name: "Militia Plate", slot: "chest", rarity: "common", baseStats: { DEF: 75, HP: 225 } },
  { catalogId: "c-cst-12", name: "Training Armor", slot: "chest", rarity: "common", baseStats: { DEF: 60, HP: 275 } },
  { catalogId: "c-cst-13", name: "Steel Breastplate", slot: "chest", rarity: "common", baseStats: { DEF: 78, HP: 215 } },
];

const COMMON_BOOTS: CatalogItem[] = [
  { catalogId: "c-bts-01", name: "Leather Boots", slot: "boots", rarity: "common", baseStats: { ATK: 13, DEF: 13, SPEED: 4 } },
  { catalogId: "c-bts-02", name: "Iron Boots", slot: "boots", rarity: "common", baseStats: { ATK: 14, DEF: 16, SPEED: 4 } },
  { catalogId: "c-bts-03", name: "Guard Greaves", slot: "boots", rarity: "common", baseStats: { ATK: 15, DEF: 15, SPEED: 5 } },
  { catalogId: "c-bts-04", name: "Scout Boots", slot: "boots", rarity: "common", baseStats: { ATK: 13, DEF: 12, SPEED: 6 } },
  { catalogId: "c-bts-05", name: "Steel Boots", slot: "boots", rarity: "common", baseStats: { ATK: 16, DEF: 16, SPEED: 4 } },
  { catalogId: "c-bts-06", name: "Battle Boots", slot: "boots", rarity: "common", baseStats: { ATK: 17, DEF: 14, SPEED: 5 } },
  { catalogId: "c-bts-07", name: "Traveler Boots", slot: "boots", rarity: "common", baseStats: { ATK: 12, DEF: 13, SPEED: 6 } },
  { catalogId: "c-bts-08", name: "Chain Boots", slot: "boots", rarity: "common", baseStats: { ATK: 14, DEF: 17, SPEED: 4 } },
  { catalogId: "c-bts-09", name: "Soldier Greaves", slot: "boots", rarity: "common", baseStats: { ATK: 16, DEF: 15, SPEED: 5 } },
  { catalogId: "c-bts-10", name: "Worn Boots", slot: "boots", rarity: "common", baseStats: { ATK: 13, DEF: 14, SPEED: 5 } },
  { catalogId: "c-bts-11", name: "Bronze Greaves", slot: "boots", rarity: "common", baseStats: { ATK: 15, DEF: 16, SPEED: 5 } },
  { catalogId: "c-bts-12", name: "Training Boots", slot: "boots", rarity: "common", baseStats: { ATK: 14, DEF: 13, SPEED: 5 } },
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
  { catalogId: "r-helm-01", name: "Knight Helm", slot: "helmet", rarity: "rare", baseStats: { DEF: 40, HP: 135 } },
  { catalogId: "r-helm-02", name: "Silent Hood", slot: "helmet", rarity: "rare", baseStats: { DEF: 35, HP: 140 } },
  { catalogId: "r-helm-03", name: "Vanguard Helm", slot: "helmet", rarity: "rare", baseStats: { DEF: 42, HP: 125 } },
  { catalogId: "r-helm-04", name: "Storm Visor", slot: "helmet", rarity: "rare", baseStats: { DEF: 38, HP: 130 } },
  { catalogId: "r-helm-05", name: "Battle Crown", slot: "helmet", rarity: "rare", baseStats: { DEF: 36, HP: 138 } },
  { catalogId: "r-helm-06", name: "Assassin Hood", slot: "helmet", rarity: "rare", baseStats: { DEF: 33, HP: 135, CRIT: 3 } },
  { catalogId: "r-helm-07", name: "Mystic Hood", slot: "helmet", rarity: "rare", baseStats: { DEF: 34, HP: 132 } },
  { catalogId: "r-helm-08", name: "War Captain Helm", slot: "helmet", rarity: "rare", baseStats: { DEF: 41, HP: 128 } },
];

const RARE_GLOVES: CatalogItem[] = [
  { catalogId: "r-glv-01", name: "Power Gauntlets", slot: "gloves", rarity: "rare", baseStats: { ATK: 52 } },
  { catalogId: "r-glv-02", name: "Shadow Grips", slot: "gloves", rarity: "rare", baseStats: { ATK: 48, CRIT: 2 } },
  { catalogId: "r-glv-03", name: "Arcane Gloves", slot: "gloves", rarity: "rare", baseStats: { ATK: 46 } },
  { catalogId: "r-glv-04", name: "Swift Gauntlets", slot: "gloves", rarity: "rare", baseStats: { ATK: 47, SPEED: 2 } },
  { catalogId: "r-glv-05", name: "Ironclad Gloves", slot: "gloves", rarity: "rare", baseStats: { ATK: 50 } },
  { catalogId: "r-glv-06", name: "Assassin Wraps", slot: "gloves", rarity: "rare", baseStats: { ATK: 49, CRIT: 2 } },
  { catalogId: "r-glv-07", name: "Storm Grips", slot: "gloves", rarity: "rare", baseStats: { ATK: 51 } },
];

const RARE_CHESTS: CatalogItem[] = [
  { catalogId: "r-cst-01", name: "Knight Armor", slot: "chest", rarity: "rare", baseStats: { DEF: 80, HP: 275 } },
  { catalogId: "r-cst-02", name: "Shadow Vest", slot: "chest", rarity: "rare", baseStats: { DEF: 70, HP: 265 } },
  { catalogId: "r-cst-03", name: "Mystic Robe", slot: "chest", rarity: "rare", baseStats: { DEF: 68, HP: 280 } },
  { catalogId: "r-cst-04", name: "Vanguard Plate", slot: "chest", rarity: "rare", baseStats: { DEF: 82, HP: 260 } },
  { catalogId: "r-cst-05", name: "Ironwall Armor", slot: "chest", rarity: "rare", baseStats: { DEF: 85, HP: 255 } },
  { catalogId: "r-cst-06", name: "Storm Armor", slot: "chest", rarity: "rare", baseStats: { DEF: 76, HP: 270 } },
  { catalogId: "r-cst-07", name: "Warplate", slot: "chest", rarity: "rare", baseStats: { DEF: 78, HP: 268 } },
  { catalogId: "r-cst-08", name: "Assassin Armor", slot: "chest", rarity: "rare", baseStats: { DEF: 72, HP: 272 } },
];

const RARE_BOOTS: CatalogItem[] = [
  { catalogId: "r-bts-01", name: "Swift Boots", slot: "boots", rarity: "rare", baseStats: { ATK: 15, DEF: 14, SPEED: 7 } },
  { catalogId: "r-bts-02", name: "Shadow Boots", slot: "boots", rarity: "rare", baseStats: { ATK: 16, DEF: 15, SPEED: 6 } },
  { catalogId: "r-bts-03", name: "Knight Greaves", slot: "boots", rarity: "rare", baseStats: { ATK: 17, DEF: 18, SPEED: 5 } },
  { catalogId: "r-bts-04", name: "Storm Greaves", slot: "boots", rarity: "rare", baseStats: { ATK: 16, DEF: 16, SPEED: 6 } },
  { catalogId: "r-bts-05", name: "Mystic Sandals", slot: "boots", rarity: "rare", baseStats: { ATK: 14, DEF: 14, SPEED: 7 } },
  { catalogId: "r-bts-06", name: "Vanguard Boots", slot: "boots", rarity: "rare", baseStats: { ATK: 18, DEF: 17, SPEED: 5 } },
  { catalogId: "r-bts-07", name: "Ironstride Boots", slot: "boots", rarity: "rare", baseStats: { ATK: 17, DEF: 18, SPEED: 5 } },
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
  { catalogId: "e-helm-01", name: "Doom Helm", slot: "helmet", rarity: "epic", baseStats: { DEF: 44, HP: 145 } },
  { catalogId: "e-helm-02", name: "Shadow Crown", slot: "helmet", rarity: "epic", baseStats: { DEF: 38, HP: 140, CRIT: 4 } },
  { catalogId: "e-helm-03", name: "Arcane Diadem", slot: "helmet", rarity: "epic", baseStats: { DEF: 36, HP: 142, CRIT: 3 } },
  { catalogId: "e-helm-04", name: "Titan Helm", slot: "helmet", rarity: "epic", baseStats: { DEF: 46, HP: 135 } },
  { catalogId: "e-helm-05", name: "Blood Visor", slot: "helmet", rarity: "epic", baseStats: { DEF: 40, HP: 138, ATK: 8 } },
];

const EPIC_GLOVES: CatalogItem[] = [
  { catalogId: "e-glv-01", name: "Doom Gauntlets", slot: "gloves", rarity: "epic", baseStats: { ATK: 56 } },
  { catalogId: "e-glv-02", name: "Shadow Claws", slot: "gloves", rarity: "epic", baseStats: { ATK: 52, CRIT: 4 } },
  { catalogId: "e-glv-03", name: "Arcane Grips", slot: "gloves", rarity: "epic", baseStats: { ATK: 50 } },
  { catalogId: "e-glv-04", name: "Titan Fists", slot: "gloves", rarity: "epic", baseStats: { ATK: 58 } },
  { catalogId: "e-glv-05", name: "Blood Knuckles", slot: "gloves", rarity: "epic", baseStats: { ATK: 54, HP: 30 } },
];

const EPIC_CHESTS: CatalogItem[] = [
  { catalogId: "e-cst-01", name: "Doom Armor", slot: "chest", rarity: "epic", baseStats: { DEF: 88, HP: 290 } },
  { catalogId: "e-cst-02", name: "Shadow Plate", slot: "chest", rarity: "epic", baseStats: { DEF: 78, HP: 285 } },
  { catalogId: "e-cst-03", name: "Arcane Vestment", slot: "chest", rarity: "epic", baseStats: { DEF: 75, HP: 300 } },
  { catalogId: "e-cst-04", name: "Titan Plate", slot: "chest", rarity: "epic", baseStats: { DEF: 92, HP: 280 } },
  { catalogId: "e-cst-05", name: "Blood Armor", slot: "chest", rarity: "epic", baseStats: { DEF: 81, HP: 288 } },
];

const EPIC_BOOTS: CatalogItem[] = [
  { catalogId: "e-bts-01", name: "Doom Greaves", slot: "boots", rarity: "epic", baseStats: { ATK: 19, DEF: 19, SPEED: 6 } },
  { catalogId: "e-bts-02", name: "Shadow Steps", slot: "boots", rarity: "epic", baseStats: { ATK: 17, DEF: 16, SPEED: 8 } },
  { catalogId: "e-bts-03", name: "Arcane Boots", slot: "boots", rarity: "epic", baseStats: { ATK: 16, DEF: 16, SPEED: 7 } },
  { catalogId: "e-bts-04", name: "Titan Greaves", slot: "boots", rarity: "epic", baseStats: { ATK: 20, DEF: 20, SPEED: 5 } },
  { catalogId: "e-bts-05", name: "Bloodstride Boots", slot: "boots", rarity: "epic", baseStats: { ATK: 18, DEF: 18, SPEED: 7 } },
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
    baseStats: { ATK: 25, DEF: 30 },
    classRestriction: "warrior",
    setName: "crimson_conqueror",
    description: "Forged in the blood of a thousand battles.",
  },
  {
    catalogId: "l-war-glv",
    name: "Crimson War Gauntlets",
    slot: "gloves",
    rarity: "legendary",
    baseStats: { ATK: 55 },
    classRestriction: "warrior",
    setName: "crimson_conqueror",
    description: "Each blow carries the weight of conquest.",
  },
  {
    catalogId: "l-war-cst",
    name: "Crimson War Plate",
    slot: "chest",
    rarity: "legendary",
    baseStats: { HP: 305, DEF: 85 },
    classRestriction: "warrior",
    setName: "crimson_conqueror",
    description: "Unyielding armor of the Crimson Legion.",
  },
  {
    catalogId: "l-war-bts",
    name: "Crimson War Greaves",
    slot: "boots",
    rarity: "legendary",
    baseStats: { SPEED: 8 },
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
    baseStats: { CRIT: 12 },
    classRestriction: "rogue",
    setName: "shadow_reaper",
    description: "See every weakness before the strike.",
  },
  {
    catalogId: "l-rog-glv",
    name: "Shadow Reaper Gloves",
    slot: "gloves",
    rarity: "legendary",
    baseStats: { ATK: 55 },
    classRestriction: "rogue",
    setName: "shadow_reaper",
    description: "Silent hands that end lives.",
  },
  {
    catalogId: "l-rog-cst",
    name: "Shadow Reaper Vest",
    slot: "chest",
    rarity: "legendary",
    baseStats: { DEF: 50 },
    classRestriction: "rogue",
    setName: "shadow_reaper",
    description: "Light enough to vanish, tough enough to survive.",
  },
  {
    catalogId: "l-rog-bts",
    name: "Shadow Reaper Boots",
    slot: "boots",
    rarity: "legendary",
    baseStats: { SPEED: 12 },
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
    baseStats: { CRIT: 10 },
    classRestriction: "mage",
    setName: "arcane_dominion",
    description: "Channel the raw essence of the arcane.",
  },
  {
    catalogId: "l-mag-glv",
    name: "Arcane Dominion Grips",
    slot: "gloves",
    rarity: "legendary",
    baseStats: { ATK: 50 },
    classRestriction: "mage",
    setName: "arcane_dominion",
    description: "Every gesture unleashes devastation.",
  },
  {
    catalogId: "l-mag-cst",
    name: "Arcane Dominion Robe",
    slot: "chest",
    rarity: "legendary",
    baseStats: { HP: 305 },
    classRestriction: "mage",
    setName: "arcane_dominion",
    description: "Woven from threads of pure mana.",
  },
  {
    catalogId: "l-mag-bts",
    name: "Arcane Dominion Sandals",
    slot: "boots",
    rarity: "legendary",
    baseStats: { SPEED: 8 },
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
    baseStats: { DEF: 55 },
    classRestriction: "tank",
    setName: "iron_bastion",
    description: "An immovable wall begins at the head.",
  },
  {
    catalogId: "l-tnk-glv",
    name: "Iron Bastion Gauntlets",
    slot: "gloves",
    rarity: "legendary",
    baseStats: { DEF: 45 },
    classRestriction: "tank",
    setName: "iron_bastion",
    description: "Grip the enemy and never let go.",
  },
  {
    catalogId: "l-tnk-cst",
    name: "Iron Bastion Plate",
    slot: "chest",
    rarity: "legendary",
    baseStats: { HP: 380 },
    classRestriction: "tank",
    setName: "iron_bastion",
    description: "The fortress walks among mortals.",
  },
  {
    catalogId: "l-tnk-bts",
    name: "Iron Bastion Greaves",
    slot: "boots",
    rarity: "legendary",
    baseStats: { DEF: 25, HP: 100 },
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
  { catalogId: "cw-swd-01", name: "Rusted Sword", slot: "weapon", rarity: "common", baseStats: { ATK: 48, CRIT: 2 }, description: "Sword" },
  { catalogId: "cw-swd-02", name: "Iron Blade", slot: "weapon", rarity: "common", baseStats: { ATK: 52, CRIT: 3 }, description: "Sword" },
  { catalogId: "cw-swd-03", name: "Short Sword", slot: "weapon", rarity: "common", baseStats: { ATK: 50, CRIT: 3 }, description: "Sword" },
  { catalogId: "cw-swd-04", name: "Guard Sword", slot: "weapon", rarity: "common", baseStats: { ATK: 55, CRIT: 3 }, description: "Sword" },
  { catalogId: "cw-swd-05", name: "Bronze Saber", slot: "weapon", rarity: "common", baseStats: { ATK: 53, CRIT: 2 }, description: "Sword" },
  { catalogId: "cw-swd-06", name: "Militia Blade", slot: "weapon", rarity: "common", baseStats: { ATK: 56, CRIT: 3 }, description: "Sword" },
  { catalogId: "cw-swd-07", name: "Steel Cutter", slot: "weapon", rarity: "common", baseStats: { ATK: 58, CRIT: 2 }, description: "Sword" },
  { catalogId: "cw-swd-08", name: "Old War Sword", slot: "weapon", rarity: "common", baseStats: { ATK: 54, CRIT: 4 }, description: "Sword" },
  { catalogId: "cw-swd-09", name: "Training Blade", slot: "weapon", rarity: "common", baseStats: { ATK: 47, CRIT: 3 }, description: "Sword" },
  { catalogId: "cw-swd-10", name: "Broad Sword", slot: "weapon", rarity: "common", baseStats: { ATK: 60, CRIT: 2 }, description: "Sword" },
  { catalogId: "cw-swd-11", name: "Soldier Sword", slot: "weapon", rarity: "common", baseStats: { ATK: 55, CRIT: 3 }, description: "Sword" },
  { catalogId: "cw-swd-12", name: "Chainblade", slot: "weapon", rarity: "common", baseStats: { ATK: 57, CRIT: 3 }, description: "Sword" },
  { catalogId: "cw-swd-13", name: "Traveler Sword", slot: "weapon", rarity: "common", baseStats: { ATK: 51, CRIT: 4 }, description: "Sword" },
];

const COMMON_DAGGERS: CatalogItem[] = [
  { catalogId: "cw-dgr-01", name: "Rusted Dagger", slot: "weapon", rarity: "common", baseStats: { ATK: 36, CRIT: 7, SPEED: 2 }, description: "Dagger" },
  { catalogId: "cw-dgr-02", name: "Iron Dagger", slot: "weapon", rarity: "common", baseStats: { ATK: 40, CRIT: 8, SPEED: 3 }, description: "Dagger" },
  { catalogId: "cw-dgr-03", name: "Scout Knife", slot: "weapon", rarity: "common", baseStats: { ATK: 38, CRIT: 7, SPEED: 4 }, description: "Dagger" },
  { catalogId: "cw-dgr-04", name: "Bronze Dagger", slot: "weapon", rarity: "common", baseStats: { ATK: 41, CRIT: 8, SPEED: 3 }, description: "Dagger" },
  { catalogId: "cw-dgr-05", name: "Steel Shiv", slot: "weapon", rarity: "common", baseStats: { ATK: 44, CRIT: 9, SPEED: 2 }, description: "Dagger" },
  { catalogId: "cw-dgr-06", name: "Silent Knife", slot: "weapon", rarity: "common", baseStats: { ATK: 39, CRIT: 8, SPEED: 4 }, description: "Dagger" },
  { catalogId: "cw-dgr-07", name: "Guard Dagger", slot: "weapon", rarity: "common", baseStats: { ATK: 42, CRIT: 7, SPEED: 3 }, description: "Dagger" },
  { catalogId: "cw-dgr-08", name: "War Knife", slot: "weapon", rarity: "common", baseStats: { ATK: 45, CRIT: 8, SPEED: 2 }, description: "Dagger" },
  { catalogId: "cw-dgr-09", name: "Training Dagger", slot: "weapon", rarity: "common", baseStats: { ATK: 37, CRIT: 7, SPEED: 3 }, description: "Dagger" },
  { catalogId: "cw-dgr-10", name: "Twin Blade", slot: "weapon", rarity: "common", baseStats: { ATK: 43, CRIT: 9, SPEED: 3 }, description: "Dagger" },
  { catalogId: "cw-dgr-11", name: "Short Fang", slot: "weapon", rarity: "common", baseStats: { ATK: 40, CRIT: 8, SPEED: 3 }, description: "Dagger" },
  { catalogId: "cw-dgr-12", name: "Militia Knife", slot: "weapon", rarity: "common", baseStats: { ATK: 42, CRIT: 8, SPEED: 3 }, description: "Dagger" },
];

const COMMON_MACES: CatalogItem[] = [
  { catalogId: "cw-mac-01", name: "Iron Mace", slot: "weapon", rarity: "common", baseStats: { ATK: 58, DEF: 7 }, description: "Mace" },
  { catalogId: "cw-mac-02", name: "Bronze Hammer", slot: "weapon", rarity: "common", baseStats: { ATK: 60, DEF: 8 }, description: "Mace" },
  { catalogId: "cw-mac-03", name: "Guard Hammer", slot: "weapon", rarity: "common", baseStats: { ATK: 62, DEF: 9 }, description: "Mace" },
  { catalogId: "cw-mac-04", name: "Rusted Mace", slot: "weapon", rarity: "common", baseStats: { ATK: 54, DEF: 7 }, description: "Mace" },
  { catalogId: "cw-mac-05", name: "Soldier Hammer", slot: "weapon", rarity: "common", baseStats: { ATK: 63, DEF: 8 }, description: "Mace" },
  { catalogId: "cw-mac-06", name: "War Mace", slot: "weapon", rarity: "common", baseStats: { ATK: 65, DEF: 7 }, description: "Mace" },
  { catalogId: "cw-mac-07", name: "Steel Crusher", slot: "weapon", rarity: "common", baseStats: { ATK: 66, DEF: 8 }, description: "Mace" },
  { catalogId: "cw-mac-08", name: "Training Hammer", slot: "weapon", rarity: "common", baseStats: { ATK: 55, DEF: 6 }, description: "Mace" },
  { catalogId: "cw-mac-09", name: "Old Maul", slot: "weapon", rarity: "common", baseStats: { ATK: 57, DEF: 9 }, description: "Mace" },
  { catalogId: "cw-mac-10", name: "Heavy Club", slot: "weapon", rarity: "common", baseStats: { ATK: 68, DEF: 6 }, description: "Mace" },
  { catalogId: "cw-mac-11", name: "Chain Mace", slot: "weapon", rarity: "common", baseStats: { ATK: 61, DEF: 8 }, description: "Mace" },
  { catalogId: "cw-mac-12", name: "Militia Hammer", slot: "weapon", rarity: "common", baseStats: { ATK: 62, DEF: 8 }, description: "Mace" },
  { catalogId: "cw-mac-13", name: "Iron Maul", slot: "weapon", rarity: "common", baseStats: { ATK: 64, DEF: 7 }, description: "Mace" },
];

const COMMON_STAFFS: CatalogItem[] = [
  { catalogId: "cw-stf-01", name: "Wooden Staff", slot: "weapon", rarity: "common", baseStats: { ATK: 42, CRIT: 4 }, description: "Staff" },
  { catalogId: "cw-stf-02", name: "Iron Staff", slot: "weapon", rarity: "common", baseStats: { ATK: 46, CRIT: 5 }, description: "Staff" },
  { catalogId: "cw-stf-03", name: "Training Staff", slot: "weapon", rarity: "common", baseStats: { ATK: 41, CRIT: 4 }, description: "Staff" },
  { catalogId: "cw-stf-04", name: "Bronze Rod", slot: "weapon", rarity: "common", baseStats: { ATK: 45, CRIT: 5 }, description: "Staff" },
  { catalogId: "cw-stf-05", name: "Guard Staff", slot: "weapon", rarity: "common", baseStats: { ATK: 48, CRIT: 5 }, description: "Staff" },
  { catalogId: "cw-stf-06", name: "War Staff", slot: "weapon", rarity: "common", baseStats: { ATK: 50, CRIT: 4 }, description: "Staff" },
  { catalogId: "cw-stf-07", name: "Mystic Rod", slot: "weapon", rarity: "common", baseStats: { ATK: 44, CRIT: 6 }, description: "Staff" },
  { catalogId: "cw-stf-08", name: "Old Staff", slot: "weapon", rarity: "common", baseStats: { ATK: 43, CRIT: 5 }, description: "Staff" },
  { catalogId: "cw-stf-09", name: "Traveler Staff", slot: "weapon", rarity: "common", baseStats: { ATK: 47, CRIT: 5 }, description: "Staff" },
  { catalogId: "cw-stf-10", name: "Chain Rod", slot: "weapon", rarity: "common", baseStats: { ATK: 49, CRIT: 4 }, description: "Staff" },
  { catalogId: "cw-stf-11", name: "Soldier Staff", slot: "weapon", rarity: "common", baseStats: { ATK: 48, CRIT: 5 }, description: "Staff" },
  { catalogId: "cw-stf-12", name: "Steel Rod", slot: "weapon", rarity: "common", baseStats: { ATK: 52, CRIT: 5 }, description: "Staff" },
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
  { catalogId: "rw-swd-01", name: "Knight Blade", slot: "weapon", rarity: "rare", baseStats: { ATK: 60, CRIT: 4 }, description: "Sword" },
  { catalogId: "rw-swd-02", name: "Storm Saber", slot: "weapon", rarity: "rare", baseStats: { ATK: 58, CRIT: 5 }, description: "Sword" },
  { catalogId: "rw-swd-03", name: "Vanguard Sword", slot: "weapon", rarity: "rare", baseStats: { ATK: 62, CRIT: 3 }, description: "Sword" },
  { catalogId: "rw-swd-04", name: "Blood Saber", slot: "weapon", rarity: "rare", baseStats: { ATK: 59, CRIT: 4 }, description: "Sword" },
  { catalogId: "rw-swd-05", name: "Silver Edge", slot: "weapon", rarity: "rare", baseStats: { ATK: 57, CRIT: 5 }, description: "Sword" },
  { catalogId: "rw-swd-06", name: "War Captain Blade", slot: "weapon", rarity: "rare", baseStats: { ATK: 63, CRIT: 3 }, description: "Sword" },
  { catalogId: "rw-swd-07", name: "Assassin Sword", slot: "weapon", rarity: "rare", baseStats: { ATK: 56, CRIT: 6 }, description: "Sword" },
  { catalogId: "rw-swd-08", name: "Mystic Saber", slot: "weapon", rarity: "rare", baseStats: { ATK: 58, CRIT: 4 }, description: "Sword" },
];

const RARE_DAGGERS: CatalogItem[] = [
  { catalogId: "rw-dgr-01", name: "Shadow Fang", slot: "weapon", rarity: "rare", baseStats: { ATK: 44, CRIT: 10, SPEED: 4 }, description: "Dagger" },
  { catalogId: "rw-dgr-02", name: "Swift Blade", slot: "weapon", rarity: "rare", baseStats: { ATK: 43, CRIT: 9, SPEED: 5 }, description: "Dagger" },
  { catalogId: "rw-dgr-03", name: "Silver Dagger", slot: "weapon", rarity: "rare", baseStats: { ATK: 46, CRIT: 9, SPEED: 3 }, description: "Dagger" },
  { catalogId: "rw-dgr-04", name: "Blood Knife", slot: "weapon", rarity: "rare", baseStats: { ATK: 47, CRIT: 10, SPEED: 3 }, description: "Dagger" },
  { catalogId: "rw-dgr-05", name: "Silent Edge", slot: "weapon", rarity: "rare", baseStats: { ATK: 42, CRIT: 9, SPEED: 5 }, description: "Dagger" },
  { catalogId: "rw-dgr-06", name: "Assassin Fang", slot: "weapon", rarity: "rare", baseStats: { ATK: 45, CRIT: 10, SPEED: 4 }, description: "Dagger" },
  { catalogId: "rw-dgr-07", name: "Storm Knife", slot: "weapon", rarity: "rare", baseStats: { ATK: 48, CRIT: 8, SPEED: 3 }, description: "Dagger" },
];

const RARE_MACES: CatalogItem[] = [
  { catalogId: "rw-mac-01", name: "Ironclad Mace", slot: "weapon", rarity: "rare", baseStats: { ATK: 67, DEF: 10 }, description: "Mace" },
  { catalogId: "rw-mac-02", name: "Vanguard Hammer", slot: "weapon", rarity: "rare", baseStats: { ATK: 68, DEF: 9 }, description: "Mace" },
  { catalogId: "rw-mac-03", name: "Storm Maul", slot: "weapon", rarity: "rare", baseStats: { ATK: 65, DEF: 10 }, description: "Mace" },
  { catalogId: "rw-mac-04", name: "Blood Crusher", slot: "weapon", rarity: "rare", baseStats: { ATK: 70, DEF: 8 }, description: "Mace" },
  { catalogId: "rw-mac-05", name: "Knight Hammer", slot: "weapon", rarity: "rare", baseStats: { ATK: 66, DEF: 11 }, description: "Mace" },
  { catalogId: "rw-mac-06", name: "War Mace II", slot: "weapon", rarity: "rare", baseStats: { ATK: 69, DEF: 9 }, description: "Mace" },
  { catalogId: "rw-mac-07", name: "Silver Maul", slot: "weapon", rarity: "rare", baseStats: { ATK: 64, DEF: 10 }, description: "Mace" },
  { catalogId: "rw-mac-08", name: "Titan Hammer", slot: "weapon", rarity: "rare", baseStats: { ATK: 72, DEF: 8 }, description: "Mace" },
];

const RARE_STAFFS: CatalogItem[] = [
  { catalogId: "rw-stf-01", name: "Mystic Staff", slot: "weapon", rarity: "rare", baseStats: { ATK: 52, CRIT: 6 }, description: "Staff" },
  { catalogId: "rw-stf-02", name: "Arcane Rod", slot: "weapon", rarity: "rare", baseStats: { ATK: 50, CRIT: 7 }, description: "Staff" },
  { catalogId: "rw-stf-03", name: "Storm Staff", slot: "weapon", rarity: "rare", baseStats: { ATK: 54, CRIT: 5 }, description: "Staff" },
  { catalogId: "rw-stf-04", name: "Blood Staff", slot: "weapon", rarity: "rare", baseStats: { ATK: 53, CRIT: 6 }, description: "Staff" },
  { catalogId: "rw-stf-05", name: "Silver Staff", slot: "weapon", rarity: "rare", baseStats: { ATK: 51, CRIT: 7 }, description: "Staff" },
  { catalogId: "rw-stf-06", name: "Warlock Rod", slot: "weapon", rarity: "rare", baseStats: { ATK: 55, CRIT: 5 }, description: "Staff" },
  { catalogId: "rw-stf-07", name: "Vanguard Staff", slot: "weapon", rarity: "rare", baseStats: { ATK: 53, CRIT: 6 }, description: "Staff" },
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
  { catalogId: "ew-swd-01", name: "Doom Blade", slot: "weapon", rarity: "epic", baseStats: { ATK: 66, CRIT: 5 }, description: "Sword" },
  { catalogId: "ew-swd-02", name: "Blood Reaver", slot: "weapon", rarity: "epic", baseStats: { ATK: 64, CRIT: 6 }, description: "Sword" },
  { catalogId: "ew-swd-03", name: "Titan Edge", slot: "weapon", rarity: "epic", baseStats: { ATK: 68, CRIT: 4 }, description: "Sword" },
  { catalogId: "ew-swd-04", name: "Stormbringer", slot: "weapon", rarity: "epic", baseStats: { ATK: 63, CRIT: 6 }, description: "Sword" },
  { catalogId: "ew-swd-05", name: "Shadowfang", slot: "weapon", rarity: "epic", baseStats: { ATK: 62, CRIT: 7 }, description: "Sword" },
];

const EPIC_DAGGERS: CatalogItem[] = [
  { catalogId: "ew-dgr-01", name: "Nightpiercer", slot: "weapon", rarity: "epic", baseStats: { ATK: 50, CRIT: 12, SPEED: 4 }, description: "Dagger" },
  { catalogId: "ew-dgr-02", name: "Soul Fang", slot: "weapon", rarity: "epic", baseStats: { ATK: 48, CRIT: 11, SPEED: 5 }, description: "Dagger" },
  { catalogId: "ew-dgr-03", name: "Blood Talon", slot: "weapon", rarity: "epic", baseStats: { ATK: 51, CRIT: 11, SPEED: 4 }, description: "Dagger" },
  { catalogId: "ew-dgr-04", name: "Silent Doom", slot: "weapon", rarity: "epic", baseStats: { ATK: 47, CRIT: 12, SPEED: 5 }, description: "Dagger" },
  { catalogId: "ew-dgr-05", name: "Shadow Claw", slot: "weapon", rarity: "epic", baseStats: { ATK: 49, CRIT: 10, SPEED: 5 }, description: "Dagger" },
];

const EPIC_MACES: CatalogItem[] = [
  { catalogId: "ew-mac-01", name: "Doom Maul", slot: "weapon", rarity: "epic", baseStats: { ATK: 74, DEF: 11 }, description: "Mace" },
  { catalogId: "ew-mac-02", name: "Titan Crusher", slot: "weapon", rarity: "epic", baseStats: { ATK: 76, DEF: 10 }, description: "Mace" },
  { catalogId: "ew-mac-03", name: "Bloodbreaker", slot: "weapon", rarity: "epic", baseStats: { ATK: 72, DEF: 12 }, description: "Mace" },
  { catalogId: "ew-mac-04", name: "Storm Hammer", slot: "weapon", rarity: "epic", baseStats: { ATK: 70, DEF: 13 }, description: "Mace" },
  { catalogId: "ew-mac-05", name: "Skull Mace", slot: "weapon", rarity: "epic", baseStats: { ATK: 75, DEF: 11 }, description: "Mace" },
];

const EPIC_STAFFS: CatalogItem[] = [
  { catalogId: "ew-stf-01", name: "Arcane Oblivion", slot: "weapon", rarity: "epic", baseStats: { ATK: 57, CRIT: 7 }, description: "Staff" },
  { catalogId: "ew-stf-02", name: "Doom Staff", slot: "weapon", rarity: "epic", baseStats: { ATK: 58, CRIT: 6 }, description: "Staff" },
  { catalogId: "ew-stf-03", name: "Stormcaller", slot: "weapon", rarity: "epic", baseStats: { ATK: 55, CRIT: 8 }, description: "Staff" },
  { catalogId: "ew-stf-04", name: "Blood Channeler", slot: "weapon", rarity: "epic", baseStats: { ATK: 56, CRIT: 7 }, description: "Staff" },
  { catalogId: "ew-stf-05", name: "Titan Staff", slot: "weapon", rarity: "epic", baseStats: { ATK: 59, CRIT: 6 }, description: "Staff" },
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
    classRestriction: "tank",
    setName: "iron_bastion",
    description: "Unyielding iron, unbreakable will.",
  },
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
