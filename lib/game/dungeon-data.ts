/** Static dungeon & boss definitions.
 *  Each dungeon has 10 bosses beaten sequentially.
 *  Unlock chain: prevDungeonId must be completed (10/10) to unlock next. */

import { getBossCatalogEntry } from "./boss-catalog";

/* ─── Types ─── */

export type DungeonBoss = {
  index: number; // 0-9
  name: string;
  description: string;
  level: number;
  statMultiplier: number; // Scaling factor for boss stats
  abilityIds: string[]; // Boss ability IDs from boss-catalog
};

export type DungeonTheme = {
  gradient: string;
  cardBg: string;
  accent: string;
  glowColor: string;
  borderGlow: string;
  icon: string;
};

export type DungeonDefinition = {
  id: string;
  name: string;
  subtitle: string;
  minLevel: number;
  staminaCost: number;
  prevDungeonId: string | null;
  bosses: DungeonBoss[];
  theme: DungeonTheme;
};

/* ─── Boss helper ─── */

const boss = (
  dungeonId: string,
  index: number,
  name: string,
  description: string,
  baseLevel: number,
  mult: number,
): DungeonBoss => ({
  index,
  name,
  description,
  level: baseLevel + index,
  statMultiplier: mult + index * 0.15,
  abilityIds: getBossCatalogEntry(dungeonId, index)?.abilityIds ?? [],
});

/* ─── Dungeon catalogue ─── */

