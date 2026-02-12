"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import CombatBattleScreen from "@/app/components/CombatBattleScreen";
import CombatLootScreen from "@/app/components/CombatLootScreen";
import PageLoader from "@/app/components/PageLoader";
import HeroCard from "@/app/components/HeroCard";
import useCharacterAvatar from "@/app/hooks/useCharacterAvatar";
import { BOSS_CATALOG } from "@/lib/game/boss-catalog";
import { BOSS_ABILITIES } from "@/lib/game/boss-abilities";
import { getBossStats } from "@/lib/game/dungeon";

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

const SLOT_ICON: Record<string, string> = {
  weapon: "⚔️",
  helmet: "🪖",
  chest: "🛡️",
  gloves: "🧤",
  boots: "👢",
  accessory: "💍",
  legs: "🦿",
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

/** Boss-specific emoji avatars for visual variety */
const BOSS_AVATARS: Record<string, string> = {
  "Straw Dummy": "🎯", "Rusty Automaton": "🤖", "Barrel Golem": "🛢️",
  "Plank Knight": "🪵", "Flying Francis": "🦟", "Scarecrow Mage": "🧙",
  "Mud Troll": "🧌", "Possessed Mannequin": "🪆", "Iron Dummy": "🗡️",
  "Drill Sergeant Grizzle": "💪", "Ghost": "👻", "Skeleton Archer": "💀",
  "Shambling Zombie": "🧟", "Tomb Spider": "🕷️", "Bone Golem": "🦴",
  "Banshee": "😱", "Crypt Knight": "⚔️", "Wraith": "🌫️",
  "Lich Apprentice": "📖", "Necromancer Voss": "☠️", "Spore Sprite": "✨",
  "Mushroom Brute": "🍄", "Vine Strangler": "🌿", "Poison Toad": "🐸",
  "Mycelium Golem": "🌲", "Rot Witch": "🧪", "Fungal Hydra": "🐉",
  "Sporeling Hive Mind": "🧠", "Blight Treant": "🌳", "The Overgrowth": "🌺",
  "Ember Rat": "🐀", "Magma Slime": "🫧", "Mine Foreman": "⛏️",
  "Lava Beetle": "🪲", "Cinder Elemental": "🔥", "Soot Dragon Whelp": "🐲",
  "Obsidian Guardian": "🗿", "Flame Witch": "🔮", "Infernal Siege Engine": "💣",
  "Pyrax the Molten King": "👑", "Frost Wisp": "❄️", "Ice Wolf": "🐺",
  "Glacier Troll": "🏔️", "Frozen Sentinel": "🧊", "Blizzard Harpy": "🦅",
  "Crystal Golem": "💎", "Frost Wyvern": "🐉", "Ice Lich": "🥶",
  "Permafrost Colossus": "🗻", "Glacius the Eternal": "🌀",
  "Light Sprite": "💡", "Radiant Archer": "🏹", "Crystal Beast": "🦄",
  "Solar Monk": "☀️", "Golden Golem": "🏆", "Seraph Guardian": "👼",
  "Prism Dragon": "🌈", "Light Weaver": "🕸️", "Solar Colossus": "🌞",
  "The Heart of the Ray": "💛", "Shadow Wisp": "🌑", "Dark Stalker": "🦇",
  "Void Spider": "🕷️", "Shade Knight": "🗡️", "Eclipse Wolf": "🌒",
  "Nightborne Mage": "🪄", "Abyss Hydra": "🐙", "Shadow Dragon": "🐲",
  "Void Colossus": "⬛", "The Whispering Dark": "👁️",
  "Gear Sprite": "⚡", "Clockwork Hound": "🐕", "Piston Golem": "🏗️",
  "Sawblade Dancer": "💿", "Tesla Turret": "⚡", "Steam Knight": "♨️",
  "Gear Dragon": "⚙️", "Grand Mechanist": "🔧", "Siege Automaton": "🤖",
  "The Grand Engine": "🏭", "Depth Crawler": "🦀", "Angler Horror": "🐡",
  "Coral Golem": "🪸", "Siren": "🧜", "Kraken Spawn": "🦑",
  "Abyssal Leviathan": "🐋", "Deep Sea Dragon": "🐉", "Drowned Admiral": "⚓",
  "Tidal Colossus": "🌊", "Charybdis the Devourer": "🌀",
  "Imp Swarm": "😈", "Hellhound Alpha": "🐕‍🦺", "Flame Demoness": "💃",
  "Iron Demon": "🦾", "Pit Fiend": "👿", "Soul Reaver": "💀",
  "Infernal Dragon": "🐉", "Dark Seraph": "😇", "The Throne Guardian": "🛡️",
  "Archfiend Malachar": "👑",
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
  const avatarSrc = useCharacterAvatar(characterId);
  const [character, setCharacter] = useState<Character | null>(null);
  const [dungeons, setDungeons] = useState<DungeonInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [fighting, setFighting] = useState(false);
  const [screen, setScreen] = useState<DungeonScreen>({ kind: "list" });
  const [error, setError] = useState<string | null>(null);
  const [selectedBoss, setSelectedBoss] = useState<number | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

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

  /* ── Fight boss ── */
  const handleFight = async () => {
    if (screen.kind !== "boss" || fighting) return;
    setError(null);
    setFighting(true);
    try {
      const res = await fetch(`/api/dungeons/run/${screen.runId}/fight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
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

  const handleLootContinue = () => {
    // Boss defeated, go back to list (run is already deleted, need to reload)
    loadData();
    setScreen({ kind: "list" });
    window.dispatchEvent(new Event("character-updated"));
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
    return <PageLoader emoji="🏰" text="Loading dungeons…" avatarSrc={avatarSrc} />;
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
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBackToList}
              aria-label="Back to dungeons"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/80 text-sm text-slate-400 transition hover:bg-slate-700 hover:text-white"
            >
              ←
            </button>
            <h1 className="text-xl font-bold text-white">
              {dungeon.theme.icon} {dungeon.name}
            </h1>
          </div>
          <span className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300">
            Stamina{" "}
            <span className="font-bold text-amber-400">
              {character.currentStamina}/{character.maxStamina}
            </span>
          </span>
        </div>

        {/* Boss card */}
        <div className="mb-6 flex flex-col items-center">
          <p className="mb-3 text-sm text-slate-400">
            Boss{" "}
            <span className="font-bold text-white">
              {(screen.dungeon.bossIndex ?? 0) + 1}
            </span>{" "}
            / {dungeon.bosses.length}
          </p>
          <div className="w-72">
            <HeroCard
              name={boss.name}
              imageSrc={BOSS_IMAGES[boss.name]}
              description={boss.description}
              hp={{ current: boss.hp, max: boss.maxHp }}
            >
              {error && <p className="px-3 pb-2 text-sm text-red-400">{error}</p>}
              <div className="flex justify-center px-3 pb-3">
                <button
                  type="button"
                  onClick={handleFight}
                  disabled={fighting}
                  aria-label="Fight Boss"
                  className="rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-amber-900/40 transition hover:from-amber-500 hover:to-orange-500 disabled:opacity-50"
                >
                  {fighting ? "Fighting…" : "⚔️ Fight Boss"}
                </button>
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
          <p className="mb-1 text-3xl">🏆</p>
          <p className="text-lg font-bold text-green-400">
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
          <button
            type="button"
            onClick={handleBackToList}
            aria-label="Back to Dungeons"
            className="mt-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-3 text-sm font-bold text-white transition hover:from-amber-500 hover:to-orange-500"
          >
            ← Back to Dungeons
          </button>
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
          <p className="text-lg font-bold text-red-400">Defeat</p>
          <p className="mt-2 text-sm text-slate-400">
            The boss was too strong. Prepare and try again.
          </p>
          <button
            type="button"
            onClick={handleBackToList}
            aria-label="Back to Dungeons"
            className="mt-4 rounded-xl border border-slate-700 bg-slate-800 px-6 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-700"
          >
            ← Back to Dungeons
          </button>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     DETAIL — dungeon map + boss details (по образцу скриншота)
     ══════════════════════════════════════════ */
  if (screen.kind === "detail") {
    const { dungeon } = screen;
    const canAfford = character.currentStamina >= dungeon.staminaCost;
    const canStart = dungeon.unlocked && !dungeon.completed && canAfford;
    const dungeonIndex = dungeons.findIndex((d) => d.id === dungeon.id);
    const selectedBossIndex = selectedBoss ?? dungeon.bossIndex;
    const activeBoss = dungeon.bosses[selectedBossIndex] ?? dungeon.bosses[0];
    const isBossDefeated = selectedBossIndex < dungeon.bossIndex;
    const isBossCurrent = selectedBossIndex === dungeon.bossIndex && !dungeon.completed;
    const isBossLocked = selectedBossIndex > dungeon.bossIndex && !dungeon.completed;
    const possibleDrops = getBossPossibleDrops(dungeonIndex, selectedBossIndex);

    // Calculate boss preview stats based on player level
    const bossPreviewStats = !isBossLocked
      ? getBossStats(character.level, activeBoss as Parameters<typeof getBossStats>[1])
      : null;

    return (
      <div className="flex min-h-full flex-col p-4 lg:p-6">
        {/* Top bar: Back + dungeon name + progress + stamina */}
        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => { setSelectedBoss(null); handleBackToList(); }}
            aria-label="Back to dungeons"
            tabIndex={0}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/80 text-sm text-slate-400 transition hover:bg-slate-700 hover:text-white"
          >
            ←
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-white lg:text-xl">
              {dungeon.theme.icon} {dungeon.name}
            </h1>
            <p className="text-[10px] text-slate-500">{dungeon.subtitle}</p>
          </div>
          <span className="shrink-0 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300">
            ⚡ {dungeon.staminaCost} Energy
          </span>
        </div>

        {/* Two-column layout: Boss Map (left) + Boss Detail (right) */}
        <div className="flex flex-1 flex-col gap-4 lg:flex-row">
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
            <div className="custom-scrollbar max-h-[500px] overflow-y-auto p-3 lg:max-h-[600px]">
              <div className="relative flex flex-col items-center gap-1">
                {dungeon.bosses.map((boss, idx) => {
                  const defeated = boss.index < dungeon.bossIndex;
                  const current = boss.index === dungeon.bossIndex && !dungeon.completed;
                  const locked = boss.index > dungeon.bossIndex && !dungeon.completed;
                  const isSelected = selectedBossIndex === boss.index;
                  const avatar = BOSS_AVATARS[boss.name] ?? "❓";

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
                          ) : avatar}
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
          <div className="order-first flex flex-1 flex-col items-center lg:order-none">
            {/* Status badges above card */}
            <div className="mb-2 flex items-center justify-center gap-2">
              <p className="text-sm font-bold text-slate-300">
                Level {activeBoss.level} · Boss {selectedBossIndex + 1}/{dungeon.bosses.length}
              </p>
              {isBossCurrent && (
                <span className="animate-pulse rounded-full bg-amber-900/40 px-3 py-1 text-[11px] font-bold text-amber-400">
                  ⚔️ Current Target
                </span>
              )}
              {isBossLocked && (
                <span className="rounded-full bg-slate-800/60 px-3 py-1 text-[11px] font-bold text-slate-500">
                  🔒 Locked
                </span>
              )}
            </div>

            {/* Boss HeroCard */}
            <div className="w-full max-w-[280px]">
            <HeroCard
              name={isBossLocked ? "???" : activeBoss.name}
              level={activeBoss.level}
              icon={isBossLocked ? "🔒" : (BOSS_AVATARS[activeBoss.name] ?? "❓")}
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
              statSize="sm"
              disabled={isBossLocked}
            >
              {/* Boss Abilities */}
              {!isBossLocked && (() => {
                const catalogEntry = BOSS_CATALOG.find(
                  (b) => b.dungeonId === dungeon.id && b.bossIndex === selectedBossIndex,
                );
                if (!catalogEntry) return null;
                const abilityMap = new Map(BOSS_ABILITIES.map((a) => [a.id, a]));
                const abilities = catalogEntry.abilityIds
                  .map((id) => abilityMap.get(id))
                  .filter(Boolean);
                if (abilities.length === 0) return null;

                const TYPE_ICON: Record<string, string> = {
                  physical: "⚔️",
                  magic: "✨",
                  buff: "🛡️",
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
                          <span className="text-xs">{TYPE_ICON[ability.type] ?? "❓"}</span>
                          {ability.name}
                        </span>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Possible Loot */}
              {!isBossLocked && (
                <div className="flex flex-wrap items-center justify-center gap-1.5 px-3 pb-3">
                  {possibleDrops.map((drop, i) => {
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
                        <span className="text-lg">{SLOT_ICON[drop.slot] ?? "📦"}</span>
                      </div>
                    );
                  })}
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-md border-2 border-yellow-700/40 bg-yellow-900/30 transition-all hover:brightness-125"
                    title={`Gold ~${20 + dungeonIndex * 30 + Math.floor((20 + dungeonIndex * 30) * selectedBossIndex * 0.2)}g`}
                  >
                    <span className="text-lg">🪙</span>
                  </div>
                </div>
              )}
            </HeroCard>
            </div>

            {/* Error */}
            {error && (
              <p className="mt-3 mb-3 text-sm text-red-400" role="alert">{error}</p>
            )}

            {/* Fight button — only for current boss */}
            {isBossCurrent && !dungeon.completed ? (
              <button
                type="button"
                onClick={() => handleStart(dungeon)}
                disabled={!canStart || starting}
                aria-label="Fight Boss"
                tabIndex={0}
                className={`
                  mt-4 rounded-2xl px-6 py-4 text-base font-bold text-white shadow-lg transition
                  ${canStart
                    ? "bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 shadow-red-900/40 hover:from-red-500 hover:via-orange-500 hover:to-amber-500 hover:shadow-xl"
                    : "bg-slate-800 text-slate-500"
                  }
                  disabled:opacity-50
                `}
              >
                {starting
                  ? "Preparing…"
                  : !canAfford
                    ? `Not enough stamina (need ${dungeon.staminaCost})`
                    : `⚔️ FIGHT`}
              </button>
            ) : dungeon.completed ? (
              <div className="mt-4 rounded-xl border border-green-800/40 bg-green-950/20 px-4 py-3 text-center text-sm font-medium text-green-400">
                ✅ Dungeon Completed
              </div>
            ) : isBossDefeated ? (
              <div className="mt-4 rounded-xl border border-green-800/30 bg-green-950/10 px-4 py-3 text-center text-xs text-green-400/60">
                This boss has already been defeated
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-slate-700/30 bg-slate-900/30 px-4 py-3 text-center text-xs text-slate-500">
                Defeat boss {selectedBossIndex} first to unlock this fight
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     LIST — dungeon carousel (S&F style)
     ══════════════════════════════════════════ */
  const handleScrollCarousel = (direction: "left" | "right") => {
    const el = carouselRef.current;
    if (!el) return;
    const cardWidth = el.querySelector<HTMLElement>(".dungeon-card")?.offsetWidth ?? 320;
    const scrollAmount = cardWidth + 20;
    el.scrollBy({ left: direction === "right" ? scrollAmount : -scrollAmount, behavior: "smooth" });
  };

  return (
    <div className="flex min-h-full flex-col p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">🏰 Dungeons</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Defeat 10 bosses in sequence to conquer each dungeon.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-400">
            <strong className="text-white">{character.characterName}</strong> ·
            Lv. {character.level}
          </span>
          <span className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300">
            Stamina{" "}
            <span className="font-bold text-amber-400">
              {character.currentStamina}/{character.maxStamina}
            </span>
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="mb-4 text-sm text-red-400" role="alert">{error}</p>
      )}

      {/* Dungeon carousel */}
      <div className="relative flex-1">
        {/* Navigation arrows */}
        <button
          type="button"
          onClick={() => handleScrollCarousel("left")}
          aria-label="Previous dungeon"
          className="carousel-nav-btn left-2"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => handleScrollCarousel("right")}
          aria-label="Next dungeon"
          className="carousel-nav-btn right-2"
        >
          ›
        </button>

        {/* Cards scroll container */}
        <div ref={carouselRef} className="dungeon-carousel px-8 py-4">
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
                      sizes="320px"
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
                {isLocked && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-slate-950/60">
                    <span className="text-4xl">🔒</span>
                    <span className="text-xs font-medium text-slate-400">
                      Lv. {dungeon.minLevel}+ required
                    </span>
                    {dungeon.prevDungeonId && (
                      <span className="text-[10px] text-slate-500">
                        Complete previous dungeon
                      </span>
                    )}
                  </div>
                )}

                {/* Completed badge */}
                {dungeon.completed && (
                  <div className="absolute right-3 top-3 z-10 rounded-lg bg-green-600/90 px-2.5 py-1 text-xs font-bold text-white shadow-lg backdrop-blur-sm">
                    ✅ COMPLETE
                  </div>
                )}

                {/* Stamina cost badge */}
                {!isLocked && (
                  <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1 text-xs font-bold text-amber-400 shadow-lg backdrop-blur-sm">
                    ⚡ {dungeon.staminaCost}
                  </div>
                )}

                {/* ── Card info panel (overlay at bottom) ── */}
                <div className="relative z-10 mt-auto flex flex-col gap-2.5 p-4">
                  {/* Title */}
                  <h3 className="text-lg font-bold leading-tight text-white drop-shadow-lg">
                    {dungeon.name}
                  </h3>

                  {/* Description */}
                  <p className="line-clamp-3 text-xs leading-relaxed text-slate-300 drop-shadow-md">
                    {lore?.paragraphs?.[0] ?? dungeon.subtitle}
                  </p>

                  {/* Progress bar */}
                  {!isLocked && (
                    <div className="pt-2">
                      <div className="mb-1.5 flex items-center justify-between text-[10px]">
                        <span className="font-medium text-slate-400">
                          {dungeon.completed ? "All bosses defeated" : `Boss ${dungeon.bossIndex + 1} of ${dungeon.bosses.length}`}
                        </span>
                        <span className="font-bold text-slate-300">
                          {dungeon.bossIndex}/{dungeon.bosses.length}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800/80">
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
        </div>
      </div>
    </div>
  );
}

/* ────────────────── Page wrapper ────────────────── */

export default function DungeonPage() {
  return (
    <Suspense fallback={<PageLoader emoji="🏰" text="Loading dungeons…" />}>
      <DungeonContent />
    </Suspense>
  );
}
