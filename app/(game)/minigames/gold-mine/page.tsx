"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import PageLoader from "@/app/components/PageLoader";
import useCharacterAvatar from "@/app/hooks/useCharacterAvatar";
import {
  GOLD_MINE_BOOST_COST_GEMS,
  GOLD_MINE_SLOT_COST_GEMS,
  GOLD_MINE_MAX_SLOTS,
  GOLD_MINE_FREE_SLOTS,
} from "@/lib/game/balance";

/* ────────────────── Types ────────────────── */

type MineSession = {
  id: string;
  slotIndex: number;
  startedAt: string;
  endsAt: string;
  reward: number;
  boosted: boolean;
  ready: boolean;
};

type MineState = {
  sessions: MineSession[];
  maxSlots: number;
  purchasedSlots: number;
  gold: number;
  gems: number;
  level: number;
  isVip: boolean;
  loading: boolean;
  actionLoading: number | null; // slotIndex that is loading
  error: string | null;
};

/* ────────────────── Helpers ────────────────── */

const formatTimeLeft = (endsAt: string): string => {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return "Ready!";
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
};

const getProgress = (startedAt: string, endsAt: string): number => {
  const start = new Date(startedAt).getTime();
  const end = new Date(endsAt).getTime();
  const now = Date.now();
  if (now >= end) return 100;
  const total = end - start;
  if (total <= 0) return 100;
  return Math.min(100, Math.max(0, ((now - start) / total) * 100));
};

/* ────────────────── Initial State ────────────────── */

const INITIAL_STATE: MineState = {
  sessions: [],
  maxSlots: 1,
  purchasedSlots: 0,
  gold: 0,
  gems: 0,
  level: 1,
  isVip: false,
  loading: true,
  actionLoading: null,
  error: null,
};

/* ────────────────── Gold Mine Content ────────────────── */

