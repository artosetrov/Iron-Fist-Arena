"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import PageHeader from "@/app/components/PageHeader";
import CombatBattleScreen from "@/app/components/CombatBattleScreen";
import CombatLootScreen from "@/app/components/CombatLootScreen";
import StanceSelector from "@/app/components/StanceSelector";
import type { CombatStance } from "@/lib/game/types";
import PageLoader from "@/app/components/PageLoader";
import HeroCard from "@/app/components/HeroCard";
import { BOSS_CATALOG } from "@/lib/game/boss-catalog";
import { BOSS_ABILITIES } from "@/lib/game/boss-abilities";
import CardCarousel from "@/app/components/ui/CardCarousel";
import { getBossStats } from "@/lib/game/dungeon";
import GameIcon, { type GameIconKey } from "@/app/components/ui/GameIcon";
import { GameButton, GameCard, PageContainer } from "@/app/components/ui";

/* ────────────────── Types ────────────────── */

type Character = {
  id: string;
  characterName: string;
  level: number;
  currentStamina: number;
  maxStamina: number;
  gold?: number;
};

type CombatantSnapshot = {
  id: string;
  name: string;
  class: string;
  level: number;
  currentHp: number;
  maxHp: number;
  baseStats: {
    strength: number;
    agility: number;
    vitality: number;
    endurance: number;
    intelligence: number;
    wisdom: number;
    luck: number;
    charisma: number;
  };
};

type CombatLogEntry = {
  turn: number;
  actorId: string;
  targetId: string;
  action: string;
  damage?: number;
  healed?: number;
  dodge?: boolean;
  crit?: boolean;
  message: string;
  actorHpAfter?: number;
  targetHpAfter?: number;
  statusTicks?: { type: string; damage?: number; healed?: number }[];
};

type DungeonBoss = {
  index: number;
  name: string;
  description: string;
  level: number;
  statMultiplier: number;
};

type DungeonTheme = {
  gradient: string;
  cardBg: string;
  accent: string;
  glowColor: string;
  borderGlow: string;
  icon: string;
};

type DungeonInfo = {
  id: string;
  name: string;
  subtitle: string;
  minLevel: number;
  staminaCost: number;
  prevDungeonId: string | null;
  bosses: DungeonBoss[];
  theme: DungeonTheme;
  unlocked: boolean;
  bossIndex: number;
  completed: boolean;
  currentBoss: DungeonBoss | null;
};

type FightResult = {
  victory?: boolean;
  dungeonComplete?: boolean;
  rewards?: { gold: number; xp: number };
  log?: CombatLogEntry[];
  playerSnapshot?: CombatantSnapshot;
  enemySnapshot?: CombatantSnapshot;
  goldEarned?: number;
  xpEarned?: number;
  ratingEarned?: number;
  droppedItem?: { itemId: string | null; rarity: string } | null;
  bossIndex?: number;
  nextBossIndex?: number;
  dungeonName?: string;
  message?: string;
};

/* ────────────────── Screen state ────────────────── */

type DungeonScreen =
  | { kind: "list" }
  | { kind: "detail"; dungeon: DungeonInfo }
  | {
      kind: "boss";
      dungeon: DungeonInfo;
      runId: string;
      boss: { name: string; description: string; hp: number; maxHp: number };
    }
  | {
      kind: "stance";
      dungeon: DungeonInfo;
      runId: string;
      boss: { name: string; description: string; hp: number; maxHp: number };
    }
  | { kind: "battle"; dungeon: DungeonInfo; runId: string; fightResult: FightResult }
  | { kind: "loot"; dungeon: DungeonInfo; fightResult: FightResult }
  | { kind: "complete"; dungeon: DungeonInfo; fightResult: FightResult }
  | { kind: "defeat"; dungeon: DungeonInfo; fightResult: FightResult };

/* ────────────────── Boss loot preview data ────────────────── */

type PossibleDrop = {
  name: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  slot: string;
};

const RARITY_COLORS: Record<string, string> = {
  common: "text-slate-300 border-slate-600 bg-slate-800/50",
  uncommon: "text-green-300 border-green-600 bg-green-900/30",
  rare: "text-blue-300 border-blue-600 bg-blue-900/30",
  epic: "text-purple-300 border-purple-600 bg-purple-900/30",
  legendary: "text-amber-300 border-amber-600 bg-amber-900/30",
};

const RARITY_ICON: Record<string, string> = {
  common: "⚪",
  uncommon: "🟢",
  rare: "🔵",
  epic: "🟣",
  legendary: "🟠",
};

const SLOT_ICON: Record<string, GameIconKey> = {
  weapon: "weapon",
  helmet: "helmet",
  chest: "chest",
  gloves: "gloves",
  boots: "boots",
  accessory: "ring",
  legs: "legs",
};

/** Generate possible loot preview for a boss based on dungeon + boss index */
const getBossPossibleDrops = (
  dungeonIndex: number,
  bossIndex: number,
): PossibleDrop[] => {
  const isFinalBoss = bossIndex === 9;
  const isLateBoss = bossIndex >= 7;
  const isMidBoss = bossIndex >= 4;

  const slots = ["weapon", "helmet", "chest", "gloves", "boots", "legs", "necklace", "ring"];
  const slot = slots[(dungeonIndex + bossIndex) % slots.length];

  const SLOT_DROP_NAME: Record<string, string> = {
    weapon: "Blade",
    helmet: "Crown",
    chest: "Plate",
    gloves: "Gauntlets",
    boots: "Greaves",
    legs: "Legplates",
    necklace: "Necklace",
    ring: "Ring",
  };

  const drops: PossibleDrop[] = [];

  if (isFinalBoss) {
    drops.push({
      name: `Legendary ${SLOT_DROP_NAME[slot] ?? "Armor"}`,
      rarity: "legendary",
      slot,
    });
    drops.push({
      name: `Epic ${slots[(dungeonIndex + bossIndex + 1) % slots.length] === "weapon" ? "Sword" : "Armor Piece"}`,
      rarity: "epic",
      slot: slots[(dungeonIndex + bossIndex + 1) % slots.length],
    });
  } else if (isLateBoss) {
    drops.push({
      name: `Epic ${slot === "weapon" ? "Weapon" : "Armor"}`,
      rarity: "epic",
      slot,
    });
    drops.push({
      name: `Rare ${slots[(dungeonIndex + bossIndex + 2) % slots.length] === "weapon" ? "Blade" : "Guard"}`,
      rarity: "rare",
      slot: slots[(dungeonIndex + bossIndex + 2) % slots.length],
    });
  } else if (isMidBoss) {
    drops.push({
      name: `Rare Equipment`,
      rarity: "rare",
      slot,
    });
    drops.push({
      name: `Uncommon Piece`,
      rarity: "uncommon",
      slot: slots[(dungeonIndex + bossIndex + 1) % slots.length],
    });
  } else {
    drops.push({
      name: `Common Equipment`,
      rarity: "common",
      slot,
    });
    drops.push({
      name: `Uncommon Item`,
      rarity: "uncommon",
      slot: slots[(dungeonIndex + bossIndex + 1) % slots.length],
    });
  }

  return drops;
};

