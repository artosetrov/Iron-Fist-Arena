"use client";

import { useCallback, useEffect, useState } from "react";
import { GameButton, GameSection } from "@/app/components/ui";
import GameIcon from "@/app/components/ui/GameIcon";
import type { GameIconKey } from "@/app/components/ui/GameIcon";
import PageLoader from "@/app/components/PageLoader";

/* ──────────────────── Types ──────────────────── */

type GoldStats = { total: number; avg: number; max: number };
type GemsStats = { total: number; avg: number; max: number };

type TopGoldEntry = {
  characterName: string;
  class: string;
  level: number;
  gold: number;
};

type TopGemsEntry = {
  username: string;
  gems: number;
};

type EquipByRarity = {
  rarity: string;
  count: number;
};

type EquipByType = {
  itemType: string;
  count: number;
};

type EconomyData = {
  gold: GoldStats;
  gems: GemsStats;
  topGold: TopGoldEntry[];
  topGems: TopGemsEntry[];
  equipByRarity: EquipByRarity[];
  equipByType: EquipByType[];
  totalCharacters: number;
  totalUsers: number;
};

/* ──────────────────── Helpers ──────────────────── */

const classIcon = (cls: string): GameIconKey => {
  const lower = cls.toLowerCase();
  if (lower === "warrior") return "warrior";
  if (lower === "rogue") return "rogue";
  if (lower === "mage") return "mage";
  if (lower === "tank") return "tank";
  return "warrior";
};

const RARITY_BAR_COLORS: Record<string, string> = {
  common: "from-slate-500 to-slate-400",
  uncommon: "from-green-600 to-green-400",
  rare: "from-blue-600 to-blue-400",
  epic: "from-purple-600 to-purple-400",
  legendary: "from-amber-600 to-yellow-400",
};

const RARITY_TEXT_COLORS: Record<string, string> = {
  common: "text-slate-300",
  uncommon: "text-green-400",
  rare: "text-blue-400",
  epic: "text-purple-400",
  legendary: "text-amber-400",
};

const rarityBarColor = (rarity: string): string =>
  RARITY_BAR_COLORS[rarity.toLowerCase()] ?? "from-slate-500 to-slate-400";

const rarityTextColor = (rarity: string): string =>
  RARITY_TEXT_COLORS[rarity.toLowerCase()] ?? "text-slate-300";

const fmt = (n: number): string => n.toLocaleString();

/* ──────────────────── Component ──────────────────── */

