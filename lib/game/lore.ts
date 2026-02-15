/**
 * Iron Fist Arena — Lore & Narrative Data
 *
 * Single source of truth for all world-building texts, onboarding copy,
 * art prompts, NPC quotes and seasonal flavour.
 *
 * Import from here instead of hardcoding narrative strings in components.
 */

import type { CharacterOrigin } from "./origins";

/* ═══════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════ */

export type PrologueSlide = {
  id: string;
  title: string;
  text: string;
  /** Background image path (generated art). Falls back to gradient if missing. */
  bgImage?: string;
  /** Prompt for AI art generation (stored for reference, not shown to player). */
  artPrompt: string;
};

export type OriginLore = {
  tagline: string;
  loreDescription: string;
  /** Unique onboarding slide shown after the common prologue. */
  prologueSlide: PrologueSlide;
};

export type ClassLore = {
  tagline: string;
};

export type NpcQuote = {
  id: string;
  name: string;
  title: string;
  quote: string;
  /** Default portrait path under /public/images/npcs/ */
  imagePath: string;
};

export type ItemRarityLore = {
  name: string;
  flavour: string;
};

export type SeasonTemplate = {
  id: number;
  name: string;
  tagline: string;
  description: string;
};

/* ═══════════════════════════════════════════════════════════════════
   World
   ═══════════════════════════════════════════════════════════════════ */

export const WORLD = {
  name: "Grandria",
  cityName: "Stray City",
  cityDescription:
    "The last standing settlement on a continent stitched from the ruins of five fallen kingdoms. Once an unremarkable trade outpost, now the reluctant capital of the desperate, the ambitious, and the clinically insane.",
  legend:
    "When the Barrier between worlds cracked, the dead walked, demons deserted their posts, and every monster with a grudge found a way through. Armies fell. Kings vanished. Only Stray City survived — not because it was strong, but because nobody thought it was worth destroying.",
} as const;

/* ═══════════════════════════════════════════════════════════════════
   Arena
   ═══════════════════════════════════════════════════════════════════ */

export const ARENA_LORE = {
  name: "The Iron Fist",
  purpose:
    "A brutal tournament-engine designed to find the strongest fighters in the land. Fight, climb the ranks, and prove your worth.",
  rule: "The Top 100 fighters at the end of each season form the Fist — an elite strike force sent to face the Seasonal Threat. Everyone else? Better luck next time. If the world survives.",
  motto: "Fight. Win. Survive. The rest is paperwork.",
} as const;

/* ═══════════════════════════════════════════════════════════════════
   Hub Building Lore — descriptions shown in map tooltips
   ═══════════════════════════════════════════════════════════════════ */

export type HubBuildingLore = {
  name: string;
  description: string;
  /** Background / scene image for the location page & wiki card */
  imagePath: string;
};

export const HUB_BUILDING_LORE: Record<string, HubBuildingLore> = {
  arena: {
    name: "The Iron Fist",
    description:
      "If you are not brave enough to start life-threatening fights for some gold and honor you are not a true hero.",
    imagePath: "/images/buildings/location-arena.png",
  },
  dungeon: {
    name: "The Catacombs",
    description:
      "Dark tunnels beneath the city, crawling with monsters and treasure. The deeper you go, the richer — or deader — you get.",
    imagePath: "/images/buildings/location-dungeon.png",
  },
  shop: {
    name: "Market Square",
    description:
      "Weapons, armor, potions — if it exists, someone here is selling it. Prices are fair. Refunds are not.",
    imagePath: "/images/buildings/location-shop.png",
  },
  tavern: {
    name: "Mama Grog's Tavern",
    description:
      "Sit down, drink up, lose your gold in the shell game. That's what the tavern's for. Therapy is extra.",
    imagePath: "/images/buildings/location-tavern.png",
  },
  training: {
    name: "Training Grounds",
    description:
      "If you can't beat wood — the darkness will swallow you whole. Practice here before the Arena eats you alive.",
    imagePath: "/images/buildings/location-training.png",
  },
  leaderboard: {
    name: "Hall of Fame",
    description:
      "The eternal records of the greatest fighters. Golden plaques, dusty trophies, and a very long list of names — most of them crossed out.",
    imagePath: "/images/buildings/location-leaderboard.png",
  },
  blacksmith: {
    name: "The Rusty Nail",
    description:
      "Every blade is a work of art. Every art has a price. Bring your gear for repairs, upgrades, and unsolicited opinions.",
    imagePath: "/images/buildings/location-blacksmith.png",
  },
  warehouse: {
    name: "Warehouse",
    description:
      "Store your loot, sort your gear, and pretend you have a system. The warehouse doesn't judge. Much.",
    imagePath: "/images/buildings/location-warehouse.png",
  },
} as const;

