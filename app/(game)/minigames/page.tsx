"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import PageLoader from "@/app/components/PageLoader";

/* ── Types ── */

type MinigameCard = {
  id: string;
  title: string;
  description: string;
  image: string;
  href: string;
  available: boolean;
  tag?: string;
};

/* ── Data ── */

const MINIGAMES: MinigameCard[] = [
  {
    id: "dungeon-rush",
    title: "Dungeon Rush",
    description: "5-wave PvE gauntlet. Fight mobs, earn XP and Gold!",
    image: "/images/minigames/dungeon-rush.png",
    href: "/minigames/dungeon-rush",
    available: true,
    tag: "3 Energy",
  },
  {
    id: "shell-game",
    title: "Shell Game",
    description: "Find the ball under the right cup. Bet gold, track the shuffle, pick wisely!",
    image: "/images/minigames/shell-game.png",
    href: "/minigames/shell-game",
    available: true,
    tag: "x2 Payout",
  },
  {
    id: "gold-mine",
    title: "Gold Mine",
    description: "Start mining and collect gold over time. Idle income!",
    image: "/images/minigames/gold-mine.png",
    href: "/minigames/gold-mine",
    available: true,
    tag: "Idle",
  },
  {
    id: "coin-flip",
    title: "Coin Flip",
    description: "Heads or tails? Double or nothing!",
    image: "/images/minigames/coin-flip.png",
    href: "/minigames/coin-flip",
    available: false,
    tag: "Coming Soon",
  },
  {
    id: "dice-roll",
    title: "Dice Roll",
    description: "Roll the dice and test your luck against the house.",
    image: "/images/minigames/dice-roll.png",
    href: "/minigames/dice-roll",
    available: false,
    tag: "Coming Soon",
  },
];

/* ── Component ── */

const MinigamesContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const characterId = searchParams.get("characterId");

  const buildHref = (base: string) => {
    if (!characterId) return base;
    return `${base}?characterId=${characterId}`;
  };

  const handleCardClick = (game: MinigameCard) => {
    if (!game.available) return;
    router.push(buildHref(game.href));
  };

  return (
    <div className="relative flex min-h-full flex-col items-center px-4 py-10">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <Image
          src="/images/minigames/tavern-interior.png"
          alt=""
          fill
          className="object-cover opacity-20"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-transparent to-slate-950/90" />
      </div>

      {/* Header */}
      <div className="relative z-10 mb-10 text-center">
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
          <span className="mr-2">🍺</span>Tavern
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Welcome to the Tavern! Bet your gold, test your luck.
        </p>
      </div>

      {/* Grid */}
      <div className="relative z-10 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MINIGAMES.map((game) => (
          <button
            key={game.id}
            type="button"
            onClick={() => handleCardClick(game)}
            disabled={!game.available}
            className={`group relative flex flex-col items-end justify-end overflow-hidden rounded-2xl border text-center transition-all duration-200 aspect-[4/5]
              ${
                game.available
                  ? "cursor-pointer border-slate-700/60 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-900/20 active:scale-[0.98]"
                  : "cursor-not-allowed border-slate-800/40 opacity-50"
              }
            `}
            aria-label={game.title}
            tabIndex={game.available ? 0 : -1}
          >
            {/* Background image */}
            <Image
              src={game.image}
              alt={game.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              sizes="(max-width: 640px) 100vw, 240px"
            />

            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            {/* Tag */}
            {game.tag && (
              <span
                className={`absolute top-3 right-3 z-10 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm
                  ${
                    game.available
                      ? "border border-amber-500/40 bg-amber-900/60 text-amber-300"
                      : "border border-slate-700/40 bg-slate-800/60 text-slate-500"
                  }
                `}
              >
                {game.tag}
              </span>
            )}

            {/* Text content */}
            <div className="relative z-10 w-full px-4 pb-4">
              <h2 className="text-lg font-bold text-white drop-shadow-lg">
                {game.title}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-300 drop-shadow-md">
                {game.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

const MinigamesPage = () => (
  <Suspense fallback={<PageLoader emoji="🍺" text="Entering the Tavern..." />}>
    <MinigamesContent />
  </Suspense>
);

export default MinigamesPage;
