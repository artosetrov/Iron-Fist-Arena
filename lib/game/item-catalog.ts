/**
 * Item Catalog v1.3 — Trimmed catalog for cleaner shop
 *
 * Armor:  Common 5/slot (20), Rare 4/slot (16), Epic 3/slot (12), Legendary 4 sets x4 (16) = 64
 * Weapons: Common 5/type (20), Rare 4/type (16), Epic 3/type (12), Legendary 4 sets x4 (16) = 64
 * Accessories: Amulets 16, Belts 16, Relics 16, Legs 15, Necklaces 16, Rings 16 = 95
 *
 * Total: ~223 items (down from ~328)
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
/*  COMMON ITEMS (20)                                                  */
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
  { catalogId: "c-helm-01", name: "Rusted Helm", slot: "helmet", rarity: "common", baseStats: { DEF: 30, HP: 105, ARMOR: 22 }, description: "Found in a ditch. The previous owner didn't need it anymore." },
  { catalogId: "c-helm-04", name: "Leather Hood", slot: "helmet", rarity: "common", baseStats: { DEF: 28, HP: 125, ARMOR: 21 }, description: "Makes you look mysterious. Smell? Less so." },
  { catalogId: "c-helm-06", name: "Steel Mask", slot: "helmet", rarity: "common", baseStats: { DEF: 38, HP: 112, ARMOR: 28 }, description: "Hides your face. And your shame." },
  { catalogId: "c-helm-07", name: "Old Battle Helm", slot: "helmet", rarity: "common", baseStats: { DEF: 35, HP: 120, ARMOR: 25 }, description: "Survived more battles than its owner." },
  { catalogId: "c-helm-10", name: "Chain Hood", slot: "helmet", rarity: "common", baseStats: { DEF: 37, HP: 108, ARMOR: 27 }, description: "Jangling chains announce your arrival. Stealth optional." },
];

const COMMON_GLOVES: CatalogItem[] = [
  { catalogId: "c-glv-01", name: "Rough Gloves", slot: "gloves", rarity: "common", baseStats: { ATK: 39, ARMOR: 13 }, description: "Found behind a tavern. Don't sniff them." },
  { catalogId: "c-glv-03", name: "Iron Knuckles", slot: "gloves", rarity: "common", baseStats: { ATK: 47, ARMOR: 16 }, description: "For when words aren't enough. Which is always." },
  { catalogId: "c-glv-06", name: "Steel Gloves", slot: "gloves", rarity: "common", baseStats: { ATK: 48, ARMOR: 17 }, description: "Can't feel your fingers? Working as intended." },
  { catalogId: "c-glv-09", name: "Guard Grips", slot: "gloves", rarity: "common", baseStats: { ATK: 44, ARMOR: 15 }, description: "Tight enough to hold a sword. Barely." },
  { catalogId: "c-glv-12", name: "Old War Gloves", slot: "gloves", rarity: "common", baseStats: { ATK: 50, ARMOR: 17 }, description: "Seen three wars. Won none of them." },
];

const COMMON_CHESTS: CatalogItem[] = [
  { catalogId: "c-cst-01", name: "Rusted Armor", slot: "chest", rarity: "common", baseStats: { DEF: 60, HP: 220, ARMOR: 39 }, description: "Tetanus included at no extra charge." },
  { catalogId: "c-cst-03", name: "Iron Plate", slot: "chest", rarity: "common", baseStats: { DEF: 72, HP: 240, ARMOR: 47 }, description: "Heavy as guilt. Twice as uncomfortable." },
  { catalogId: "c-cst-07", name: "Chain Armor", slot: "chest", rarity: "common", baseStats: { DEF: 74, HP: 235, ARMOR: 48 }, description: "Sounds like a wind chime in combat. Enemies appreciate the ambiance." },
  { catalogId: "c-cst-09", name: "Scout Armor", slot: "chest", rarity: "common", baseStats: { DEF: 63, HP: 270, ARMOR: 41 }, description: "Light enough to run away in. You'll need to." },
  { catalogId: "c-cst-13", name: "Steel Breastplate", slot: "chest", rarity: "common", baseStats: { DEF: 78, HP: 215, ARMOR: 52 }, description: "Shiny enough to see your regrets in." },
];

const COMMON_BOOTS: CatalogItem[] = [
  { catalogId: "c-bts-01", name: "Leather Boots", slot: "boots", rarity: "common", baseStats: { ATK: 13, DEF: 13, SPEED: 4, ARMOR: 13 }, description: "Smells like regret and stale ale." },
  { catalogId: "c-bts-04", name: "Scout Boots", slot: "boots", rarity: "common", baseStats: { ATK: 13, DEF: 12, SPEED: 6, ARMOR: 13 }, description: "Fast feet, thin soles. Watch for pebbles." },
  { catalogId: "c-bts-06", name: "Battle Boots", slot: "boots", rarity: "common", baseStats: { ATK: 17, DEF: 14, SPEED: 5, ARMOR: 14 }, description: "Kick first, ask questions never." },
  { catalogId: "c-bts-08", name: "Chain Boots", slot: "boots", rarity: "common", baseStats: { ATK: 14, DEF: 17, SPEED: 4, ARMOR: 17 }, description: "Clink, clink, clink. Stealth is dead." },
  { catalogId: "c-bts-05", name: "Steel Boots", slot: "boots", rarity: "common", baseStats: { ATK: 16, DEF: 16, SPEED: 4, ARMOR: 16 }, description: "Your toes are safe. Your ankles, not so much." },
];

/* ================================================================== */
/*  RARE ITEMS (16)                                                    */
/* ================================================================== */

/*
 * Rare multiplier: x1.08
 *   Helmet: DEF ~38, HP ~130
 *   Gloves: ATK ~49
 *   Chest:  DEF ~76, HP ~270
 *   Boots:  ATK ~16, DEF ~16, SPEED ~5
 */

const RARE_HELMETS: CatalogItem[] = [
  { catalogId: "r-helm-01", name: "Knight Helm", slot: "helmet", rarity: "rare", baseStats: { DEF: 40, HP: 135, ARMOR: 50 }, description: "Standard-issue for knights who survived training." },
  { catalogId: "r-helm-03", name: "Vanguard Helm", slot: "helmet", rarity: "rare", baseStats: { DEF: 42, HP: 125, ARMOR: 52 }, description: "First into battle, last to break." },
  { catalogId: "r-helm-06", name: "Assassin Hood", slot: "helmet", rarity: "rare", baseStats: { DEF: 33, HP: 135, CRIT: 3, ARMOR: 42 }, description: "Hides your face and your intentions." },
  { catalogId: "r-helm-04", name: "Storm Visor", slot: "helmet", rarity: "rare", baseStats: { DEF: 38, HP: 130, ARMOR: 48 }, description: "Forged during a thunderstorm. The sparks were free." },
];

const RARE_GLOVES: CatalogItem[] = [
  { catalogId: "r-glv-01", name: "Power Gauntlets", slot: "gloves", rarity: "rare", baseStats: { ATK: 52, ARMOR: 30 }, description: "Grip strength that cracks walnuts and skulls." },
  { catalogId: "r-glv-02", name: "Shadow Grips", slot: "gloves", rarity: "rare", baseStats: { ATK: 48, CRIT: 2, ARMOR: 26 }, description: "Leave no fingerprints. Ever." },
  { catalogId: "r-glv-04", name: "Swift Gauntlets", slot: "gloves", rarity: "rare", baseStats: { ATK: 47, SPEED: 2, ARMOR: 27 }, description: "Light enough to punch twice before they blink." },
  { catalogId: "r-glv-07", name: "Storm Grips", slot: "gloves", rarity: "rare", baseStats: { ATK: 51, ARMOR: 30 }, description: "Spark slightly when you clench your fist." },
];