/** Boss-specific icon avatars for visual variety */
const BOSS_AVATARS: Record<string, GameIconKey> = {
  "Straw Dummy": "training", "Rusty Automaton": "settings", "Barrel Golem": "endurance",
  "Plank Knight": "weapon", "Flying Francis": "agility", "Scarecrow Mage": "mage",
  "Mud Troll": "strength", "Possessed Mannequin": "relic", "Iron Dummy": "rogue",
  "Drill Sergeant Grizzle": "strength", "Ghost": "wisdom", "Skeleton Archer": "agility",
  "Shambling Zombie": "endurance", "Tomb Spider": "luck", "Bone Golem": "endurance",
  "Banshee": "charisma", "Crypt Knight": "weapon", "Wraith": "intelligence",
  "Lich Apprentice": "wisdom", "Necromancer Voss": "mage", "Spore Sprite": "charisma",
  "Mushroom Brute": "strength", "Vine Strangler": "endurance", "Poison Toad": "luck",
  "Mycelium Golem": "vitality", "Rot Witch": "mage", "Fungal Hydra": "strength",
  "Sporeling Hive Mind": "intelligence", "Blight Treant": "vitality", "The Overgrowth": "charisma",
  "Ember Rat": "agility", "Magma Slime": "vitality", "Mine Foreman": "gold-mine",
  "Lava Beetle": "endurance", "Cinder Elemental": "stamina", "Soot Dragon Whelp": "strength",
  "Obsidian Guardian": "tank", "Flame Witch": "mage", "Infernal Siege Engine": "strength",
  "Pyrax the Molten King": "helmet", "Frost Wisp": "intelligence", "Ice Wolf": "agility",
  "Glacier Troll": "endurance", "Frozen Sentinel": "tank", "Blizzard Harpy": "agility",
  "Crystal Golem": "gems", "Frost Wyvern": "strength", "Ice Lich": "mage",
  "Permafrost Colossus": "endurance", "Glacius the Eternal": "intelligence",
  "Light Sprite": "charisma", "Radiant Archer": "agility", "Crystal Beast": "gems",
  "Solar Monk": "wisdom", "Golden Golem": "leaderboard", "Seraph Guardian": "wisdom",
  "Prism Dragon": "charisma", "Light Weaver": "intelligence", "Solar Colossus": "strength",
  "The Heart of the Ray": "charisma", "Shadow Wisp": "intelligence", "Dark Stalker": "rogue",
  "Void Spider": "luck", "Shade Knight": "rogue", "Eclipse Wolf": "agility",
  "Nightborne Mage": "mage", "Abyss Hydra": "strength", "Shadow Dragon": "strength",
  "Void Colossus": "endurance", "The Whispering Dark": "intelligence",
  "Gear Sprite": "stamina", "Clockwork Hound": "agility", "Piston Golem": "endurance",
  "Sawblade Dancer": "agility", "Tesla Turret": "stamina", "Steam Knight": "tank",
  "Gear Dragon": "settings", "Grand Mechanist": "settings", "Siege Automaton": "endurance",
  "The Grand Engine": "settings", "Depth Crawler": "agility", "Angler Horror": "luck",
  "Coral Golem": "endurance", "Siren": "charisma", "Kraken Spawn": "strength",
  "Abyssal Leviathan": "vitality", "Deep Sea Dragon": "strength", "Drowned Admiral": "wisdom",
  "Tidal Colossus": "endurance", "Charybdis the Devourer": "intelligence",
  "Imp Swarm": "agility", "Hellhound Alpha": "strength", "Flame Demoness": "charisma",
  "Iron Demon": "strength", "Pit Fiend": "endurance", "Soul Reaver": "rogue",
  "Infernal Dragon": "strength", "Dark Seraph": "wisdom", "The Throne Guardian": "tank",
  "Archfiend Malachar": "helmet",
};

/** Boss-specific image paths (override emoji avatars when present) */
const BOSS_IMAGES: Record<string, string> = {
  "Straw Dummy": "/images/bosses/boss-straw-dummy.png",
  "Rusty Automaton": "/images/bosses/boss-rusty-automaton.png",
  "Barrel Golem": "/images/bosses/boss-barrel-golem.png",
  "Plank Knight": "/images/bosses/boss-plank-knight.png",
  "Flying Francis": "/images/bosses/boss-flying-francis.png",
  "Scarecrow Mage": "/images/bosses/boss-scarecrow-mage.png",
  "Mud Troll": "/images/bosses/boss-mud-troll.png",
  "Possessed Mannequin": "/images/bosses/boss-possessed-mannequin.png",
  "Iron Dummy": "/images/bosses/boss-iron-dummy.png",
  "Drill Sergeant Grizzle": "/images/bosses/boss-drill-sergeant-grizzle.png",
};

/* ────────────────── Lore data ────────────────── */

type DungeonLore = {
  tagline: string;
  paragraphs: string[];
  quote?: { text: string; author: string };
};

