"use client";

import { useEffect, useState } from "react";
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
}: {
  character: Character;
  onSelect: (id: string) => void;
}) => {
  const cls = character.class;

  return (
    <button
      type="button"
      onClick={() => onSelect(character.id)}
      className={`group relative w-full overflow-hidden rounded-2xl border bg-gradient-to-br ${CLASS_GRADIENT[cls] ?? "from-slate-700/20 to-slate-600/20"} ${CLASS_BORDER[cls] ?? "border-slate-600/40 hover:border-slate-400/60"} p-4 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/30`}
      aria-label={`Select ${character.characterName}`}
      tabIndex={0}
    >
      {/* Shine overlay on hover */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative flex items-center gap-4">
        {/* Avatar */}
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border-2 border-slate-700 bg-gradient-to-b from-slate-800 to-slate-900 shadow-inner">
          <span className="text-3xl">{CLASS_ICON[cls] ?? "⚔️"}</span>
          <span className="absolute -bottom-1 -left-1 rounded-md bg-slate-700 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
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

  const handleSelect = (id: string) => {
    router.push(`/hub?characterId=${id}`);
    router.refresh();
  };

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

      <div className="relative z-10 w-full max-w-lg">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold uppercase tracking-wider text-white sm:text-4xl">
            Character Selection
          </h1>
          <p className="mt-2 text-sm text-slate-500">Choose your champion or forge a new one</p>
        </header>

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
                  <CharacterCard character={c} onSelect={handleSelect} />
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