const RARE_CHESTS: CatalogItem[] = [
  { catalogId: "r-cst-01", name: "Knight Armor", slot: "chest", rarity: "rare", baseStats: { DEF: 80, HP: 275, ARMOR: 92 }, description: "Dented in all the right places." },
  { catalogId: "r-cst-03", name: "Mystic Robe", slot: "chest", rarity: "rare", baseStats: { DEF: 68, HP: 280, ARMOR: 78 }, description: "The runes glow when danger is near. Or on Tuesdays." },
  { catalogId: "r-cst-05", name: "Ironwall Armor", slot: "chest", rarity: "rare", baseStats: { DEF: 85, HP: 255, ARMOR: 96 }, description: "You don't dodge. You don't need to." },
  { catalogId: "r-cst-08", name: "Assassin Armor", slot: "chest", rarity: "rare", baseStats: { DEF: 72, HP: 272, ARMOR: 82 }, description: "Tight-fitting, silent, and suspiciously affordable." },
];

const RARE_BOOTS: CatalogItem[] = [
  { catalogId: "r-bts-01", name: "Swift Boots", slot: "boots", rarity: "rare", baseStats: { ATK: 15, DEF: 14, SPEED: 7, ARMOR: 27 }, description: "Fast enough to outrun most problems." },
  { catalogId: "r-bts-03", name: "Knight Greaves", slot: "boots", rarity: "rare", baseStats: { ATK: 17, DEF: 18, SPEED: 5, ARMOR: 31 }, description: "Steel-toed for kicking down doors and egos." },
  { catalogId: "r-bts-05", name: "Mystic Sandals", slot: "boots", rarity: "rare", baseStats: { ATK: 14, DEF: 14, SPEED: 7, ARMOR: 25 }, description: "Enchanted soles that hover just above the mud." },
  { catalogId: "r-bts-06", name: "Vanguard Boots", slot: "boots", rarity: "rare", baseStats: { ATK: 18, DEF: 17, SPEED: 5, ARMOR: 32 }, description: "Built to charge forward, not retreat." },
];

/* ================================================================== */
/*  EPIC ITEMS (12)                                                    */
/* ================================================================== */

/*
 * Epic multiplier: x1.15
 *   Helmet: DEF ~40, HP ~138
 *   Gloves: ATK ~52
 *   Chest:  DEF ~81, HP ~288
 *   Boots:  ATK ~17, DEF ~17, SPEED ~6
 */

const EPIC_HELMETS: CatalogItem[] = [
  { catalogId: "e-helm-01", name: "Doom Helm", slot: "helmet", rarity: "epic", baseStats: { DEF: 44, HP: 145, ARMOR: 72 }, description: "Stare into the visor. Nothing stares back." },
  { catalogId: "e-helm-02", name: "Shadow Crown", slot: "helmet", rarity: "epic", baseStats: { DEF: 38, HP: 140, CRIT: 4, ARMOR: 64 }, description: "Darkness crowns itself upon your brow." },
  { catalogId: "e-helm-04", name: "Titan Helm", slot: "helmet", rarity: "epic", baseStats: { DEF: 46, HP: 135, ARMOR: 75 }, description: "Forged for heads that never bow." },
];

const EPIC_GLOVES: CatalogItem[] = [
  { catalogId: "e-glv-01", name: "Doom Gauntlets", slot: "gloves", rarity: "epic", baseStats: { ATK: 56, ARMOR: 42 }, description: "Anything you grab with these stays grabbed. Forever." },
  { catalogId: "e-glv-02", name: "Shadow Claws", slot: "gloves", rarity: "epic", baseStats: { ATK: 52, CRIT: 4, ARMOR: 38 }, description: "They cut what light cannot touch." },
  { catalogId: "e-glv-04", name: "Titan Fists", slot: "gloves", rarity: "epic", baseStats: { ATK: 58, ARMOR: 44 }, description: "One punch reshapes the battlefield." },
];

const EPIC_CHESTS: CatalogItem[] = [
  { catalogId: "e-cst-01", name: "Doom Armor", slot: "chest", rarity: "epic", baseStats: { DEF: 88, HP: 290, ARMOR: 128 }, description: "Blades shatter on contact. So do hopes." },
  { catalogId: "e-cst-03", name: "Arcane Vestment", slot: "chest", rarity: "epic", baseStats: { DEF: 75, HP: 300, ARMOR: 110 }, description: "Woven from raw mana. Handle with awe." },
  { catalogId: "e-cst-04", name: "Titan Plate", slot: "chest", rarity: "epic", baseStats: { DEF: 92, HP: 280, ARMOR: 135 }, description: "Mountains crumble. This doesn't." },
];

const EPIC_BOOTS: CatalogItem[] = [
  { catalogId: "e-bts-01", name: "Doom Greaves", slot: "boots", rarity: "epic", baseStats: { ATK: 19, DEF: 19, SPEED: 6, ARMOR: 42 }, description: "Each step cracks the earth beneath." },
  { catalogId: "e-bts-02", name: "Shadow Steps", slot: "boots", rarity: "epic", baseStats: { ATK: 17, DEF: 16, SPEED: 8, ARMOR: 36 }, description: "You were never here. Your enemies will swear it." },
  { catalogId: "e-bts-04", name: "Titan Greaves", slot: "boots", rarity: "epic", baseStats: { ATK: 20, DEF: 20, SPEED: 5, ARMOR: 44 }, description: "Stand your ground. Nothing moves you." },
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
    description: "Crowned in crimson steel, its wearer has never known defeat. Dry cleaning not included.",
  },
  {
    catalogId: "l-war-glv",
    name: "Crimson War Gauntlets",
    slot: "gloves",
    rarity: "legendary",
    baseStats: { ATK: 55, ARMOR: 50 },
    classRestriction: "warrior",
    setName: "crimson_conqueror",
    description: "Every fist becomes a siege engine. Enemies call them 'the last handshake.'",
  },
  {
    catalogId: "l-war-cst",
    name: "Crimson War Plate",
    slot: "chest",
    rarity: "legendary",
    baseStats: { HP: 305, DEF: 85, ARMOR: 148 },
    classRestriction: "warrior",
    setName: "crimson_conqueror",
    description: "Bathed in the blood of fallen empires. Arrows bounce off it out of respect.",
  },
  {
    catalogId: "l-war-bts",
    name: "Crimson War Greaves",
    slot: "boots",
    rarity: "legendary",
    baseStats: { SPEED: 8, ARMOR: 52 },
    classRestriction: "warrior",
    setName: "crimson_conqueror",
    description: "The earth trembles with each step — retreat is not in their vocabulary.",
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
    description: "Reveals every mortal weakness. The last thing victims see is their own doom.",
  },
  {
    catalogId: "l-rog-glv",
    name: "Shadow Reaper Gloves",
    slot: "gloves",
    rarity: "legendary",
    baseStats: { ATK: 55, ARMOR: 35 },
    classRestriction: "rogue",
    setName: "shadow_reaper",
    description: "Stitched from the shadows of executed kings. Fingerprints not included.",
  },
  {
    catalogId: "l-rog-cst",
    name: "Shadow Reaper Vest",
    slot: "chest",
    rarity: "legendary",
    baseStats: { DEF: 50, ARMOR: 110 },
    classRestriction: "rogue",
    setName: "shadow_reaper",
    description: "Woven from midnight itself — blades pass through it like a bad memory.",
  },
  {
    catalogId: "l-rog-bts",
    name: "Shadow Reaper Boots",
    slot: "boots",
    rarity: "legendary",
    baseStats: { SPEED: 12, ARMOR: 40 },
    classRestriction: "rogue",
    setName: "shadow_reaper",
    description: "Death walks silently, and these boots are why.",
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
    description: "Contains the collapsed knowledge of a thousand dead archmages. Heavy reading.",
  },
  {
    catalogId: "l-mag-glv",
    name: "Arcane Dominion Grips",
    slot: "gloves",
    rarity: "legendary",
    baseStats: { ATK: 50, ARMOR: 30 },
    classRestriction: "mage",
    setName: "arcane_dominion",
    description: "A snap of these fingers rewrites the laws of physics. Handle with cosmic care.",
  },
  {
    catalogId: "l-mag-cst",
    name: "Arcane Dominion Robe",
    slot: "chest",
    rarity: "legendary",
    baseStats: { HP: 305, ARMOR: 100 },
    classRestriction: "mage",
    setName: "arcane_dominion",
    description: "Spun from the fabric of collapsing dimensions. Machine wash cold only.",
  },
  {
    catalogId: "l-mag-bts",
    name: "Arcane Dominion Sandals",
    slot: "boots",
    rarity: "legendary",
    baseStats: { SPEED: 8, ARMOR: 35 },
    classRestriction: "mage",
    setName: "arcane_dominion",
    description: "Each step tears a rift between realms. Mind the cosmic gap.",
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
    description: "Once these close around you, even gods can't pry them open.",
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
    description: "Mountains move aside when these greaves march forward.",
  },
];

