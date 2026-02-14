/** Boss catalog — every boss with their assigned ability IDs.
 *  Dungeons 1-5 (lv 1-25): 3 abilities per boss.
 *  Dungeons 6-10 (lv 26+): 4 abilities per boss.
 *
 *  Skills are distributed thematically by dungeon theme,
 *  with final bosses (index 9) getting the strongest combos. */

export type BossCatalogEntry = {
  dungeonId: string;
  bossIndex: number;
  name: string;
  description: string;
  abilityIds: string[];
};

/* ─── Shorthand constants for ability IDs ─── */

// Physical
const CRUSH = "boss_crushing_blow";
const TAIL = "boss_tail_swipe";
const FRENZY = "boss_frenzy";
const SLAM = "boss_ground_slam";
const IMPALE = "boss_impale";
const CHARGE = "boss_charge";
const REND = "boss_rend";

// Magic
const SHADOW = "boss_shadow_bolt";
const FROST = "boss_frost_breath";
const FIRE = "boss_fire_wave";
const POISON = "boss_poison_cloud";
const DRAIN = "boss_life_drain";
const CHAIN = "boss_chain_lightning";
const ARCANE = "boss_arcane_burst";

// Buff
const ENRAGE = "boss_enrage";
const STONE = "boss_stone_skin";
const DARK = "boss_dark_shield";
const REGEN = "boss_regeneration";
const ROAR = "boss_battle_roar";
const HASTE = "boss_haste";

/* ─── Catalog ─── */