const DUNGEON_LORE: Record<string, DungeonLore> = {
  training_camp: {
    tagline: "Where pups become warriors",
    paragraphs: [
      "On the outskirts of the Stray City lies an old training ground, built by the first Arena fighters.",
      "No real enemies here — only wooden dummies, straw golems, and rusty training machines that sometimes… come alive.",
      "But at night the dummies start moving on their own. They say weak spirits from the depths of the Dungeons possess them.",
    ],
    quote: {
      text: "If you can't beat wood — the darkness will swallow you.",
      author: "Old Instructor Fang",
    },
  },
  desecrated_catacombs: {
    tagline: "Where the dead refuse to rest",
    paragraphs: [
      "Beneath the old cemetery lies a labyrinth of crumbling tombs and forgotten kings.",
      "The dead here don't sleep — they patrol. Skeletons rattle through the halls, ghosts wail in the dark, and the Necromancer's will binds them all.",
      "Teal runes glow on the walls, remnants of wards that once kept the dead sealed. Now they only light the way for adventurers brave — or foolish — enough to enter.",
    ],
    quote: {
      text: "The dead don't forgive trespassers. They collect them.",
      author: "Gravedigger Mort",
    },
  },
  fungal_grotto: {
    tagline: "The spores whisper secrets",
    paragraphs: [
      "Deep below the marshlands, a cave system thrums with alien life. Giant mushrooms glow in colors that don't exist on the surface.",
      "The air is thick with spores — some heal, some hallucinate, some kill. The Mushroom Brutes guard their territory with fungal fury.",
      "At the heart of the grotto, the Overgrowth stirs — the cave itself is alive, and it doesn't want visitors.",
    ],
    quote: {
      text: "Don't breathe too deep. The grotto remembers everyone who inhaled its secrets.",
      author: "Herbalist Willow",
    },
  },
  scorched_mines: {
    tagline: "Heat rises from below",
    paragraphs: [
      "Once a prosperous gold mine, now a hellscape of molten rock and fire spirits. The miners dug too deep and woke something beneath the stone.",
      "Lava rivers flow where mine carts once rolled. Magma slimes bubble happily on the rocks, and the Molten King rules from his obsidian chamber.",
      "The ore here is priceless — if you can survive the heat long enough to mine it.",
    ],
    quote: {
      text: "We found gold. Then the gold found fire. Then the fire found us.",
      author: "Last journal of Foreman Gruk",
    },
  },
  frozen_abyss: {
    tagline: "Where even fire freezes",
    paragraphs: [
      "At the bottom of the world lies a cavern of eternal winter. Ice crystals older than civilization line the walls, and the silence is absolute.",
      "Frozen warriors stand trapped in ice — some from armies long forgotten, some from last week. The Ice Wolves hunt anything with warmth.",
      "Glacius the Eternal waits at the deepest point. They say he was once a fire mage who tried to melt the abyss. The abyss won.",
    ],
    quote: {
      text: "Cold doesn't kill you. It preserves you. Forever.",
      author: "Frostbitten Scout",
    },
  },
  realm_of_light: {
    tagline: "Where light burns brighter than fire",
    paragraphs: [
      "Beneath the city lie the Shining Catacombs — an ancient temple of the Order of Light.",
      "Marble halls bathed in warm golden glow. Floating fireflies light the way. But around every corner — animated statues, radiant guardians, and crystal beasts.",
      "The deeper the floor — the brighter the light. And the deadlier the foes.",
    ],
    quote: {
      text: "They say the Heart of the Ray lies at the very center — an artifact that empowers any fighter. But no one has returned from the last floor the same.",
      author: "Ancient Scroll",
    },
  },
  shadow_realm: {
    tagline: "Where the darkness stares back",
    paragraphs: [
      "Where light ends — the Whisper begins.",
      "Shadow Realm is a rift beneath the world. The ground pulses here, walls breathe, and darkness stares back at you.",
      "Shadows take the shape of fears. Monsters emerge from smoke. Sometimes your own silhouette attacks you.",
    ],
    quote: {
      text: "Dark relics. Shards of forbidden power. Legendary loot with odds found nowhere else. Only hardened warriors dare to descend.",
      author: "Guild Legend",
    },
  },
  clockwork_citadel: {
    tagline: "Gears never stop turning",
    paragraphs: [
      "An ancient fortress built by a mad inventor who wanted to create perpetual motion — and succeeded. The gears haven't stopped in a thousand years.",
      "Every wall moves, every floor shifts, every corridor rearranges. The clockwork creatures that patrol the halls were built to maintain the machine. Now they maintain it against intruders.",
      "At the center spins the Grand Engine — a consciousness born from a million turning gears.",
    ],
    quote: {
      text: "The citadel doesn't have traps. The citadel IS the trap.",
      author: "Escaped prisoner, name unknown",
    },
  },
  abyssal_depths: {
    tagline: "Beneath the world, something waits",
    paragraphs: [
      "Below the deepest ocean trench lies a cavern that shouldn't exist. Bioluminescent horrors drift through the dark water, and sunken ruins hint at a civilization that worshipped the deep.",
      "The Kraken's tentacles reach from crevices too dark to see into. The Siren's song echoes off ancient coral, luring fighters to watery graves.",
      "Charybdis the Devourer lurks at the bottom — a living whirlpool that has swallowed ships, armies, and hope.",
    ],
    quote: {
      text: "The ocean floor is littered with the bones of those who thought they were ready.",
      author: "Admiral Ghost-Eye",
    },
  },
  infernal_throne: {
    tagline: "The final descent into madness",
    paragraphs: [
      "The last dungeon. The deepest pit. Where the Archfiend Malachar sits upon his obsidian throne and waits for challengers.",
      "Rivers of hellfire flow between broken platforms. Imp swarms darken the crimson sky. Demons of every rank guard the path to the throne — and each one is a nightmare given form.",
      "No one has defeated Malachar. The throne room is littered with the weapons of those who tried.",
    ],
    quote: {
      text: "He doesn't fight because he must. He fights because he's bored. That's what makes him terrifying.",
      author: "The Last Champion",
    },
  },
};

/* ────────────────── Dungeon images ────────────────── */

const DUNGEON_IMAGES: Record<string, string> = {
  training_camp: "/images/dungeons/dungeon-training-camp.png",
  desecrated_catacombs: "/images/dungeons/dungeon-desecrated-catacombs.png",
  fungal_grotto: "/images/dungeons/dungeon-fungal-grotto.png",
  scorched_mines: "/images/dungeons/dungeon-scorched-mines.png",
  frozen_abyss: "/images/dungeons/dungeon-frozen-abyss.png",
  realm_of_light: "/images/dungeons/dungeon-realm-of-light.png",
  shadow_realm: "/images/dungeons/dungeon-shadow-realm.png",
  clockwork_citadel: "/images/dungeons/dungeon-clockwork-citadel.png",
  abyssal_depths: "/images/dungeons/dungeon-abyssal-depths.png",
  infernal_throne: "/images/dungeons/dungeon-infernal-throne.png",
};

/* ────────────────── Component ────────────────── */