/* ================================================================== */
/*  WEAPON CATALOG — COMMON (20)                                       */
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
  { catalogId: "cw-swd-01", name: "Rusted Sword", slot: "weapon", rarity: "common", baseStats: { ATK: 48, CRIT: 2 }, weaponCategory: "sword", description: "A blade so rusty, tetanus is the real weapon." },
  { catalogId: "cw-swd-03", name: "Short Sword", slot: "weapon", rarity: "common", baseStats: { ATK: 50, CRIT: 3 }, weaponCategory: "sword", description: "It's not the size, it's... no, it's the size." },
  { catalogId: "cw-swd-07", name: "Steel Cutter", slot: "weapon", rarity: "common", baseStats: { ATK: 58, CRIT: 2 }, weaponCategory: "sword", description: "Cuts steel. Just kidding, it IS steel." },
  { catalogId: "cw-swd-08", name: "Old War Sword", slot: "weapon", rarity: "common", baseStats: { ATK: 54, CRIT: 4 }, weaponCategory: "sword", description: "Has stories to tell. None of them impressive." },
  { catalogId: "cw-swd-10", name: "Broad Sword", slot: "weapon", rarity: "common", baseStats: { ATK: 60, CRIT: 2 }, weaponCategory: "sword", description: "Wide as a dinner plate. Just as elegant." },
];

const COMMON_DAGGERS: CatalogItem[] = [
  { catalogId: "cw-dgr-01", name: "Rusted Dagger", slot: "weapon", rarity: "common", baseStats: { ATK: 36, CRIT: 7, SPEED: 2 }, weaponCategory: "dagger", description: "More tetanus than talent." },
  { catalogId: "cw-dgr-03", name: "Scout Knife", slot: "weapon", rarity: "common", baseStats: { ATK: 38, CRIT: 7, SPEED: 4 }, weaponCategory: "dagger", description: "Good for whittling sticks and stabbing things." },
  { catalogId: "cw-dgr-05", name: "Steel Shiv", slot: "weapon", rarity: "common", baseStats: { ATK: 44, CRIT: 9, SPEED: 2 }, weaponCategory: "dagger", description: "Prison rules apply." },
  { catalogId: "cw-dgr-08", name: "War Knife", slot: "weapon", rarity: "common", baseStats: { ATK: 45, CRIT: 8, SPEED: 2 }, weaponCategory: "dagger", description: "Seen war. Mostly from the supply tent." },
  { catalogId: "cw-dgr-10", name: "Twin Blade", slot: "weapon", rarity: "common", baseStats: { ATK: 43, CRIT: 9, SPEED: 3 }, weaponCategory: "dagger", description: "Two edges. Twice the chance to cut yourself." },
];

const COMMON_MACES: CatalogItem[] = [
  { catalogId: "cw-mac-01", name: "Iron Mace", slot: "weapon", rarity: "common", baseStats: { ATK: 58, DEF: 7 }, weaponCategory: "mace", description: "Bonk. Problem solved." },
  { catalogId: "cw-mac-04", name: "Rusted Mace", slot: "weapon", rarity: "common", baseStats: { ATK: 54, DEF: 7 }, weaponCategory: "mace", description: "The rust adds character. And infection." },
  { catalogId: "cw-mac-06", name: "War Mace", slot: "weapon", rarity: "common", baseStats: { ATK: 65, DEF: 7 }, weaponCategory: "mace", description: "Subtlety is for rogues." },
  { catalogId: "cw-mac-09", name: "Old Maul", slot: "weapon", rarity: "common", baseStats: { ATK: 57, DEF: 9 }, weaponCategory: "mace", description: "Grandpa's favorite. He wasn't a nice man." },
  { catalogId: "cw-mac-10", name: "Heavy Club", slot: "weapon", rarity: "common", baseStats: { ATK: 68, DEF: 6 }, weaponCategory: "mace", description: "Literally just a big stick. Effective though." },
];

const COMMON_STAFFS: CatalogItem[] = [
  { catalogId: "cw-stf-01", name: "Wooden Staff", slot: "weapon", rarity: "common", baseStats: { ATK: 42, CRIT: 4 }, weaponCategory: "staff", twoHanded: true, description: "It's a stick. A fancy stick, but still a stick." },
  { catalogId: "cw-stf-06", name: "War Staff", slot: "weapon", rarity: "common", baseStats: { ATK: 50, CRIT: 4 }, weaponCategory: "staff", twoHanded: true, description: "For mages who solve problems physically." },
  { catalogId: "cw-stf-07", name: "Mystic Rod", slot: "weapon", rarity: "common", baseStats: { ATK: 44, CRIT: 6 }, weaponCategory: "staff", twoHanded: true, description: "\"Mystic\" is doing a lot of heavy lifting here." },
  { catalogId: "cw-stf-10", name: "Chain Rod", slot: "weapon", rarity: "common", baseStats: { ATK: 49, CRIT: 4 }, weaponCategory: "staff", twoHanded: true, description: "Wrapped in chains for no good reason." },
  { catalogId: "cw-stf-12", name: "Steel Rod", slot: "weapon", rarity: "common", baseStats: { ATK: 52, CRIT: 5 }, weaponCategory: "staff", twoHanded: true, description: "Cold steel, zero enchantment. Peak budget mage." },
];

/* ================================================================== */
/*  WEAPON CATALOG — RARE (16)                                         */
/* ================================================================== */

/*
 * Rare multiplier: x1.08
 *   Swords:  ATK ~59, CRIT ~3
 *   Daggers: ATK ~45, CRIT ~9, SPEED ~3
 *   Maces:   ATK ~67, DEF ~9
 *   Staffs:  ATK ~52, CRIT ~5
 */

