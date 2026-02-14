"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import PageLoader from "@/app/components/PageLoader";
import PageHeader from "@/app/components/PageHeader";
import GameIcon from "@/app/components/ui/GameIcon";
import { GameButton, PageContainer } from "@/app/components/ui";
import {
  SHELL_GAME_MIN_BET,
  SHELL_GAME_MAX_BET,
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
  betAmount: 0,
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
  const router = useRouter();
  const characterId = searchParams.get("characterId");

  const [state, setState] = useState<GameState>(INITIAL_STATE);
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

    const bet = state.betAmount;
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterId, state.loading, state.betAmount, state.gold]);

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

  /* ── Bet slider ── */
  const maxBet = state.gold !== null ? Math.min(state.gold, SHELL_GAME_MAX_BET) : SHELL_GAME_MAX_BET;
  const sliderFillPercent = maxBet > 0 ? (state.betAmount / maxBet) * 100 : 0;

  const handleBetSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState((s) => ({ ...s, betAmount: Number(e.target.value), error: null }));
  };

  const handleSetMaxBet = () => {
    setState((s) => ({ ...s, betAmount: maxBet, error: null }));
  };

  /* ── Cup rendering helpers ── */
  const getCupTranslateX = (visualPos: number): string => {
    // Each cup slot is ~120px apart (center to center)
    const offsets = [-130, 0, 130];
    return `${offsets[visualPos]}px`;
  };

  const isCupClickable = state.phase === "picking" && !state.loading;

  return (
    <div className="flex min-h-full flex-col items-center px-4 py-4">
      <PageHeader
        title="Shell Game"
        leftHref={`/minigames${characterId ? `?characterId=${characterId}` : ""}`}
        leftLabel="Back to Tavern"
      />

      {/* Gold display */}
      {state.gold !== null && (
        <p className="mb-6 inline-flex items-center gap-1.5 font-display text-base font-bold text-yellow-400">
          <GameIcon name="gold" size={18} /> {state.gold.toLocaleString()} gold
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
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
        <div className="flex w-full max-w-md flex-col items-center gap-5 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6">
          <p className="text-sm font-bold text-slate-300">Place your bet</p>

          {/* Bet amount display */}
          <p className="font-display text-3xl text-amber-400">
            {state.betAmount.toLocaleString()}
            <span className="ml-1.5 text-base text-amber-400/60">gold</span>
          </p>

          {/* Slider */}
          <div className="w-full px-1">
            <input
              type="range"
              min={0}
              max={maxBet}
              step={10}
              value={state.betAmount}
              onChange={handleBetSliderChange}
              className="bet-slider w-full cursor-pointer"
              style={{
                background: `linear-gradient(to right, #d97706 0%, #f59e0b ${sliderFillPercent}%, #334155 ${sliderFillPercent}%, #334155 100%)`,
              }}
              aria-label="Bet amount slider"
              aria-valuemin={0}
              aria-valuemax={maxBet}
              aria-valuenow={state.betAmount}
            />
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500">
              <span>0</span>
              <button
                type="button"
                onClick={handleSetMaxBet}
                className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-amber-400/80 transition hover:bg-slate-700 hover:text-amber-300"
                aria-label="Set maximum bet"
                tabIndex={0}
              >
                MAX
              </button>
              <span>{maxBet.toLocaleString()}</span>
            </div>
          </div>

          {/* Start button */}
          <GameButton
            variant="action"
            size="lg"
            fullWidth
            onClick={handleStartGame}
            disabled={state.loading || state.gold === null || state.betAmount < SHELL_GAME_MIN_BET}
            className="max-w-xs"
            aria-label="Start game"
            tabIndex={0}
          >
            {state.loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Starting...
              </span>
            ) : state.betAmount < SHELL_GAME_MIN_BET ? (
              `Min bet: ${SHELL_GAME_MIN_BET} gold`
            ) : (
              `Bet ${state.betAmount.toLocaleString()} Gold`
            )}
          </GameButton>

          {state.betAmount > 0 && state.betAmount < SHELL_GAME_MIN_BET && (
            <p className="text-xs text-amber-500/70">
              Minimum bet is {SHELL_GAME_MIN_BET} gold
            </p>
          )}
        </div>
      )}

      {/* ── Play again / Back ── */}
      {state.phase === "reveal" && (
        <div className="flex gap-3">
          <GameButton
            size="lg"
            onClick={handlePlayAgain}
            aria-label="Play again"
            tabIndex={0}
          >
            Play Again
          </GameButton>
          <GameButton
            variant="secondary"
            onClick={() => router.push(`/minigames${characterId ? `?characterId=${characterId}` : ""}`)}
            aria-label="Back to minigames"
            tabIndex={0}
          >
            Back
          </GameButton>
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
  <Suspense fallback={<PageLoader icon={<GameIcon name="shell-game" size={32} />} text="Loading Shell Game..." />}>
    <ShellGameContent />
  </Suspense>
);

export default ShellGamePage;
