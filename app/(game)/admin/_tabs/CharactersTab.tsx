"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GameButton, GameSection } from "@/app/components/ui";
import GameBadge from "@/app/components/ui/GameBadge";
import GameModal from "@/app/components/ui/GameModal";
import GameIcon from "@/app/components/ui/GameIcon";
import type { GameIconKey } from "@/app/components/ui/GameIcon";

/* ────────────────── Types ────────────────── */

type EquipmentItem = {
  id: string;
  equippedSlot: string;
  upgradeLevel: number;
  item: {
    itemName: string;
    rarity: string;
    itemType: string;
  };
};

type CharacterOwner = {
  id: string;
  username: string;
  email: string;
};

type AdminCharacter = {
  id: string;
  characterName: string;
  class: string;
  origin: string;
  level: number;
  currentXp: number;
  gold: number;
  statPointsAvailable: number;
  strength: number;
  agility: number;
  vitality: number;
  endurance: number;
  intelligence: number;
  wisdom: number;
  luck: number;
  charisma: number;
  maxHp: number;
  currentHp: number;
  armor: number;
  magicResist: number;
  currentStamina: number;
  maxStamina: number;
  pvpRating: number;
  pvpWins: number;
  pvpLosses: number;
  pvpWinStreak: number;
  highestPvpRank: string;
  createdAt: string;
  lastPlayed: string | null;
  user: CharacterOwner;
  equipment: EquipmentItem[];
};