const RARE_SWORDS: CatalogItem[] = [
  { catalogId: "rw-swd-01", name: "Knight Blade", slot: "weapon", rarity: "rare", baseStats: { ATK: 60, CRIT: 4 }, weaponCategory: "sword", description: "Reliable steel for a reliable knight." },
  { catalogId: "rw-swd-03", name: "Vanguard Sword", slot: "weapon", rarity: "rare", baseStats: { ATK: 62, CRIT: 3 }, weaponCategory: "sword", description: "Always leads the charge. Literally." },
  { catalogId: "rw-swd-05", name: "Silver Edge", slot: "weapon", rarity: "rare", baseStats: { ATK: 57, CRIT: 5 }, weaponCategory: "sword", description: "Polished to a mirror shine. Werewolves hate it." },
  { catalogId: "rw-swd-07", name: "Assassin Sword", slot: "weapon", rarity: "rare", baseStats: { ATK: 56, CRIT: 6 }, weaponCategory: "sword", description: "Quiet blade for quiet work." },
];

const RARE_DAGGERS: CatalogItem[] = [
  { catalogId: "rw-dgr-01", name: "Shadow Fang", slot: "weapon", rarity: "rare", baseStats: { ATK: 44, CRIT: 10, SPEED: 4 }, weaponCategory: "dagger", description: "Named after the bite, not the wolf." },
  { catalogId: "rw-dgr-02", name: "Swift Blade", slot: "weapon", rarity: "rare", baseStats: { ATK: 43, CRIT: 9, SPEED: 5 }, weaponCategory: "dagger", description: "Strikes before you finish blinking." },
  { catalogId: "rw-dgr-04", name: "Blood Knife", slot: "weapon", rarity: "rare", baseStats: { ATK: 47, CRIT: 10, SPEED: 3 }, weaponCategory: "dagger", description: "Serrated edge. Not for the squeamish." },
  { catalogId: "rw-dgr-07", name: "Storm Knife", slot: "weapon", rarity: "rare", baseStats: { ATK: 48, CRIT: 8, SPEED: 3 }, weaponCategory: "dagger", description: "Crackles faintly when it cuts the air." },
];

const RARE_MACES: CatalogItem[] = [
  { catalogId: "rw-mac-01", name: "Ironclad Mace", slot: "weapon", rarity: "rare", baseStats: { ATK: 67, DEF: 10 }, weaponCategory: "mace", description: "Iron-banded and satisfyingly heavy." },
  { catalogId: "rw-mac-04", name: "Blood Crusher", slot: "weapon", rarity: "rare", baseStats: { ATK: 70, DEF: 8 }, weaponCategory: "mace", description: "Subtlety was never the point." },
  { catalogId: "rw-mac-05", name: "Knight Hammer", slot: "weapon", rarity: "rare", baseStats: { ATK: 66, DEF: 11 }, weaponCategory: "mace", description: "Blessed by a chapel priest. Hits like a sermon." },
  { catalogId: "rw-mac-08", name: "Titan Hammer", slot: "weapon", rarity: "rare", baseStats: { ATK: 72, DEF: 8 }, weaponCategory: "mace", description: "Sized for a giant. You'll grow into it." },
];

const RARE_STAFFS: CatalogItem[] = [
  { catalogId: "rw-stf-01", name: "Mystic Staff", slot: "weapon", rarity: "rare", baseStats: { ATK: 52, CRIT: 6 }, weaponCategory: "staff", twoHanded: true, description: "Channels energy from a hidden crystal core." },
  { catalogId: "rw-stf-03", name: "Storm Staff", slot: "weapon", rarity: "rare", baseStats: { ATK: 54, CRIT: 5 }, weaponCategory: "staff", twoHanded: true, description: "Lightning arcs between the crystal tips. Aim carefully." },
  { catalogId: "rw-stf-05", name: "Silver Staff", slot: "weapon", rarity: "rare", baseStats: { ATK: 51, CRIT: 7 }, weaponCategory: "staff", twoHanded: true, description: "Polished silver that moonlight clings to like a lover." },
  { catalogId: "rw-stf-06", name: "Warlock Rod", slot: "weapon", rarity: "rare", baseStats: { ATK: 55, CRIT: 5 }, weaponCategory: "staff", twoHanded: true, description: "Whispers dark bargains to anyone who holds it long enough." },
];

/* ================================================================== */
/*  WEAPON CATALOG — EPIC (12)                                         */
/* ================================================================== */

/*
 * Epic multiplier: x1.15
 *   Swords:  ATK ~63, CRIT ~3-5
 *   Daggers: ATK ~48, CRIT ~10-12, SPEED ~4
 *   Maces:   ATK ~71, DEF ~10-12
 *   Staffs:  ATK ~55, CRIT ~6-7
 */

const EPIC_SWORDS: CatalogItem[] = [
  { catalogId: "ew-swd-01", name: "Doom Blade", slot: "weapon", rarity: "epic", baseStats: { ATK: 66, CRIT: 5 }, weaponCategory: "sword", description: "The air crackles with menace when drawn." },
  { catalogId: "ew-swd-03", name: "Titan Edge", slot: "weapon", rarity: "epic", baseStats: { ATK: 68, CRIT: 4 }, weaponCategory: "sword", description: "Cleaves stone like butter. Armor fares worse." },
  { catalogId: "ew-swd-05", name: "Shadowfang", slot: "weapon", rarity: "epic", baseStats: { ATK: 62, CRIT: 7 }, weaponCategory: "sword", description: "Bites before you see it move." },
];

const EPIC_DAGGERS: CatalogItem[] = [
  { catalogId: "ew-dgr-01", name: "Nightpiercer", slot: "weapon", rarity: "epic", baseStats: { ATK: 50, CRIT: 12, SPEED: 4 }, weaponCategory: "dagger", description: "Finds the gap in any armor. Every time." },
  { catalogId: "ew-dgr-03", name: "Blood Talon", slot: "weapon", rarity: "epic", baseStats: { ATK: 51, CRIT: 11, SPEED: 4 }, weaponCategory: "dagger", description: "Curved like a predator's claw. Just as cruel." },
  { catalogId: "ew-dgr-04", name: "Silent Doom", slot: "weapon", rarity: "epic", baseStats: { ATK: 47, CRIT: 12, SPEED: 5 }, weaponCategory: "dagger", description: "Your last breath won't make a sound." },
];

const EPIC_MACES: CatalogItem[] = [
  { catalogId: "ew-mac-01", name: "Doom Maul", slot: "weapon", rarity: "epic", baseStats: { ATK: 74, DEF: 11 }, weaponCategory: "mace", twoHanded: true, description: "Where it falls, nothing rises again." },
  { catalogId: "ew-mac-02", name: "Titan Crusher", slot: "weapon", rarity: "epic", baseStats: { ATK: 76, DEF: 10 }, weaponCategory: "mace", twoHanded: true, description: "Forged to shatter giants. Mortals don't stand a chance." },
  { catalogId: "ew-mac-04", name: "Storm Hammer", slot: "weapon", rarity: "epic", baseStats: { ATK: 70, DEF: 13 }, weaponCategory: "mace", twoHanded: true, description: "Thunder obeys the one who swings this hammer." },
];