export const BOSS_CATALOG: BossCatalogEntry[] = [
  /* ═══════════════════════════════════════════
   *  1. Training Camp (lv 1-7) — 3 abilities
   * ═══════════════════════════════════════════ */
  {
    dungeonId: "training_camp",
    bossIndex: 0,
    name: "Straw Dummy",
    description: "A lifeless target — until the wind picks up.",
    abilityIds: [TAIL, STONE, REND],
  },
  {
    dungeonId: "training_camp",
    bossIndex: 1,
    name: "Rusty Automaton",
    description: "Gears creak. Blades spin. Slowly.",
    abilityIds: [CRUSH, STONE, REND],
  },
  {
    dungeonId: "training_camp",
    bossIndex: 2,
    name: "Barrel Golem",
    description: "Assembled from old casks and spite.",
    abilityIds: [SLAM, STONE, CRUSH],
  },
  {
    dungeonId: "training_camp",
    bossIndex: 3,
    name: "Plank Knight",
    description: "Held together by rusty nails and determination.",
    abilityIds: [IMPALE, STONE, ROAR],
  },
  {
    dungeonId: "training_camp",
    bossIndex: 4,
    name: "Flying Francis",
    description: "Buzzes and staggers through the air. A crash landing is unavoidable.",
    abilityIds: [CHARGE, HASTE, TAIL],
  },
  {
    dungeonId: "training_camp",
    bossIndex: 5,
    name: "Scarecrow Mage",
    description: "Waves a stick. Sparks occasionally fly.",
    abilityIds: [FIRE, SHADOW, DARK],
  },
  {
    dungeonId: "training_camp",
    bossIndex: 6,
    name: "Mud Troll",
    description: "Slow, sticky, surprisingly aggressive.",
    abilityIds: [SLAM, REGEN, ENRAGE],
  },
  {
    dungeonId: "training_camp",
    bossIndex: 7,
    name: "Possessed Mannequin",
    description: "They say it blinks when you look away.",
    abilityIds: [SHADOW, HASTE, REND],
  },
  {
    dungeonId: "training_camp",
    bossIndex: 8,
    name: "Iron Dummy",
    description: "Upgraded. Dangerous. Still has straw hair.",
    abilityIds: [CRUSH, STONE, ENRAGE],
  },
  {
    dungeonId: "training_camp",
    bossIndex: 9,
    name: "Drill Sergeant Grizzle",
    description: "The real boss. Retired from the arena. Still terrifying.",
    abilityIds: [CHARGE, ROAR, FRENZY],
  },

  /* ═══════════════════════════════════════════
   *  2. Desecrated Catacombs (lv 5-12) — 3 abilities
   * ═══════════════════════════════════════════ */
  {
    dungeonId: "desecrated_catacombs",
    bossIndex: 0,
    name: "Ghost",
    description: "A wailing ghost trying fiercely to scare you away.",
    abilityIds: [SHADOW, HASTE, DARK],
  },
  {
    dungeonId: "desecrated_catacombs",
    bossIndex: 1,
    name: "Skeleton Archer",
    description: "Rattling bones, deadly aim.",
    abilityIds: [IMPALE, REND, HASTE],
  },
  {
    dungeonId: "desecrated_catacombs",
    bossIndex: 2,
    name: "Shambling Zombie",
    description: "Slow but impossible to put down.",
    abilityIds: [REGEN, POISON, CRUSH],
  },
  {
    dungeonId: "desecrated_catacombs",
    bossIndex: 3,
    name: "Tomb Spider",
    description: "Spins webs between coffins.",
    abilityIds: [POISON, TAIL, HASTE],
  },
  {
    dungeonId: "desecrated_catacombs",
    bossIndex: 4,
    name: "Bone Golem",
    description: "Assembled from the remains of fallen warriors.",
    abilityIds: [SLAM, STONE, CRUSH],
  },
  {
    dungeonId: "desecrated_catacombs",
    bossIndex: 5,
    name: "Banshee",
    description: "Her scream can freeze blood.",
    abilityIds: [SHADOW, CHAIN, DARK],
  },
  {
    dungeonId: "desecrated_catacombs",
    bossIndex: 6,
    name: "Crypt Knight",
    description: "Still guards his king's tomb. In full plate.",
    abilityIds: [CHARGE, STONE, IMPALE],
  },
  {
    dungeonId: "desecrated_catacombs",
    bossIndex: 7,
    name: "Wraith",
    description: "Phases through walls. Ignores armor.",
    abilityIds: [DRAIN, SHADOW, HASTE],
  },
  {
    dungeonId: "desecrated_catacombs",
    bossIndex: 8,
    name: "Lich Apprentice",
    description: "Learning dark magic. Already dangerous.",
    abilityIds: [ARCANE, SHADOW, DARK],
  },
  {
    dungeonId: "desecrated_catacombs",
    bossIndex: 9,
    name: "Necromancer Voss",
    description: "He raised the dead. Now they serve.",
    abilityIds: [DRAIN, ARCANE, ENRAGE],
  },

  /* ═══════════════════════════════════════════
   *  3. Fungal Grotto (lv 10-17) — 3 abilities
   * ═══════════════════════════════════════════ */
  {
    dungeonId: "fungal_grotto",
    bossIndex: 0,
    name: "Spore Sprite",
    description: "Tiny, glowing, toxic.",
    abilityIds: [POISON, HASTE, TAIL],
  },
  {
    dungeonId: "fungal_grotto",
    bossIndex: 1,
    name: "Mushroom Brute",
    description: "Thick cap. Thicker skull.",
    abilityIds: [SLAM, STONE, ENRAGE],
  },
  {
    dungeonId: "fungal_grotto",
    bossIndex: 2,
    name: "Vine Strangler",
    description: "Wraps around legs. Squeezes.",
    abilityIds: [REND, POISON, CRUSH],
  },
  {
    dungeonId: "fungal_grotto",
    bossIndex: 3,
    name: "Poison Toad",
    description: "One lick and you see colors.",
    abilityIds: [POISON, TAIL, REGEN],
  },
  {
    dungeonId: "fungal_grotto",
    bossIndex: 4,
    name: "Mycelium Golem",
    description: "A walking ecosystem.",
    abilityIds: [SLAM, REGEN, STONE],
  },
  {
    dungeonId: "fungal_grotto",
    bossIndex: 5,
    name: "Rot Witch",
    description: "Brews potions from decay.",
    abilityIds: [POISON, DRAIN, DARK],
  },
  {
    dungeonId: "fungal_grotto",
    bossIndex: 6,
    name: "Fungal Hydra",
    description: "Cut one head — two sprout. Covered in mold.",
    abilityIds: [FRENZY, POISON, REGEN],
  },
  {
    dungeonId: "fungal_grotto",
    bossIndex: 7,
    name: "Sporeling Hive Mind",
    description: "Thousands of tiny spores, one terrible will.",
    abilityIds: [CHAIN, POISON, DARK],
  },
  {
    dungeonId: "fungal_grotto",
    bossIndex: 8,
    name: "Blight Treant",
    description: "The ancient tree fell to corruption.",
    abilityIds: [CRUSH, REGEN, ENRAGE],
  },
  {
    dungeonId: "fungal_grotto",
    bossIndex: 9,
    name: "The Overgrowth",
    description: "The grotto itself fights back.",
    abilityIds: [FRENZY, POISON, REGEN],
  },

  /* ═══════════════════════════════════════════
   *  4. Scorched Mines (lv 15-22) — 3 abilities
   * ═══════════════════════════════════════════ */
  {
    dungeonId: "scorched_mines",
    bossIndex: 0,
    name: "Ember Rat",
    description: "Fast, burning, bites.",
    abilityIds: [FIRE, HASTE, REND],
  },
  {
    dungeonId: "scorched_mines",
    bossIndex: 1,
    name: "Magma Slime",
    description: "Bubbles and burns everything it touches.",
    abilityIds: [FIRE, REGEN, STONE],
  },
  {
    dungeonId: "scorched_mines",
    bossIndex: 2,
    name: "Mine Foreman",
    description: "Swings a red-hot pickaxe.",
    abilityIds: [CRUSH, ENRAGE, IMPALE],
  },
  {
    dungeonId: "scorched_mines",
    bossIndex: 3,
    name: "Lava Beetle",
    description: "Its shell is molten rock.",
    abilityIds: [FIRE, STONE, CHARGE],
  },
  {
    dungeonId: "scorched_mines",
    bossIndex: 4,
    name: "Cinder Elemental",
    description: "Pure fire given hateful form.",
    abilityIds: [FIRE, ARCANE, ENRAGE],
  },
  {
    dungeonId: "scorched_mines",
    bossIndex: 5,
    name: "Soot Dragon Whelp",
    description: "Not full-grown. Still very hot.",
    abilityIds: [FIRE, TAIL, FRENZY],
  },
  {
    dungeonId: "scorched_mines",
    bossIndex: 6,
    name: "Obsidian Guardian",
    description: "Ancient golem fused from volcanic glass.",
    abilityIds: [SLAM, STONE, CRUSH],
  },
  {
    dungeonId: "scorched_mines",
    bossIndex: 7,
    name: "Flame Witch",
    description: "Dances through fire. Controls it.",
    abilityIds: [FIRE, ARCANE, DARK],
  },
  {
    dungeonId: "scorched_mines",
    bossIndex: 8,
    name: "Infernal Siege Engine",
    description: "A mining machine possessed by fire spirits.",
    abilityIds: [FIRE, CRUSH, ENRAGE],
  },
  {
    dungeonId: "scorched_mines",
    bossIndex: 9,
    name: "Pyrax the Molten King",
    description: "The mines bow to him. So does the lava.",
    abilityIds: [FIRE, ENRAGE, FRENZY],
  },

  /* ═══════════════════════════════════════════
   *  5. Frozen Abyss (lv 20-27) — 3 abilities
   * ═══════════════════════════════════════════ */
  {
    dungeonId: "frozen_abyss",
    bossIndex: 0,
    name: "Frost Wisp",
    description: "A floating shard of cold.",
    abilityIds: [FROST, HASTE, SHADOW],
  },
  {
    dungeonId: "frozen_abyss",
    bossIndex: 1,
    name: "Ice Wolf",
    description: "Hunts in frozen packs.",
    abilityIds: [REND, FROST, CHARGE],
  },
  {
    dungeonId: "frozen_abyss",
    bossIndex: 2,
    name: "Glacier Troll",
    description: "Covered in ice. Hits like an avalanche.",
    abilityIds: [SLAM, FROST, STONE],
  },
  {
    dungeonId: "frozen_abyss",
    bossIndex: 3,
    name: "Frozen Sentinel",
    description: "A soldier trapped in ice, still fighting.",
    abilityIds: [FROST, STONE, IMPALE],
  },
  {
    dungeonId: "frozen_abyss",
    bossIndex: 4,
    name: "Blizzard Harpy",
    description: "Shrieks bring hail.",
    abilityIds: [FROST, CHAIN, HASTE],
  },
  {
    dungeonId: "frozen_abyss",
    bossIndex: 5,
    name: "Crystal Golem",
    description: "Each facet reflects a different death.",
    abilityIds: [FROST, STONE, CRUSH],
  },
  {
    dungeonId: "frozen_abyss",
    bossIndex: 6,
    name: "Frost Wyvern",
    description: "Breathes freezing fog.",
    abilityIds: [FROST, TAIL, FRENZY],
  },
  {
    dungeonId: "frozen_abyss",
    bossIndex: 7,
    name: "Ice Lich",
    description: "Master of cold magic.",
    abilityIds: [FROST, ARCANE, DARK],
  },
  {
    dungeonId: "frozen_abyss",
    bossIndex: 8,
    name: "Permafrost Colossus",
    description: "Hasn't moved in centuries. Until now.",
    abilityIds: [FROST, SLAM, ENRAGE],
  },
  {
    dungeonId: "frozen_abyss",
    bossIndex: 9,
    name: "Glacius the Eternal",
    description: "Winter incarnate. The abyss itself.",
    abilityIds: [FROST, ARCANE, ENRAGE],
  },

  /* ═══════════════════════════════════════════
   *  6. Realm of Light (lv 25-32) — 4 abilities
   * ═══════════════════════════════════════════ */
  {
    dungeonId: "realm_of_light",
    bossIndex: 0,
    name: "Light Sprite",
    description: "Blindingly fast, blindingly bright.",
    abilityIds: [ARCANE, HASTE, CHAIN, REND],
  },
  {
    dungeonId: "realm_of_light",
    bossIndex: 1,
    name: "Radiant Archer",
    description: "Arrows of pure light.",
    abilityIds: [IMPALE, ARCANE, HASTE, REND],
  },
  {
    dungeonId: "realm_of_light",
    bossIndex: 2,
    name: "Crystal Beast",
    description: "Reflects attacks as beams.",
    abilityIds: [ARCANE, STONE, CRUSH, DARK],
  },
  {
    dungeonId: "realm_of_light",
    bossIndex: 3,
    name: "Solar Monk",
    description: "Channels the sun through fists.",
    abilityIds: [CRUSH, ENRAGE, ARCANE, HASTE],
  },
  {
    dungeonId: "realm_of_light",
    bossIndex: 4,
    name: "Golden Golem",
    description: "Forged from holy metal.",
    abilityIds: [SLAM, STONE, CRUSH, REGEN],
  },
  {
    dungeonId: "realm_of_light",
    bossIndex: 5,
    name: "Seraph Guardian",
    description: "An angel that asks no questions.",
    abilityIds: [ARCANE, CHAIN, DARK, ENRAGE],
  },
  {
    dungeonId: "realm_of_light",
    bossIndex: 6,
    name: "Prism Dragon",
    description: "Each scale bends light into weapons.",
    abilityIds: [ARCANE, FIRE, FROST, TAIL],
  },
  {
    dungeonId: "realm_of_light",
    bossIndex: 7,
    name: "Light Weaver",
    description: "Stitches reality with radiance.",
    abilityIds: [ARCANE, CHAIN, REGEN, DARK],
  },
  {
    dungeonId: "realm_of_light",
    bossIndex: 8,
    name: "Solar Colossus",
    description: "The temple's last defender.",
    abilityIds: [SLAM, ARCANE, STONE, ENRAGE],
  },
  {
    dungeonId: "realm_of_light",
    bossIndex: 9,
    name: "The Heart of the Ray",
    description: "An artifact given life. Burning judgment.",
    abilityIds: [ARCANE, FIRE, ENRAGE, FRENZY],
  },

  /* ═══════════════════════════════════════════
   *  7. Shadow Realm (lv 30-37) — 4 abilities
   * ═══════════════════════════════════════════ */
  {
    dungeonId: "shadow_realm",
    bossIndex: 0,
    name: "Shadow Wisp",
    description: "A fragment of a nightmare.",
    abilityIds: [SHADOW, HASTE, DARK, DRAIN],
  },
  {
    dungeonId: "shadow_realm",
    bossIndex: 1,
    name: "Dark Stalker",
    description: "Hunts by sound. Silent footsteps.",
    abilityIds: [SHADOW, CHARGE, HASTE, REND],
  },
  {
    dungeonId: "shadow_realm",
    bossIndex: 2,
    name: "Void Spider",
    description: "Webs that devour light.",
    abilityIds: [POISON, SHADOW, HASTE, TAIL],
  },
  {
    dungeonId: "shadow_realm",
    bossIndex: 3,
    name: "Shade Knight",
    description: "Your own silhouette, armored.",
    abilityIds: [SHADOW, STONE, IMPALE, DARK],
  },
  {
    dungeonId: "shadow_realm",
    bossIndex: 4,
    name: "Eclipse Wolf",
    description: "Born from a sunless sky.",
    abilityIds: [SHADOW, FRENZY, CHARGE, REND],
  },
  {
    dungeonId: "shadow_realm",
    bossIndex: 5,
    name: "Nightborne Mage",
    description: "Spells woven from absolute darkness.",
    abilityIds: [SHADOW, ARCANE, DARK, DRAIN],
  },
  {
    dungeonId: "shadow_realm",
    bossIndex: 6,
    name: "Abyss Hydra",
    description: "Each head a different fear.",
    abilityIds: [FRENZY, SHADOW, POISON, ENRAGE],
  },
  {
    dungeonId: "shadow_realm",
    bossIndex: 7,
    name: "Shadow Dragon",
    description: "Breathes oblivion.",
    abilityIds: [SHADOW, ARCANE, TAIL, ENRAGE],
  },
  {
    dungeonId: "shadow_realm",
    bossIndex: 8,
    name: "Void Colossus",
    description: "Where it steps, nothing remains.",
    abilityIds: [SHADOW, SLAM, STONE, ENRAGE],
  },
  {
    dungeonId: "shadow_realm",
    bossIndex: 9,
    name: "The Whispering Dark",
    description: "Not a creature. A place. That hates.",
    abilityIds: [SHADOW, DRAIN, ARCANE, ENRAGE],
  },

  /* ═══════════════════════════════════════════
   *  8. Clockwork Citadel (lv 35-42) — 4 abilities
   * ═══════════════════════════════════════════ */
  {
    dungeonId: "clockwork_citadel",
    bossIndex: 0,
    name: "Gear Sprite",
    description: "Tiny, fast, sparking.",
    abilityIds: [CHAIN, HASTE, TAIL, REND],
  },
  {
    dungeonId: "clockwork_citadel",
    bossIndex: 1,
    name: "Clockwork Hound",
    description: "Metal teeth, spring-loaded jaws.",
    abilityIds: [FRENZY, CHARGE, REND, HASTE],
  },
  {
    dungeonId: "clockwork_citadel",
    bossIndex: 2,
    name: "Piston Golem",
    description: "Each punch backed by steam pressure.",
    abilityIds: [SLAM, CRUSH, STONE, ENRAGE],
  },
  {
    dungeonId: "clockwork_citadel",
    bossIndex: 3,
    name: "Sawblade Dancer",
    description: "Spinning blades, deadly rhythm.",
    abilityIds: [FRENZY, REND, HASTE, IMPALE],
  },
  {
    dungeonId: "clockwork_citadel",
    bossIndex: 4,
    name: "Tesla Turret",
    description: "Zaps anything that moves.",
    abilityIds: [CHAIN, ARCANE, STONE, DARK],
  },
  {
    dungeonId: "clockwork_citadel",
    bossIndex: 5,
    name: "Steam Knight",
    description: "Hisses, clanks, annihilates.",
    abilityIds: [CRUSH, STONE, CHARGE, ENRAGE],
  },
  {
    dungeonId: "clockwork_citadel",
    bossIndex: 6,
    name: "Gear Dragon",
    description: "Wings of interlocking cogs.",
    abilityIds: [FIRE, CHAIN, TAIL, ENRAGE],
  },
  {
    dungeonId: "clockwork_citadel",
    bossIndex: 7,
    name: "Grand Mechanist",
    description: "Builder of nightmares.",
    abilityIds: [CHAIN, ARCANE, STONE, REGEN],
  },
  {
    dungeonId: "clockwork_citadel",
    bossIndex: 8,
    name: "Siege Automaton",
    description: "A walking fortress of brass and fury.",
    abilityIds: [SLAM, CRUSH, STONE, ENRAGE],
  },
  {
    dungeonId: "clockwork_citadel",
    bossIndex: 9,
    name: "The Grand Engine",
    description: "The citadel's heart. Infinite gears. One mind.",
    abilityIds: [CHAIN, FRENZY, ENRAGE, STONE],
  },

  /* ═══════════════════════════════════════════
   *  9. Abyssal Depths (lv 40-47) — 4 abilities
   * ═══════════════════════════════════════════ */
  {
    dungeonId: "abyssal_depths",
    bossIndex: 0,
    name: "Depth Crawler",
    description: "Skitters across the ocean floor.",
    abilityIds: [POISON, TAIL, HASTE, REND],
  },
  {
    dungeonId: "abyssal_depths",
    bossIndex: 1,
    name: "Angler Horror",
    description: "Its light lures. Its jaws close.",
    abilityIds: [DRAIN, CRUSH, DARK, FRENZY],
  },
  {
    dungeonId: "abyssal_depths",
    bossIndex: 2,
    name: "Coral Golem",
    description: "Living reef with a grudge.",
    abilityIds: [SLAM, STONE, REGEN, CRUSH],
  },
  {
    dungeonId: "abyssal_depths",
    bossIndex: 3,
    name: "Siren",
    description: "Her song drowns reason.",
    abilityIds: [SHADOW, DRAIN, DARK, CHAIN],
  },
  {
    dungeonId: "abyssal_depths",
    bossIndex: 4,
    name: "Kraken Spawn",
    description: "One tentacle from something much larger.",
    abilityIds: [FRENZY, CRUSH, SLAM, ENRAGE],
  },
  {
    dungeonId: "abyssal_depths",
    bossIndex: 5,
    name: "Abyssal Leviathan",
    description: "A whale-sized predator with a temper.",
    abilityIds: [CRUSH, SLAM, ENRAGE, REGEN],
  },
  {
    dungeonId: "abyssal_depths",
    bossIndex: 6,
    name: "Deep Sea Dragon",
    description: "Scales covered in barnacles and fury.",
    abilityIds: [FROST, TAIL, FRENZY, ENRAGE],
  },
  {
    dungeonId: "abyssal_depths",
    bossIndex: 7,
    name: "Drowned Admiral",
    description: "Still commands a ghost fleet.",
    abilityIds: [SHADOW, DRAIN, IMPALE, ROAR],
  },
  {
    dungeonId: "abyssal_depths",
    bossIndex: 8,
    name: "Tidal Colossus",
    description: "The ocean given legs.",
    abilityIds: [SLAM, FROST, STONE, ENRAGE],
  },
  {
    dungeonId: "abyssal_depths",
    bossIndex: 9,
    name: "Charybdis the Devourer",
    description: "The abyss opens. Everything falls in.",
    abilityIds: [DRAIN, FRENZY, ENRAGE, ARCANE],
  },

  /* ═══════════════════════════════════════════
   *  10. Infernal Throne (lv 45-52) — 4 abilities
   * ═══════════════════════════════════════════ */
  {
    dungeonId: "infernal_throne",
    bossIndex: 0,
    name: "Imp Swarm",
    description: "Small, vicious, everywhere.",
    abilityIds: [FRENZY, FIRE, HASTE, REND],
  },
  {
    dungeonId: "infernal_throne",
    bossIndex: 1,
    name: "Hellhound Alpha",
    description: "Three heads, triple the fury.",
    abilityIds: [FIRE, FRENZY, CHARGE, REND],
  },
  {
    dungeonId: "infernal_throne",
    bossIndex: 2,
    name: "Flame Demoness",
    description: "Beauty and annihilation.",
    abilityIds: [FIRE, ARCANE, DARK, DRAIN],
  },
  {
    dungeonId: "infernal_throne",
    bossIndex: 3,
    name: "Iron Demon",
    description: "Forged in infernal pits.",
    abilityIds: [CRUSH, STONE, ENRAGE, SLAM],
  },
  {
    dungeonId: "infernal_throne",
    bossIndex: 4,
    name: "Pit Fiend",
    description: "Commander of lesser demons.",
    abilityIds: [FIRE, ROAR, ENRAGE, FRENZY],
  },
  {
    dungeonId: "infernal_throne",
    bossIndex: 5,
    name: "Soul Reaver",
    description: "Steals strength from the fallen.",
    abilityIds: [DRAIN, SHADOW, DARK, ENRAGE],
  },
  {
    dungeonId: "infernal_throne",
    bossIndex: 6,
    name: "Infernal Dragon",
    description: "Fire made flesh, fury made scale.",
    abilityIds: [FIRE, TAIL, FRENZY, ENRAGE],
  },
  {
    dungeonId: "infernal_throne",
    bossIndex: 7,
    name: "Dark Seraph",
    description: "An angel that chose the wrong side.",
    abilityIds: [SHADOW, ARCANE, DRAIN, DARK],
  },
  {
    dungeonId: "infernal_throne",
    bossIndex: 8,
    name: "The Throne Guardian",
    description: "The last line of defense. Absolute.",
    abilityIds: [SLAM, STONE, ENRAGE, CRUSH],
  },
  {
    dungeonId: "infernal_throne",
    bossIndex: 9,
    name: "Archfiend Malachar",
    description: "He sits on the throne. He waits. He wins.",
    abilityIds: [FIRE, ARCANE, ENRAGE, DRAIN],
  },
];

/* ─── Lookup helpers ─── */

const catalogMap = new Map<string, BossCatalogEntry>(
  BOSS_CATALOG.map((entry) => [`${entry.dungeonId}:${entry.bossIndex}`, entry]),
);

/** Get boss catalog entry by dungeon ID and boss index. */
export const getBossCatalogEntry = (
  dungeonId: string,
  bossIndex: number,
): BossCatalogEntry | undefined => catalogMap.get(`${dungeonId}:${bossIndex}`);

/** All boss names (for checking if a name is a known boss). */
export const BOSS_NAMES = new Set(BOSS_CATALOG.map((b) => b.name));

/** Canonical image path for a boss by name. Convention: boss-{kebab-case(name)}.png in /images/bosses/. */
export const getBossImagePath = (name: string): string =>
  `/images/bosses/boss-${name.toLowerCase().replace(/\s+/g, "-")}.png`;