type CharactersResponse = {
  characters: AdminCharacter[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type ClassFilter = "all" | "Warrior" | "Rogue" | "Mage" | "Tank";

/* ────────────────── Helpers ────────────────── */

const formatDate = (iso: string | null): string => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const classIcon = (cls: string): GameIconKey => {
  const lower = cls.toLowerCase();
  if (lower === "warrior") return "warrior";
  if (lower === "rogue") return "rogue";
  if (lower === "mage") return "mage";
  if (lower === "tank") return "tank";
  return "warrior";
};

const RARITY_COLORS: Record<string, string> = {
  common: "text-slate-300",
  uncommon: "text-green-400",
  rare: "text-blue-400",
  epic: "text-purple-400",
  legendary: "text-amber-400",
};

const rarityColor = (rarity: string): string =>
  RARITY_COLORS[rarity.toLowerCase()] ?? "text-slate-300";

const SLOT_ICONS: Record<string, GameIconKey> = {
  helmet: "helmet",
  weapon: "weapon",
  "weapon-offhand": "weapon",
  chest: "chest",
  gloves: "gloves",
  boots: "boots",
  legs: "legs",
  ring: "ring",
  accessory: "accessory",
  amulet: "amulet",
  belt: "belt",
  relic: "relic",
};

const slotIcon = (slot: string): GameIconKey =>
  SLOT_ICONS[slot.toLowerCase()] ?? "weapon";

const STAT_DEFS: { key: keyof AdminCharacter; label: string; icon: GameIconKey }[] = [
  { key: "strength", label: "STR", icon: "strength" },
  { key: "agility", label: "AGI", icon: "agility" },
  { key: "vitality", label: "VIT", icon: "vitality" },
  { key: "endurance", label: "END", icon: "endurance" },
  { key: "intelligence", label: "INT", icon: "intelligence" },
  { key: "wisdom", label: "WIS", icon: "wisdom" },
  { key: "luck", label: "LCK", icon: "luck" },
  { key: "charisma", label: "CHA", icon: "charisma" },
];

/* ────────────────── Component ────────────────── */

const CharactersTab = () => {
  /* ── List state ── */
  const [characters, setCharacters] = useState<AdminCharacter[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ── Filters ── */
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [classFilter, setClassFilter] = useState<ClassFilter>("all");

  /* ── Modal state ── */
  const [selectedChar, setSelectedChar] = useState<AdminCharacter | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  /* ── Action form state ── */
  const [goldAmount, setGoldAmount] = useState(0);
  const [levelValue, setLevelValue] = useState(1);

  const LIMIT = 15;

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

  /* ── Fetch characters ── */
  const fetchCharacters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (classFilter !== "all") params.set("class", classFilter);

      const res = await fetch(`/api/admin/characters?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: CharactersResponse = await res.json();

      setCharacters(data.characters);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load characters");
    }
    setLoading(false);
  }, [page, debouncedSearch, classFilter]);

  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  /* ── Filter change resets page ── */
  const handleClassFilterChange = useCallback((val: ClassFilter) => {
    setClassFilter(val);
    setPage(1);
  }, []);

  /* ── Open detail modal ── */
  const openCharModal = useCallback((char: AdminCharacter) => {
    setSelectedChar(char);
    setGoldAmount(0);
    setLevelValue(char.level);
    setActionError(null);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setSelectedChar(null);
  }, []);

  /* ── PATCH action helper ── */
  const patchCharacter = useCallback(
    async (body: Record<string, unknown>) => {
      if (!selectedChar) return;
      setActionLoading(true);
      setActionError(null);
      try {
        const res = await fetch("/api/admin/characters", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ characterId: selectedChar.id, ...body }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? `HTTP ${res.status}`);
        }
        const { character } = await res.json();
        setSelectedChar(character);
        fetchCharacters();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Action failed");
      }
      setActionLoading(false);
    },
    [selectedChar, fetchCharacters],
  );

  /* ── Actions ── */
  const handleAddGold = useCallback(() => {
    if (!goldAmount || goldAmount <= 0) return;
    patchCharacter({ gold: (selectedChar?.gold ?? 0) + goldAmount });
  }, [goldAmount, selectedChar, patchCharacter]);

  const handleSetLevel = useCallback(() => {
    if (!levelValue || levelValue < 1) return;
    patchCharacter({ level: levelValue, currentXp: 0 });
  }, [levelValue, patchCharacter]);

  const handleResetStamina = useCallback(() => {
    if (!selectedChar) return;
    patchCharacter({ currentStamina: selectedChar.maxStamina });
  }, [selectedChar, patchCharacter]);

  const handleResetPvpRating = useCallback(() => {
    patchCharacter({ pvpRating: 0 });
  }, [patchCharacter]);

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
              placeholder="Search character name..."
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

          {/* Class Filter */}
          <select
            value={classFilter}
            onChange={(e) => handleClassFilterChange(e.target.value as ClassFilter)}
            className="rounded-xl border border-slate-700/50 bg-slate-800/60 px-4 py-2.5 text-sm text-slate-300 outline-none transition focus:border-amber-500/50"
          >
            <option value="all">All Classes</option>
            <option value="Warrior">Warrior</option>
            <option value="Rogue">Rogue</option>
            <option value="Mage">Mage</option>
            <option value="Tank">Tank</option>
          </select>

          {/* Count */}
          <span className="shrink-0 text-xs text-slate-500">
            {total} character{total !== 1 ? "s" : ""} found
          </span>
        </div>
      </GameSection>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {error}
          <button
            type="button"
            onClick={fetchCharacters}
            className="ml-3 text-xs font-bold text-red-300 underline hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Table ── */}
      <GameSection flush>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white">
                  Name
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white">
                  Class
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white">
                  Origin
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white">
                  Level
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white">
                  <span className="inline-flex items-center gap-1.5">
                    <GameIcon name="gold" size={14} />
                    Gold
                  </span>
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white">
                  <span className="inline-flex items-center gap-1.5">
                    <GameIcon name="pvp-rating" size={14} />
                    PvP Rating
                  </span>
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white">
                  Owner
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && characters.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <span className="inline-flex items-center gap-2 text-sm text-slate-400">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-amber-400" />
                      Loading characters...
                    </span>
                  </td>
                </tr>
              ) : characters.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">
                    No characters found
                  </td>
                </tr>
              ) : (
                characters.map((char) => (
                  <tr
                    key={char.id}
                    onClick={() => openCharModal(char)}
                    className="cursor-pointer border-b border-slate-700/30 bg-slate-800/40 transition hover:bg-slate-700/40"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-slate-300">
                      {char.characterName}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-sm text-slate-300">
                        <GameIcon name={classIcon(char.class)} size={18} />
                        {char.class}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {char.origin}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-slate-700/40 bg-slate-800/60 px-2.5 py-0.5 text-[10px] font-bold text-amber-400">
                        Lv. {char.level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-300">
                      {char.gold.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-300">
                      {char.pvpRating.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {char.user.username}
                    </td>
                  </tr>
                ))
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
        title={selectedChar ? `Character: ${selectedChar.characterName}` : "Character Details"}
      >
        {selectedChar && (
          <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
            {/* ── Header ── */}
            <div className="flex flex-wrap items-center gap-3">
              <GameIcon name={classIcon(selectedChar.class)} size={28} />
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold text-white">{selectedChar.characterName}</p>
                <p className="text-xs text-slate-400">
                  Created {formatDate(selectedChar.createdAt)}
                  {selectedChar.lastPlayed && ` · Last played ${formatDate(selectedChar.lastPlayed)}`}
                </p>
              </div>
              <GameBadge variant="warning" pill>
                Lv. {selectedChar.level}
              </GameBadge>
              <GameBadge variant="info" pill>
                {selectedChar.class}
              </GameBadge>
              <GameBadge variant="default" pill>
                {selectedChar.origin}
              </GameBadge>
            </div>

            {/* ── Owner ── */}
            <div className="rounded-xl border border-slate-700/50 bg-slate-900/80 p-4">
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-white">Owner</h4>
              <div className="flex items-center gap-4 text-sm text-slate-300">
                <span className="font-medium">{selectedChar.user.username}</span>
                <span className="text-xs text-slate-500">{selectedChar.user.email}</span>
                <span className="ml-auto font-mono text-[10px] text-slate-600">{selectedChar.user.id}</span>
              </div>
            </div>

            {/* ── Stats Grid ── */}
            <div className="rounded-xl border border-slate-700/50 bg-slate-900/80">
              <div className="border-b border-slate-700/50 px-4 py-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">Stats</h4>
              </div>
              <div className="grid grid-cols-2 gap-px bg-slate-700/20 p-px">
                {STAT_DEFS.map(({ key, label, icon }) => (
                  <div
                    key={key}
                    className="flex items-center gap-2.5 bg-slate-900/80 px-4 py-2.5"
                  >
                    <GameIcon name={icon} size={18} />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      {label}
                    </span>
                    <span className="ml-auto font-mono text-sm font-bold text-slate-200">
                      {selectedChar[key] as number}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Resources Row ── */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {/* Gold */}
              <div className="rounded-xl border border-slate-700/50 bg-slate-900/80 p-3 text-center">
                <div className="mb-1 flex items-center justify-center gap-1.5">
                  <GameIcon name="gold" size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Gold</span>
                </div>
                <p className="font-mono text-sm font-bold text-amber-400">
                  {selectedChar.gold.toLocaleString()}
                </p>
              </div>
              {/* Stamina */}
              <div className="rounded-xl border border-slate-700/50 bg-slate-900/80 p-3 text-center">
                <div className="mb-1 flex items-center justify-center gap-1.5">
                  <GameIcon name="stamina" size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Stamina</span>
                </div>
                <p className="font-mono text-sm font-bold text-emerald-400">
                  {selectedChar.currentStamina}/{selectedChar.maxStamina}
                </p>
              </div>
              {/* PvP Rating */}
              <div className="rounded-xl border border-slate-700/50 bg-slate-900/80 p-3 text-center">
                <div className="mb-1 flex items-center justify-center gap-1.5">
                  <GameIcon name="pvp-rating" size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">PvP Rating</span>
                </div>
                <p className="font-mono text-sm font-bold text-blue-400">
                  {selectedChar.pvpRating.toLocaleString()}
                </p>
              </div>
              {/* Stat Points */}
              <div className="rounded-xl border border-slate-700/50 bg-slate-900/80 p-3 text-center">
                <div className="mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Stat Points</span>
                </div>
                <p className="font-mono text-sm font-bold text-purple-400">
                  {selectedChar.statPointsAvailable}
                </p>
              </div>
            </div>

            {/* ── PvP Stats ── */}
            <div className="rounded-xl border border-slate-700/50 bg-slate-900/80">
              <div className="border-b border-slate-700/50 px-4 py-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">PvP Stats</h4>
              </div>
              <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Wins</p>
                  <p className="font-mono text-sm font-bold text-emerald-400">{selectedChar.pvpWins}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Losses</p>
                  <p className="font-mono text-sm font-bold text-red-400">{selectedChar.pvpLosses}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Win Streak</p>
                  <p className="font-mono text-sm font-bold text-amber-400">{selectedChar.pvpWinStreak}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Highest Rank</p>
                  <p className="text-sm font-bold text-slate-300">{selectedChar.highestPvpRank || "—"}</p>
                </div>
              </div>
            </div>

            {/* ── Equipment ── */}
            <div className="rounded-xl border border-slate-700/50 bg-slate-900/80">
              <div className="border-b border-slate-700/50 px-4 py-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Equipment ({selectedChar.equipment.length})
                </h4>
              </div>
              {selectedChar.equipment.length === 0 ? (
                <p className="px-4 py-4 text-center text-xs text-slate-500">No equipment</p>
              ) : (
                <div className="divide-y divide-slate-700/30">
                  {selectedChar.equipment.map((eq) => (
                    <div
                      key={eq.id}
                      className="flex items-center gap-3 px-4 py-2.5"
                    >
                      <GameIcon name={slotIcon(eq.equippedSlot)} size={20} />
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium ${rarityColor(eq.item.rarity)}`}>
                          {eq.item.itemName}
                        </p>
                        <p className="text-[10px] text-slate-500 capitalize">
                          {eq.equippedSlot} · {eq.item.rarity}
                        </p>
                      </div>
                      {eq.upgradeLevel > 0 && (
                        <span className="rounded-full border border-amber-500/40 bg-amber-900/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                          +{eq.upgradeLevel}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Action Error ── */}
            {actionError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-400">
                {actionError}
              </div>
            )}

            {/* ── Quick Actions ── */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Quick Actions</h4>

              {/* Add Gold */}
              <div className="rounded-xl border border-slate-700/50 bg-slate-900/80 p-4">
                <p className="mb-3 text-sm font-medium text-slate-300">
                  <span className="inline-flex items-center gap-1.5">
                    <GameIcon name="gold" size={16} />
                    Add Gold
                  </span>
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    value={goldAmount}
                    onChange={(e) => setGoldAmount(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="Amount"
                    className="w-28 rounded-lg border border-slate-700/50 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 outline-none transition focus:border-amber-500/50"
                  />
                  <GameButton
                    variant="action"
                    size="sm"
                    onClick={handleAddGold}
                    disabled={actionLoading || goldAmount <= 0}
                  >
                    {actionLoading ? "Saving..." : "Add Gold"}
                  </GameButton>
                </div>
              </div>

              {/* Set Level */}
              <div className="rounded-xl border border-slate-700/50 bg-slate-900/80 p-4">
                <p className="mb-3 text-sm font-medium text-slate-300">Set Level</p>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    value={levelValue}
                    onChange={(e) => setLevelValue(Math.max(1, parseInt(e.target.value) || 1))}
                    placeholder="Level"
                    className="w-28 rounded-lg border border-slate-700/50 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 outline-none transition focus:border-amber-500/50"
                  />
                  <GameButton
                    variant="primary"
                    size="sm"
                    onClick={handleSetLevel}
                    disabled={actionLoading || levelValue < 1}
                  >
                    {actionLoading ? "Saving..." : "Set Level"}
                  </GameButton>
                </div>
              </div>

              {/* Reset Actions Row */}
              <div className="flex flex-wrap gap-3">
                <div className="flex-1 rounded-xl border border-slate-700/50 bg-slate-900/80 p-4">
                  <p className="mb-3 text-sm font-medium text-slate-300">
                    <span className="inline-flex items-center gap-1.5">
                      <GameIcon name="stamina" size={16} />
                      Reset Stamina
                    </span>
                  </p>
                  <p className="mb-3 text-[10px] text-slate-500">
                    Set stamina to {selectedChar.maxStamina}/{selectedChar.maxStamina}
                  </p>
                  <GameButton
                    variant="action"
                    size="sm"
                    onClick={handleResetStamina}
                    disabled={actionLoading || selectedChar.currentStamina === selectedChar.maxStamina}
                  >
                    {actionLoading ? "Saving..." : "Reset Stamina"}
                  </GameButton>
                </div>
                <div className="flex-1 rounded-xl border border-slate-700/50 bg-slate-900/80 p-4">
                  <p className="mb-3 text-sm font-medium text-slate-300">
                    <span className="inline-flex items-center gap-1.5">
                      <GameIcon name="pvp-rating" size={16} />
                      Reset PvP Rating
                    </span>
                  </p>
                  <p className="mb-3 text-[10px] text-slate-500">
                    Set PvP rating to 0
                  </p>
                  <GameButton
                    variant="danger"
                    size="sm"
                    onClick={handleResetPvpRating}
                    disabled={actionLoading || selectedChar.pvpRating === 0}
                  >
                    {actionLoading ? "Saving..." : "Reset PvP Rating"}
                  </GameButton>
                </div>
              </div>
            </div>
          </div>
        )}
      </GameModal>
    </div>
  );
};

export default CharactersTab;