/** Get location scene image path by building id. */
export const getLocationImagePath = (buildingId: string): string =>
  `/images/buildings/location-${buildingId}.png`;

/* ═══════════════════════════════════════════════════════════════════
   Common Prologue Slides (shown to ALL new players)
   ═══════════════════════════════════════════════════════════════════ */

const ART_PROMPT_BASE =
  "Create a 2D hand-painted cartoon fantasy RPG scene in casual browser game style. Thick clean black outlines, exaggerated proportions, humorous grotesque tone. Soft gradient shading, one main soft light source, subtle rim light. Vibrant but slightly muted colors, slightly darkened edges. Stylized semi-isometric perspective, whimsical tabletop adventure map feeling. Simplified textures, no realism, no photo textures. Clean readable silhouettes, high contrast, mobile-friendly clarity. Polished casual MMO aesthetic. No UI, no text, no panels.";

export const PROLOGUE_COMMON: PrologueSlide[] = [
  {
    id: "world-that-was",
    title: "The World That Was",
    text: "Grandria was once magnificent. Five kingdoms, endless lands, heroes, legends… and a catastrophic amount of overconfidence. Then the First Season came. Something without a name — but with very specific plans — poured through the Barrier.",
    bgImage: "/images/ui/onboarding/prologue-1.png",
    artPrompt: `${ART_PROMPT_BASE} Stylized fantasy environment, layered depth, soft ambient lighting. A dramatic panoramic view of five crumbling fantasy kingdoms on a vast continent. Ruined castles and towers in different architectural styles — gothic, elvish, orcish, dwarven, human — collapsing under a dark swirling sky. Cracks of otherworldly purple-red energy splitting the ground. Dramatic clouds, falling debris, a sense of epic collapse. Wide establishing shot, cinematic composition.`,
  },
  {
    id: "world-that-is",
    title: "The World That Is",
    text: "The kingdoms fell. Armies crumbled. But life is stubborn. Survivors flocked to the only city still standing — Stray City. A former trade dump that became the last home for everyone: humans, orcs, undead, demons, and those politely referred to as 'other'.",
    bgImage: "/images/ui/onboarding/prologue-2.png",
    artPrompt: `${ART_PROMPT_BASE} Stylized fantasy environment, cartoon buildings and market stalls, playful proportions, layered depth. A bustling medieval fantasy city built among ruins. Patched-together buildings, market stalls with colourful awnings, smoke rising from chimneys. Diverse crowd: humans, orcs, skeletons, demons, dog-people all mingling. A large cracked stone gate at the entrance reads nothing (no text). Warm amber lighting mixed with cool shadows. Cozy yet chaotic atmosphere. Wide establishing shot from slightly above.`,
  },
  {
    id: "the-arena",
    title: "The Iron Fist",
    text: "When it became clear that evil arrives every season — like taxes, but worse — the city found a solution. Not an army. Not prayers. An Arena. Fight — and if you make it to the Top 100, you get to save the world. If you don't… well, at least you had fun.",
    bgImage: "/images/ui/onboarding/prologue-3.png",
    artPrompt: `${ART_PROMPT_BASE} Stylized fantasy environment, layered depth, rich colour palette. A grand stone arena in the centre of a medieval fantasy city. Circular colosseum-style structure with banners and torches. A roaring crowd of diverse fantasy races in the stands. Two silhouetted fighters facing each other in the sandy pit below. Dramatic warm spotlights from above, dust particles in the air. Epic yet humorous tone — some spectators eating snacks, one skeleton waving a foam finger. Wide shot showing the full arena.`,
  },
];