const EPIC_STAFFS: CatalogItem[] = [
  { catalogId: "ew-stf-01", name: "Arcane Oblivion", slot: "weapon", rarity: "epic", baseStats: { ATK: 57, CRIT: 7 }, weaponCategory: "staff", twoHanded: true, description: "Reality bends around its crystal tip." },
  { catalogId: "ew-stf-03", name: "Stormcaller", slot: "weapon", rarity: "epic", baseStats: { ATK: 55, CRIT: 8 }, weaponCategory: "staff", twoHanded: true, description: "Raise it high and the sky answers." },
  { catalogId: "ew-stf-05", name: "Titan Staff", slot: "weapon", rarity: "epic", baseStats: { ATK: 59, CRIT: 6 }, weaponCategory: "staff", twoHanded: true, description: "Carved from a petrified world-tree root." },
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
    description: "Forged from a dying star's core. Empires crumble at its edge.",
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
    description: "Named after every kingdom it annihilated. The list is still growing.",
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
    description: "So massive it bends gravity. Two hands required, zero mercy given.",
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
    description: "Judge, jury, and executioner — all in one crimson swing.",
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
    description: "Carved from a shadow dragon's fang. One puncture erases you from existence.",
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
    description: "Twin blades that move as one — twice the shadow, twice the funeral.",
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
    description: "So fast it cuts the future. Victims die before they're born.",
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
    description: "Rips through plate mail like parchment. Even ghosts check their backs.",
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
    description: "Channels the primordial chaos that existed before creation. Side effects may include reality.",
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
    description: "Bends cosmic law like a twig. Reality files formal complaints.",
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
    description: "Holds dominion over the arcane leylines. Entire schools of magic bow to it.",
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
    description: "Whispers apocalyptic incantations. The cosmos listens and obeys.",
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
    description: "Swung with the force of a collapsing fortress. The earth apologizes afterward.",
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
    description: "One swing reshapes the battlefield. Cartographers hate this weapon.",
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
  { catalogId: "c-amu-01", name: "Wooden Pendant", slot: "amulet", rarity: "common", baseStats: { HP: 40, DEF: 8 }, description: "Carved from oak. Or maybe a chair leg." },
  { catalogId: "c-amu-02", name: "Bone Charm", slot: "amulet", rarity: "common", baseStats: { HP: 35, DEF: 10 }, description: "Whose bone is this? Don't ask." },
  { catalogId: "c-amu-03", name: "Copper Locket", slot: "amulet", rarity: "common", baseStats: { HP: 45, DEF: 7 }, description: "The portrait inside is definitely not you." },
  { catalogId: "c-amu-04", name: "Stone Talisman", slot: "amulet", rarity: "common", baseStats: { HP: 38, DEF: 9 }, description: "Heavy as a bad conscience. Equally protective." },
];

const RARE_AMULETS: CatalogItem[] = [
  { catalogId: "r-amu-01", name: "Silver Moon Pendant", slot: "amulet", rarity: "rare", baseStats: { HP: 75, DEF: 18, SPEED: 3 }, uniquePassive: "+5% healing received", description: "Favored by night-watch captains for obvious reasons." },
  { catalogId: "r-amu-02", name: "Wolfang Necklace", slot: "amulet", rarity: "rare", baseStats: { HP: 65, DEF: 22 }, uniquePassive: "+3% lifesteal on hit", description: "The wolf didn't give it up willingly." },
  { catalogId: "r-amu-03", name: "Jade Amulet", slot: "amulet", rarity: "rare", baseStats: { HP: 80, DEF: 16, CRIT: 4 }, uniquePassive: "+8% poison resistance", description: "Merchants swear it wards off bad deals." },
  { catalogId: "r-amu-04", name: "Ember Medallion", slot: "amulet", rarity: "rare", baseStats: { HP: 70, DEF: 20 }, uniquePassive: "+5% fire damage", description: "Pleasantly warm. Great for cold dungeon nights." },
];

const EPIC_AMULETS: CatalogItem[] = [
  { catalogId: "e-amu-01", name: "Amulet of Vitality", slot: "amulet", rarity: "epic", baseStats: { HP: 140, DEF: 32, SPEED: 5 }, uniquePassive: "Regenerate 3% HP per turn", description: "Death recoils at its radiance." },
  { catalogId: "e-amu-02", name: "Shadowheart Pendant", slot: "amulet", rarity: "epic", baseStats: { HP: 120, DEF: 38, CRIT: 8 }, uniquePassive: "+12% damage in the dark", description: "Darkness obeys whoever wears this." },
  { catalogId: "e-amu-03", name: "Stormcaller Torc", slot: "amulet", rarity: "epic", baseStats: { HP: 130, DEF: 35, ATK: 15 }, uniquePassive: "10% chance to stun on hit for 1 turn", description: "Touch it and taste lightning on your tongue." },
  { catalogId: "e-amu-04", name: "Blessed Ankh", slot: "amulet", rarity: "epic", baseStats: { HP: 160, DEF: 28 }, uniquePassive: "Survive lethal blow with 1 HP once per battle", description: "The grave spits you back. Once." },
];

const LEGENDARY_AMULETS: CatalogItem[] = [
  { catalogId: "l-amu-01", name: "Crimson Heart Amulet", slot: "amulet", rarity: "legendary", baseStats: { HP: 220, DEF: 45, ATK: 20 }, uniquePassive: "On kill: restore 15% HP", classRestriction: "warrior", setName: "crimson_conqueror", description: "Pulses with the heartbeat of every conquered empire. It never stops." },
  { catalogId: "l-amu-02", name: "Shadow Reaper Locket", slot: "amulet", rarity: "legendary", baseStats: { HP: 180, DEF: 35, CRIT: 18 }, uniquePassive: "Critical hits heal for 8% of damage dealt", classRestriction: "rogue", setName: "shadow_reaper", description: "Traps a shard of pure death inside. Open it and shadows pour out." },
  { catalogId: "l-amu-03", name: "Arcane Dominion Amulet", slot: "amulet", rarity: "legendary", baseStats: { HP: 200, DEF: 40, SPEED: 8 }, uniquePassive: "Spells cost 20% less stamina", classRestriction: "mage", setName: "arcane_dominion", description: "A collapsed star of pure mana. Wearing it rewrites the laws of magic." },
  { catalogId: "l-amu-04", name: "Iron Bastion Medal", slot: "amulet", rarity: "legendary", baseStats: { HP: 280, DEF: 55 }, uniquePassive: "Reduce all incoming damage by 8%", classRestriction: "tank", setName: "iron_bastion", description: "Granted only to those who have never fallen. The medal is heavier than most shields." },
];

/* ================================================================== */
/*  BELTS (16)                                                         */
/* ================================================================== */

const COMMON_BELTS: CatalogItem[] = [
  { catalogId: "c-blt-01", name: "Leather Belt", slot: "belt", rarity: "common", baseStats: { DEF: 12, ARMOR: 8 }, description: "Holds your pants up. Heroism starts small." },
  { catalogId: "c-blt-02", name: "Rope Sash", slot: "belt", rarity: "common", baseStats: { DEF: 10, ARMOR: 6, SPEED: 2 }, description: "It's literally rope. You paid gold for rope." },
  { catalogId: "c-blt-03", name: "Chain Link Belt", slot: "belt", rarity: "common", baseStats: { DEF: 14, ARMOR: 10 }, description: "Clinks with every step. Stealth? Never heard of it." },
  { catalogId: "c-blt-04", name: "Cloth Sash", slot: "belt", rarity: "common", baseStats: { DEF: 8, ARMOR: 5, SPEED: 3 }, description: "A glorified rag around your waist. Comfy though." },
];

const RARE_BELTS: CatalogItem[] = [
  { catalogId: "r-blt-01", name: "Reinforced War Belt", slot: "belt", rarity: "rare", baseStats: { DEF: 24, ARMOR: 18, HP: 30 }, description: "Holds your armor together and your guts in." },
  { catalogId: "r-blt-02", name: "Ranger's Utility Belt", slot: "belt", rarity: "rare", baseStats: { DEF: 18, ARMOR: 14, SPEED: 5 }, description: "Twelve pockets. You'll fill every one." },
  { catalogId: "r-blt-03", name: "Scaled Girdle", slot: "belt", rarity: "rare", baseStats: { DEF: 22, ARMOR: 20 }, description: "Lizard scales. The seller swore they were dragon." },
  { catalogId: "r-blt-04", name: "Spiked Belt", slot: "belt", rarity: "rare", baseStats: { DEF: 20, ARMOR: 16, ATK: 8 }, description: "Hugging the wearer is strongly discouraged." },
];