export const DUNGEONS: DungeonDefinition[] = [
  /* 1. Training Camp ─────────────────────── */
  {
    id: "training_camp",
    name: "Training Camp",
    subtitle: "Where pups become warriors",
    minLevel: 1,
    staminaCost: 10,
    prevDungeonId: null,
    theme: {
      gradient: "from-green-900 via-emerald-800 to-green-950",
      cardBg: "from-green-950/90 via-emerald-950/80 to-slate-950/90",
      accent: "border-green-500/70 shadow-green-500/30",
      glowColor: "ring-green-400/50",
      borderGlow: "hover:shadow-green-500/20",
      icon: "🏕️",
    },
    bosses: [
      boss("training_camp", 0, "Straw Dummy", "A lifeless target — until the wind picks up.", 1, 0.5),
      boss("training_camp", 1, "Rusty Automaton", "Gears creak. Blades spin. Slowly.", 2, 0.55),
      boss("training_camp", 2, "Barrel Golem", "Assembled from old casks and spite.", 3, 0.6),
      boss("training_camp", 3, "Plank Knight", "Held together by rusty nails and determination.", 3, 0.65),
      boss("training_camp", 4, "Flying Francis", "Buzzes and staggers through the air. A crash landing is unavoidable.", 4, 0.7),
      boss("training_camp", 5, "Scarecrow Mage", "Waves a stick. Sparks occasionally fly.", 4, 0.75),
      boss("training_camp", 6, "Mud Troll", "Slow, sticky, surprisingly aggressive.", 5, 0.8),
      boss("training_camp", 7, "Possessed Mannequin", "They say it blinks when you look away.", 5, 0.85),
      boss("training_camp", 8, "Iron Dummy", "Upgraded. Dangerous. Still has straw hair.", 6, 0.9),
      boss("training_camp", 9, "Drill Sergeant Grizzle", "The real boss. Retired from the arena. Still terrifying.", 7, 1.0),
    ],
  },

  /* 2. Desecrated Catacombs ───────────── */
  {
    id: "desecrated_catacombs",
    name: "Desecrated Catacombs",
    subtitle: "Where the dead refuse to rest",
    minLevel: 5,
    staminaCost: 12,
    prevDungeonId: "training_camp",
    theme: {
      gradient: "from-cyan-900 via-teal-800 to-cyan-950",
      cardBg: "from-cyan-950/90 via-teal-950/80 to-slate-950/90",
      accent: "border-cyan-500/70 shadow-cyan-500/30",
      glowColor: "ring-cyan-400/50",
      borderGlow: "hover:shadow-cyan-500/20",
      icon: "💀",
    },
    bosses: [
      boss("desecrated_catacombs", 0, "Ghost", "A wailing ghost trying fiercely to scare you away.", 5, 0.7),
      boss("desecrated_catacombs", 1, "Skeleton Archer", "Rattling bones, deadly aim.", 6, 0.75),
      boss("desecrated_catacombs", 2, "Shambling Zombie", "Slow but impossible to put down.", 7, 0.8),
      boss("desecrated_catacombs", 3, "Tomb Spider", "Spins webs between coffins.", 7, 0.85),
      boss("desecrated_catacombs", 4, "Bone Golem", "Assembled from the remains of fallen warriors.", 8, 0.9),
      boss("desecrated_catacombs", 5, "Banshee", "Her scream can freeze blood.", 8, 0.95),
      boss("desecrated_catacombs", 6, "Crypt Knight", "Still guards his king's tomb. In full plate.", 9, 1.0),
      boss("desecrated_catacombs", 7, "Wraith", "Phases through walls. Ignores armor.", 10, 1.05),
      boss("desecrated_catacombs", 8, "Lich Apprentice", "Learning dark magic. Already dangerous.", 10, 1.1),
      boss("desecrated_catacombs", 9, "Necromancer Voss", "He raised the dead. Now they serve.", 12, 1.2),
    ],
  },

  /* 3. Fungal Grotto ──────────────────── */
  {
    id: "fungal_grotto",
    name: "Fungal Grotto",
    subtitle: "The spores whisper secrets",
    minLevel: 10,
    staminaCost: 14,
    prevDungeonId: "desecrated_catacombs",
    theme: {
      gradient: "from-lime-900 via-green-800 to-lime-950",
      cardBg: "from-lime-950/90 via-green-950/80 to-slate-950/90",
      accent: "border-lime-500/70 shadow-lime-500/30",
      glowColor: "ring-lime-400/50",
      borderGlow: "hover:shadow-lime-500/20",
      icon: "🍄",
    },
    bosses: [
      boss("fungal_grotto", 0, "Spore Sprite", "Tiny, glowing, toxic.", 10, 0.8),
      boss("fungal_grotto", 1, "Mushroom Brute", "Thick cap. Thicker skull.", 11, 0.85),
      boss("fungal_grotto", 2, "Vine Strangler", "Wraps around legs. Squeezes.", 12, 0.9),
      boss("fungal_grotto", 3, "Poison Toad", "One lick and you see colors.", 12, 0.95),
      boss("fungal_grotto", 4, "Mycelium Golem", "A walking ecosystem.", 13, 1.0),
      boss("fungal_grotto", 5, "Rot Witch", "Brews potions from decay.", 13, 1.05),
      boss("fungal_grotto", 6, "Fungal Hydra", "Cut one head — two sprout. Covered in mold.", 14, 1.1),
      boss("fungal_grotto", 7, "Sporeling Hive Mind", "Thousands of tiny spores, one terrible will.", 15, 1.15),
      boss("fungal_grotto", 8, "Blight Treant", "The ancient tree fell to corruption.", 15, 1.2),
      boss("fungal_grotto", 9, "The Overgrowth", "The grotto itself fights back.", 17, 1.35),
    ],
  },

  /* 4. Scorched Mines ─────────────────── */
  {
    id: "scorched_mines",
    name: "Scorched Mines",
    subtitle: "Heat rises from below",
    minLevel: 15,
    staminaCost: 16,
    prevDungeonId: "fungal_grotto",
    theme: {
      gradient: "from-orange-900 via-red-800 to-orange-950",
      cardBg: "from-orange-950/90 via-red-950/80 to-slate-950/90",
      accent: "border-orange-500/70 shadow-orange-500/30",
      glowColor: "ring-orange-400/50",
      borderGlow: "hover:shadow-orange-500/20",
      icon: "🔥",
    },
    bosses: [
      boss("scorched_mines", 0, "Ember Rat", "Fast, burning, bites.", 15, 0.9),
      boss("scorched_mines", 1, "Magma Slime", "Bubbles and burns everything it touches.", 16, 0.95),
      boss("scorched_mines", 2, "Mine Foreman", "Swings a red-hot pickaxe.", 17, 1.0),
      boss("scorched_mines", 3, "Lava Beetle", "Its shell is molten rock.", 17, 1.05),
      boss("scorched_mines", 4, "Cinder Elemental", "Pure fire given hateful form.", 18, 1.1),
      boss("scorched_mines", 5, "Soot Dragon Whelp", "Not full-grown. Still very hot.", 18, 1.15),
      boss("scorched_mines", 6, "Obsidian Guardian", "Ancient golem fused from volcanic glass.", 19, 1.2),
      boss("scorched_mines", 7, "Flame Witch", "Dances through fire. Controls it.", 20, 1.25),
      boss("scorched_mines", 8, "Infernal Siege Engine", "A mining machine possessed by fire spirits.", 20, 1.3),
      boss("scorched_mines", 9, "Pyrax the Molten King", "The mines bow to him. So does the lava.", 22, 1.45),
    ],
  },

  /* 5. Frozen Abyss ───────────────────── */
  {
    id: "frozen_abyss",
    name: "Frozen Abyss",
    subtitle: "Where even fire freezes",
    minLevel: 20,
    staminaCost: 18,
    prevDungeonId: "scorched_mines",
    theme: {
      gradient: "from-blue-900 via-sky-800 to-blue-950",
      cardBg: "from-blue-950/90 via-sky-950/80 to-slate-950/90",
      accent: "border-blue-500/70 shadow-blue-500/30",
      glowColor: "ring-blue-400/50",
      borderGlow: "hover:shadow-blue-500/20",
      icon: "❄️",
    },
    bosses: [
      boss("frozen_abyss", 0, "Frost Wisp", "A floating shard of cold.", 20, 1.0),
      boss("frozen_abyss", 1, "Ice Wolf", "Hunts in frozen packs.", 21, 1.05),
      boss("frozen_abyss", 2, "Glacier Troll", "Covered in ice. Hits like an avalanche.", 22, 1.1),
      boss("frozen_abyss", 3, "Frozen Sentinel", "A soldier trapped in ice, still fighting.", 22, 1.15),
      boss("frozen_abyss", 4, "Blizzard Harpy", "Shrieks bring hail.", 23, 1.2),
      boss("frozen_abyss", 5, "Crystal Golem", "Each facet reflects a different death.", 23, 1.25),
      boss("frozen_abyss", 6, "Frost Wyvern", "Breathes freezing fog.", 24, 1.3),
      boss("frozen_abyss", 7, "Ice Lich", "Master of cold magic.", 25, 1.35),
      boss("frozen_abyss", 8, "Permafrost Colossus", "Hasn't moved in centuries. Until now.", 25, 1.4),
      boss("frozen_abyss", 9, "Glacius the Eternal", "Winter incarnate. The abyss itself.", 27, 1.55),
    ],
  },

  /* 6. Realm of Light ─────────────────── */
  {
    id: "realm_of_light",
    name: "Realm of Light",
    subtitle: "Where light burns brighter than fire",
    minLevel: 25,
    staminaCost: 20,
    prevDungeonId: "frozen_abyss",
    theme: {
      gradient: "from-amber-900 via-yellow-800 to-amber-950",
      cardBg: "from-amber-950/90 via-yellow-950/80 to-slate-950/90",
      accent: "border-amber-500/70 shadow-amber-500/30",
      glowColor: "ring-amber-400/50",
      borderGlow: "hover:shadow-amber-500/20",
      icon: "✨",
    },
    bosses: [
      boss("realm_of_light", 0, "Light Sprite", "Blindingly fast, blindingly bright.", 25, 1.1),
      boss("realm_of_light", 1, "Radiant Archer", "Arrows of pure light.", 26, 1.15),
      boss("realm_of_light", 2, "Crystal Beast", "Reflects attacks as beams.", 27, 1.2),
      boss("realm_of_light", 3, "Solar Monk", "Channels the sun through fists.", 27, 1.25),
      boss("realm_of_light", 4, "Golden Golem", "Forged from holy metal.", 28, 1.3),
      boss("realm_of_light", 5, "Seraph Guardian", "An angel that asks no questions.", 28, 1.35),
      boss("realm_of_light", 6, "Prism Dragon", "Each scale bends light into weapons.", 29, 1.4),
      boss("realm_of_light", 7, "Light Weaver", "Stitches reality with radiance.", 30, 1.45),
      boss("realm_of_light", 8, "Solar Colossus", "The temple's last defender.", 30, 1.5),
      boss("realm_of_light", 9, "The Heart of the Ray", "An artifact given life. Burning judgment.", 32, 1.65),
    ],
  },

  /* 7. Shadow Realm ───────────────────── */
  {
    id: "shadow_realm",
    name: "Shadow Realm",
    subtitle: "Where the darkness stares back",
    minLevel: 30,
    staminaCost: 22,
    prevDungeonId: "realm_of_light",
    theme: {
      gradient: "from-purple-900 via-violet-800 to-purple-950",
      cardBg: "from-purple-950/90 via-violet-950/80 to-slate-950/90",
      accent: "border-purple-500/70 shadow-purple-500/30",
      glowColor: "ring-purple-400/50",
      borderGlow: "hover:shadow-purple-500/20",
      icon: "🌑",
    },
    bosses: [
      boss("shadow_realm", 0, "Shadow Wisp", "A fragment of a nightmare.", 30, 1.2),
      boss("shadow_realm", 1, "Dark Stalker", "Hunts by sound. Silent footsteps.", 31, 1.25),
      boss("shadow_realm", 2, "Void Spider", "Webs that devour light.", 32, 1.3),
      boss("shadow_realm", 3, "Shade Knight", "Your own silhouette, armored.", 32, 1.35),
      boss("shadow_realm", 4, "Eclipse Wolf", "Born from a sunless sky.", 33, 1.4),
      boss("shadow_realm", 5, "Nightborne Mage", "Spells woven from absolute darkness.", 33, 1.45),
      boss("shadow_realm", 6, "Abyss Hydra", "Each head a different fear.", 34, 1.5),
      boss("shadow_realm", 7, "Shadow Dragon", "Breathes oblivion.", 35, 1.55),
      boss("shadow_realm", 8, "Void Colossus", "Where it steps, nothing remains.", 35, 1.6),
      boss("shadow_realm", 9, "The Whispering Dark", "Not a creature. A place. That hates.", 37, 1.75),
    ],
  },

  /* 8. Clockwork Citadel ──────────────── */
  {
    id: "clockwork_citadel",
    name: "Clockwork Citadel",
    subtitle: "Gears never stop turning",
    minLevel: 35,
    staminaCost: 24,
    prevDungeonId: "shadow_realm",
    theme: {
      gradient: "from-zinc-800 via-neutral-700 to-zinc-900",
      cardBg: "from-zinc-900/90 via-neutral-900/80 to-slate-950/90",
      accent: "border-zinc-400/70 shadow-zinc-400/30",
      glowColor: "ring-zinc-300/50",
      borderGlow: "hover:shadow-zinc-400/20",
      icon: "⚙️",
    },
    bosses: [
      boss("clockwork_citadel", 0, "Gear Sprite", "Tiny, fast, sparking.", 35, 1.3),
      boss("clockwork_citadel", 1, "Clockwork Hound", "Metal teeth, spring-loaded jaws.", 36, 1.35),
      boss("clockwork_citadel", 2, "Piston Golem", "Each punch backed by steam pressure.", 37, 1.4),
      boss("clockwork_citadel", 3, "Sawblade Dancer", "Spinning blades, deadly rhythm.", 37, 1.45),
      boss("clockwork_citadel", 4, "Tesla Turret", "Zaps anything that moves.", 38, 1.5),
      boss("clockwork_citadel", 5, "Steam Knight", "Hisses, clanks, annihilates.", 38, 1.55),
      boss("clockwork_citadel", 6, "Gear Dragon", "Wings of interlocking cogs.", 39, 1.6),
      boss("clockwork_citadel", 7, "Grand Mechanist", "Builder of nightmares.", 40, 1.65),
      boss("clockwork_citadel", 8, "Siege Automaton", "A walking fortress of brass and fury.", 40, 1.7),
      boss("clockwork_citadel", 9, "The Grand Engine", "The citadel's heart. Infinite gears. One mind.", 42, 1.85),
    ],
  },

  /* 9. Abyssal Depths ─────────────────── */
  {
    id: "abyssal_depths",
    name: "Abyssal Depths",
    subtitle: "Beneath the world, something waits",
    minLevel: 40,
    staminaCost: 26,
    prevDungeonId: "clockwork_citadel",
    theme: {
      gradient: "from-indigo-900 via-blue-900 to-indigo-950",
      cardBg: "from-indigo-950/90 via-blue-950/80 to-slate-950/90",
      accent: "border-indigo-500/70 shadow-indigo-500/30",
      glowColor: "ring-indigo-400/50",
      borderGlow: "hover:shadow-indigo-500/20",
      icon: "🌊",
    },
    bosses: [
      boss("abyssal_depths", 0, "Depth Crawler", "Skitters across the ocean floor.", 40, 1.4),
      boss("abyssal_depths", 1, "Angler Horror", "Its light lures. Its jaws close.", 41, 1.45),
      boss("abyssal_depths", 2, "Coral Golem", "Living reef with a grudge.", 42, 1.5),
      boss("abyssal_depths", 3, "Siren", "Her song drowns reason.", 42, 1.55),
      boss("abyssal_depths", 4, "Kraken Spawn", "One tentacle from something much larger.", 43, 1.6),
      boss("abyssal_depths", 5, "Abyssal Leviathan", "A whale-sized predator with a temper.", 43, 1.65),
      boss("abyssal_depths", 6, "Deep Sea Dragon", "Scales covered in barnacles and fury.", 44, 1.7),
      boss("abyssal_depths", 7, "Drowned Admiral", "Still commands a ghost fleet.", 45, 1.75),
      boss("abyssal_depths", 8, "Tidal Colossus", "The ocean given legs.", 45, 1.8),
      boss("abyssal_depths", 9, "Charybdis the Devourer", "The abyss opens. Everything falls in.", 47, 1.95),
    ],
  },

  /* 10. Infernal Throne ───────────────── */
  {
    id: "infernal_throne",
    name: "Infernal Throne",
    subtitle: "The final descent into madness",
    minLevel: 45,
    staminaCost: 30,
    prevDungeonId: "abyssal_depths",
    theme: {
      gradient: "from-red-900 via-rose-800 to-red-950",
      cardBg: "from-red-950/90 via-rose-950/80 to-slate-950/90",
      accent: "border-red-500/70 shadow-red-500/30",
      glowColor: "ring-red-400/50",
      borderGlow: "hover:shadow-red-500/20",
      icon: "👑",
    },
    bosses: [
      boss("infernal_throne", 0, "Imp Swarm", "Small, vicious, everywhere.", 45, 1.5),
      boss("infernal_throne", 1, "Hellhound Alpha", "Three heads, triple the fury.", 46, 1.55),
      boss("infernal_throne", 2, "Flame Demoness", "Beauty and annihilation.", 47, 1.6),
      boss("infernal_throne", 3, "Iron Demon", "Forged in infernal pits.", 47, 1.65),
      boss("infernal_throne", 4, "Pit Fiend", "Commander of lesser demons.", 48, 1.7),
      boss("infernal_throne", 5, "Soul Reaver", "Steals strength from the fallen.", 48, 1.75),
      boss("infernal_throne", 6, "Infernal Dragon", "Fire made flesh, fury made scale.", 49, 1.8),
      boss("infernal_throne", 7, "Dark Seraph", "An angel that chose the wrong side.", 50, 1.85),
      boss("infernal_throne", 8, "The Throne Guardian", "The last line of defense. Absolute.", 50, 1.9),
      boss("infernal_throne", 9, "Archfiend Malachar", "He sits on the throne. He waits. He wins.", 52, 2.1),
    ],
  },
];

/* ─── Lookup helpers ─── */

export const getDungeonById = (id: string): DungeonDefinition | undefined =>
  DUNGEONS.find((d) => d.id === id);

export const BOSSES_PER_DUNGEON = 10;