/* ═══════════════════════════════════════════════════════════════════
   Origin (Race) Lore — per-race taglines + unique prologue slide
   ═══════════════════════════════════════════════════════════════════ */

export const ORIGIN_LORE: Record<CharacterOrigin, OriginLore> = {
  human: {
    tagline: "Average at everything. Best at adapting.",
    loreDescription:
      "Humans lost their kingdoms and arrived in Stray City as refugees. They are versatile, adaptive, and still convinced the world revolves around them.",
    prologueSlide: {
      id: "origin-human",
      title: "A Fresh Start",
      text: "You were a simple farmer — or a guard, or a merchant — from a village that now only exists on old maps. You walked to Stray City looking for a better life. You got a registration card and directions to the Arena. \"Newcomer?\" the registrar asked. \"Don't worry. Everyone here is a newcomer. Some — for the second time.\"",
      bgImage: "/images/origins/origin-human.png",
      artPrompt: `${ART_PROMPT_BASE} Fantasy RPG character scene. A weary but determined human traveller approaching a large city gate. They carry a small pack and look up at the imposing walls of Stray City. A bored orc guard leans against the gate, pointing lazily toward a sign. Warm sunset lighting, dusty road, a sense of new beginnings mixed with exhaustion. Character is cartoonish with big eyes and simple armour.`,
    },
  },
  dogfolk: {
    tagline: "Loyalty is not a trait. It's a weapon.",
    loreDescription:
      "Dogfolk are canine warriors driven by unconditional loyalty. Once they decide to protect the world, they won't stop — even if it kills them. Literally.",
    prologueSlide: {
      id: "origin-dogfolk",
      title: "The Last of the Pack",
      text: "Your pack died protecting a caravan. You were the only one who made it to Stray City. Wounded, starving, but with a growl that made the gate guards step back. \"A dog? In the Arena?\" laughed an orc bouncer. Five minutes later he was apologising. From the floor.",
      bgImage: "/images/origins/origin-dogfolk.png",
      artPrompt: `${ART_PROMPT_BASE} Fantasy RPG character scene. A muscular anthropomorphic dog warrior limping through a city gate, bandaged but fierce. Behind them, a dusty road stretches to the horizon. An intimidated orc guard steps aside nervously. The dog-warrior has loyal determined eyes, scarred armor, and clenched fists. Warm amber light, dramatic mood with a touch of comedy.`,
    },
  },
  orc: {
    tagline: "Hit first. Ask later. Hit again.",
    loreDescription:
      "Orcs lost their war clans after the Cataclysm. Former enemies, now blacksmiths, bouncers, and 'motivational consultants' in Stray City's south quarter.",
    prologueSlide: {
      id: "origin-orc",
      title: "Fists Need Work",
      text: "The Thunderfist Clan fell apart after the Cataclysm. You could've become a mercenary, a bandit, a philosopher… but your fists were itching. The Arena is the only place where fighting pays instead of getting you fined. \"Why are you here?\" — \"Because I can.\" — \"…Fair enough. Next!\"",
      bgImage: "/images/origins/origin-orc.png",
      artPrompt: `${ART_PROMPT_BASE} Fantasy RPG character scene. A large green-skinned orc with oversized fists standing in front of an Arena registration desk. A tiny goblin clerk looks up at the orc nervously while stamping a paper. The orc grins with one tusk poking out. Behind them, a queue of diverse fighters. Warm interior tavern-like lighting, humorous tone.`,
    },
  },
  demon: {
    tagline: "Even Hell couldn't hold us.",
    loreDescription:
      "Not all demons serve evil. Some deserted from Inferno after yet another bureaucratic reform (yes, Hell has bureaucracy, and it's worse than you think). They trade, fight, and complain about the weather.",
    prologueSlide: {
      id: "origin-demon",
      title: "The Deserter",
      text: "You're a deserter. You fled the Seventh Bureaucratic Circle of Inferno when you found out your contract was extended for eternity. Literally. On the surface — fresh air, strange food, and people who look at you with suspicion. The Arena is the only place where reputation is forged by fists, not seals.",
      bgImage: "/images/origins/origin-demon.png",
      artPrompt: `${ART_PROMPT_BASE} Fantasy RPG character scene. A medium-sized demon with small horns and a tired office-worker expression, stepping out of a glowing red portal into a sunny medieval street. They carry a singed briefcase and look relieved. Nearby townsfolk stare suspiciously. Contrast between the hellish red glow behind and the warm daylight ahead. Comedy meets fantasy.`,
    },
  },
  skeleton: {
    tagline: "Death is not the end. It's an inconvenience.",
    loreDescription:
      "When the Barrier cracked, graveyards spat out those who had unfinished business. They're not evil — just extremely irritated and legally questionable.",
    prologueSlide: {
      id: "origin-skeleton",
      title: "Rude Awakening",
      text: "You woke up. That would be normal if not for two facts: first — you only remember your name, second — you're dead. Technically. The graveyard spat you out along with a couple dozen other annoyed skeletons. \"Undead? In the Arena?\" — \"Where else? Back in the pit?\"",
      bgImage: "/images/origins/origin-skeleton.png",
      artPrompt: `${ART_PROMPT_BASE} Fantasy RPG character scene. A cartoon skeleton climbing out of an open grave in a moonlit cemetery, looking confused and annoyed. They dust off old armour pieces. Other skeletons in the background are also climbing out, some stretching, one checking a pocket watch. A living guard at the cemetery gate looks horrified. Blue-purple moonlight, comedic gothic atmosphere.`,
    },
  },
};

