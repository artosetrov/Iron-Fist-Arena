"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import PageLoader from "@/app/components/PageLoader";
import {
  SHELL_GAME_MIN_BET,
  SHELL_GAME_MAX_BET,
  SHELL_GAME_BET_PRESETS,
  SHELL_GAME_CUPS,
} from "@/lib/game/minigames/shell-game";

/* ────────────────── Types ────────────────── */

type GamePhase = "idle" | "betting" | "showing" | "shuffling" | "picking" | "reveal";

type ShellGameSwap = [number, number];

type GameState = {
  gameId: string | null;
  phase: GamePhase;
  betAmount: number;
  initialPosition: number;
  swaps: ShellGameSwap[];
  chosenCup: number | null;
  correctCup: number | null;
  result: "win" | "lose" | null;
  goldChange: number;
  gold: number | null;
  error: string | null;
  loading: boolean;
};

/* ────────────────── Constants ────────────────── */

const SWAP_DURATION = 400; // ms per swap animation
const SHOW_BALL_DURATION = 1500; // ms to show ball at start
const REVEAL_LIFT_DURATION = 600; // ms for cup lift on reveal

const CUP_POSITIONS = [0, 1, 2];

/* ────────────────── Initial State ────────────────── */

const INITIAL_STATE: GameState = {
  gameId: null,
  phase: "idle",
  betAmount: SHELL_GAME_BET_PRESETS[0],
  initialPosition: 0,
  swaps: [],
  chosenCup: null,
  correctCup: null,
  result: null,
  goldChange: 0,
  gold: null,
  error: null,
  loading: false,
};

/* ────────────────── Shell Game Content ────────────────── */