const EconomyTab = () => {
  const [data, setData] = useState<EconomyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEconomy = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/economy");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: EconomyData = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load economy data");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEconomy();
  }, [fetchEconomy]);

  /* ── Initial loading ── */
  if (loading && !data) {
    return <PageLoader text="Loading economy data\u2026" />;
  }

  /* ── Error state (no cached data) ── */
  if (error && !data) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-6 py-4 text-sm text-red-400">
          {error}
        </div>
        <GameButton variant="primary" size="sm" onClick={fetchEconomy}>
          Retry
        </GameButton>
      </div>
    );
  }

  if (!data) return null;

  /* ── Derived ── */
  const maxRarityCount = Math.max(...data.equipByRarity.map((e) => e.count), 1);
  const maxTypeCount = Math.max(...data.equipByType.map((e) => e.count), 1);

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Economy Overview</h2>
        <GameButton variant="secondary" size="sm" onClick={fetchEconomy} disabled={loading}>
          {loading ? "Refreshing\u2026" : "Refresh"}
        </GameButton>
      </div>

      {/* ── Inline error on refresh ── */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {error}
          <button
            type="button"
            onClick={fetchEconomy}
            className="ml-3 text-xs font-bold text-red-300 underline hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Top Metrics (4 cards) ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard icon="gold" label="Total Gold" value={fmt(data.gold.total)} color="text-amber-400" />
        <MetricCard icon="gold" label="Avg Gold" value={fmt(Math.round(data.gold.avg))} color="text-amber-400" />
        <MetricCard icon="gems" label="Total Gems" value={fmt(data.gems.total)} color="text-purple-400" />
        <MetricCard icon="gems" label="Avg Gems" value={fmt(Math.round(data.gems.avg))} color="text-purple-400" />
      </div>

      {/* ── Server Stats (2 cards) ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/80 p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Users</span>
          <p className="mt-1 font-mono text-2xl font-bold text-slate-200">{fmt(data.totalUsers)}</p>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/80 p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Characters</span>
          <p className="mt-1 font-mono text-2xl font-bold text-slate-200">{fmt(data.totalCharacters)}</p>
        </div>
      </div>

      {/* ── Top 10 Richest Characters ── */}
      <GameSection flush>
        <div className="border-b border-slate-700/50 px-4 py-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Top 10 Richest Characters
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="w-12 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white">#</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white">Character</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white">Class</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white">Level</th>
                <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-white">
                  <span className="inline-flex items-center gap-1.5">
                    <GameIcon name="gold" size={14} />
                    Gold
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.topGold.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                    No data
                  </td>
                </tr>
              ) : (
                data.topGold.map((entry, i) => (
                  <tr
                    key={`gold-${entry.characterName}-${i}`}
                    className="border-b border-slate-700/30 bg-slate-800/40 transition hover:bg-slate-700/40"
                  >
                    <td className="px-4 py-3 text-sm font-bold text-slate-500">{i + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-300">{entry.characterName}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-sm text-slate-300">
                        <GameIcon name={classIcon(entry.class)} size={18} />
                        <span className="capitalize">{entry.class}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-slate-700/40 bg-slate-800/60 px-2.5 py-0.5 text-[10px] font-bold text-amber-400">
                        Lv. {entry.level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-bold text-amber-400">
                      {fmt(entry.gold)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GameSection>

      {/* ── Top 10 Gems Holders ── */}
      <GameSection flush>
        <div className="border-b border-slate-700/50 px-4 py-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Top 10 Gems Holders
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[400px] text-left">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="w-12 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white">#</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white">Username</th>
                <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-white">
                  <span className="inline-flex items-center gap-1.5">
                    <GameIcon name="gems" size={14} />
                    Gems
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.topGems.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-500">
                    No data
                  </td>
                </tr>
              ) : (
                data.topGems.map((entry, i) => (
                  <tr
                    key={`gems-${entry.username}-${i}`}
                    className="border-b border-slate-700/30 bg-slate-800/40 transition hover:bg-slate-700/40"
                  >
                    <td className="px-4 py-3 text-sm font-bold text-slate-500">{i + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-300">{entry.username}</td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-bold text-purple-400">
                      {fmt(entry.gems)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GameSection>

      {/* ── Equipment by Rarity ── */}
      <GameSection flush>
        <div className="border-b border-slate-700/50 px-4 py-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Equipment by Rarity
          </h3>
        </div>
        <div className="space-y-2.5 p-4">
          {data.equipByRarity.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">No data</p>
          ) : (
            data.equipByRarity.map((entry) => {
              const pct = Math.max((entry.count / maxRarityCount) * 100, 2);
              return (
                <div key={entry.rarity} className="flex items-center gap-3">
                  <span className={`w-20 shrink-0 text-right text-xs font-bold capitalize ${rarityTextColor(entry.rarity)}`}>
                    {entry.rarity}
                  </span>
                  <div className="relative flex-1">
                    <div
                      className={`h-6 rounded-full bg-gradient-to-r ${rarityBarColor(entry.rarity)} shadow-sm transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-12 shrink-0 text-right font-mono text-xs font-bold text-slate-300">
                    {fmt(entry.count)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </GameSection>

      {/* ── Equipment by Type ── */}
      <GameSection flush>
        <div className="border-b border-slate-700/50 px-4 py-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Equipment by Type
          </h3>
        </div>
        <div className="space-y-2.5 p-4">
          {data.equipByType.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">No data</p>
          ) : (
            data.equipByType.map((entry) => {
              const pct = Math.max((entry.count / maxTypeCount) * 100, 2);
              return (
                <div key={entry.itemType} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-right text-xs font-bold capitalize text-slate-400">
                    {entry.itemType}
                  </span>
                  <div className="relative flex-1">
                    <div
                      className="h-6 rounded-full bg-gradient-to-r from-sky-600 to-sky-400 shadow-sm transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-12 shrink-0 text-right font-mono text-xs font-bold text-slate-300">
                    {fmt(entry.count)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </GameSection>
    </div>
  );
};

/* ──────────────────── Sub-components ──────────────────── */

const MetricCard = ({
  icon,
  label,
  value,
  color,
}: {
  icon: GameIconKey;
  label: string;
  value: string;
  color: string;
}) => (
  <div className="rounded-xl border border-slate-700/50 bg-slate-900/80 p-4">
    <div className="mb-2 flex items-center gap-2">
      <GameIcon name={icon} size={20} />
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
    </div>
    <p className={`font-mono text-2xl font-bold ${color}`}>{value}</p>
  </div>
);

export default EconomyTab;