const EPIC_BELTS: CatalogItem[] = [
  { catalogId: "e-blt-01", name: "Titan's Cinch", slot: "belt", rarity: "epic", baseStats: { DEF: 42, ARMOR: 32, HP: 60 }, description: "Holds the weight of a titan's legacy." },
  { catalogId: "e-blt-02", name: "Windrunner Sash", slot: "belt", rarity: "epic", baseStats: { DEF: 30, ARMOR: 22, SPEED: 10 }, description: "The wind itself couldn't outrun you." },
  { catalogId: "e-blt-03", name: "Bloodforged Girdle", slot: "belt", rarity: "epic", baseStats: { DEF: 38, ARMOR: 28, ATK: 15 }, description: "Quenched in the blood of fallen champions." },
  { catalogId: "e-blt-04", name: "Guardian's Waistguard", slot: "belt", rarity: "epic", baseStats: { DEF: 45, ARMOR: 35 }, description: "No blade has ever reached what lies behind it." },
];

const LEGENDARY_BELTS: CatalogItem[] = [
  { catalogId: "l-blt-01", name: "Crimson Conqueror Belt", slot: "belt", rarity: "legendary", baseStats: { DEF: 55, ARMOR: 42, ATK: 20, HP: 80 }, classRestriction: "warrior", setName: "crimson_conqueror", description: "Girds the conqueror's core with crimson iron. Retreat? Not physically possible." },
  { catalogId: "l-blt-02", name: "Shadow Reaper Cord", slot: "belt", rarity: "legendary", baseStats: { DEF: 40, ARMOR: 30, SPEED: 12, CRIT: 10 }, classRestriction: "rogue", setName: "shadow_reaper", description: "Conceals enough shadow-forged blades to arm a small rebellion." },
  { catalogId: "l-blt-03", name: "Arcane Dominion Cincture", slot: "belt", rarity: "legendary", baseStats: { DEF: 45, ARMOR: 35, HP: 100, SPEED: 6 }, classRestriction: "mage", setName: "arcane_dominion", description: "Braided from crystallized leyline energy. Glows when cosmic truths are near." },
  { catalogId: "l-blt-04", name: "Iron Bastion Waistplate", slot: "belt", rarity: "legendary", baseStats: { DEF: 65, ARMOR: 55, HP: 120 }, classRestriction: "tank", setName: "iron_bastion", description: "An immovable foundation." },
];

/* ================================================================== */
/*  RELICS (16)                                                        */
/* ================================================================== */

const COMMON_RELICS: CatalogItem[] = [
  { catalogId: "c-rel-01", name: "Cracked Orb", slot: "relic", rarity: "common", baseStats: { ATK: 10, CRIT: 2 }, description: "Cracked but still sparkles. Like your confidence." },
  { catalogId: "c-rel-02", name: "Old Figurine", slot: "relic", rarity: "common", baseStats: { ATK: 8, CRIT: 3 }, description: "Is it a cat or a bear? Nobody knows." },
  { catalogId: "c-rel-03", name: "Dusty Prism", slot: "relic", rarity: "common", baseStats: { ATK: 12, CRIT: 1 }, description: "Makes pretty rainbows. That's about it." },
  { catalogId: "c-rel-04", name: "Worn Fetish", slot: "relic", rarity: "common", baseStats: { ATK: 9, CRIT: 2 }, description: "Smells weird. Might be cursed. Probably fine." },
];

const RARE_RELICS: CatalogItem[] = [
  { catalogId: "r-rel-01", name: "Crimson Eye", slot: "relic", rarity: "rare", baseStats: { ATK: 22, CRIT: 6 }, uniquePassive: "+5% damage to bleeding targets", description: "Stares at wounds like a hungry thing." },
  { catalogId: "r-rel-02", name: "Frost Shard", slot: "relic", rarity: "rare", baseStats: { ATK: 18, CRIT: 8, SPEED: 3 }, uniquePassive: "+8% slow chance on hit", description: "Keep it away from your drink. Or don't." },
  { catalogId: "r-rel-03", name: "Thunder Tooth", slot: "relic", rarity: "rare", baseStats: { ATK: 25, CRIT: 5 }, uniquePassive: "+6% chance to chain lightning on hit", description: "Pulled from a storm beast's jaw mid-roar." },
  { catalogId: "r-rel-04", name: "Venom Gland", slot: "relic", rarity: "rare", baseStats: { ATK: 20, CRIT: 7 }, uniquePassive: "+10% poison damage", description: "Handle with gloves. Thick ones." },
];

const EPIC_RELICS: CatalogItem[] = [
  { catalogId: "e-rel-01", name: "Relic of Fury", slot: "relic", rarity: "epic", baseStats: { ATK: 42, CRIT: 12 }, uniquePassive: "+10% damage to stunned targets", description: "Hold it and feel wrath consume all doubt." },
  { catalogId: "e-rel-02", name: "Void Fragment", slot: "relic", rarity: "epic", baseStats: { ATK: 38, CRIT: 15, SPEED: 5 }, uniquePassive: "Ignore 15% of target armor", description: "A shard of absolute nothingness. Terrifyingly real." },
  { catalogId: "e-rel-03", name: "Phoenix Feather", slot: "relic", rarity: "epic", baseStats: { ATK: 35, CRIT: 10, HP: 50 }, uniquePassive: "+20% damage when below 30% HP", description: "From ashes, unstoppable fury is reborn." },
  { catalogId: "e-rel-04", name: "Demon Horn", slot: "relic", rarity: "epic", baseStats: { ATK: 45, CRIT: 14 }, uniquePassive: "Every 5th hit deals 50% bonus damage", description: "Ripped from a demon lord. It still screams." },
];

const LEGENDARY_RELICS: CatalogItem[] = [
  { catalogId: "l-rel-01", name: "Crimson Conqueror Sigil", slot: "relic", rarity: "legendary", baseStats: { ATK: 60, CRIT: 18, HP: 80 }, uniquePassive: "Every 3rd hit deals 2x damage", classRestriction: "warrior", setName: "crimson_conqueror", description: "Branded with the blood oath of the Crimson Legion. Victory is not optional." },
  { catalogId: "l-rel-02", name: "Shadow Reaper Effigy", slot: "relic", rarity: "legendary", baseStats: { ATK: 55, CRIT: 25, SPEED: 8 }, uniquePassive: "Critical hits have 30% chance to reset cooldowns", classRestriction: "rogue", setName: "shadow_reaper", description: "A perfect effigy of the Reaper. Stare too long and it stares back." },
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
  { catalogId: "c-leg-01", name: "Leather Trousers", slot: "legs", rarity: "common", baseStats: { DEF: 42, HP: 160, ARMOR: 28 }, description: "More patches than original material." },
  { catalogId: "c-leg-02", name: "Iron Greaves Pants", slot: "legs", rarity: "common", baseStats: { DEF: 48, HP: 165, ARMOR: 32 }, description: "Iron pants. Sitting down is now a quest." },
  { catalogId: "c-leg-03", name: "Chain Leggings", slot: "legs", rarity: "common", baseStats: { DEF: 52, HP: 155, ARMOR: 35 }, description: "Chafes in places you don't want to think about." },
  { catalogId: "c-leg-04", name: "Cloth Pants", slot: "legs", rarity: "common", baseStats: { DEF: 38, HP: 185, ARMOR: 25 }, description: "Basically pajamas. But with stats!" },
];

