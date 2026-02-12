"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import PageLoader from "@/app/components/PageLoader";
import {
  ALL_ORIGINS,
  ORIGIN_DEFS,
  ORIGIN_GRADIENT,
  ORIGIN_BORDER,
  ORIGIN_ACCENT,
  type CharacterOrigin,
} from "@/lib/game/origins";

/* ────────────────── Types ────────────────── */

type Character = {
  id: string;
  characterName: string;
  class: string;
  origin: string;
  level: number;
  gold: number;
  pvpRating: number;
};

type CharStats = { str: number; agi: number; vit: number; end: number; int: number; wis: number; lck: number; cha: number };
type DerivedStats = {
  physicalDamage: number;
  magicDamage: number;
  defense: number;
  magicDefense: number;
  critChance: number;
  critDamage: number;
  dodgeChance: number;
  armorReduction: number;
  magicResistPercent: number;
  maxHp: number;
};

type CharacterDetail = {
  id: string;
  characterName: string;
  class: string;
  origin?: string;
  level: number;
  currentXp: number;
  prestigeLevel: number;
  gold: number;
  maxHp: number;
  currentHp: number;
  armor: number;
  magicResist: number;
  pvpRating: number;
  pvpWins: number;
  pvpLosses: number;
  statPointsAvailable: number;
  stats: CharStats;
  derived: DerivedStats;
};

/* ────────────────── Constants ────────────────── */

const CLASS_LABELS: Record<string, string> = {
  warrior: "Warrior",
  rogue: "Rogue",
  mage: "Mage",
  tank: "Tank",
};

const CLASS_ICON: Record<string, string> = {
  warrior: "⚔️",
  rogue: "🗡️",
  mage: "🧙",
  tank: "🛡️",
};

const CLASS_DESCRIPTION: Record<string, string> = {
  warrior: "Brute force & heavy strikes",
  rogue: "Speed, stealth & critical hits",
  mage: "Arcane power & elemental fury",
  tank: "Iron defense & unbreakable will",
};

const CLASS_GRADIENT: Record<string, string> = {
  warrior: "from-red-600/20 to-orange-600/20",
  rogue: "from-emerald-600/20 to-teal-600/20",
  mage: "from-violet-600/20 to-indigo-600/20",
  tank: "from-sky-600/20 to-blue-600/20",
};

const CLASS_BORDER: Record<string, string> = {
  warrior: "border-red-500/40 hover:border-red-400/60",
  rogue: "border-emerald-500/40 hover:border-emerald-400/60",
  mage: "border-violet-500/40 hover:border-violet-400/60",
  tank: "border-sky-500/40 hover:border-sky-400/60",
};

const CLASS_ACCENT: Record<string, string> = {
  warrior: "text-red-400",
  rogue: "text-emerald-400",
  mage: "text-violet-400",
  tank: "text-sky-400",
};

const ALL_CLASSES = ["warrior", "rogue", "mage", "tank"] as const;

const CLASS_IMAGE: Record<string, string> = {
  warrior: "/images/generated/class-warrior.png",
  rogue: "/images/generated/class-rogue.png",
  mage: "/images/generated/class-mage.png",
  tank: "/images/generated/class-tank.png",
};

const ORIGIN_IMAGE: Record<string, string> = {
  human: "/images/generated/origin-human.png",
  orc: "/images/generated/origin-orc.png",
  skeleton: "/images/generated/origin-skeleton.png",
  demon: "/images/generated/origin-demon.png",
  dogfolk: "/images/generated/origin-dogfolk.png",
};

/* ────────────────── Character Card ────────────────── */