/* ═══════════════════════════════════════════════════════════════════
   Class Lore — taglines for onboarding class selection
   ═══════════════════════════════════════════════════════════════════ */

export const CLASS_LORE: Record<string, ClassLore> = {
  warrior: { tagline: "Problems can be solved with a sword. A big sword." },
  rogue: { tagline: "If the enemy can't see you — they've already lost." },
  mage: { tagline: "Books, staves, and a ball of pure chaos." },
  tank: { tagline: "You hit me? Cute. My turn." },
};

/* ═══════════════════════════════════════════════════════════════════
   Item Rarity Lore
   ═══════════════════════════════════════════════════════════════════ */

export const ITEM_RARITY_LORE: ItemRarityLore[] = [
  {
    name: "Common",
    flavour:
      "Junkyard scraps from Stray City. Handed out at the Arena entrance — for free, because nobody else wants them. \"Is this a sword or a rusty stick?\" — \"Yes.\"",
  },
  {
    name: "Uncommon",
    flavour:
      "Honest work from city blacksmiths. Cheap, but real metal. \"Won't break. Probably.\"",
  },
  {
    name: "Rare",
    flavour:
      "Master-forged steel and enchanted crystals. If you've got blue gear, you survived the Catacombs. Respect. \"Oh, blue loot? Means you made it past floor three.\"",
  },
  {
    name: "Epic",
    flavour:
      "Artifacts from the depths — infused with Barrier energy. Dark, pulsing, dangerous even to the wielder. \"Purple? Don't touch it with bare hands.\"",
  },
  {
    name: "Legendary",
    flavour:
      "Relics of the First Champions — those who walked against Seasonal Threats and returned. Four legendary sets, one per class. \"If you see golden light — it's either a legend or a trap.\"",
  },
];