const ShellGameContent = () => {
  const searchParams = useSearchParams();
  const characterId = searchParams.get("characterId");

  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [customBet, setCustomBet] = useState("");
  const [cupPositions, setCupPositions] = useState<number[]>([0, 1, 2]);
  const [liftedCup, setLiftedCup] = useState<number | null>(null);
  const [ballVisible, setBallVisible] = useState(false);
  const [highlightCup, setHighlightCup] = useState<number | null>(null);
  const animationRef = useRef<NodeJS.Timeout[]>([]);

  // Load gold on mount
  useEffect(() => {
    if (!characterId) return;
    const controller = new AbortController();
    fetch(`/api/characters/${characterId}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.gold != null) {
          setState((s) => ({ ...s, gold: data.gold, phase: "betting" }));
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [characterId]);

  // Cleanup animations on unmount
  useEffect(() => {
    return () => {
      animationRef.current.forEach(clearTimeout);
    };
  }, []);

  const clearAnimations = () => {
    animationRef.current.forEach(clearTimeout);
    animationRef.current = [];
  };

  const addTimeout = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    animationRef.current.push(id);
    return id;
  };

  /* ── Start game ── */
  const handleStartGame = useCallback(async () => {
    if (!characterId || state.loading) return;

    const bet = customBet ? Number(customBet) : state.betAmount;
    if (!Number.isFinite(bet) || bet < SHELL_GAME_MIN_BET || bet > SHELL_GAME_MAX_BET) {
      setState((s) => ({ ...s, error: `Bet must be ${SHELL_GAME_MIN_BET}–${SHELL_GAME_MAX_BET} gold` }));
      return;
    }
    if (state.gold !== null && bet > state.gold) {
      setState((s) => ({ ...s, error: "Not enough gold" }));
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const res = await fetch("/api/minigames/shell-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId, betAmount: bet }),
      });
      const data = await res.json();

      if (!res.ok) {
        setState((s) => ({ ...s, loading: false, error: data.error ?? "Failed to start game" }));
        return;
      }

      // Update gold (bet deducted)
      const newGold = state.gold !== null ? state.gold - bet : null;

      setState((s) => ({
        ...s,
        gameId: data.gameId,
        betAmount: bet,
        initialPosition: data.initialPosition,
        swaps: data.swaps,
        gold: newGold,
        loading: false,
        phase: "showing",
        chosenCup: null,
        correctCup: null,
        result: null,
        goldChange: 0,
        error: null,
      }));

      // Reset cup positions
      setCupPositions([0, 1, 2]);
      setBallVisible(true);
      setLiftedCup(data.initialPosition);
      setHighlightCup(null);

      // Run animation sequence
      clearAnimations();
      runShuffleAnimation(data.initialPosition, data.swaps);
    } catch {
      setState((s) => ({ ...s, loading: false, error: "Network error" }));
    }
  }, [characterId, state.loading, state.betAmount, state.gold, customBet]);

  /* ── Shuffle animation ── */
  const runShuffleAnimation = (initialPos: number, swaps: ShellGameSwap[]) => {
    // Phase 1: Show ball under lifted cup
    addTimeout(() => {
      setLiftedCup(null); // Lower the cup
      setBallVisible(false);
    }, SHOW_BALL_DURATION);

    // Phase 2: Start shuffling after cup is lowered
    const shuffleStart = SHOW_BALL_DURATION + 400;

    addTimeout(() => {
      setState((s) => ({ ...s, phase: "shuffling" }));
    }, shuffleStart);

    // Animate each swap
    let currentPositions = [0, 1, 2];
    swaps.forEach((swap, i) => {
      const delay = shuffleStart + i * SWAP_DURATION;
      addTimeout(() => {
        const [a, b] = swap;
        const newPositions = [...currentPositions];
        // Find which visual cup is at position a and b
        const cupAtA = newPositions.indexOf(a);
        const cupAtB = newPositions.indexOf(b);
        if (cupAtA !== -1 && cupAtB !== -1) {
          newPositions[cupAtA] = b;
          newPositions[cupAtB] = a;
        }
        currentPositions = newPositions;
        setCupPositions([...currentPositions]);
      }, delay);
    });

    // Phase 3: Enter picking phase
    const pickDelay = shuffleStart + swaps.length * SWAP_DURATION + 300;
    addTimeout(() => {
      setState((s) => ({ ...s, phase: "picking" }));
    }, pickDelay);
  };

  /* ── Pick a cup ── */
  const handlePickCup = useCallback(
    async (cupIndex: number) => {
      if (state.phase !== "picking" || !state.gameId || state.loading) return;

      setState((s) => ({ ...s, loading: true }));

      try {
        const res = await fetch("/api/minigames/shell-game", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameId: state.gameId, chosenCup: cupIndex }),
        });
        const data = await res.json();

        if (!res.ok) {
          setState((s) => ({ ...s, loading: false, error: data.error ?? "Failed to submit" }));
          return;
        }

        const newGold =
          state.gold !== null
            ? data.result === "win"
              ? state.gold + state.betAmount * 2
              : state.gold
            : null;

        setState((s) => ({
          ...s,
          phase: "reveal",
          chosenCup: cupIndex,
          correctCup: data.correctCup,
          result: data.result,
          goldChange: data.goldChange,
          gold: newGold,
          loading: false,
        }));

        // Show reveal animation
        setHighlightCup(cupIndex);
        setLiftedCup(data.correctCup);
        setBallVisible(true);

        // Dispatch update event for sidebar gold refresh
        window.dispatchEvent(new Event("character-updated"));
      } catch {
        setState((s) => ({ ...s, loading: false, error: "Network error" }));
      }
    },
    [state.phase, state.gameId, state.loading, state.gold, state.betAmount],
  );

  /* ── Play again ── */
  const handlePlayAgain = () => {
    clearAnimations();
    setCupPositions([0, 1, 2]);
    setLiftedCup(null);
    setBallVisible(false);
    setHighlightCup(null);
    setState((s) => ({
      ...INITIAL_STATE,
      gold: s.gold,
      betAmount: s.betAmount,
      phase: "betting",
    }));
  };

  /* ── Bet input ── */
  const handleBetPreset = (amount: number) => {
    setCustomBet("");
    setState((s) => ({ ...s, betAmount: amount, error: null }));
  };

  const handleCustomBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "");
    setCustomBet(v);
    if (v) {
      setState((s) => ({ ...s, betAmount: Number(v), error: null }));
    }
  };

  /* ── Cup rendering helpers ── */
  const getCupTranslateX = (visualPos: number): string => {
    // Each cup slot is ~120px apart (center to center)
    const offsets = [-130, 0, 130];
    return `${offsets[visualPos]}px`;
  };

  const isCupClickable = state.phase === "picking" && !state.loading;

  return (
    <div className="flex min-h-full flex-col items-center px-4 py-8">
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
        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
          <span className="mr-2">🥤</span>Shell Game
        </h1>
      </div>

      {/* Gold display */}
      {state.gold !== null && (
        <p className="mb-6 text-sm font-medium text-yellow-400">
          🪙 {state.gold.toLocaleString()} gold
        </p>
      )}

      {/* Error */}
      {state.error && (
        <div className="mb-4 max-w-md rounded-lg border border-red-500/30 bg-red-900/20 px-4 py-2 text-center text-sm text-red-400">
          {state.error}
        </div>
      )}

      {/* ── Cups Area ── */}
      <div
        className="relative mb-8 flex h-52 w-full max-w-md items-end justify-center"
        role="group"
        aria-label="Shell game cups"
      >
        {CUP_POSITIONS.map((cupIdx) => {
          const visualPos = cupPositions[cupIdx];
          const isLifted = liftedCup === cupIdx;
          const isHighlighted = highlightCup === cupIdx;
          const isBallHere =
            state.phase === "showing"
              ? cupIdx === state.initialPosition
              : cupIdx === state.correctCup;
          const isWrongPick = state.phase === "reveal" && state.chosenCup === cupIdx && !isBallHere;

          return (
            <div
              key={cupIdx}
              className="absolute bottom-0 flex flex-col items-center transition-all ease-in-out"
              style={{
                transform: `translateX(${getCupTranslateX(visualPos)})`,
                transitionDuration:
                  state.phase === "shuffling" ? `${SWAP_DURATION}ms` : "300ms",
                zIndex: isLifted ? 10 : 1,
              }}
            >
              {/* Ball (under the cup) */}
              <img
                src="/images/minigames/shell-game-ball.png"
                alt="Ball"
                className={`absolute bottom-1 h-8 w-8 transition-opacity duration-300
                  ${ballVisible && isBallHere ? "opacity-100" : "opacity-0"}
                `}
              />

              {/* Cup */}
              <button
                type="button"
                onClick={() => handlePickCup(cupIdx)}
                disabled={!isCupClickable}
                className={`relative flex h-28 w-24 items-end justify-center transition-all duration-300
                  ${isCupClickable ? "cursor-pointer hover:-translate-y-2" : "cursor-default"}
                  ${isLifted ? "-translate-y-16" : "translate-y-0"}
                  ${isHighlighted && state.result === "win" ? "drop-shadow-[0_0_20px_rgba(34,197,94,0.5)]" : ""}
                  ${isWrongPick ? "drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]" : ""}
                `}
                aria-label={`Cup ${cupIdx + 1}`}
                tabIndex={isCupClickable ? 0 : -1}
              >
                <Image
                  src="/images/minigames/shell-game-cup.png"
                  alt={`Cup ${cupIdx + 1}`}
                  width={96}
                  height={112}
                  className={`h-full w-full object-contain drop-shadow-xl transition-all duration-300
                    ${isHighlighted && state.result === "win" ? "hue-rotate-[90deg] brightness-110" : ""}
                    ${isWrongPick ? "hue-rotate-[330deg] brightness-75 saturate-150" : ""}
                  `}
                  draggable={false}
                  priority
                />

                {/* Picking indicator */}
                {isCupClickable && (
                  <span className="absolute -bottom-6 text-xs font-medium text-slate-400 opacity-0 transition-opacity group-hover:opacity-100">
                    Pick
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Phase text */}
      <div className="mb-6 h-8 text-center">
        {state.phase === "showing" && (
          <p className="animate-pulse text-sm font-medium text-amber-400">
            Watch the ball carefully...
          </p>
        )}
        {state.phase === "shuffling" && (
          <p className="animate-pulse text-sm font-medium text-amber-400">
            Shuffling...
          </p>
        )}
        {state.phase === "picking" && (
          <p className="text-sm font-medium text-emerald-400">
            Pick a cup! Where&apos;s the ball?
          </p>
        )}
        {state.phase === "reveal" && state.result === "win" && (
          <p className="text-lg font-black text-emerald-400">
            You won +{state.betAmount.toLocaleString()} gold!
          </p>
        )}
        {state.phase === "reveal" && state.result === "lose" && (
          <p className="text-lg font-black text-red-400">
            Wrong cup! Lost {state.betAmount.toLocaleString()} gold
          </p>
        )}
      </div>

      {/* ── Betting controls ── */}
      {(state.phase === "betting" || state.phase === "idle") && (
        <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6">
          <p className="text-sm font-bold text-slate-300">Place your bet</p>

          {/* Presets */}
          <div className="flex flex-wrap justify-center gap-2">
            {SHELL_GAME_BET_PRESETS.map((preset) => {
              const active = !customBet && state.betAmount === preset;
              const disabled = state.gold !== null && preset > state.gold;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleBetPreset(preset)}
                  disabled={disabled}
                  className={`rounded-lg border px-4 py-2 text-sm font-bold transition
                    ${active
                      ? "border-amber-500/50 bg-amber-900/40 text-amber-300"
                      : disabled
                        ? "border-slate-800 bg-slate-900/40 text-slate-600 cursor-not-allowed"
                        : "border-slate-700 bg-slate-800 text-slate-300 hover:border-amber-600/40 hover:text-amber-300"
                    }
                  `}
                  aria-label={`Bet ${preset} gold`}
                  tabIndex={0}
                >
                  {preset}
                </button>
              );
            })}
          </div>

          {/* Custom input */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">or</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Custom bet"
              value={customBet}
              onChange={handleCustomBetChange}
              className="w-32 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-center text-sm font-bold text-white placeholder-slate-600 outline-none transition focus:border-amber-500/50"
              aria-label="Custom bet amount"
            />
            <span className="text-xs text-slate-500">
              ({SHELL_GAME_MIN_BET}–{SHELL_GAME_MAX_BET})
            </span>
          </div>

          {/* Start button */}
          <button
            type="button"
            onClick={handleStartGame}
            disabled={state.loading || state.gold === null}
            className="w-full max-w-xs rounded-xl border border-emerald-500/40 bg-gradient-to-b from-emerald-600 to-emerald-700 px-6 py-3 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-emerald-900/30 transition hover:from-emerald-500 hover:to-emerald-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Start game"
            tabIndex={0}
          >
            {state.loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Starting...
              </span>
            ) : (
              `Bet ${(customBet ? Number(customBet) : state.betAmount).toLocaleString()} Gold`
            )}
          </button>
        </div>
      )}

      {/* ── Play again / Back ── */}
      {state.phase === "reveal" && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handlePlayAgain}
            className="rounded-xl border border-amber-500/40 bg-gradient-to-b from-amber-600 to-amber-700 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-amber-900/30 transition hover:from-amber-500 hover:to-amber-600 active:scale-[0.98]"
            aria-label="Play again"
            tabIndex={0}
          >
            Play Again
          </button>
          <Link
            href={`/minigames${characterId ? `?characterId=${characterId}` : ""}`}
            className="flex items-center rounded-xl border border-slate-700 bg-slate-800 px-6 py-3 text-sm font-bold text-slate-300 transition hover:border-slate-600 hover:text-white"
            aria-label="Back to minigames"
            tabIndex={0}
          >
            Back
          </Link>
        </div>
      )}

      {/* Loading state overlay when waiting */}
      {state.loading && state.phase === "picking" && (
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-slate-300" />
          Revealing...
        </div>
      )}
    </div>
  );
};

const ShellGamePage = () => (
  <Suspense fallback={<PageLoader emoji="🥤" text="Loading Shell Game..." />}>
    <ShellGameContent />
  </Suspense>
);

export default ShellGamePage;