function DungeonContent() {
  const searchParams = useSearchParams();
  const characterId = searchParams.get("characterId");
  const [character, setCharacter] = useState<Character | null>(null);
  const [dungeons, setDungeons] = useState<DungeonInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [fighting, setFighting] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [screen, setScreen] = useState<DungeonScreen>({ kind: "list" });
  const [error, setError] = useState<string | null>(null);
  const [selectedBoss, setSelectedBoss] = useState<number | null>(null);
  /* carousel refs removed — handled by CardCarousel */

  /* ── Load character + dungeons ── */
  const loadData = useCallback(async () => {
    if (!characterId) return;
    setLoading(true);
    setError(null);
    try {
      const [charRes, dungeonRes] = await Promise.all([
        fetch(`/api/characters/${characterId}`),
        fetch(`/api/dungeons?characterId=${characterId}`),
      ]);
      if (!charRes.ok) throw new Error("Failed to load character");
      if (!dungeonRes.ok) throw new Error("Failed to load dungeons");
      const charData = await charRes.json();
      const dungeonData = await dungeonRes.json();
      setCharacter(charData);
      setDungeons(dungeonData.dungeons ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Loading error");
    } finally {
      setLoading(false);
    }
  }, [characterId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ── Start dungeon run ── */
  const handleStart = async (dungeon: DungeonInfo) => {
    if (!characterId || starting) return;
    setError(null);
    if (character && character.currentStamina < dungeon.staminaCost) {
      setError("Not enough stamina");
      return;
    }
    setStarting(true);
    try {
      const res = await fetch("/api/dungeons/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId, dungeonId: dungeon.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error");
        return;
      }
      setCharacter((c) =>
        c ? { ...c, currentStamina: c.currentStamina - dungeon.staminaCost } : null
      );
      setScreen({
        kind: "boss",
        dungeon,
        runId: data.runId,
        boss: {
          name: data.boss.name,
          description: data.boss.description,
          hp: data.boss.hp,
          maxHp: data.boss.maxHp,
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setStarting(false);
    }
  };

  /* ── Fight boss → go to stance screen first ── */
  const handleFight = () => {
    if (screen.kind !== "boss" || fighting) return;
    setError(null);
    setScreen({
      kind: "stance",
      dungeon: screen.dungeon,
      runId: screen.runId,
      boss: screen.boss,
    });
  };

  /* ── Stance confirmed → actually fight boss ── */
  const handleDungeonStanceConfirm = async (stance: CombatStance) => {
    if (screen.kind !== "stance" || fighting) return;
    setError(null);
    setFighting(true);
    try {
      const res = await fetch(`/api/dungeons/run/${screen.runId}/fight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stance }),
      });
      const data = (await res.json()) as FightResult;

      if (data.playerSnapshot && data.enemySnapshot && data.log) {
        setScreen({ kind: "battle", dungeon: screen.dungeon, runId: screen.runId, fightResult: data });
      } else {
        handleFightResultDirect(data, screen.dungeon);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setFighting(false);
    }
  };

  /* ── Save stance as default ── */
  const handleSaveDungeonStance = async (stance: CombatStance) => {
    if (!characterId) return;
    await fetch(`/api/characters/${characterId}/stance`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stance }),
    });
  };

  /* Process fight result */
  const handleFightResultDirect = (data: FightResult, dungeon: DungeonInfo) => {
    if (!data.victory) {
      setScreen({ kind: "defeat", dungeon, fightResult: data });
      return;
    }
    // Rewards saved server-side — notify sidebar to refresh
    window.dispatchEvent(new Event("character-updated"));
    if (data.dungeonComplete) {
      setCharacter((c) =>
        c && data.rewards ? { ...c, gold: (c.gold ?? 0) + data.rewards.gold } : c
      );
      setScreen({ kind: "complete", dungeon, fightResult: data });
      return;
    }
    setScreen({ kind: "loot", dungeon, fightResult: data });
  };

  const handleBattleComplete = () => {
    if (screen.kind !== "battle") return;
    handleFightResultDirect(screen.fightResult, screen.dungeon);
  };

  const handleLootContinue = async () => {
    if (transitioning) return;
    // Boss defeated — reload data, then return to dungeon detail (not list)
    const dungeonId = screen.kind === "loot" ? screen.dungeon.id : null;
    window.dispatchEvent(new Event("character-updated"));

    if (!characterId) return;
    setError(null);
    setTransitioning(true);
    try {
      const [charRes, dungeonRes] = await Promise.all([
        fetch(`/api/characters/${characterId}`),
        fetch(`/api/dungeons?characterId=${characterId}`),
      ]);
      if (!charRes.ok) throw new Error("Failed to load character");
      if (!dungeonRes.ok) throw new Error("Failed to load dungeons");
      const charData = await charRes.json();
      const dungeonData = await dungeonRes.json();
      const freshDungeons: DungeonInfo[] = dungeonData.dungeons ?? [];
      setCharacter(charData);
      setDungeons(freshDungeons);

      // Try to navigate back to the same dungeon's detail page
      const updatedDungeon = dungeonId
        ? freshDungeons.find((d) => d.id === dungeonId)
        : null;

      if (updatedDungeon) {
        setSelectedBoss(null);
        setScreen({ kind: "detail", dungeon: updatedDungeon });
      } else {
        setScreen({ kind: "list" });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Loading error");
      setScreen({ kind: "list" });
    } finally {
      setTransitioning(false);
    }
  };

  const handleBackToList = () => {
    loadData();
    setScreen({ kind: "list" });
    setSelectedBoss(null);
    setError(null);
    window.dispatchEvent(new Event("character-updated"));
  };

  /* ── Loading ── */
  if (loading || !character) {
    return <PageLoader icon={<GameIcon name="dungeons" size={32} />} text="Loading dungeons…" />;
  }

  /* ══════════════════════════════════════════
     STANCE SELECTION — before boss fight
     ══════════════════════════════════════════ */
  if (screen.kind === "stance") {
    return (
      <PageContainer>
        <PageHeader title="Dungeons" />
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 lg:p-6">
          <p className="mb-4 text-center text-sm text-slate-400">
            Preparing to fight <span className="font-bold text-amber-300">{screen.boss.name}</span>
          </p>
          <StanceSelector
            onConfirm={handleDungeonStanceConfirm}
            onSaveDefault={handleSaveDungeonStance}
            onBack={() =>
              setScreen({
                kind: "boss",
                dungeon: screen.dungeon,
                runId: screen.runId,
                boss: screen.boss,
              })
            }
            loading={fighting}
            confirmLabel="Fight Boss!"
          />
          {error && (
            <p className="mt-2 text-center text-sm text-red-400">{error}</p>
          )}
        </div>
      </PageContainer>
    );
  }

  /* ══════════════════════════════════════════
     BATTLE SCREEN — animated combat
     ══════════════════════════════════════════ */
  if (screen.kind === "battle" && screen.fightResult.playerSnapshot && screen.fightResult.enemySnapshot) {
    return (
      <CombatBattleScreen
        result={{
          winnerId: screen.fightResult.victory ? character.id : "boss",
          loserId: screen.fightResult.victory ? "boss" : character.id,
          draw: false,
          turns: screen.fightResult.log?.length ?? 0,
          log: screen.fightResult.log ?? [],
          playerSnapshot: screen.fightResult.playerSnapshot,
          enemySnapshot: screen.fightResult.enemySnapshot,
        }}
        playerId={character.id}
        onComplete={handleBattleComplete}
      />
    );
  }

  /* ══════════════════════════════════════════
     LOOT SCREEN — after winning a boss fight
     ══════════════════════════════════════════ */
  if (screen.kind === "loot") {
    const bossName = screen.fightResult.enemySnapshot?.name ?? "Boss";
    return (
      <CombatLootScreen
        enemy={{ name: bossName, class: screen.fightResult.enemySnapshot?.class }}
        rewards={{
          gold: screen.fightResult.goldEarned,
          xp: screen.fightResult.xpEarned,
          rating: screen.fightResult.ratingEarned,
          droppedItem: screen.fightResult.droppedItem,
        }}
        onContinue={handleLootContinue}
        loading={transitioning}
      />
    );
  }

  /* ══════════════════════════════════════════
     BOSS ENCOUNTER — pre-fight screen
     ══════════════════════════════════════════ */
  if (screen.kind === "boss") {
    const { boss, dungeon } = screen;
    const hpPercent = Math.round((boss.hp / boss.maxHp) * 100);

    return (
      <div className="flex min-h-full flex-col p-4 lg:p-6">
        <PageHeader
          title={`${dungeon.theme.icon} ${dungeon.name}`}
          leftOnClick={handleBackToList}
          leftLabel="Back to dungeons"
          hideClose
          actions={
            <div className="w-28 shrink-0">
              <div className="relative h-6 w-full overflow-hidden rounded-full border border-slate-700 bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500"
                  style={{ width: `${character.maxStamina ? (character.currentStamina / character.maxStamina) * 100 : 0}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center gap-0.5 text-xs font-bold leading-none text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                  <GameIcon name="stamina" size={14} /> {character.currentStamina}/{character.maxStamina}
                </span>
              </div>
            </div>
          }
        />

        {/* Boss card */}
        <div className="mb-6 flex flex-col items-center">
          <p className="mb-3 text-sm text-slate-400">
            Boss{" "}
            <span className="font-bold text-white">
              {(screen.dungeon.bossIndex ?? 0) + 1}
            </span>{" "}
            / {dungeon.bosses.length}
          </p>
          <div className="hero-card-container--fixed">
            <HeroCard
              name={boss.name}
              variant="default"
              imageSrc={BOSS_IMAGES[boss.name]}
              description={boss.description}
              hp={{ current: boss.hp, max: boss.maxHp }}
            >
              {error && <p className="px-3 pb-2 text-sm text-red-400">{error}</p>}
              <div className="flex justify-center px-3 pb-3">
                <GameButton onClick={handleFight} disabled={fighting} aria-label="Fight Boss" size="lg">
                  {fighting ? "Fighting…" : <><GameIcon name="fights" size={16} /> Fight Boss</>}
                </GameButton>
              </div>
            </HeroCard>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     DUNGEON COMPLETE
     ══════════════════════════════════════════ */
  if (screen.kind === "complete") {
    return (
      <div className="flex min-h-full flex-col items-center justify-center p-4 lg:p-6">
        <div className="w-full max-w-md rounded-2xl border border-green-700/60 bg-gradient-to-b from-green-900/30 to-slate-900/80 p-6 text-center">
          <div className="mb-1"><GameIcon name="leaderboard" size={40} /></div>
          <p className="font-display text-xl text-green-400">
            {screen.dungeon.name} Complete!
          </p>
          <p className="mt-1 text-xs text-slate-500">All bosses defeated</p>
          {screen.fightResult.rewards && (
            <p className="mt-2 text-sm text-slate-300">
              Gold:{" "}
              <span className="font-bold text-yellow-400">
                +{screen.fightResult.rewards.gold}
              </span>{" "}
              · XP:{" "}
              <span className="font-bold text-blue-400">
                +{screen.fightResult.rewards.xp}
              </span>
            </p>
          )}
          <GameButton onClick={handleBackToList} aria-label="Back to Dungeons" className="mt-4">
            ← Back to Dungeons
          </GameButton>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     DEFEAT
     ══════════════════════════════════════════ */
  if (screen.kind === "defeat") {
    return (
      <div className="flex min-h-full flex-col items-center justify-center p-4 lg:p-6">
        <div className="w-full max-w-md rounded-2xl border border-red-700/60 bg-gradient-to-b from-red-900/30 to-slate-900/80 p-6 text-center">
          <p className="mb-1 text-3xl">💀</p>
          <p className="font-display text-xl text-red-400">Defeat</p>
          <p className="mt-2 text-sm text-slate-400">
            The boss was too strong. Prepare and try again.
          </p>
          <GameButton variant="secondary" onClick={handleBackToList} aria-label="Back to Dungeons" className="mt-4">
            ← Back to Dungeons
          </GameButton>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     DETAIL — dungeon map + boss details
     ══════════════════════════════════════════ */
  if (screen.kind === "detail") {
    const { dungeon } = screen;
    const canAfford = character.currentStamina >= dungeon.staminaCost;
    const canStart = dungeon.unlocked && !dungeon.completed && canAfford;
    const dungeonIndex = dungeons.findIndex((d) => d.id === dungeon.id);
    const selectedBossIndex = selectedBoss ?? dungeon.bossIndex;
    const activeBoss = dungeon.bosses[selectedBossIndex] ?? dungeon.bosses[0] ?? null;
    if (!activeBoss) return null;
    const isBossDefeated = selectedBossIndex < dungeon.bossIndex;
    const isBossCurrent = selectedBossIndex === dungeon.bossIndex && !dungeon.completed;
    const isBossLocked = selectedBossIndex > dungeon.bossIndex && !dungeon.completed;
    const possibleDrops = getBossPossibleDrops(dungeonIndex, selectedBossIndex);

    // Calculate boss preview stats based on player level
    const bossPreviewStats = !isBossLocked
      ? getBossStats(character.level, activeBoss as Parameters<typeof getBossStats>[1])
      : null;

    /** Render boss abilities + loot children for HeroCard */
    const renderBossCardChildren = (bossIdx: number, locked: boolean) => {
      if (locked) return null;
      const drops = getBossPossibleDrops(dungeonIndex, bossIdx);
      return (
        <>
          {/* Boss Abilities */}
          {(() => {
            const catalogEntry = BOSS_CATALOG.find(
              (b) => b.dungeonId === dungeon.id && b.bossIndex === bossIdx,
            );
            if (!catalogEntry) return null;
            const abilityMap = new Map(BOSS_ABILITIES.map((a) => [a.id, a]));
            const abilities = catalogEntry.abilityIds
              .map((id) => abilityMap.get(id))
              .filter(Boolean);
            if (abilities.length === 0) return null;

            const TYPE_ICON: Record<string, GameIconKey> = {
              physical: "fights",
              magic: "charisma",
              buff: "endurance",
            };
            const TYPE_COLOR: Record<string, string> = {
              physical: "text-red-400",
              magic: "text-blue-400",
              buff: "text-amber-400",
            };

            return (
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 px-3 pb-2">
                {abilities.map((ability) => {
                  if (!ability) return null;
                  return (
                    <span
                      key={ability.id}
                      className={`inline-flex items-center gap-1 text-[11px] font-medium ${TYPE_COLOR[ability.type] ?? "text-slate-400"}`}
                      title={[
                        ability.type === "buff"
                          ? ability.selfBuff
                            ? Object.entries(ability.selfBuff).map(([k, v]) => `+${Math.round(v * 100)}% ${k}`).join(", ")
                            : ability.dodgeBonus ? `+${ability.dodgeBonus}% dodge` : "buff"
                          : `${ability.multiplier}x${ability.hits && ability.hits > 1 ? ` ×${ability.hits}` : ""}`,
                        ability.status ? `${Math.round(ability.status.chance * 100)}% ${ability.status.type}` : null,
                        ability.armorBreak ? `-${Math.round(ability.armorBreak * 100)}% armor` : null,
                        ability.critBonus ? `+${ability.critBonus}% crit` : null,
                        `CD ${ability.cooldown}`,
                      ].filter(Boolean).join(" · ")}
                    >
                      <GameIcon name={TYPE_ICON[ability.type] ?? "dungeons"} size={14} />
                      {ability.name}
                    </span>
                  );
                })}
              </div>
            );
          })()}

          {/* Possible Loot */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 px-3 pb-3">
            {drops.map((drop, i) => {
              const rarityBorder: Record<string, string> = {
                common: "border-slate-400",
                uncommon: "border-green-500",
                rare: "border-blue-500",
                epic: "border-purple-500",
                legendary: "border-amber-500",
              };
              const rarityBg: Record<string, string> = {
                common: "bg-slate-800/60",
                uncommon: "bg-green-950/60",
                rare: "bg-blue-950/60",
                epic: "bg-purple-950/60",
                legendary: "bg-amber-950/60",
              };
              return (
                <div
                  key={i}
                  className={`flex h-11 w-11 items-center justify-center rounded-md border-2 transition-all hover:brightness-125 ${rarityBorder[drop.rarity] ?? "border-slate-400"} ${rarityBg[drop.rarity] ?? "bg-slate-800/60"}`}
                  title={`${drop.name} — ${drop.rarity} ${drop.slot}`}
                >
                  <GameIcon name={SLOT_ICON[drop.slot] ?? "chest"} size={24} />
                </div>
              );
            })}
            <div
              className="flex h-11 w-11 items-center justify-center rounded-md border-2 border-yellow-700/40 bg-yellow-900/30 transition-all hover:brightness-125"
              title={`Gold ~${20 + dungeonIndex * 30 + Math.floor((20 + dungeonIndex * 30) * bossIdx * 0.2)}g`}
            >
              <GameIcon name="gold" size={24} />
            </div>
          </div>
        </>
      );
    };

    /** Render fight button / status for a boss */
    const renderFightAction = (bossIdx: number) => {
      const bDefeated = bossIdx < dungeon.bossIndex;
      const bCurrent = bossIdx === dungeon.bossIndex && !dungeon.completed;
      const bLocked = bossIdx > dungeon.bossIndex && !dungeon.completed;

      if (bCurrent && !dungeon.completed) {
        return (
          <GameButton
            onClick={() => handleStart(dungeon)}
            disabled={!canStart || starting}
            aria-label="Fight Boss"
            variant={canStart ? "primary" : "secondary"}
            size="lg"
            fullWidth
            className="mt-4"
          >
            {starting
              ? "Preparing…"
              : !canAfford
                ? `Not enough stamina (need ${dungeon.staminaCost})`
                : <><GameIcon name="fights" size={16} /> FIGHT</>}
          </GameButton>
        );
      }
      if (dungeon.completed) {
        return (
          <div className="mt-4 rounded-xl border border-green-800/40 bg-green-950/20 px-4 py-3 text-center text-sm font-medium text-green-400">
            ✅ Dungeon Completed
          </div>
        );
      }
      if (bDefeated) {
        return (
          <div className="mt-4 rounded-xl border border-green-800/30 bg-green-950/10 px-4 py-3 text-center text-xs text-green-400/60">
            This boss has already been defeated
          </div>
        );
      }
      return (
        <div className="mt-4 rounded-xl border border-slate-700/30 bg-slate-900/30 px-4 py-3 text-center text-xs text-slate-500">
          Defeat boss {bossIdx} first to unlock this fight
        </div>
      );
    };

    /** Build HeroCard props for a boss by index */
    const getBossCardProps = (bossIdx: number) => {
      const boss = dungeon.bosses[bossIdx] ?? dungeon.bosses[0];
      const locked = bossIdx > dungeon.bossIndex && !dungeon.completed;
      const stats = !locked
        ? getBossStats(character.level, boss as Parameters<typeof getBossStats>[1])
        : null;
      return { boss, locked, stats };
    };

    /* handleScrollBossCarousel removed — handled by CardCarousel */

    return (
      <div className="flex min-h-full flex-col p-4 lg:p-6">
        <PageHeader
          title={`${dungeon.theme.icon} ${dungeon.name}`}
          leftOnClick={() => { setSelectedBoss(null); handleBackToList(); }}
          leftLabel="Back to dungeons"
        />

        {/* Stamina bar — click to go to potions shop */}
        <Link
          href={characterId ? `/shop?characterId=${characterId}&tab=potions` : "/shop?tab=potions"}
          className="mx-auto mb-4 block w-full max-w-xs"
          aria-label="Buy potions"
          tabIndex={0}
        >
          <div className="relative h-6 w-full overflow-hidden rounded-full bg-slate-800 transition hover:brightness-125">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500"
              style={{ width: `${character.maxStamina ? (character.currentStamina / character.maxStamina) * 100 : 0}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center gap-1 text-sm font-bold leading-none text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
              <GameIcon name="stamina" size={16} /> {character.currentStamina}/{character.maxStamina} · Cost {dungeon.staminaCost}
            </span>
          </div>
        </Link>

        {/* Progress bar (mobile) */}
        <div className="mb-3 lg:hidden">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-bold uppercase tracking-wider text-slate-400">
              {dungeon.bossIndex}/{dungeon.bosses.length} Defeated
            </span>
            {dungeon.completed && (
              <span className="rounded bg-green-900/50 px-2 py-0.5 text-[10px] font-bold text-green-400">
                COMPLETE
              </span>
            )}
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                dungeon.completed
                  ? "bg-green-500"
                  : "bg-gradient-to-r from-amber-600 to-amber-400"
              }`}
              style={{ width: `${dungeon.completed ? 100 : Math.round((dungeon.bossIndex / dungeon.bosses.length) * 100)}%` }}
            />
          </div>
        </div>

        {/* ═══════════ MOBILE: Boss card carousel ═══════════ */}
        <div className="flex flex-1 flex-col lg:hidden">
          <CardCarousel ariaLabelPrev="Previous boss" ariaLabelNext="Next boss">
            {dungeon.bosses.map((boss) => {
              const { locked, stats } = getBossCardProps(boss.index);
              const defeated = boss.index < dungeon.bossIndex;
              const current = boss.index === dungeon.bossIndex && !dungeon.completed;

              return (
                <div key={boss.index} className="hero-card-container--default">
                  {/* Status badge */}
                  <div className="mb-2 flex items-center justify-center gap-2">
                    <p className="text-xs font-bold text-slate-400">
                      Boss {boss.index + 1}/{dungeon.bosses.length} · Lv.{boss.level}
                    </p>
                    {defeated && (
                      <span className="rounded-full bg-green-900/40 px-2 py-0.5 text-[10px] font-bold text-green-400">
                        ✓ Defeated
                      </span>
                    )}
                    {current && (
                      <span className="flex animate-pulse items-center gap-1 rounded-full bg-amber-900/40 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                        <GameIcon name="fights" size={12} /> Current
                      </span>
                    )}
                  </div>

                  <HeroCard
                    name={locked ? "???" : boss.name}
                    variant="compact"
                    level={boss.level}
                    icon={locked ? "🔒" : undefined}
                    imageSrc={!locked ? BOSS_IMAGES[boss.name] : undefined}
                    description={
                      locked
                        ? "Defeat the previous boss to reveal this enemy."
                        : boss.description
                    }
                    hp={
                      stats
                        ? { current: stats.maxHp, max: stats.maxHp }
                        : undefined
                    }
                    hideDescription={false}
                    disabled={locked}
                  >
                    {renderBossCardChildren(boss.index, locked)}
                  </HeroCard>

                  {renderFightAction(boss.index)}
                </div>
              );
            })}
          </CardCarousel>

          {/* Error */}
          {error && (
            <p className="mt-3 text-center text-sm text-red-400" role="alert">{error}</p>
          )}
        </div>

        {/* ═══════════ DESKTOP: Two-column layout ═══════════ */}
        <div className="hidden flex-1 gap-4 lg:flex lg:flex-row">
          {/* ─── Left: Boss Map ─── */}
          <div className={`relative flex-shrink-0 overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-b ${dungeon.theme.cardBg} lg:w-[340px]`}>
            {/* Dungeon title bar inside map */}
            <div className="border-b border-slate-700/40 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {dungeon.bossIndex}/{dungeon.bosses.length} Defeated
                </span>
                {dungeon.completed && (
                  <span className="rounded bg-green-900/50 px-2 py-0.5 text-[10px] font-bold text-green-400">
                    COMPLETE
                  </span>
                )}
              </div>
              {/* Progress bar */}
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    dungeon.completed
                      ? "bg-green-500"
                      : "bg-gradient-to-r from-amber-600 to-amber-400"
                  }`}
                  style={{ width: `${dungeon.completed ? 100 : Math.round((dungeon.bossIndex / dungeon.bosses.length) * 100)}%` }}
                />
              </div>
            </div>

            {/* Boss nodes — vertical path */}
            <div className="custom-scrollbar max-h-[600px] overflow-y-auto p-3">
              <div className="relative flex flex-col items-center gap-1">
                {dungeon.bosses.map((boss, idx) => {
                  const defeated = boss.index < dungeon.bossIndex;
                  const current = boss.index === dungeon.bossIndex && !dungeon.completed;
                  const locked = boss.index > dungeon.bossIndex && !dungeon.completed;
                  const isSelected = selectedBossIndex === boss.index;
                  const avatarIcon = BOSS_AVATARS[boss.name];

                  return (
                    <div key={boss.index} className="flex w-full flex-col items-center">
                      {/* Connecting line */}
                      {idx > 0 && (
                        <div
                          className={`h-3 w-0.5 ${
                            defeated ? "bg-green-600/60" : current ? "bg-amber-600/40" : "bg-slate-700/40"
                          }`}
                        />
                      )}

                      {/* Boss node button */}
                      <button
                        type="button"
                        onClick={() => setSelectedBoss(boss.index)}
                        aria-label={`Select boss ${boss.name}`}
                        tabIndex={0}
                        className={`
                          group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all
                          ${isSelected
                            ? "border-amber-500/70 bg-amber-950/30 shadow-lg shadow-amber-900/20 ring-1 ring-amber-500/30"
                            : defeated
                              ? "border-green-800/30 bg-green-950/10 hover:bg-green-950/20"
                              : current
                                ? "border-amber-700/40 bg-amber-950/15 hover:bg-amber-950/25"
                                : "border-slate-800/40 bg-slate-900/20 opacity-60 hover:opacity-80"
                          }
                        `}
                      >
                        {/* Avatar circle */}
                        <div
                          className={`
                            relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl shadow-md
                            ${!locked && BOSS_IMAGES[boss.name]
                              ? "bg-transparent"
                              : defeated
                                ? "bg-gradient-to-br from-green-800 to-green-900"
                                : current
                                  ? `bg-gradient-to-br ${dungeon.theme.gradient} ring-2 ring-amber-500/50`
                                  : locked
                                    ? "bg-slate-800/80"
                                    : "bg-slate-800"
                            }
                          `}
                        >
                          {locked ? "🔒" : BOSS_IMAGES[boss.name] ? (
                            <div className="h-full w-full overflow-hidden rounded-xl">
                              <Image
                                src={BOSS_IMAGES[boss.name]}
                                alt={boss.name}
                                width={1024}
                                height={1024}
                                className="h-full w-full object-contain"
                                sizes="44px"
                              />
                            </div>
                          ) : avatarIcon ? (
                            <GameIcon name={avatarIcon} size={24} />
                          ) : (
                            <GameIcon name="dungeons" size={24} />
                          )}
                          {defeated && (
                            <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-[8px]">
                              ✓
                            </div>
                          )}
                          {current && (
                            <div className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-amber-500" />
                          )}
                        </div>

                        {/* Boss info */}
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-bold ${
                            isSelected ? "text-amber-300" : defeated ? "text-green-400/80" : current ? "text-white" : "text-slate-500"
                          }`}>
                            {boss.name}
                          </p>
                          <p className="truncate text-[10px] text-slate-600">
                            Level {boss.level}
                          </p>
                        </div>

                        {/* Boss index badge */}
                        <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold ${
                          defeated ? "bg-green-900/40 text-green-500" : current ? "bg-amber-900/40 text-amber-400" : "bg-slate-800 text-slate-600"
                        }`}>
                          {boss.index + 1}/{dungeon.bosses.length}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ─── Right: Boss Detail Panel ─── */}
          <div className="flex flex-1 flex-col items-center">
            {/* Status badges above card */}
            <div className="mb-2 flex items-center justify-center gap-2">
              <p className="text-sm font-bold text-slate-300">
                Level {activeBoss.level} · Boss {selectedBossIndex + 1}/{dungeon.bosses.length}
              </p>
              {isBossCurrent && (
                <span className="flex animate-pulse items-center gap-1 rounded-full bg-amber-900/40 px-3 py-1 text-[11px] font-bold text-amber-400">
                  <GameIcon name="fights" size={14} /> Current Target
                </span>
              )}
              {isBossLocked && (
                <span className="rounded-full bg-slate-800/60 px-3 py-1 text-[11px] font-bold text-slate-500">
                  🔒 Locked
                </span>
              )}
            </div>

            {/* Boss HeroCard */}
            <div className="hero-card-container--fixed">
              <HeroCard
                name={isBossLocked ? "???" : activeBoss.name}
                variant="default"
                level={activeBoss.level}
                icon={isBossLocked ? "🔒" : undefined}
                imageSrc={!isBossLocked ? BOSS_IMAGES[activeBoss.name] : undefined}
                description={
                  isBossLocked
                    ? "Defeat the previous boss to reveal this enemy."
                    : activeBoss.description
                }
                hp={
                  bossPreviewStats
                    ? { current: bossPreviewStats.maxHp, max: bossPreviewStats.maxHp }
                    : undefined
                }
                stats={
                  bossPreviewStats
                    ? {
                        strength: bossPreviewStats.strength,
                        agility: bossPreviewStats.agility,
                        intelligence: bossPreviewStats.intelligence,
                        vitality: bossPreviewStats.vitality,
                        endurance: bossPreviewStats.endurance,
                        wisdom: bossPreviewStats.wisdom,
                        luck: bossPreviewStats.luck,
                        charisma: bossPreviewStats.charisma,
                      }
                    : undefined
                }
                disabled={isBossLocked}
              >
                {renderBossCardChildren(selectedBossIndex, isBossLocked)}
              </HeroCard>
            </div>

            {/* Error */}
            {error && (
              <p className="mt-3 mb-3 text-sm text-red-400" role="alert">{error}</p>
            )}

            {/* Fight button — only for current boss */}
            {renderFightAction(selectedBossIndex)}
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     LIST — dungeon carousel (S&F style)
     ══════════════════════════════════════════ */
  /* handleScrollCarousel removed — handled by CardCarousel */

  return (
    <PageContainer>
      <PageHeader title="Dungeons" />

      {/* Error */}
      {error && (
        <p className="mb-4 text-sm text-red-400" role="alert">{error}</p>
      )}

      {/* Dungeon carousel */}
      <CardCarousel
        cardSelector=".dungeon-card"
        ariaLabelPrev="Previous dungeon"
        ariaLabelNext="Next dungeon"
      >
          {dungeons.map((dungeon) => {
            const progressPercent = Math.round(
              (dungeon.bossIndex / dungeon.bosses.length) * 100
            );
            const isLocked = !dungeon.unlocked;
            const dungeonImage = DUNGEON_IMAGES[dungeon.id];
            const lore = DUNGEON_LORE[dungeon.id];

            return (
              <button
                key={dungeon.id}
                type="button"
                onClick={() => {
                  if (dungeon.unlocked) {
                    setSelectedBoss(null);
                    setScreen({ kind: "detail", dungeon });
                  }
                }}
                disabled={isLocked}
                aria-label={`${dungeon.unlocked ? "Open" : "Locked"} ${dungeon.name}`}
                tabIndex={0}
                className={`
                  dungeon-card group relative flex flex-col overflow-hidden rounded-2xl border-2 text-left
                  ${
                    isLocked
                      ? "dungeon-card-locked border-slate-800/40"
                      : "dungeon-card-active dungeon-card-shimmer border-amber-600/50 cursor-pointer"
                  }
                `}
              >
                {/* ── Full-height background image ── */}
                <div className="absolute inset-0 bg-slate-900">
                  {dungeonImage ? (
                    <Image
                      src={dungeonImage}
                      alt={dungeon.name}
                      fill
                      sizes="640px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      priority
                    />
                  ) : (
                    <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${dungeon.theme.gradient}`}>
                      <span className="text-6xl drop-shadow-lg">{dungeon.theme.icon}</span>
                    </div>
                  )}
                </div>

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />

                {/* Lock overlay */}
                {isLocked && (() => {
                  const needsLevel = character.level < dungeon.minLevel;
                  const prevDungeon = dungeon.prevDungeonId
                    ? dungeons.find((d) => d.id === dungeon.prevDungeonId)
                    : null;
                  const needsPrevComplete = !!prevDungeon && !prevDungeon.completed;
                  return (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-950/60">
                      <span className="text-6xl">🔒</span>
                      {needsLevel && (
                        <span className="text-sm font-medium text-slate-400">
                          Lv. {dungeon.minLevel}+ required
                        </span>
                      )}
                      {needsPrevComplete && (
                        <span className="text-xs text-slate-500">
                          Complete {prevDungeon.name} first
                        </span>
                      )}
                    </div>
                  );
                })()}

                {/* Completed badge */}
                {dungeon.completed && (
                  <div className="absolute right-4 top-4 z-10 rounded-lg bg-green-600/90 px-3 py-1.5 text-sm font-bold text-white shadow-lg backdrop-blur-sm">
                    ✅ COMPLETE
                  </div>
                )}

                {/* Stamina cost badge */}
                {!isLocked && (
                  <div className="absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-lg bg-black/60 px-3 py-1.5 text-sm font-bold text-amber-400 shadow-lg backdrop-blur-sm">
                    <GameIcon name="stamina" size={18} /> {dungeon.staminaCost}
                  </div>
                )}

                {/* ── Card info panel (overlay at bottom) ── */}
                <div className="relative z-10 mt-auto flex flex-col gap-3 p-6">
                  {/* Title */}
                  <h3 className="font-display text-2xl leading-tight text-white drop-shadow-lg lg:text-3xl">
                    {dungeon.name}
                  </h3>

                  {/* Description */}
                  <p className="line-clamp-4 text-sm leading-relaxed text-slate-300 drop-shadow-md">
                    {lore?.paragraphs?.[0] ?? dungeon.subtitle}
                  </p>

                  {/* Progress bar */}
                  {!isLocked && (
                    <div className="pt-3">
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-400">
                          {dungeon.completed ? "All bosses defeated" : `Boss ${dungeon.bossIndex + 1} of ${dungeon.bosses.length}`}
                        </span>
                        <span className="font-bold text-slate-300">
                          {dungeon.bossIndex}/{dungeon.bosses.length}
                        </span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800/80">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            dungeon.completed
                              ? "bg-gradient-to-r from-green-500 to-emerald-400"
                              : "bg-gradient-to-r from-amber-600 to-orange-400"
                          }`}
                          style={{ width: `${dungeon.completed ? 100 : progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Level requirement */}
                  {isLocked && (
                    <div className="flex items-center gap-2 pt-2">
                      <div className="h-1 w-1 rounded-full bg-slate-600" />
                      <span className="text-[10px] text-slate-600">
                        Reach level {dungeon.minLevel}
                      </span>
                    </div>
                  )}
                </div>

                {/* ── Bottom border glow ── */}
                {!isLocked && (
                  <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600" />
                )}
              </button>
            );
          })}
      </CardCarousel>
    </PageContainer>
  );
}

/* ────────────────── Page wrapper ────────────────── */

export default function DungeonPage() {
  return (
    <Suspense fallback={<PageLoader icon={<GameIcon name="dungeons" size={32} />} text="Loading dungeons…" />}>
      <DungeonContent />
    </Suspense>
  );
}
