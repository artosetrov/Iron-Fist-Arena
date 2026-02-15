"use client";

import { useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import GameIcon from "@/app/components/ui/GameIcon";
import type { GameIconKey } from "@/app/components/ui/GameIcon";
import { ORIGIN_IMAGE } from "@/app/components/HeroCard";
import { BOSS_NAMES, getBossImagePath } from "@/lib/game/boss-catalog";
import { getBossAssetKey, getOriginAvatarAssetKey } from "@/lib/game/asset-registry";
import { useAssetUrl } from "@/lib/hooks/useAssetOverrides";
import { GameButton } from "@/app/components/ui";

/* ────────────────── Types ────────────────── */

type LootReward = {
  gold?: number;
  xp?: number;
  rating?: number;
  droppedItem?: { itemId: string | null; rarity: string } | null;
};

type EnemyInfo = {
  name: string;
  class?: string;
  origin?: string;
};

type CombatLootScreenProps = {
  enemy: EnemyInfo;
  rewards: LootReward;
  onContinue: () => void;
  loading?: boolean;
};

const RARITY_COLOR: Record<string, string> = {
  common: "text-slate-300",
  uncommon: "text-green-400",
  rare: "text-blue-400",
  epic: "text-purple-400",
  legendary: "text-amber-400",
};

const RARITY_LABEL: Record<string, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

/* ────────────────── Component ────────────────── */

const CombatLootScreen = ({
  enemy,
  rewards,
  onContinue,
  loading = false,
}: CombatLootScreenProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Escape") onContinue();
    },
    [onContinue]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    btnRef.current?.focus();
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onContinue();
  };

  const cls = enemy.class?.toLowerCase() ?? "";
  const CLASS_ICON_KEY: Record<string, GameIconKey> = {
    warrior: "warrior",
    rogue: "rogue",
    mage: "mage",
    tank: "tank",
  };
  const iconKey = CLASS_ICON_KEY[cls];

  const bossKey = BOSS_NAMES.has(enemy.name) ? getBossAssetKey(enemy.name) : "";
  const originKey = enemy.origin ? getOriginAvatarAssetKey(enemy.origin) : "";
  const bossImageUrl = useAssetUrl(
    bossKey,
    bossKey ? getBossImagePath(enemy.name) : ""
  );
  const originImageUrl = useAssetUrl(
    originKey,
    originKey ? ORIGIN_IMAGE[enemy.origin!] : ""
  );

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Loot"
    >
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-amber-700/40 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl">
        {/* Header */}
        <div className="border-b border-slate-800 bg-gradient-to-r from-amber-900/40 to-orange-900/40 px-6 py-4 text-center">
          <h2 className="font-display text-xl tracking-wider text-amber-400">
            What a Fight!
          </h2>
        </div>

        {/* Enemy avatar */}
        <div className="flex flex-col items-center px-6 pt-5">
          <div className={`relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl ${BOSS_NAMES.has(enemy.name) ? "bg-transparent" : "border border-slate-700 bg-gradient-to-b from-slate-800 to-slate-900"}`}>
            {BOSS_NAMES.has(enemy.name) ? (
              <Image
                src={bossImageUrl}
                alt={enemy.name}
                width={1024}
                height={1024}
                className="h-full w-full object-contain"
                sizes="80px"
                unoptimized={bossImageUrl.startsWith("http")}
              />
            ) : enemy.origin && originImageUrl ? (
              <Image
                src={originImageUrl}
                alt={enemy.origin}
                width={1024}
                height={1024}
                className="h-full w-full object-cover"
                sizes="80px"
                unoptimized={originImageUrl.startsWith("http")}
              />
            ) : iconKey ? (
              <span aria-hidden="true">
                <GameIcon name={iconKey} size={40} />
              </span>
            ) : (
              <span className="text-4xl" aria-hidden="true">
                💀
              </span>
            )}
          </div>
          <p className="mt-2 text-sm font-bold uppercase tracking-wide text-slate-300">
            {enemy.name}
          </p>
        </div>

        {/* Loot */}
        <div className="flex flex-wrap items-center justify-center gap-4 px-6 py-5">
          {rewards.gold !== undefined && rewards.gold > 0 && (
            <div className="flex flex-col items-center gap-1 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3">
              <span aria-hidden="true">
                <GameIcon name="gold" size={28} />
              </span>
              <span className="text-sm font-bold text-yellow-400">
                {rewards.gold.toLocaleString()}
              </span>
            </div>
          )}
          {rewards.xp !== undefined && rewards.xp > 0 && (
            <div className="flex flex-col items-center gap-1 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3">
              <span aria-hidden="true">
                <GameIcon name="xp" size={28} />
              </span>
              <span className="text-sm font-bold text-blue-400">
                +{rewards.xp} XP
              </span>
            </div>
          )}
          {rewards.rating !== undefined && rewards.rating > 0 && (
            <div className="flex flex-col items-center gap-1 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3">
              <span aria-hidden="true">
                <GameIcon name="pvp-rating" size={28} />
              </span>
              <span className="text-sm font-bold text-cyan-400">
                +{rewards.rating} Rating
              </span>
            </div>
          )}
          {rewards.droppedItem && (
            <div className="flex flex-col items-center gap-1 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3">
              <span className="text-2xl" aria-hidden="true">
                🎁
              </span>
              <span
                className={`text-xs font-bold ${RARITY_COLOR[rewards.droppedItem.rarity] ?? "text-slate-300"}`}
              >
                {RARITY_LABEL[rewards.droppedItem.rarity] ?? rewards.droppedItem.rarity}
              </span>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="border-t border-slate-800 px-6 py-4">
          <GameButton
            ref={btnRef}
            onClick={onContinue}
            disabled={loading}
            aria-label="Continue"
            fullWidth
            size="lg"
          >
            {loading ? "Loading…" : "Continue"}
          </GameButton>
        </div>
      </div>
    </div>
  );
};

export default CombatLootScreen;
