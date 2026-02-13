"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PageHeader from "@/app/components/PageHeader";
import PageLoader from "@/app/components/PageLoader";
import HeroCard from "@/app/components/HeroCard";
import { GameButton, PageContainer } from "@/app/components/ui";
import GameIcon from "@/app/components/ui/GameIcon";

type Entry = {
  rank: number;
  characterName: string;
  class: string;
  origin?: string;
  level: number;
  pvpRating: number;
  pvpWins: number;
  pvpLosses: number;
  highestPvpRank: string;
  currentRank: string;
  strength: number;
  agility: number;
  vitality: number;
  intelligence: number;
  luck: number;
  maxHp: number;
  currentHp: number;
};

const CLASS_LABEL: Record<string, string> = {
  warrior: "Warrior",
  rogue: "Rogue",
  mage: "Mage",
  tank: "Tank",
};

/** Tailwind color classes per rank tier */
const RANK_COLOR: Record<string, string> = {
  Bronze: "text-amber-600",
  Silver: "text-slate-300",
  Gold: "text-yellow-400",
  Platinum: "text-cyan-400",
  Diamond: "text-blue-400",
  Master: "text-purple-400",
  Grandmaster: "text-red-400",
};

const getRankColor = (rank: string): string => {
  const tier = rank.split(" ")[0];
  return RANK_COLOR[tier] ?? "text-slate-400";
};

/* ─────────── Hero tooltip on hover ─────────── */

const CARD_W = 200;
const CARD_H = 340;
const TOOLTIP_GAP = 12;

type TooltipState = {
  entry: Entry;
  x: number;
  y: number;
} | null;

const HeroTooltip = ({ state }: { state: NonNullable<TooltipState> }) => {
  const { entry, x, y } = state;

  // Position so the card doesn't overflow viewport
  const vw = typeof window !== "undefined" ? window.innerWidth : 1920;
  const vh = typeof window !== "undefined" ? window.innerHeight : 1080;

  let left = x + TOOLTIP_GAP;
  let top = y - CARD_H / 2;

  // Flip to left side if overflows right
  if (left + CARD_W > vw - 8) {
    left = x - CARD_W - TOOLTIP_GAP;
  }
  // Clamp vertical
  if (top < 8) top = 8;
  if (top + CARD_H > vh - 8) top = vh - CARD_H - 8;

  return createPortal(
    <div
      className="pointer-events-none fixed z-[9999] animate-in fade-in zoom-in-95 duration-150"
      style={{ left, top, width: CARD_W }}
    >
      <HeroCard
        name={entry.characterName}
        className={entry.class}
        origin={entry.origin}
        level={entry.level}
        rating={entry.pvpRating}
        hp={{ current: entry.currentHp, max: entry.maxHp }}
        stats={{
          strength: entry.strength,
          agility: entry.agility,
          vitality: entry.vitality,
          intelligence: entry.intelligence,
          luck: entry.luck,
        }}
        statSize="sm"
        disabled
      />
    </div>,
    document.body,
  );
};

/* ─────────── Main Page ─────────── */

export default function LeaderboardPage() {
  const [data, setData] = useState<{ season: number; leaderboard: Entry[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const tooltipTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const res = await fetch("/api/leaderboard?limit=50", { signal: controller.signal });
        if (!res.ok) throw new Error("Failed to load leaderboard");
        const json = await res.json();
        setData(json);
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Error");
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, []);

  const handleRowMouseEnter = useCallback((entry: Entry, event: React.MouseEvent<HTMLTableRowElement>) => {
    clearTimeout(tooltipTimeout.current);
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      entry,
      x: rect.right,
      y: rect.top + rect.height / 2,
    });
  }, []);

  const handleRowMouseMove = useCallback((entry: Entry, event: React.MouseEvent<HTMLTableRowElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      entry,
      x: rect.right,
      y: rect.top + rect.height / 2,
    });
  }, []);

  const handleRowMouseLeave = useCallback(() => {
    tooltipTimeout.current = setTimeout(() => setTooltip(null), 80);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => () => clearTimeout(tooltipTimeout.current), []);

  if (error) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 p-8">
        <p className="text-red-400" role="alert">{error}</p>
        <GameButton
          variant="secondary"
          onClick={() => { setError(null); setLoading(true); window.location.reload(); }}
          aria-label="Retry loading leaderboard"
        >
          Retry
        </GameButton>
      </div>
    );
  }

  if (loading || !data) {
    return <PageLoader icon={<GameIcon name="leaderboard" size={32} />} text="Loading leaderboard…" />;
  }

  return (
    <PageContainer>
      <PageHeader title={`Leaderboard · Season ${data.season}`} />

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-left text-xs uppercase tracking-wider text-slate-400">
              <th className="px-3 py-2.5">#</th>
              <th className="px-3 py-2.5">Name</th>
              <th className="px-3 py-2.5">Class</th>
              <th className="px-3 py-2.5">Lv.</th>
              <th className="px-3 py-2.5">Rating</th>
              <th className="px-3 py-2.5">W / L</th>
              <th className="px-3 py-2.5">Rank</th>
            </tr>
          </thead>
          <tbody>
            {data.leaderboard.map((e) => (
              <tr
                key={`${e.rank}-${e.characterName}`}
                className="border-b border-slate-800/50 text-slate-300 transition hover:bg-slate-800/30"
                onMouseEnter={(ev) => handleRowMouseEnter(e, ev)}
                onMouseMove={(ev) => handleRowMouseMove(e, ev)}
                onMouseLeave={handleRowMouseLeave}
              >
                <td className="px-3 py-2 font-bold text-white">
                  {e.rank <= 3 ? (
                    <span className={e.rank === 1 ? "text-yellow-400" : e.rank === 2 ? "text-slate-300" : "text-amber-700"}>
                      {e.rank === 1 ? "🥇" : e.rank === 2 ? "🥈" : "🥉"}
                    </span>
                  ) : (
                    e.rank
                  )}
                </td>
                <td className="px-3 py-2 font-medium text-white">{e.characterName}</td>
                <td className="px-3 py-2">{CLASS_LABEL[e.class] ?? e.class}</td>
                <td className="px-3 py-2">{e.level}</td>
                <td className="px-3 py-2 font-bold text-amber-400">{e.pvpRating}</td>
                <td className="px-3 py-2">
                  <span className="text-green-400">{e.pvpWins}</span>
                  {" / "}
                  <span className="text-red-400">{e.pvpLosses}</span>
                </td>
                <td className={`px-3 py-2 font-semibold ${getRankColor(e.currentRank)}`}>
                  {e.currentRank}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tooltip && <HeroTooltip state={tooltip} />}
    </PageContainer>
  );
}