const CharacterCard = ({
  character,
  onSelect,
  isSelected = false,
}: {
  character: Character;
  onSelect: (id: string) => void;
  isSelected?: boolean;
}) => {
  const cls = character.class;

  return (
    <button
      type="button"
      onClick={() => onSelect(character.id)}
      className={`group relative w-full overflow-hidden rounded-2xl border bg-gradient-to-br ${CLASS_GRADIENT[cls] ?? "from-slate-700/20 to-slate-600/20"} ${
        isSelected
          ? "border-amber-500/60 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10"
          : `${CLASS_BORDER[cls] ?? "border-slate-600/40 hover:border-slate-400/60"}`
      } p-4 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/30`}
      aria-label={`Select ${character.characterName}`}
      tabIndex={0}
    >
      {/* Shine overlay on hover */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative flex items-center gap-4">
        {/* Avatar */}
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-slate-700 bg-gradient-to-b from-slate-800 to-slate-900 shadow-inner">
          {character.origin && ORIGIN_IMAGE[character.origin] ? (
            <Image
              src={ORIGIN_IMAGE[character.origin]}
              alt={character.origin}
              width={1024}
              height={1024}
              className="absolute left-1/2 -top-2 w-[300%] max-w-none -translate-x-1/2"
              sizes="168px"
            />
          ) : (
            <span className="text-3xl">{CLASS_ICON[cls] ?? "⚔️"}</span>
          )}
          <span className="absolute -bottom-1 -left-1 z-10 rounded-md bg-slate-700 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
            Lv.{character.level}
          </span>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold text-white">{character.characterName}</p>
          <p className={`text-xs font-semibold uppercase tracking-wider ${CLASS_ACCENT[cls] ?? "text-slate-400"}`}>
            {CLASS_LABELS[cls] ?? cls}
            {character.origin && ORIGIN_DEFS[character.origin as CharacterOrigin] && (
              <span className="ml-1.5 text-slate-500">
                · {ORIGIN_DEFS[character.origin as CharacterOrigin].icon}{" "}
                {ORIGIN_DEFS[character.origin as CharacterOrigin].label}
              </span>
            )}
          </p>
          <div className="mt-1.5 flex items-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="text-yellow-400">🪙</span> {character.gold}
            </span>
            <span className="flex items-center gap-1">
              <span>🏅</span> {character.pvpRating}
            </span>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-700/50 bg-slate-800/50 text-slate-500 transition-all group-hover:border-amber-500/30 group-hover:bg-amber-500/10 group-hover:text-amber-400">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </button>
  );
};

/* ────────────────── Class Selector Card ────────────────── */

const ClassSelectorCard = ({
  cls,
  selected,
  onSelect,
}: {
  cls: string;
  selected: boolean;
  onSelect: (cls: string) => void;
}) => (
  <button
    type="button"
    onClick={() => onSelect(cls)}
    className={`group relative flex flex-col items-center gap-1.5 rounded-xl border p-2 transition-all duration-200
      ${selected
        ? `bg-gradient-to-b ${CLASS_GRADIENT[cls]} ${CLASS_BORDER[cls]?.split(" ")[0]} shadow-lg`
        : "border-slate-700/50 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/80"
      }
    `}
    aria-label={`Select class ${CLASS_LABELS[cls]}`}
    aria-pressed={selected}
    tabIndex={0}
  >
    <div className="relative h-16 w-16 overflow-hidden rounded-lg">
      <Image
        src={CLASS_IMAGE[cls]}
        alt={CLASS_LABELS[cls]}
        fill
        className="object-cover object-top transition-transform duration-200 group-hover:scale-110"
        sizes="64px"
      />
    </div>
    <span className={`text-[10px] font-bold uppercase tracking-wider ${selected ? CLASS_ACCENT[cls] : "text-slate-400"}`}>
      {CLASS_LABELS[cls]}
    </span>
    {selected && (
      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-black shadow">
        ✓
      </span>
    )}
  </button>
);

/* ────────────────── Origin Selector Card ────────────────── */

const OriginSelectorCard = ({
  origin,
  selected,
  onSelect,
}: {
  origin: CharacterOrigin;
  selected: boolean;
  onSelect: (o: CharacterOrigin) => void;
}) => {
  const def = ORIGIN_DEFS[origin];

  return (
    <button
      type="button"
      onClick={() => onSelect(origin)}
      className={`group relative flex flex-col items-center gap-1.5 rounded-xl border p-2 transition-all duration-200
        ${selected
          ? `bg-gradient-to-b ${ORIGIN_GRADIENT[origin]} ${ORIGIN_BORDER[origin]?.split(" ")[0]} shadow-lg`
          : "border-slate-700/50 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/80"
        }
      `}
      aria-label={`Select origin ${def.label}`}
      aria-pressed={selected}
      tabIndex={0}
    >
      <div className="relative h-14 w-14 overflow-hidden rounded-lg">
        <Image
          src={ORIGIN_IMAGE[origin]}
          alt={def.label}
          fill
          className="object-cover object-top transition-transform duration-200 group-hover:scale-110"
          sizes="56px"
        />
      </div>
      <span
        className={`text-[10px] font-bold uppercase tracking-wider leading-tight text-center ${
          selected ? ORIGIN_ACCENT[origin] : "text-slate-400"
        }`}
      >
        {def.label}
      </span>
      {selected && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-black shadow">
          ✓
        </span>
      )}
    </button>
  );
};