const GoldMineContent = () => {
  const searchParams = useSearchParams();
  const characterId = searchParams.get("characterId");
  const avatarSrc = useCharacterAvatar(characterId);

  const [state, setState] = useState<MineState>(INITIAL_STATE);
  const [, setTick] = useState(0); // force re-render for countdown
  const tickRef = useRef<NodeJS.Timeout | null>(null);

  /* ── Fetch status ── */
  const fetchStatus = useCallback(async () => {
    if (!characterId) return;
    try {
      const res = await fetch(`/api/minigames/gold-mine?characterId=${characterId}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setState((s) => ({ ...s, loading: false, error: data.error ?? "Failed to load" }));
        return;
      }
      const data = await res.json();
      setState((s) => ({
        ...s,
        sessions: data.sessions,
        maxSlots: data.maxSlots,
        purchasedSlots: data.purchasedSlots,
        gold: data.gold,
        gems: data.gems,
        level: data.level,
        isVip: data.isVip,
        loading: false,
        error: null,
      }));
    } catch {
      setState((s) => ({ ...s, loading: false, error: "Network error" }));
    }
  }, [characterId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  /* ── Countdown ticker ── */
  useEffect(() => {
    const hasActive = state.sessions.some((s) => !s.ready);
    if (hasActive) {
      tickRef.current = setInterval(() => {
        setTick((t) => t + 1);
        // Check if any session just became ready
        setState((prev) => ({
          ...prev,
          sessions: prev.sessions.map((s) => ({
            ...s,
            ready: Date.now() >= new Date(s.endsAt).getTime(),
          })),
        }));
      }, 1000);
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [state.sessions]);

  /* ── Start mining ── */
  const handleStartMining = useCallback(async () => {
    if (!characterId || state.actionLoading !== null) return;
    setState((s) => ({ ...s, actionLoading: -1, error: null }));

    try {
      const res = await fetch("/api/minigames/gold-mine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setState((s) => ({ ...s, actionLoading: null, error: data.error ?? "Failed to start" }));
        return;
      }

      setState((s) => ({
        ...s,
        actionLoading: null,
        sessions: [...s.sessions, { ...data, boosted: false }],
      }));
    } catch {
      setState((s) => ({ ...s, actionLoading: null, error: "Network error" }));
    }
  }, [characterId, state.actionLoading]);

  /* ── Collect reward ── */
  const handleCollect = useCallback(
    async (sessionId: string, slotIndex: number) => {
      if (!characterId || state.actionLoading !== null) return;
      setState((s) => ({ ...s, actionLoading: slotIndex, error: null }));

      try {
        const res = await fetch("/api/minigames/gold-mine/collect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ characterId, sessionId }),
        });
        const data = await res.json();

        if (!res.ok) {
          setState((s) => ({ ...s, actionLoading: null, error: data.error ?? "Failed to collect" }));
          return;
        }

        setState((s) => ({
          ...s,
          actionLoading: null,
          gold: data.gold,
          sessions: s.sessions.filter((sess) => sess.id !== sessionId),
        }));

        window.dispatchEvent(new Event("character-updated"));
      } catch {
        setState((s) => ({ ...s, actionLoading: null, error: "Network error" }));
      }
    },
    [characterId, state.actionLoading],
  );

  /* ── Boost ── */
  const handleBoost = useCallback(
    async (sessionId: string, slotIndex: number) => {
      if (!characterId || state.actionLoading !== null) return;
      setState((s) => ({ ...s, actionLoading: slotIndex, error: null }));

      try {
        const res = await fetch("/api/minigames/gold-mine/boost", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ characterId, sessionId }),
        });
        const data = await res.json();

        if (!res.ok) {
          setState((s) => ({ ...s, actionLoading: null, error: data.error ?? "Failed to boost" }));
          return;
        }

        setState((s) => ({
          ...s,
          actionLoading: null,
          gems: data.gemsRemaining,
          sessions: s.sessions.map((sess) =>
            sess.id === sessionId
              ? { ...sess, endsAt: new Date().toISOString(), boosted: true, ready: true }
              : sess,
          ),
        }));
      } catch {
        setState((s) => ({ ...s, actionLoading: null, error: "Network error" }));
      }
    },
    [characterId, state.actionLoading],
  );

  /* ── Buy slot ── */
  const handleBuySlot = useCallback(async () => {
    if (!characterId || state.actionLoading !== null) return;
    setState((s) => ({ ...s, actionLoading: -2, error: null }));

    try {
      const res = await fetch("/api/minigames/gold-mine/buy-slot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setState((s) => ({ ...s, actionLoading: null, error: data.error ?? "Failed to buy slot" }));
        return;
      }

      setState((s) => ({
        ...s,
        actionLoading: null,
        purchasedSlots: data.purchasedSlots,
        maxSlots: data.maxSlots,
        gems: data.gemsRemaining,
      }));
    } catch {
      setState((s) => ({ ...s, actionLoading: null, error: "Network error" }));
    }
  }, [characterId, state.actionLoading]);

  /* ── Render ── */
  if (state.loading) {
    return <PageLoader emoji="⛏️" text="Loading Gold Mine..." avatarSrc={avatarSrc} />;
  }

  const sessionsBySlot = new Map<number, MineSession>();
  for (const s of state.sessions) {
    sessionsBySlot.set(s.slotIndex, s);
  }

  const canBuyMoreSlots = state.purchasedSlots < GOLD_MINE_MAX_SLOTS - GOLD_MINE_FREE_SLOTS;
  const hasEmptySlot = state.sessions.length < state.maxSlots;

  return (
    <div className="relative flex min-h-full flex-col items-center px-4 py-8">
      <Link
        href="/hub"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/80 text-slate-400 transition hover:bg-slate-700 hover:text-white"
        aria-label="Back to Hub"
        tabIndex={0}
      >
        ✕
      </Link>
      {/* Header */}
      <div className="mb-2 flex items-center gap-3">
        <Link
          href={`/minigames${characterId ? `?characterId=${characterId}` : ""}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-400 transition hover:border-slate-600 hover:text-white"
          aria-label="Back to Minigames"
          tabIndex={0}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-white sm:text-4xl">
          Gold Mine
        </h1>
      </div>

      {/* Resources */}
      <div className="mb-6 flex items-center gap-4 text-sm font-medium">
        <span className="text-yellow-400">🪙 {state.gold.toLocaleString()}</span>
        <span className="text-purple-400">💎 {state.gems.toLocaleString()}</span>
        <span className="text-slate-400">Lv.{state.level}</span>
        {state.isVip && (
          <span className="rounded-full border border-amber-500/40 bg-amber-900/30 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-300">
            VIP
          </span>
        )}
      </div>

      {/* Error */}
      {state.error && (
        <div className="mb-4 max-w-md rounded-lg border border-red-500/30 bg-red-900/20 px-4 py-2 text-center text-sm text-red-400">
          {state.error}
        </div>
      )}

      {/* Slots grid */}
      <div className="mb-6 grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: state.maxSlots }, (_, i) => {
          const session = sessionsBySlot.get(i);
          const isActionLoading = state.actionLoading === i;

          return (
            <div
              key={i}
              className="relative flex flex-col items-center gap-3 rounded-2xl border border-slate-700/60 bg-gradient-to-b from-slate-800/80 to-slate-900/80 p-5 transition-all"
            >
              {/* Slot label */}
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Slot {i + 1}
              </span>

              {!session ? (
                /* ── Empty slot ── */
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-slate-700 text-3xl text-slate-600">
                    ⛏️
                  </div>
                  <p className="text-xs text-slate-500">Ready to mine</p>
                  <button
                    type="button"
                    onClick={handleStartMining}
                    disabled={state.actionLoading !== null}
                    className="w-full rounded-xl border border-emerald-500/40 bg-gradient-to-b from-emerald-600 to-emerald-700 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-emerald-900/30 transition hover:from-emerald-500 hover:to-emerald-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={`Start mining in slot ${i + 1}`}
                    tabIndex={0}
                  >
                    {state.actionLoading === -1 ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Starting...
                      </span>
                    ) : (
                      "Start Mining"
                    )}
                  </button>
                </div>
              ) : session.ready ? (
                /* ── Ready to collect ── */
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-amber-500/50 bg-amber-900/20 text-3xl animate-bounce">
                    🪙
                  </div>
                  <p className="text-sm font-bold text-amber-300">
                    +{session.reward.toLocaleString()} gold
                  </p>
                  <button
                    type="button"
                    onClick={() => handleCollect(session.id, i)}
                    disabled={state.actionLoading !== null}
                    className="w-full rounded-xl border border-amber-500/40 bg-gradient-to-b from-amber-600 to-amber-700 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-amber-900/30 transition hover:from-amber-500 hover:to-amber-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={`Collect reward from slot ${i + 1}`}
                    tabIndex={0}
                  >
                    {isActionLoading ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Collecting...
                      </span>
                    ) : (
                      "Collect"
                    )}
                  </button>
                </div>
              ) : (
                /* ── Mining in progress ── */
                <div className="flex w-full flex-col items-center gap-3">
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-slate-600 bg-slate-800/50 text-3xl">
                    <span className="animate-pulse">⛏️</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full">
                    <div className="mb-1 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Mining...</span>
                      <span className="font-mono text-amber-400">
                        {formatTimeLeft(session.endsAt)}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-1000"
                        style={{ width: `${getProgress(session.startedAt, session.endsAt)}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-slate-400">
                    Reward: <span className="font-bold text-amber-300">{session.reward.toLocaleString()}</span> gold
                  </p>

                  {/* Boost button */}
                  <button
                    type="button"
                    onClick={() => handleBoost(session.id, i)}
                    disabled={state.actionLoading !== null || state.gems < GOLD_MINE_BOOST_COST_GEMS}
                    className="w-full rounded-xl border border-purple-500/40 bg-gradient-to-b from-purple-600 to-purple-700 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-purple-900/30 transition hover:from-purple-500 hover:to-purple-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={`Boost mining in slot ${i + 1} for ${GOLD_MINE_BOOST_COST_GEMS} gems`}
                    tabIndex={0}
                  >
                    {isActionLoading ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Boosting...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1">
                        ⚡ Instant Complete
                        <span className="ml-1 text-purple-300">({GOLD_MINE_BOOST_COST_GEMS} 💎)</span>
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Buy slot card */}
        {canBuyMoreSlots && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-700/50 bg-slate-900/30 p-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-slate-700 text-3xl text-slate-600">
              +
            </div>
            <p className="text-center text-xs text-slate-500">
              Unlock extra slot
            </p>
            <button
              type="button"
              onClick={handleBuySlot}
              disabled={state.actionLoading !== null || state.gems < GOLD_MINE_SLOT_COST_GEMS}
              className="w-full rounded-xl border border-purple-500/40 bg-gradient-to-b from-purple-600/80 to-purple-700/80 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-purple-900/30 transition hover:from-purple-500 hover:to-purple-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={`Buy extra mining slot for ${GOLD_MINE_SLOT_COST_GEMS} gems`}
              tabIndex={0}
            >
              {state.actionLoading === -2 ? (
                <span className="flex items-center justify-center gap-1.5">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Buying...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1">
                  Buy Slot
                  <span className="ml-1 text-purple-300">({GOLD_MINE_SLOT_COST_GEMS} 💎)</span>
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Info panel */}
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700/40 bg-slate-800/30 p-4">
        <h3 className="mb-2 font-display text-sm tracking-wider text-slate-400">How it works</h3>
        <ul className="space-y-1 text-xs leading-relaxed text-slate-500">
          <li>
            <span className="text-slate-300">⛏️</span> Start mining in a free slot — wait 30 min{" "}
            <span className="text-amber-400">(VIP: 15 min)</span>
          </li>
          <li>
            <span className="text-slate-300">🪙</span> Collect your reward:{" "}
            <span className="font-mono text-amber-300">100 + Level × 3</span> gold
          </li>
          <li>
            <span className="text-slate-300">⚡</span> Boost to finish instantly for{" "}
            <span className="text-purple-400">{GOLD_MINE_BOOST_COST_GEMS} gems</span>
          </li>
          <li>
            <span className="text-slate-300">🔓</span> Buy up to{" "}
            {GOLD_MINE_MAX_SLOTS - GOLD_MINE_FREE_SLOTS} extra slots for{" "}
            <span className="text-purple-400">{GOLD_MINE_SLOT_COST_GEMS} gems</span> each
          </li>
        </ul>
      </div>

      {/* Start mining CTA if all slots empty and none shown */}
      {hasEmptySlot && state.sessions.length === 0 && !state.loading && (
        <div className="mt-6">
          <button
            type="button"
            onClick={handleStartMining}
            disabled={state.actionLoading !== null}
            className="rounded-xl border border-emerald-500/40 bg-gradient-to-b from-emerald-600 to-emerald-700 px-8 py-3 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-emerald-900/30 transition hover:from-emerald-500 hover:to-emerald-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Start your first mining session"
            tabIndex={0}
          >
            {state.actionLoading === -1 ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Starting...
              </span>
            ) : (
              "Start Mining!"
            )}
          </button>
        </div>
      )}
    </div>
  );
};

const GoldMinePage = () => (
  <Suspense fallback={<PageLoader emoji="⛏️" text="Loading Gold Mine..." />}>
    <GoldMineContent />
  </Suspense>
);

export default GoldMinePage;