const RARE_LEGS: CatalogItem[] = [
  { catalogId: "r-leg-01", name: "Knight Legguards", slot: "legs", rarity: "rare", baseStats: { DEF: 58, HP: 195, ARMOR: 55 }, description: "Stand your ground. These won't let you fall." },
  { catalogId: "r-leg-02", name: "Shadow Leggings", slot: "legs", rarity: "rare", baseStats: { DEF: 50, HP: 190, SPEED: 3, ARMOR: 48 }, description: "Silent steps, deadly strikes." },
  { catalogId: "r-leg-03", name: "Mystic Leg Wraps", slot: "legs", rarity: "rare", baseStats: { DEF: 48, HP: 200, ARMOR: 45 }, description: "The runes itch, but your legs stay intact." },
  { catalogId: "r-leg-04", name: "Storm Legplates", slot: "legs", rarity: "rare", baseStats: { DEF: 55, HP: 188, ARMOR: 52 }, description: "Crackling with residual energy." },
];

const EPIC_LEGS: CatalogItem[] = [
  { catalogId: "e-leg-01", name: "Doom Legplates", slot: "legs", rarity: "epic", baseStats: { DEF: 65, HP: 210, ARMOR: 85 }, description: "Fate walks in these. You just steer." },
  { catalogId: "e-leg-02", name: "Shadow Legguards", slot: "legs", rarity: "epic", baseStats: { DEF: 56, HP: 205, SPEED: 5, ARMOR: 72 }, description: "Step into a shadow, emerge behind your enemy." },
  { catalogId: "e-leg-04", name: "Titan Legplates", slot: "legs", rarity: "epic", baseStats: { DEF: 68, HP: 200, ARMOR: 90 }, description: "Giants kneel. You don't have to." },
];

const LEGENDARY_LEGS: CatalogItem[] = [
  { catalogId: "l-leg-01", name: "Crimson Conqueror Legplates", slot: "legs", rarity: "legendary", baseStats: { DEF: 72, HP: 240, ARMOR: 110, ATK: 15 }, classRestriction: "warrior", setName: "crimson_conqueror", description: "Crimson-forged legplates that have marched through a hundred sieges unscratched." },
  { catalogId: "l-leg-02", name: "Shadow Reaper Leggings", slot: "legs", rarity: "legendary", baseStats: { DEF: 55, HP: 200, ARMOR: 80, SPEED: 10, CRIT: 8 }, classRestriction: "rogue", setName: "shadow_reaper", description: "Woven from the void between shadows. Your footsteps become someone else's nightmare." },
  { catalogId: "l-leg-03", name: "Arcane Dominion Legwraps", slot: "legs", rarity: "legendary", baseStats: { DEF: 58, HP: 230, ARMOR: 75, SPEED: 6 }, classRestriction: "mage", setName: "arcane_dominion", description: "Enchanted with anti-gravity runes. Walking is optional, floating is standard." },
  { catalogId: "l-leg-04", name: "Iron Bastion Legplates", slot: "legs", rarity: "legendary", baseStats: { DEF: 80, HP: 280, ARMOR: 130 }, classRestriction: "tank", setName: "iron_bastion", description: "Bolted to the bedrock of the world itself. Earthquakes ask your permission first." },
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
  { catalogId: "c-nck-01", name: "Copper Chain", slot: "necklace", rarity: "common", baseStats: { HP: 42, DEF: 10, CRIT: 2 }, description: "Turns your neck green. Very fashionable." },
  { catalogId: "c-nck-02", name: "Leather Cord", slot: "necklace", rarity: "common", baseStats: { HP: 48, DEF: 8, CRIT: 3 }, description: "Looks like a dog leash. Don't ask why." },
  { catalogId: "c-nck-03", name: "Bone Necklace", slot: "necklace", rarity: "common", baseStats: { HP: 38, DEF: 12, CRIT: 2 }, description: "Spooky bones on a string. Peak fashion." },
  { catalogId: "c-nck-04", name: "Iron Choker", slot: "necklace", rarity: "common", baseStats: { HP: 45, DEF: 11, CRIT: 3 }, description: "Tight enough to remind you you're alive." },
];

const RARE_NECKLACES: CatalogItem[] = [
  { catalogId: "r-nck-01", name: "Ruby Pendant", slot: "necklace", rarity: "rare", baseStats: { HP: 80, DEF: 20, CRIT: 6 }, uniquePassive: "+4% critical damage", description: "The gem pulses in sync with your heartbeat." },
  { catalogId: "r-nck-02", name: "Sapphire Chain", slot: "necklace", rarity: "rare", baseStats: { HP: 90, DEF: 18, CRIT: 5, SPEED: 3 }, uniquePassive: "+6% mana efficiency", description: "Every link holds a drop of frozen mana." },
  { catalogId: "r-nck-03", name: "Emerald Necklace", slot: "necklace", rarity: "rare", baseStats: { HP: 85, DEF: 22, CRIT: 5 }, uniquePassive: "+5% healing received", description: "Smells like fresh rain and ancient oak." },
  { catalogId: "r-nck-04", name: "Onyx Gorget", slot: "necklace", rarity: "rare", baseStats: { HP: 75, DEF: 24, CRIT: 7 }, uniquePassive: "+3% damage reduction at night", description: "Protects the throat from blades and bad decisions." },
];

const EPIC_NECKLACES: CatalogItem[] = [
  { catalogId: "e-nck-01", name: "Necklace of Wrath", slot: "necklace", rarity: "epic", baseStats: { HP: 145, DEF: 35, CRIT: 10, ATK: 12 }, uniquePassive: "+8% damage when below 50% HP", description: "Wear it and feel rage become purpose." },
  { catalogId: "e-nck-02", name: "Dragonscale Collar", slot: "necklace", rarity: "epic", baseStats: { HP: 160, DEF: 40, CRIT: 8 }, uniquePassive: "Reduce fire damage taken by 15%", description: "Dragonfire tempered. Nothing burns through." },
  { catalogId: "e-nck-03", name: "Starfall Pendant", slot: "necklace", rarity: "epic", baseStats: { HP: 135, DEF: 32, CRIT: 12, SPEED: 5 }, uniquePassive: "10% chance to dodge next attack after a crit", description: "Fell from the heavens. Chose its wearer." },
  { catalogId: "e-nck-04", name: "Lifeblood Choker", slot: "necklace", rarity: "epic", baseStats: { HP: 180, DEF: 38 }, uniquePassive: "Regenerate 2% HP per turn", description: "Your heartbeat strengthens. Death backs away." },
];

