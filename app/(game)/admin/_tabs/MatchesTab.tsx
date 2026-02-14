"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GameButton, GameSection } from "@/app/components/ui";
import GameBadge from "@/app/components/ui/GameBadge";
import GameModal from "@/app/components/ui/GameModal";
import GameIcon from "@/app/components/ui/GameIcon";

/* ────────────────── Types ────────────────── */

type MatchPlayer = {
  characterName: string;
  class: string;
  level: number;
};

type CombatLogEntry = {
  turn: number;
  attacker: string;
  action: string;
  damage?: number;
  targetHp?: number;
  isCrit?: boolean;
  isDodge?: boolean;
};

type Match = {
  id: string;
  player1: MatchPlayer;
  player2: MatchPlayer;
  player1RatingBefore: number;
  player1RatingAfter: number;
  player2RatingBefore: number;
  player2RatingAfter: number;
  winnerId: string;
  loserId: string;
  turnsTaken: number;
  matchDuration: number;
  player1GoldReward: number;
  player2GoldReward: number;
  player1XpReward: number;
  player2XpReward: number;
  matchType: string;
  seasonNumber: number;
  combatLog: CombatLogEntry[] | string;
  playedAt: string;
};

type MatchesResponse = {
  matches: Match[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/* ────────────────── Helpers ────────────────── */

const formatDate = (iso: string | null): string => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatDateTime = (iso: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
};

const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
};

const classIcon = (cls: string) => {
  const lower = cls.toLowerCase();
  if (lower === "warrior") return "warrior" as const;
  if (lower === "rogue") return "rogue" as const;
  if (lower === "mage") return "mage" as const;
  if (lower === "tank") return "tank" as const;
  return "fights" as const;
};

const ratingDelta = (before: number, after: number): number => after - before;

const parseCombatLog = (log: CombatLogEntry[] | string): CombatLogEntry[] => {
  if (Array.isArray(log)) return log;
  try {
    return JSON.parse(log) as CombatLogEntry[];
  } catch {
    return [];
  }
};

/* ────────────────── Component ────────────────── */

const MatchesTab = () => {
  /* ── List state ── */
  const [matches, setMatches] = useState<Match[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ── Search ── */
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  /* ── Modal ── */
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const LIMIT = 20;

  /* ── Debounce search (300ms) ── */
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  /* ── Fetch matches ── */
  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
      });
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/admin/matches?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: MatchesResponse = await res.json();

      setMatches(data.matches);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load matches");
    }
    setLoading(false);
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  /* ── Modal handlers ── */
  const openMatchModal = useCallback((match: Match) => {
    setSelectedMatch(match);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setSelectedMatch(null);
  }, []);

  /* ────────────────── Render ────────────────── */

  return (
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <GameSection flush>
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by player name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-700/50 bg-slate-800/60 px-4 py-2.5 text-sm text-slate-300 placeholder-slate-500 outline-none transition focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Count */}
          <span className="shrink-0 text-xs text-slate-500">
            {total} match{total !== 1 ? "es" : ""} found
          </span>
        </div>
      </GameSection>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {error}
          <button
            type="button"
            onClick={fetchMatches}
            className="ml-3 text-xs font-bold text-red-300 underline hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Table ── */}
      <GameSection flush>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white">
                  Date
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white">
                  Player 1
                </th>
                <th className="px-2 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  vs
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white">
                  Player 2
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white">
                  Winner
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white">
                  Rating Δ
                </th>
                <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-white">
                  Turns
                </th>
                <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-white">
                  Season
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && matches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <span className="inline-flex items-center gap-2 text-sm text-slate-400">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-amber-400" />
                      Loading matches...
                    </span>
                  </td>
                </tr>
              ) : matches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-500">
                    No matches found
                  </td>
                </tr>
              ) : (
                matches.map((match) => {
                  const p1Delta = ratingDelta(match.player1RatingBefore, match.player1RatingAfter);
                  const p2Delta = ratingDelta(match.player2RatingBefore, match.player2RatingAfter);
                  const p1IsWinner = match.winnerId !== match.loserId && p1Delta >= 0;
                  const p2IsWinner = !p1IsWinner;
                  const winnerName = p1IsWinner
                    ? match.player1.characterName
                    : match.player2.characterName;

                  return (
                    <tr
                      key={match.id}
                      onClick={() => openMatchModal(match)}
                      className="cursor-pointer border-b border-slate-700/30 bg-slate-800/40 transition hover:bg-slate-700/40"
                    >
                      {/* Date */}
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {formatDate(match.playedAt)}
                      </td>

                      {/* Player 1 */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <GameIcon name={classIcon(match.player1.class)} size={18} />
                          <div className="min-w-0">
                            <p className={`truncate text-sm font-medium ${p1IsWinner ? "text-amber-400 font-bold" : "text-slate-400"}`}>
                              {match.player1.characterName}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {match.player1.class} Lv.{match.player1.level}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* vs */}
                      <td className="px-2 py-3 text-center text-xs text-slate-600">
                        vs
                      </td>

                      {/* Player 2 */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <GameIcon name={classIcon(match.player2.class)} size={18} />
                          <div className="min-w-0">
                            <p className={`truncate text-sm font-medium ${p2IsWinner ? "text-amber-400 font-bold" : "text-slate-400"}`}>
                              {match.player2.characterName}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {match.player2.class} Lv.{match.player2.level}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Winner */}
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-amber-400">
                          {winnerName}
                        </span>
                      </td>

                      {/* Rating Delta */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5 text-xs font-mono">
                          <span className={p1Delta >= 0 ? "text-emerald-400" : "text-red-400"}>
                            P1: {p1Delta > 0 ? "+" : ""}{p1Delta}
                          </span>
                          <span className={p2Delta >= 0 ? "text-emerald-400" : "text-red-400"}>
                            P2: {p2Delta > 0 ? "+" : ""}{p2Delta}
                          </span>
                        </div>
                      </td>

                      {/* Turns */}
                      <td className="px-4 py-3 text-center text-sm text-slate-300">
                        {match.turnsTaken}
                      </td>

                      {/* Season */}
                      <td className="px-4 py-3 text-center">
                        <GameBadge variant="info" pill>
                          S{match.seasonNumber}
                        </GameBadge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-700/50 px-4 py-3">
            <GameButton
              variant="secondary"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </GameButton>
            <span className="text-xs text-slate-500">
              Page {page} of {totalPages}
            </span>
            <GameButton
              variant="secondary"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </GameButton>
          </div>
        )}
      </GameSection>

      {/* ────────────────── Detail Modal ────────────────── */}
      <GameModal
        open={modalOpen}
        onClose={closeModal}
        size="lg"
        title="Match Details"
        className="!max-w-3xl"
      >
        {selectedMatch && (
          <MatchDetailContent match={selectedMatch} />
        )}
      </GameModal>
    </div>
  );
};

/* ────────────────── Match Detail (modal body) ────────────────── */

const MatchDetailContent = ({ match }: { match: Match }) => {
  const p1Delta = ratingDelta(match.player1RatingBefore, match.player1RatingAfter);
  const p2Delta = ratingDelta(match.player2RatingBefore, match.player2RatingAfter);
  const combatLog = parseCombatLog(match.combatLog);

  return (
    <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
      {/* ── Match Header ── */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <GameIcon name={classIcon(match.player1.class)} size={22} />
            <span className="text-lg font-bold text-white">
              {match.player1.characterName}
            </span>
            <span className="text-xs text-slate-500">
              Lv.{match.player1.level}
            </span>
          </div>
          <span className="text-sm font-bold text-slate-600">vs</span>
          <div className="flex items-center gap-2">
            <GameIcon name={classIcon(match.player2.class)} size={22} />
            <span className="text-lg font-bold text-white">
              {match.player2.characterName}
            </span>
            <span className="text-xs text-slate-500">
              Lv.{match.player2.level}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-500">
          <span>{formatDateTime(match.playedAt)}</span>
          <span>•</span>
          <span>{match.matchType}</span>
          <span>•</span>
          <GameBadge variant="info" pill>Season {match.seasonNumber}</GameBadge>
          <span>•</span>
          <span>{match.turnsTaken} turns</span>
          <span>•</span>
          <span>{formatDuration(match.matchDuration)}</span>
        </div>
      </div>

      {/* ── Rating Changes ── */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/80">
        <div className="border-b border-slate-700/50 px-4 py-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white">
            <span className="inline-flex items-center gap-1.5">
              <GameIcon name="pvp-rating" size={14} />
              Rating Changes
            </span>
          </h4>
        </div>
        <div className="grid grid-cols-2 divide-x divide-slate-700/30">
          {/* Player 1 */}
          <div className="px-4 py-3">
            <p className="mb-1 text-xs font-medium text-slate-400">{match.player1.characterName}</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-slate-500">{match.player1RatingBefore}</span>
              <span className="text-slate-600">→</span>
              <span className="text-sm font-mono text-white">{match.player1RatingAfter}</span>
              <span className={`text-sm font-bold font-mono ${p1Delta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                ({p1Delta > 0 ? "+" : ""}{p1Delta})
              </span>
            </div>
          </div>
          {/* Player 2 */}
          <div className="px-4 py-3">
            <p className="mb-1 text-xs font-medium text-slate-400">{match.player2.characterName}</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-slate-500">{match.player2RatingBefore}</span>
              <span className="text-slate-600">→</span>
              <span className="text-sm font-mono text-white">{match.player2RatingAfter}</span>
              <span className={`text-sm font-bold font-mono ${p2Delta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                ({p2Delta > 0 ? "+" : ""}{p2Delta})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Rewards ── */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/80">
        <div className="border-b border-slate-700/50 px-4 py-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white">Rewards</h4>
        </div>
        <div className="grid grid-cols-2 divide-x divide-slate-700/30">
          {/* Player 1 */}
          <div className="px-4 py-3">
            <p className="mb-2 text-xs font-medium text-slate-400">{match.player1.characterName}</p>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 text-sm font-mono text-amber-300">
                <GameIcon name="gold" size={14} />
                {match.player1GoldReward.toLocaleString()}
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm font-mono text-blue-300">
                <GameIcon name="xp" size={14} />
                {match.player1XpReward.toLocaleString()}
              </span>
            </div>
          </div>
          {/* Player 2 */}
          <div className="px-4 py-3">
            <p className="mb-2 text-xs font-medium text-slate-400">{match.player2.characterName}</p>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 text-sm font-mono text-amber-300">
                <GameIcon name="gold" size={14} />
                {match.player2GoldReward.toLocaleString()}
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm font-mono text-blue-300">
                <GameIcon name="xp" size={14} />
                {match.player2XpReward.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Combat Log ── */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/80">
        <div className="border-b border-slate-700/50 px-4 py-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white">
            <span className="inline-flex items-center gap-1.5">
              <GameIcon name="fights" size={14} />
              Combat Log ({combatLog.length} entries)
            </span>
          </h4>
        </div>

        {combatLog.length === 0 ? (
          <p className="px-4 py-4 text-center text-xs text-slate-500">
            No combat log available
          </p>
        ) : (
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-700/20">
            {combatLog.map((entry, idx) => (
              <div
                key={idx}
                className={`flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-sm ${
                  idx % 2 === 0 ? "bg-slate-800/30" : "bg-slate-800/60"
                }`}
              >
                {/* Turn number */}
                <span className="w-10 shrink-0 text-[11px] font-bold text-slate-500">
                  T{entry.turn}
                </span>

                {/* Attacker */}
                <span className="font-medium text-white">
                  {entry.attacker}
                </span>

                {/* Action */}
                <span className="text-slate-400">
                  {entry.action}
                </span>

                {/* Damage */}
                {entry.damage != null && (
                  <span className="font-mono text-red-400">
                    -{entry.damage}
                  </span>
                )}

                {/* Target HP */}
                {entry.targetHp != null && (
                  <span className="text-[11px] text-slate-500">
                    ({entry.targetHp} HP left)
                  </span>
                )}

                {/* Crit badge */}
                {entry.isCrit && (
                  <GameBadge variant="warning" pill>
                    CRIT
                  </GameBadge>
                )}

                {/* Dodge badge */}
                {entry.isDodge && (
                  <GameBadge variant="info" pill>
                    DODGE
                  </GameBadge>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchesTab;