/* ═══════════════════════════════════════════════════════════════════
   NPC Quotes
   ═══════════════════════════════════════════════════════════════════ */

export const NPC_QUOTES: NpcQuote[] = [
  {
    id: "registrar-grims",
    name: "Registrar Grims",
    title: "Arena Registrar",
    quote: "Name? Class? Race? Good. Here's your starter kit. No refunds. No complaints. No crying in the lobby.",
    imagePath: "/images/npcs/npc-registrar-grims.png",
  },
  {
    id: "bram-one-eye",
    name: "Bram One-Eye",
    title: "Blacksmith, 'The Rusty Nail'",
    quote: "I forge common gear. What'd you expect, enchanted mithril? Pay common prices, get common quality. Now scram.",
    imagePath: "/images/npcs/npc-bram-one-eye.png",
  },
  {
    id: "blue-anvil-masters",
    name: "The Blue Anvil Masters",
    title: "Master Smiths Guild",
    quote: "Every blade is a work of art. Every art has a price. Usually more than you can afford.",
    imagePath: "/images/npcs/npc-blue-anvil-masters.png",
  },
  {
    id: "mama-grog",
    name: "Mama Grog",
    title: "Tavern Owner",
    quote: "Sit down, drink up, lose your gold in the shell game. That's what the tavern's for. Therapy is extra.",
    imagePath: "/images/npcs/npc-mama-grog.png",
  },
  {
    id: "old-instructor-fang",
    name: "Old Instructor Fang",
    title: "Training Master",
    quote: "If you can't beat wood — the darkness will swallow you whole.",
    imagePath: "/images/npcs/npc-old-instructor-fang.png",
  },
];

/** Get NPC image path by NPC id. */
export const getNpcImagePath = (npcId: string): string =>
  `/images/npcs/npc-${npcId}.png`;

/* ═══════════════════════════════════════════════════════════════════
   Season Templates
   ═══════════════════════════════════════════════════════════════════ */

export const SEASON_TEMPLATES: SeasonTemplate[] = [
  {
    id: 1,
    name: "The Rotting King's Horde",
    tagline: "The dead march with purpose.",
    description:
      "An army of intelligent undead led by a self-proclaimed king who refuses to stay buried. His generals command legions of ghouls, wraiths, and one very confused lich who just wanted retirement.",
  },
  {
    id: 2,
    name: "The Crystalline Blight",
    tagline: "The stones are alive. And hungry.",
    description:
      "Living crystals that consume magic and grow by absorbing everything they touch. Entire forests turned to glass. The Blight doesn't negotiate — it refracts.",
  },
  {
    id: 3,
    name: "The Faceless Storm",
    tagline: "Weather with a grudge.",
    description:
      "A sentient elemental catastrophe — part hurricane, part earthquake, part existential crisis. It doesn't attack cities. It erases them from the map.",
  },
  {
    id: 4,
    name: "The Infernal Auditor",
    tagline: "Hell sent middle management.",
    description:
      "A demon bureaucrat who decided to 'optimise' the mortal realm. Armed with infernal contracts, soul-binding fine print, and an army of imp accountants. The most terrifying threat yet.",
  },
];

/* ═══════════════════════════════════════════════════════════════════
   Onboarding UI Copy
   ═══════════════════════════════════════════════════════════════════ */

export const ONBOARDING_COPY = {
  raceSelectionTitle: "Choose Your Origin",
  raceSelectionSubtitle: "Every race has its story. What's yours?",
  prologueSkipLabel: "Skip",
  prologueNextLabel: "Next",
  prologueTapHint: "Tap to continue",
  finalSlideTitle: "Welcome to Stray City",
  finalSlideText: (name: string) =>
    `Welcome to Stray City, ${name}. The Arena awaits. The dungeons hunger. The shop is open. And somewhere beyond the Barrier, the next Seasonal Threat is already stirring. But that's later. First — show us what you're made of.`,
  enterCityLabel: "Enter the City",
} as const;