const LEGENDARY_NECKLACES: CatalogItem[] = [
  { catalogId: "l-nck-01", name: "Crimson Conqueror Chain", slot: "necklace", rarity: "legendary", baseStats: { HP: 230, DEF: 50, ATK: 25, CRIT: 10 }, uniquePassive: "Every kill grants +5% ATK for 3 turns (stacks)", classRestriction: "warrior", setName: "crimson_conqueror", description: "Each link is a fallen general's final scream, forged in crimson conquest." },
  { catalogId: "l-nck-02", name: "Shadow Reaper Torque", slot: "necklace", rarity: "legendary", baseStats: { HP: 190, DEF: 38, CRIT: 20, SPEED: 8 }, uniquePassive: "Critical hits apply 3-turn bleed (2% max HP/turn)", classRestriction: "rogue", setName: "shadow_reaper", description: "Whispers the true name of your next victim. It has never been wrong." },
  { catalogId: "l-nck-03", name: "Arcane Dominion Collar", slot: "necklace", rarity: "legendary", baseStats: { HP: 210, DEF: 45, CRIT: 15, SPEED: 6 }, uniquePassive: "Spell crits restore 10% stamina", classRestriction: "mage", setName: "arcane_dominion", description: "A collar of condensed cosmic dominion. Stars dim when you put it on." },
  { catalogId: "l-nck-04", name: "Iron Bastion Gorget", slot: "necklace", rarity: "legendary", baseStats: { HP: 290, DEF: 60 }, uniquePassive: "Block incoming critical hits (reduce crit damage by 40%)", classRestriction: "tank", setName: "iron_bastion", description: "Living iron that grows thicker with every blow. Decapitation? Not today." },
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
  { catalogId: "c-rng-01", name: "Copper Ring", slot: "ring", rarity: "common", baseStats: { ATK: 12, CRIT: 3, SPEED: 2 }, description: "Worth less than the finger it's on." },
  { catalogId: "c-rng-02", name: "Iron Band", slot: "ring", rarity: "common", baseStats: { ATK: 14, CRIT: 4, SPEED: 1 }, description: "Propose with this and you'll be single again." },
  { catalogId: "c-rng-03", name: "Bronze Signet", slot: "ring", rarity: "common", baseStats: { ATK: 16, CRIT: 3, SPEED: 2 }, description: "The seal says 'property of someone else.'" },
  { catalogId: "c-rng-04", name: "Bone Ring", slot: "ring", rarity: "common", baseStats: { ATK: 13, CRIT: 5, SPEED: 1 }, description: "The beast wants it back. Don't make eye contact." },
];

const RARE_RINGS: CatalogItem[] = [
  { catalogId: "r-rng-01", name: "Ruby Ring", slot: "ring", rarity: "rare", baseStats: { ATK: 24, CRIT: 7, SPEED: 3 }, uniquePassive: "+3% fire damage", description: "Warm to the touch. Enemies find out why." },
  { catalogId: "r-rng-02", name: "Sapphire Ring", slot: "ring", rarity: "rare", baseStats: { ATK: 20, CRIT: 8, SPEED: 4 }, uniquePassive: "+5% mana regeneration", description: "Mages never take this one off. Not even to sleep." },
  { catalogId: "r-rng-03", name: "Emerald Band", slot: "ring", rarity: "rare", baseStats: { ATK: 22, CRIT: 6, SPEED: 3, HP: 30 }, uniquePassive: "+4% nature damage", description: "Tiny leaves sprout if you forget to wear it." },
  { catalogId: "r-rng-04", name: "Onyx Seal", slot: "ring", rarity: "rare", baseStats: { ATK: 26, CRIT: 9, SPEED: 2 }, uniquePassive: "+5% damage to weakened targets", description: "Candles flicker when you make a fist." },
];

const EPIC_RINGS: CatalogItem[] = [
  { catalogId: "e-rng-01", name: "Ring of Fury", slot: "ring", rarity: "epic", baseStats: { ATK: 38, CRIT: 14, SPEED: 4 }, uniquePassive: "+12% damage on next attack after taking a hit", description: "Rage forged into metal." },
  { catalogId: "e-rng-02", name: "Voidstone Ring", slot: "ring", rarity: "epic", baseStats: { ATK: 35, CRIT: 16, SPEED: 5 }, uniquePassive: "Ignore 10% of target armor", description: "Stare into the stone. The abyss stares back." },
  { catalogId: "e-rng-03", name: "Phoenix Signet", slot: "ring", rarity: "epic", baseStats: { ATK: 32, CRIT: 12, SPEED: 4, HP: 50 }, uniquePassive: "On death: 15% chance to revive with 20% HP (once per battle)", description: "Ashes to glory. Death is not the end." },
  { catalogId: "e-rng-04", name: "Dragonheart Ring", slot: "ring", rarity: "epic", baseStats: { ATK: 40, CRIT: 15, SPEED: 3 }, uniquePassive: "Every 4th attack deals 30% bonus fire damage", description: "Pulses with ancient dragonfire. Handle with awe." },
];

const LEGENDARY_RINGS: CatalogItem[] = [
  { catalogId: "l-rng-01", name: "Crimson Conqueror Seal", slot: "ring", rarity: "legendary", baseStats: { ATK: 55, CRIT: 15, SPEED: 4, HP: 60 }, uniquePassive: "ATK increases by 2% per consecutive hit (resets on miss)", classRestriction: "warrior", setName: "crimson_conqueror", description: "Stamped in the blood of a thousand victories. Losing is contractually forbidden." },
  { catalogId: "l-rng-02", name: "Shadow Reaper Ring", slot: "ring", rarity: "legendary", baseStats: { ATK: 48, CRIT: 22, SPEED: 10 }, uniquePassive: "First attack each battle is guaranteed critical", classRestriction: "rogue", setName: "shadow_reaper", description: "Slip it on and the shadows bend to your will. One ring, infinite kills." },
  { catalogId: "l-rng-03", name: "Arcane Dominion Band", slot: "ring", rarity: "legendary", baseStats: { ATK: 45, CRIT: 18, SPEED: 6, HP: 50 }, uniquePassive: "Spell damage +15% against targets with active debuffs", classRestriction: "mage", setName: "arcane_dominion", description: "An infinite loop of arcane energy. Divides by zero and survives." },
  { catalogId: "l-rng-04", name: "Iron Bastion Band", slot: "ring", rarity: "legendary", baseStats: { ATK: 40, CRIT: 10, DEF: 25, HP: 80 }, uniquePassive: "Taunt all enemies for 2 turns at battle start", classRestriction: "tank", setName: "iron_bastion", description: "Binds the frontline together with unbreakable iron will. Retreat rings don't exist." },
];

/* ================================================================== */
/*  FULL CATALOG                                                       */
/* ================================================================== */

export const ITEM_CATALOG: CatalogItem[] = [
  // --- Armor (64) ---
  // Common (20)
  ...COMMON_HELMETS,
  ...COMMON_GLOVES,
  ...COMMON_CHESTS,
  ...COMMON_BOOTS,
  // Rare (16)
  ...RARE_HELMETS,
  ...RARE_GLOVES,
  ...RARE_CHESTS,
  ...RARE_BOOTS,
  // Epic (12)
  ...EPIC_HELMETS,
  ...EPIC_GLOVES,
  ...EPIC_CHESTS,
  ...EPIC_BOOTS,
  // Legendary (16)
  ...LEGENDARY_WARRIOR,
  ...LEGENDARY_ROGUE,
  ...LEGENDARY_MAGE,
  ...LEGENDARY_TANK,

  // --- Weapons (64) ---
  // Common (20)
  ...COMMON_SWORDS,
  ...COMMON_DAGGERS,
  ...COMMON_MACES,
  ...COMMON_STAFFS,
  // Rare (16)
  ...RARE_SWORDS,
  ...RARE_DAGGERS,
  ...RARE_MACES,
  ...RARE_STAFFS,
  // Epic (12)
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

/** Get image path for a catalog item */
export const getItemImagePath = (item: CatalogItem): string => {
  const base = "/images/items";
  if (item.rarity === "common" || item.rarity === "rare") {
    const filename = item.slot === "weapon" ? item.weaponCategory! : item.slot;
    return `${base}/${item.rarity}/${filename}.png`;
  }
  return `${base}/${item.rarity}/${item.catalogId}.png`;
};

/** Get image path by catalogId (for use when you only have the id) */
export const getItemImagePathById = (catalogId: string): string | undefined => {
  const item = getCatalogItemById(catalogId);
  if (!item) return undefined;
  return getItemImagePath(item);
};