/* ────────────────── Character Preview Panel ────────────────── */

type CharacterPreviewProps = {
  detail: CharacterDetail;
  onContinue: () => void;
  onClose: () => void;
};

const CharacterPreview = ({ detail, onContinue, onClose }: CharacterPreviewProps) => {
  const cls = detail.class;
  const origin = detail.origin ?? "";

  const statRows: { label: string; short: string; value: number; derived: string; derivedValue: string; color: string }[] = [
    { label: "Strength", short: "STR", value: detail.stats.str, derived: "DMG", derivedValue: `${detail.derived.physicalDamage}`, color: "text-red-400" },
    { label: "Vitality", short: "VIT", value: detail.stats.vit, derived: "HP", derivedValue: `${detail.derived.maxHp}`, color: "text-green-400" },
    { label: "Agility", short: "AGI", value: detail.stats.agi, derived: "DODGE", derivedValue: `${detail.derived.dodgeChance}%`, color: "text-cyan-400" },
    { label: "Luck", short: "LCK", value: detail.stats.lck, derived: "CRIT", derivedValue: `${detail.derived.critChance}%`, color: "text-yellow-400" },
    { label: "Intelligence", short: "INT", value: detail.stats.int, derived: "MDMG", derivedValue: `${detail.derived.magicDamage}`, color: "text-blue-400" },
    { label: "Armor", short: "ARM", value: detail.armor, derived: "RED.", derivedValue: `${detail.derived.armorReduction}%`, color: "text-orange-400" },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 rounded-2xl border border-slate-700/60 bg-slate-900/90 shadow-2xl shadow-black/40 overflow-hidden">
      {/* Header with close */}
      <div className="flex items-center justify-between border-b border-slate-700/50 px-5 py-3">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-300">Character Info</h2>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-white"
          aria-label="Close preview"
          tabIndex={0}
        >
          ✕
        </button>
      </div>

      {/* Avatar + name + class */}
      <div className="flex flex-col items-center px-5 pt-5 pb-3">
        <div className="relative mb-3 flex h-32 w-32 items-center justify-center overflow-hidden rounded-2xl border-2 border-slate-700 bg-gradient-to-b from-slate-800 to-slate-900 shadow-inner">
          {origin && ORIGIN_IMAGE[origin] ? (
            <Image
              src={ORIGIN_IMAGE[origin]}
              alt={origin}
              width={1024}
              height={1024}
              className="absolute left-1/2 -top-5 w-[300%] max-w-none -translate-x-1/2"
              sizes="384px"
            />
          ) : (
            <span className="text-5xl">{CLASS_ICON[cls] ?? "⚔️"}</span>
          )}
          <span className="absolute bottom-1 right-1 rounded-md bg-slate-900/80 px-2 py-0.5 text-[11px] font-bold text-white shadow backdrop-blur-sm">
            Lv.{detail.level}
          </span>
        </div>
        <p className="text-xl font-bold text-white">{detail.characterName}</p>
        <p className={`mt-0.5 text-xs font-semibold uppercase tracking-wider ${CLASS_ACCENT[cls] ?? "text-slate-400"}`}>
          {CLASS_LABELS[cls] ?? cls}
          {origin && ORIGIN_DEFS[origin as CharacterOrigin] && (
            <span className="ml-1.5 text-slate-500">
              · {ORIGIN_DEFS[origin as CharacterOrigin].icon}{" "}
              {ORIGIN_DEFS[origin as CharacterOrigin].label}
            </span>
          )}
        </p>
      </div>

      {/* Quick info row */}
      <div className="mx-5 mb-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-slate-800/60 px-2 py-2">
          <p className="text-[10px] font-semibold uppercase text-slate-500">Gold</p>
          <p className="text-sm font-bold text-yellow-400">{detail.gold.toLocaleString()}</p>
        </div>
        <div className="rounded-lg bg-slate-800/60 px-2 py-2">
          <p className="text-[10px] font-semibold uppercase text-slate-500">Rating</p>
          <p className="text-sm font-bold text-white">{detail.pvpRating}</p>
        </div>
        <div className="rounded-lg bg-slate-800/60 px-2 py-2">
          <p className="text-[10px] font-semibold uppercase text-slate-500">W / L</p>
          <p className="text-sm font-bold">
            <span className="text-green-400">{detail.pvpWins}</span>
            <span className="text-slate-600"> / </span>
            <span className="text-red-400">{detail.pvpLosses}</span>
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="mx-5 mb-4 grid grid-cols-2 gap-2">
        {statRows.map((r) => (
          <div
            key={r.short}
            className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-bold ${r.color}`}>{r.short}</p>
              <p className="text-[10px] text-slate-400">
                {r.derived}
                <span className="ml-1 text-slate-300">{r.derivedValue}</span>
              </p>
            </div>
            <span className="text-lg font-bold text-white">{r.value}</span>
          </div>
        ))}
      </div>

      {/* Prestige badge */}
      {detail.prestigeLevel > 0 && (
        <div className="mx-5 mb-4 rounded-lg bg-amber-900/30 px-3 py-2 text-center text-xs font-bold text-amber-300">
          Prestige {detail.prestigeLevel} — +{detail.prestigeLevel * 2}% all stats
        </div>
      )}

      {/* Stat points notice */}
      {detail.statPointsAvailable > 0 && (
        <div className="mx-5 mb-4 rounded-lg bg-indigo-900/30 px-3 py-2 text-center text-xs text-indigo-300">
          🔔 {detail.statPointsAvailable} stat point{detail.statPointsAvailable > 1 ? "s" : ""} available
        </div>
      )}

      {/* Continue button */}
      <div className="p-5 pt-0">
        <button
          type="button"
          onClick={onContinue}
          className="w-full rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-amber-600/20 transition-all hover:from-amber-500 hover:to-orange-500 hover:shadow-amber-500/30 active:scale-[0.98]"
          aria-label={`Continue as ${detail.characterName}`}
          tabIndex={0}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

/* ────────────────── Main Page ────────────────── */

export default function CharacterPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [classChoice, setClassChoice] = useState<string>("warrior");
  const [originChoice, setOriginChoice] = useState<CharacterOrigin>("human");
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<CharacterDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const res = await fetch("/api/characters", { signal: controller.signal });
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Failed to load characters");
        }
        const data = await res.json();
        setCharacters(data.characters ?? []);
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Loading error");
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [router]);

  const handleSelect = useCallback(async (id: string) => {
    setSelectedId(id);
    setDetailLoading(true);
    setSelectedDetail(null);
    try {
      const res = await fetch(`/api/inventory?characterId=${id}`);
      if (!res.ok) {
        setError("Failed to load character details");
        setSelectedId(null);
        return;
      }
      const json = await res.json();
      setSelectedDetail(json.character as CharacterDetail);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error loading details");
      setSelectedId(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleContinue = useCallback(() => {
    if (!selectedId) return;
    router.push(`/hub?characterId=${selectedId}`);
    router.refresh();
  }, [selectedId, router]);

  const handleClosePreview = useCallback(() => {
    setSelectedId(null);
    setSelectedDetail(null);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterName: name.trim(),
          class: classChoice,
          origin: originChoice,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Creation error");
        return;
      }
      router.push(`/hub?characterId=${data.character.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Character creation error");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <PageLoader emoji="🧙" text="Loading characters…" />;
  }

  if (error && characters.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 p-8">
        <div className="rounded-2xl border border-red-500/30 bg-slate-900/80 px-8 py-6 text-center">
          <p className="text-2xl">💀</p>
          <p className="mt-2 text-sm text-red-400" role="alert">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg border border-slate-700 bg-slate-800 px-5 py-2 text-sm text-slate-300 transition hover:bg-slate-700 hover:text-white"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  const hasCharacters = characters.length > 0;
  const isCreateVisible = showCreateForm || !hasCharacters;

  return (
    <main className="flex min-h-screen flex-col items-center bg-slate-950 px-4 py-8 sm:px-8">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-amber-500/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-4xl">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold uppercase tracking-wider text-white sm:text-4xl">
            Character Selection
          </h1>
          <p className="mt-2 text-sm text-slate-500">Choose your champion or forge a new one</p>
        </header>

        {/* Two-column layout: list on the left, preview on the right */}
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Left column — list + create */}
          <div className={`w-full ${selectedId ? "lg:w-1/2" : "lg:mx-auto lg:max-w-lg"} transition-all duration-300`}>
            {/* Character List */}
            {hasCharacters && (
              <section className="mb-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10">
                    <span className="text-sm">⭐</span>
                  </div>
                  <h2 className="text-sm font-bold uppercase tracking-widest text-slate-300">
                    Characters
                  </h2>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                    {characters.length}
                  </span>
                </div>

                <ul className="flex flex-col gap-3">
                  {characters.map((c) => (
                    <li key={c.id}>
                      <CharacterCard
                        character={c}
                        onSelect={handleSelect}
                        isSelected={selectedId === c.id}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Create Button / Form */}
            {hasCharacters && !isCreateVisible && (
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                className="group flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-700/60 bg-slate-900/30 py-5 text-slate-400 transition-all duration-300 hover:border-amber-500/40 hover:bg-slate-900/60 hover:text-amber-400"
                aria-label="Create new character"
                tabIndex={0}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-xl transition-all group-hover:border-amber-500/40 group-hover:bg-amber-500/10">
                  +
                </span>
                <span className="text-sm font-bold uppercase tracking-wider">Create New Character</span>
              </button>
            )}

            {isCreateVisible && (
              <section className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/80 shadow-xl">
                {/* Form header */}
                <div className="flex items-center justify-between border-b border-slate-700/50 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10">
                      <span className="text-sm">✨</span>
                    </div>
                    <h2 className="text-sm font-bold uppercase tracking-widest text-slate-300">
                      {hasCharacters ? "New Character" : "Create Your First Character"}
                    </h2>
                  </div>
                  {hasCharacters && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false);
                        setError(null);
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-white"
                      aria-label="Close form"
                      tabIndex={0}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Form body */}
                <form onSubmit={handleCreate} className="p-5">
                  {/* Name input */}
                  <label className="mb-5 flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Character Name
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      minLength={2}
                      maxLength={50}
                      placeholder="Enter a name…"
                      className="rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30"
                      aria-label="Character Name"
                    />
                  </label>

                  {/* Race selector */}
                  <div className="mb-5">
                    <span className="mb-3 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Choose Race
                    </span>
                    <div className="grid grid-cols-5 gap-2">
                      {ALL_ORIGINS.map((o) => (
                        <OriginSelectorCard
                          key={o}
                          origin={o}
                          selected={originChoice === o}
                          onSelect={setOriginChoice}
                        />
                      ))}
                    </div>

                    {/* Race description */}
                    <div className="mt-3 rounded-lg border border-slate-700/40 bg-slate-800/40 px-4 py-2.5 text-center">
                      <p className={`text-xs font-medium ${ORIGIN_ACCENT[originChoice]}`}>
                        {ORIGIN_DEFS[originChoice].description}
                      </p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {ORIGIN_DEFS[originChoice].bonusDescription}
                      </p>
                    </div>
                  </div>

                  {/* Class selector */}
                  <div className="mb-5">
                    <span className="mb-3 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Choose Class
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                      {ALL_CLASSES.map((cls) => (
                        <ClassSelectorCard
                          key={cls}
                          cls={cls}
                          selected={classChoice === cls}
                          onSelect={setClassChoice}
                        />
                      ))}
                    </div>

                    {/* Class description */}
                    <div className="mt-3 rounded-lg border border-slate-700/40 bg-slate-800/40 px-4 py-2.5 text-center">
                      <p className={`text-xs font-medium ${CLASS_ACCENT[classChoice]}`}>
                        {CLASS_DESCRIPTION[classChoice]}
                      </p>
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-center">
                      <p className="text-xs text-red-400" role="alert">{error}</p>
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={creating}
                    className="w-full rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-amber-600/20 transition-all hover:from-amber-500 hover:to-orange-500 hover:shadow-amber-500/30 disabled:opacity-50 disabled:hover:from-amber-600 disabled:hover:to-orange-600"
                  >
                    {creating ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Creating…
                      </span>
                    ) : (
                      "Forge Character"
                    )}
                  </button>
                </form>
              </section>
            )}
          </div>

          {/* Right column — character preview */}
          {selectedId && (
            <div className="w-full lg:w-1/2 lg:sticky lg:top-8 lg:self-start">
              {detailLoading ? (
                <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-700/60 bg-slate-900/90">
                  <div className="flex flex-col items-center gap-3">
                    <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-amber-500" />
                    <p className="text-xs text-slate-500">Loading stats…</p>
                  </div>
                </div>
              ) : selectedDetail ? (
                <CharacterPreview
                  detail={selectedDetail}
                  onContinue={handleContinue}
                  onClose={handleClosePreview}
                />
              ) : null}
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-slate-500 transition hover:text-slate-300"
            tabIndex={0}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
