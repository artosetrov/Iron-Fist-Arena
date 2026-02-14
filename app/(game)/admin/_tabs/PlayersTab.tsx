"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GameButton, GameSection } from "@/app/components/ui";
import GameBadge from "@/app/components/ui/GameBadge";
import GameModal from "@/app/components/ui/GameModal";
import GameIcon from "@/app/components/ui/GameIcon";

/* ────────────────── Types ────────────────── */

type UserCharacter = {
  id: string;
  characterName: string;
  class: string;
  level: number;
};

type AdminUser = {
  id: string;
  username: string;
  email: string;
  role: string;
  gems: number;
  isBanned: boolean;
  banReason: string | null;
  premiumUntil: string | null;
  createdAt: string;
  lastLogin: string | null;
  characters: UserCharacter[];
};

type UsersResponse = {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type FilterRole = "all" | "player" | "admin" | "banned";

/* ────────────────── Helpers ────────────────── */

const formatDate = (iso: string | null): string => {
  if (!iso) return "\u2014";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatDateTime = (iso: string | null): string => {
  if (!iso) return "Never";
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
};

const roleBadgeVariant = (role: string) => {
  switch (role) {
    case "admin":
      return "warning" as const;
    case "player":
    default:
      return "info" as const;
  }
};

const classIcon = (cls: string) => {
  const lower = cls.toLowerCase();
  if (lower === "warrior") return "warrior" as const;
  if (lower === "rogue") return "rogue" as const;
  if (lower === "mage") return "mage" as const;
  if (lower === "tank") return "tank" as const;
  return "fights" as const;
};

/* ────────────────── Component ────────────────── */

const PlayersTab = () => {
  /* ── List state ── */
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ── Filters ── */
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<FilterRole>("all");

  /* ── Modal state ── */
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  /* ── Action form state ── */
  const [banReason, setBanReason] = useState("");
  const [newRole, setNewRole] = useState("player");
  const [gemsAmount, setGemsAmount] = useState(0);

  const LIMIT = 15;

  /* ── Debounce search ── */
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

  /* ── Fetch users ── */
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (filter === "admin") params.set("role", "admin");
      if (filter === "player") params.set("role", "player");
      if (filter === "banned") params.set("banned", "true");

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: UsersResponse = await res.json();

      setUsers(data.users);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    }
    setLoading(false);
  }, [page, debouncedSearch, filter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  /* ── Filter change resets page ── */
  const handleFilterChange = useCallback((val: FilterRole) => {
    setFilter(val);
    setPage(1);
  }, []);

  /* ── Open detail modal ── */
  const openUserModal = useCallback((user: AdminUser) => {
    setSelectedUser(user);
    setBanReason(user.banReason ?? "");
    setNewRole(user.role);
    setGemsAmount(0);
    setActionError(null);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setSelectedUser(null);
  }, []);

  /* ── PATCH action helper ── */
  const patchUser = useCallback(
    async (body: Record<string, unknown>) => {
      if (!selectedUser) return;
      setActionLoading(true);
      setActionError(null);
      try {
        const res = await fetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: selectedUser.id, ...body }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? `HTTP ${res.status}`);
        }
        const { user } = await res.json();
        setSelectedUser(user);
        fetchUsers();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Action failed");
      }
      setActionLoading(false);
    },
    [selectedUser, fetchUsers],
  );

  /* ── Actions ── */
  const handleToggleBan = useCallback(() => {
    if (!selectedUser) return;
    if (selectedUser.isBanned) {
      patchUser({ isBanned: false, banReason: null });
    } else {
      patchUser({ isBanned: true, banReason: banReason || "No reason provided" });
    }
  }, [selectedUser, banReason, patchUser]);

  const handleRoleChange = useCallback(() => {
    if (!selectedUser || newRole === selectedUser.role) return;
    patchUser({ role: newRole });
  }, [selectedUser, newRole, patchUser]);

  const handleGemsAdjust = useCallback(
    (direction: "add" | "remove") => {
      if (!gemsAmount || gemsAmount <= 0) return;
      const adjust = direction === "add" ? gemsAmount : -gemsAmount;
      patchUser({ gemsAdjust: adjust });
    },
    [gemsAmount, patchUser],
  );

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
              placeholder="Search username or email..."
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

          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => handleFilterChange(e.target.value as FilterRole)}
            className="rounded-xl border border-slate-700/50 bg-slate-800/60 px-4 py-2.5 text-sm text-slate-300 outline-none transition focus:border-amber-500/50"
          >
            <option value="all">All Users</option>
            <option value="player">Players Only</option>
            <option value="admin">Admins Only</option>
            <option value="banned">Banned Only</option>
          </select>

          {/* Count */}
          <span className="shrink-0 text-xs text-slate-500">
            {total} user{total !== 1 ? "s" : ""} found
          </span>
        </div>
      </GameSection>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {error}
          <button
            type="button"
            onClick={fetchUsers}
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
                  Username
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white">
                  Email
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white">
                  Role
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white">
                  <span className="inline-flex items-center gap-1.5">
                    <GameIcon name="gems" size={14} />
                    Gems
                  </span>
                </th>
                <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-white">
                  Banned
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white">
                  Created
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white">
                  Last Login
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <span className="inline-flex items-center gap-2 text-sm text-slate-400">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-amber-400" />
                      Loading players...
                    </span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => openUserModal(user)}
                    className="cursor-pointer border-b border-slate-700/30 bg-slate-800/40 transition hover:bg-slate-700/40"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-slate-300">
                      {user.username}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      <GameBadge variant={roleBadgeVariant(user.role)} pill>
                        {user.role}
                      </GameBadge>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-300">
                      {user.gems.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block h-2.5 w-2.5 rounded-full ${
                          user.isBanned
                            ? "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.5)]"
                            : "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]"
                        }`}
                      />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {formatDate(user.lastLogin)}
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
        title={selectedUser ? `Player: ${selectedUser.username}` : "Player Details"}
      >
        {selectedUser && (
          <div className="space-y-5">
            {/* ── User Info Header ── */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold text-white">{selectedUser.username}</p>
                <p className="text-xs text-slate-400">{selectedUser.email}</p>
              </div>
              <GameBadge variant={roleBadgeVariant(selectedUser.role)} pill>
                {selectedUser.role}
              </GameBadge>
              <div className="flex items-center gap-1.5 text-sm font-mono text-slate-300">
                <GameIcon name="gems" size={16} />
                {selectedUser.gems.toLocaleString()}
              </div>
              {selectedUser.isBanned && (
                <GameBadge variant="danger" pill>
                  Banned
                </GameBadge>
              )}
              {selectedUser.premiumUntil && new Date(selectedUser.premiumUntil) > new Date() && (
                <GameBadge variant="premium" pill>
                  Premium
                </GameBadge>
              )}
            </div>

            <div className="flex flex-wrap gap-4 text-[11px] text-slate-500">
              <span>Created: {formatDateTime(selectedUser.createdAt)}</span>
              <span>Last login: {formatDateTime(selectedUser.lastLogin)}</span>
              <span className="font-mono text-slate-600">ID: {selectedUser.id}</span>
            </div>

            {/* ── Characters ── */}
            <div className="rounded-xl border border-slate-700/50 bg-slate-900/80">
              <div className="border-b border-slate-700/50 px-4 py-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Characters ({selectedUser.characters.length})
                </h4>
              </div>
              {selectedUser.characters.length === 0 ? (
                <p className="px-4 py-4 text-center text-xs text-slate-500">No characters</p>
              ) : (
                <div className="divide-y divide-slate-700/30">
                  {selectedUser.characters.map((char) => (
                    <div
                      key={char.id}
                      className="flex items-center gap-3 px-4 py-2.5"
                    >
                      <GameIcon name={classIcon(char.class)} size={20} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-300">{char.characterName}</p>
                        <p className="text-[10px] text-slate-500">{char.class}</p>
                      </div>
                      <span className="rounded-full border border-slate-700/40 bg-slate-800/60 px-2.5 py-0.5 text-[10px] font-bold text-amber-400">
                        Lv. {char.level}
                      </span>
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

            {/* ── Actions ── */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Actions</h4>

              {/* Ban / Unban */}
              <div className="rounded-xl border border-slate-700/50 bg-slate-900/80 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      selectedUser.isBanned
                        ? "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.5)]"
                        : "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]"
                    }`}
                  />
                  <span className="text-sm font-medium text-slate-300">
                    {selectedUser.isBanned ? "User is banned" : "User is active"}
                  </span>
                </div>
                {!selectedUser.isBanned && (
                  <textarea
                    placeholder="Ban reason (optional)..."
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    rows={2}
                    className="mb-3 w-full rounded-lg border border-slate-700/50 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 placeholder-slate-500 outline-none transition focus:border-amber-500/50"
                  />
                )}
                {selectedUser.isBanned && selectedUser.banReason && (
                  <p className="mb-3 text-xs text-red-400">
                    Reason: {selectedUser.banReason}
                  </p>
                )}
                <GameButton
                  variant={selectedUser.isBanned ? "action" : "danger"}
                  size="sm"
                  onClick={handleToggleBan}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Processing..." : selectedUser.isBanned ? "Unban User" : "Ban User"}
                </GameButton>
              </div>

              {/* Role Change */}
              <div className="rounded-xl border border-slate-700/50 bg-slate-900/80 p-4">
                <p className="mb-3 text-sm font-medium text-slate-300">Change Role</p>
                <div className="flex items-center gap-3">
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="rounded-lg border border-slate-700/50 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 outline-none transition focus:border-amber-500/50"
                  >
                    <option value="player">Player</option>
                    <option value="admin">Admin</option>
                  </select>
                  <GameButton
                    variant="primary"
                    size="sm"
                    onClick={handleRoleChange}
                    disabled={actionLoading || newRole === selectedUser.role}
                  >
                    {actionLoading ? "Saving..." : "Update Role"}
                  </GameButton>
                </div>
              </div>

              {/* Gems Adjustment */}
              <div className="rounded-xl border border-slate-700/50 bg-slate-900/80 p-4">
                <p className="mb-3 text-sm font-medium text-slate-300">
                  <span className="inline-flex items-center gap-1.5">
                    <GameIcon name="gems" size={16} />
                    Adjust Gems
                  </span>
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    value={gemsAmount}
                    onChange={(e) => setGemsAmount(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="Amount"
                    className="w-28 rounded-lg border border-slate-700/50 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 outline-none transition focus:border-amber-500/50"
                  />
                  <GameButton
                    variant="action"
                    size="sm"
                    onClick={() => handleGemsAdjust("add")}
                    disabled={actionLoading || gemsAmount <= 0}
                  >
                    Add
                  </GameButton>
                  <GameButton
                    variant="danger"
                    size="sm"
                    onClick={() => handleGemsAdjust("remove")}
                    disabled={actionLoading || gemsAmount <= 0}
                  >
                    Remove
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

export default PlayersTab;
