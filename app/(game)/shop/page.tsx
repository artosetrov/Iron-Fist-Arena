"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import PageHeader from "@/app/components/PageHeader";
import PageLoader from "@/app/components/PageLoader";
import {
  CONSUMABLE_CATALOG,
  type ConsumableDef,
  type ConsumableType,
  getConsumableImagePath,
} from "@/lib/game/consumable-catalog";
import {
  getItemImagePath,
  getCatalogItemById,
} from "@/lib/game/item-catalog";
import {
  WEAPON_AFFINITY_BONUS,
  getWeaponCategory,
  hasWeaponAffinity,
} from "@/lib/game/weapon-affinity";
import { GameButton, PageContainer } from "@/app/components/ui";
import GameIcon, { type GameIconKey } from "@/app/components/ui/GameIcon";

/* ────────────────── Constants ────────────────── */

type ItemType = "weapon" | "helmet" | "chest" | "gloves" | "legs" | "boots" | "accessory" | "amulet" | "belt" | "relic" | "necklace" | "ring";
type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

type Item = {
  id: string;
  itemName: string;
  itemType: ItemType;
  rarity: Rarity;
  itemLevel: number;
  buyPrice: number | null;
  baseStats: Record<string, number>;
  specialEffect?: string | null;
  description?: string | null;
  catalogId?: string | null;
  setName?: string | null;
  classRestriction?: string | null;
};

type Character = {
  id: string;
  characterName: string;
  class: string;
  gold: number;
  gems: number;
  level: number;
  currentStamina: number;
  maxStamina: number;
};

type ConsumableInventoryItem = {
  consumableType: ConsumableType;
  quantity: number;
};

const RARITY_CONFIG: Record<
  Rarity,
  { label: string; text: string; border: string; bg: string; glow: string; badge: string }
> = {
  common: {
    label: "Common",
    text: "text-slate-300",
    border: "border-slate-600",
    bg: "bg-slate-800/60",
    glow: "",
    badge: "bg-slate-700 text-slate-300",
  },
  uncommon: {
    label: "Uncommon",
    text: "text-green-400",
    border: "border-green-700/60",
    bg: "bg-green-950/30",
    glow: "shadow-[0_0_12px_rgba(34,197,94,0.08)]",
    badge: "bg-green-900/60 text-green-400",
  },
  rare: {
    label: "Rare",
    text: "text-blue-400",
    border: "border-blue-700/60",
    bg: "bg-blue-950/30",
    glow: "shadow-[0_0_16px_rgba(59,130,246,0.1)]",
    badge: "bg-blue-900/60 text-blue-400",
  },
  epic: {
    label: "Epic",
    text: "text-purple-400",
    border: "border-purple-700/60",
    bg: "bg-purple-950/30",
    glow: "shadow-[0_0_20px_rgba(168,85,247,0.12)]",
    badge: "bg-purple-900/60 text-purple-400",
  },
  legendary: {
    label: "Legendary",
    text: "text-amber-400",
    border: "border-amber-600/60",
    bg: "bg-amber-950/30",
    glow: "shadow-[0_0_24px_rgba(245,158,11,0.15)]",
    badge: "bg-amber-900/60 text-amber-400",
  },
};

const ITEM_TYPE_CONFIG: Record<ItemType, { label: string; icon: GameIconKey }> = {
  weapon: { label: "Weapon", icon: "weapon" },
  helmet: { label: "Helmet", icon: "helmet" },
  chest: { label: "Chestplate", icon: "chest" },
  gloves: { label: "Gloves", icon: "gloves" },
  legs: { label: "Leggings", icon: "legs" },
  boots: { label: "Boots", icon: "boots" },
  accessory: { label: "Accessory", icon: "accessory" },
  amulet: { label: "Amulet", icon: "amulet" },
  belt: { label: "Belt", icon: "belt" },
  relic: { label: "Relic", icon: "relic" },
  necklace: { label: "Necklace", icon: "amulet" },
  ring: { label: "Ring", icon: "ring" },
};

const STAT_LABELS: Record<string, { label: string; icon: GameIconKey | null; iconEmoji?: string }> = {
  strength: { label: "Strength", icon: "strength" },
  agility: { label: "Agility", icon: "agility" },
  vitality: { label: "Vitality", icon: "vitality" },
  intelligence: { label: "Intelligence", icon: "intelligence" },
  wisdom: { label: "Wisdom", icon: "wisdom" },
  luck: { label: "Luck", icon: "luck" },
  charisma: { label: "Charisma", icon: "charisma" },
  crit_chance: { label: "Crit", icon: null, iconEmoji: "💥" },
  crit_damage: { label: "Crit Damage", icon: null, iconEmoji: "🔥" },
  armor: { label: "Armor", icon: "endurance" },
  magic_resist: { label: "Magic Resist", icon: "relic" },
  dodge: { label: "Dodge", icon: "agility" },
  attack: { label: "Attack", icon: "weapon" },
  defense: { label: "Defense", icon: "chest" },
  hp: { label: "HP", icon: "vitality" },
  mp: { label: "MP", icon: null, iconEmoji: "🔵" },
  // Item System v1.0 stats
  ATK: { label: "Attack", icon: "weapon" },
  DEF: { label: "Defense", icon: "chest" },
  HP: { label: "Health", icon: "vitality" },
  CRIT: { label: "Crit", icon: null, iconEmoji: "💥" },
  SPEED: { label: "Speed", icon: "stamina" },
  ARMOR: { label: "Armor", icon: "endurance" },
};

const SET_DISPLAY_NAMES: Record<string, string> = {
  crimson_conqueror: "Crimson Conqueror",
  shadow_reaper: "Shadow Reaper",
  arcane_dominion: "Arcane Dominion",
  iron_bastion: "Iron Bastion",
};

const CLASS_LABELS: Record<string, string> = {
  warrior: "Warrior",
  rogue: "Rogue",
  mage: "Mage",
  tank: "Tank",
};

const CLASS_ICON: Record<string, GameIconKey> = {
  warrior: "warrior",
  rogue: "rogue",
  mage: "mage",
  tank: "tank",
};

const CLASS_BADGE_STYLE: Record<string, string> = {
  warrior: "bg-red-900/50 text-red-400 border-red-700/40",
  rogue: "bg-emerald-900/50 text-emerald-400 border-emerald-700/40",
  mage: "bg-violet-900/50 text-violet-400 border-violet-700/40",
  tank: "bg-sky-900/50 text-sky-400 border-sky-700/40",
};

/** Reverse mapping: weaponCategory → recommended class */
const WEAPON_CATEGORY_CLASS: Record<string, string> = {
  sword: "warrior",
  dagger: "rogue",
  mace: "tank",
  staff: "mage",
};

/** Determine the recommended class for an item (classRestriction or weapon affinity) */
const getItemClass = (item: Item): string | null => {
  if (item.classRestriction) return item.classRestriction;
  if (item.itemType !== "weapon") return null;
  // Try catalog/description lookup first
  const category = getWeaponCategory(item);
  if (category) return WEAPON_CATEGORY_CLASS[category] ?? null;
  return null;
};

type Tab = "all" | ItemType | "potions";


const TABS: { key: Tab; label: string; icon: GameIconKey | null; iconEmoji?: string }[] = [
  { key: "all", label: "All", icon: "shop" },
  { key: "weapon", label: "Weapons", icon: "weapon" },
  { key: "helmet", label: "Helmets", icon: "helmet" },
  { key: "chest", label: "Armor", icon: "chest" },
  { key: "gloves", label: "Gloves", icon: "gloves" },
  { key: "legs", label: "Leggings", icon: "legs" },
  { key: "boots", label: "Boots", icon: "boots" },
  { key: "necklace", label: "Necklaces", icon: "amulet" },
  { key: "ring", label: "Rings", icon: "ring" },
  { key: "amulet", label: "Amulets", icon: "amulet" },
  { key: "belt", label: "Belts", icon: "belt" },
  { key: "relic", label: "Relics", icon: "relic" },
  { key: "accessory", label: "Accessories", icon: "accessory" },
  { key: "potions", label: "Potions", icon: null, iconEmoji: "🧪" },
];

const RARITY_ORDER: Rarity[] = ["common", "uncommon", "rare", "epic", "legendary"];

/* ────────────────── Gold Packages ────────────────── */

type GoldPackage = {
  id: string;
  gold: number;
  priceUsd: number;
  label: string;
  icon: GameIconKey;
  popular?: boolean;
};

const GOLD_PACKAGES: GoldPackage[] = [
  { id: "gold_1000", gold: 1000, priceUsd: 0.99, label: "Pouch of Gold", icon: "gold" },
  { id: "gold_5000", gold: 5000, priceUsd: 3.99, label: "Chest of Gold", icon: "leaderboard", popular: true },
  { id: "gold_10000", gold: 10000, priceUsd: 6.99, label: "Vault of Gold", icon: "helmet" },
];

/* ────────────────── Gold Purchase Modal ────────────────── */

const GoldPurchaseModal = ({
  characterId,
  onClose,
  onPurchase,
}: {
  characterId: string;
  onClose: () => void;
  onPurchase: (goldAdded: number, newBalance: number) => void;
}) => {
  const [buying, setBuying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBuyGold = useCallback(
    async (pkg: GoldPackage) => {
      if (buying) return;
      setError(null);
      setBuying(pkg.id);
      try {
        const res = await fetch("/api/shop/buy-gold", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ characterId, packageId: pkg.id }),
        });
        const data = await res.json();
        if (res.ok) {
          onPurchase(data.goldAdded, data.newBalance);
        } else {
          setError(data.error ?? "Purchase failed");
        }
      } catch {
        setError("Network error");
      } finally {
        setBuying(null);
      }
    },
    [characterId, buying, onPurchase]
  );

  /* Close on Escape */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Buy Gold"
    >
      <div
        className="relative mx-4 w-full max-w-lg animate-[scaleIn_0.25s_ease-out] rounded-2xl border border-amber-700/40 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl shadow-amber-500/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close btn */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-slate-300"
          aria-label="Close"
          tabIndex={0}
        >
          ✕
        </button>

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-amber-600/50 bg-gradient-to-br from-amber-800/30 to-amber-900/50 shadow-lg shadow-amber-500/20">
            <GameIcon name="gold" size={36} />
          </div>
          <h2 className="font-display text-2xl text-white">Buy Gold</h2>
          <p className="mt-1 text-sm text-slate-500">Choose a package to boost your treasury</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-800/50 bg-red-950/30 px-4 py-2 text-center text-sm text-red-400">
            ⚠️ {error}
          </div>
        )}

        {/* Packages */}
        <div className="flex flex-col gap-3">
          {GOLD_PACKAGES.map((pkg) => {
            const isBuying = buying === pkg.id;
            return (
              <div
                key={pkg.id}
                className={`
                  relative flex items-center justify-between rounded-xl border p-4 transition-all duration-200
                  ${pkg.popular
                    ? "border-amber-500/50 bg-gradient-to-r from-amber-950/40 to-amber-900/20 shadow-lg shadow-amber-500/10"
                    : "border-slate-700/50 bg-slate-800/40 hover:border-slate-600/60 hover:bg-slate-800/60"
                  }
                `}
              >
                {/* Popular badge */}
                {pkg.popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow">
                    Best Value
                  </div>
                )}

                {/* Left: icon + info */}
                <div className="flex items-center gap-3">
                  <div
                    className={`
                      flex h-12 w-12 items-center justify-center rounded-xl
                      ${pkg.popular
                        ? "border-2 border-amber-600/40 bg-amber-900/40"
                        : "border border-slate-700 bg-slate-800"
                      }
                    `}
                  >
                    <GameIcon name={pkg.icon} size={28} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{pkg.label}</p>
                    <p className="flex items-center gap-1 text-lg font-black text-yellow-400">
                      <GameIcon name="gold" size={20} /> {pkg.gold.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Right: buy btn */}
                <button
                  type="button"
                  onClick={() => handleBuyGold(pkg)}
                  disabled={!!buying}
                  className={`
                    rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-200
                    ${pkg.popular
                      ? "bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-500/25 hover:from-amber-500 hover:to-amber-400 active:scale-95"
                      : "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-500/20 hover:from-amber-500 hover:to-orange-500 active:scale-95"
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                  aria-label={`Buy ${pkg.label} for $${pkg.priceUsd}`}
                  tabIndex={0}
                >
                  {isBuying ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      ...
                    </span>
                  ) : (
                    `$${pkg.priceUsd.toFixed(2)}`
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <p className="mt-5 text-center text-[11px] text-slate-600">
          Simulated purchase · No real payment required
        </p>
      </div>
    </div>
  );
};

/* ────────────────── helpers ────────────────── */

/** Map itemType to the correct image filename (weapons use their category). */
const resolveItemFilename = (item: Item): string => {
  if (item.itemType === "weapon") {
    return getWeaponCategory(item) ?? "sword";
  }
  if (item.itemType === "accessory") return "amulet";
  return item.itemType;
};

/** Render item image (catalog → generic → icon fallback) */
const ItemImage = ({ item, size = 56 }: { item: Item; size?: number }) => {
  const itemType = ITEM_TYPE_CONFIG[item.itemType] ?? { label: item.itemType, icon: "accessory" as GameIconKey };

  if (item.catalogId && getCatalogItemById(item.catalogId)) {
    return (
      <Image
        src={getItemImagePath(getCatalogItemById(item.catalogId)!)}
        alt={item.itemName}
        width={size}
        height={size}
        className="object-contain"
      />
    );
  }

  const genericRarity = (item.rarity === "common" || item.rarity === "rare") ? item.rarity : null;
  if (genericRarity) {
    return (
      <Image
        src={`/images/items/${genericRarity}/${resolveItemFilename(item)}.png`}
        alt={item.itemName}
        width={size}
        height={size}
        className="object-contain"
      />
    );
  }

  return <GameIcon name={itemType.icon} size={Math.round(size * 0.6)} />;
};

/** Determine the "primary stat" label for the modal header (like D4 "1150 Defense") */
const getPrimaryStat = (item: Item): { label: string; value: number } | null => {
  const stats = item.baseStats ?? {};
  const isArmor = ["helmet", "chest", "gloves", "legs", "boots"].includes(item.itemType);
  if (isArmor && stats.DEF) return { label: "Defense", value: stats.DEF };
  if (stats.ATK) return { label: "Attack", value: stats.ATK };
  if (stats.DEF) return { label: "Defense", value: stats.DEF };
  if (stats.HP) return { label: "Health", value: stats.HP };
  return null;
};

/** Tile-specific image — fills the tile area while keeping aspect ratio */
/** Stable hue offset derived from a string (catalogId / itemName) */
const hashStringToHue = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
};

const TileImage = ({ item }: { item: Item }) => {
  const itemType = ITEM_TYPE_CONFIG[item.itemType] ?? { label: item.itemType, icon: "accessory" as GameIconKey };
  const hue = hashStringToHue(item.catalogId ?? item.itemName);

  if (item.catalogId && getCatalogItemById(item.catalogId)) {
    return (
      <Image
        src={getItemImagePath(getCatalogItemById(item.catalogId)!)}
        alt={item.itemName}
        fill
        sizes="(max-width: 640px) 25vw, (max-width: 1024px) 20vw, 12.5vw"
        className="object-contain p-1.5"
        style={{ filter: `hue-rotate(${hue}deg) saturate(1.15)` }}
      />
    );
  }

  const genericRarity = (item.rarity === "common" || item.rarity === "rare") ? item.rarity : null;
  if (genericRarity) {
    return (
      <Image
        src={`/images/items/${genericRarity}/${resolveItemFilename(item)}.png`}
        alt={item.itemName}
        fill
        sizes="(max-width: 640px) 25vw, (max-width: 1024px) 20vw, 12.5vw"
        className="object-contain p-1.5"
        style={{ filter: `hue-rotate(${hue}deg) saturate(1.15)` }}
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center">
      <GameIcon name={itemType.icon} size={48} />
    </div>
  );
};

/* ────────────────── Shop Item Tile (compact grid cell) ────────────────── */

const ShopItemTile = ({
  item,
  canAfford,
  onSelect,
}: {
  item: Item;
  canAfford: boolean;
  onSelect: (item: Item) => void;
}) => {
  const rarity = RARITY_CONFIG[item.rarity] ?? RARITY_CONFIG.common;

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={`
        group relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-xl border-2 transition-all duration-200
        ${rarity.border} ${rarity.bg} ${rarity.glow}
        hover:scale-105 hover:brightness-125 active:scale-95
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
      `}
      aria-label={`${item.itemName} — ${rarity.label}`}
      tabIndex={0}
    >
      {/* Item image — fills the tile */}
      <div className="relative flex-1 w-full overflow-hidden">
        <TileImage item={item} />
      </div>

      {/* Price strip at bottom */}
      <div className="flex w-full items-center justify-center gap-1 border-t border-slate-700/30 bg-slate-900/60 py-1">
        <GameIcon name="gold" size={20} />
        <span className={`text-[15px] font-bold leading-none ${canAfford ? "text-yellow-400" : "text-red-400"}`}>
          {(item.buyPrice ?? 0).toLocaleString()}
        </span>
      </div>
    </button>
  );
};

/* ────────────────── Item Detail Modal (Diablo-style) ────────────────── */

const ItemDetailModal = ({
  item,
  canAfford,
  onBuy,
  buying,
  characterClass,
  onClose,
}: {
  item: Item;
  canAfford: boolean;
  onBuy: (id: string) => void;
  buying: string | null;
  characterClass?: string;
  onClose: () => void;
}) => {
  const rarity = RARITY_CONFIG[item.rarity] ?? RARITY_CONFIG.common;
  const itemType = ITEM_TYPE_CONFIG[item.itemType] ?? { label: item.itemType, icon: "accessory" as GameIconKey };
  const stats = item.baseStats ?? {};
  const statEntries = Object.entries(stats).filter(([, v]) => v !== 0);
  const isBuying = buying === item.id;
  const primaryStat = getPrimaryStat(item);
  const itemClass = getItemClass(item);

  const isAffinityWeapon = (() => {
    if (item.itemType !== "weapon" || !characterClass) return false;
    const category = getWeaponCategory(item);
    if (!category) return false;
    return hasWeaponAffinity(characterClass, category);
  })();

  /* Close on Escape */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={item.itemName}
    >
      <div
        className={`
          relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl border-2 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl
          ${rarity.border} ${rarity.glow}
        `}
        style={{ animation: "scaleIn 0.2s ease-out" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close btn */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-slate-300"
          aria-label="Close"
          tabIndex={0}
        >
          ✕
        </button>

        {/* ── Header: name + icon on right ── */}
        <div className={`flex items-start gap-4 border-b border-slate-700/40 px-5 pb-4 pt-4 ${rarity.bg}`}>
          {/* Text info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${rarity.badge}`}>
                {rarity.label}
              </span>
            </div>
            <h2 className={`mt-1 font-display text-2xl font-bold leading-tight ${rarity.text}`}>
              {item.itemName}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {itemType.label} · Lv. {item.itemLevel}
            </p>
          </div>
          {/* Item icon on right */}
          <div className="flex h-44 w-44 shrink-0 items-center justify-center">
            <ItemImage item={item} size={176} />
          </div>
        </div>

        {/* ── Body ── */}
        <div className="max-h-[60vh] overflow-y-auto px-5 py-4">

          {/* Primary stat (big number like D4) */}
          {primaryStat && (
            <div className="mb-4 text-center">
              <p className="text-3xl font-black tabular-nums text-white">{primaryStat.value}</p>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{primaryStat.label}</p>
            </div>
          )}

          {/* Class / Affinity / Weapon type badges */}
          {(() => {
            const catalogItem = item.catalogId ? getCatalogItemById(item.catalogId) : null;
            const weaponCat = catalogItem?.weaponCategory;
            const twoHanded = catalogItem?.twoHanded;
            const showBadges = itemClass || isAffinityWeapon || weaponCat;
            if (!showBadges) return null;
            return (
              <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
                {itemClass && (
                  <span className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-bold ${CLASS_BADGE_STYLE[itemClass] ?? "bg-slate-800 text-slate-400 border-slate-700"}`}>
                    {CLASS_ICON[itemClass] ? <GameIcon name={CLASS_ICON[itemClass]} size={16} /> : null}
                    {CLASS_LABELS[itemClass] ?? itemClass}
                  </span>
                )}
                {weaponCat && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-slate-600/40 bg-slate-800/60 px-2.5 py-1 text-xs font-medium text-slate-300">
                    <GameIcon name="weapon" size={14} />
                    {weaponCat.charAt(0).toUpperCase() + weaponCat.slice(1)}
                    {twoHanded ? " (2H)" : ""}
                  </span>
                )}
                {isAffinityWeapon && (
                  <span className="inline-block rounded-md bg-emerald-900/50 px-2.5 py-1 text-xs font-bold text-emerald-400">
                    +{Math.round(WEAPON_AFFINITY_BONUS * 100)}% Affinity
                  </span>
                )}
              </div>
            );
          })()}

          {/* Stats list */}
          {statEntries.length > 0 && (
            <div className="mb-3 space-y-1.5 rounded-xl border border-slate-700/30 bg-slate-900/40 px-3 py-2.5">
              {statEntries.map(([key, value]) => {
                const stat = STAT_LABELS[key] ?? { label: key, icon: null, iconEmoji: "📊" };
                return (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      {stat.icon ? <GameIcon name={stat.icon} size={16} /> : <span className="text-sm">{stat.iconEmoji ?? "📊"}</span>} {stat.label}
                    </span>
                    <span className="font-bold text-emerald-400">+{value}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Set badge */}
          {item.setName && (
            <div className="mb-3 rounded-xl border border-amber-600/30 bg-amber-950/30 px-3 py-2">
              <p className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                <GameIcon name="pvp-rating" size={16} /> Set: {SET_DISPLAY_NAMES[item.setName] ?? item.setName}
              </p>
            </div>
          )}

          {/* Unique passive (from catalog) */}
          {(() => {
            const catalogItem = item.catalogId ? getCatalogItemById(item.catalogId) : null;
            if (!catalogItem?.uniquePassive) return null;
            return (
              <div className="mb-3 rounded-xl border border-indigo-700/30 bg-indigo-950/20 px-3 py-2">
                <p className="text-xs font-medium text-indigo-400">
                  ✦ {catalogItem.uniquePassive}
                </p>
              </div>
            );
          })()}

          {/* Special effect */}
          {item.specialEffect && (
            <div className="mb-3 rounded-xl border border-amber-700/30 bg-amber-950/20 px-3 py-2">
              <p className="text-xs font-medium text-amber-400/90">
                ✦ {item.specialEffect}
              </p>
            </div>
          )}

          {/* Description */}
          {item.description && (
            <p className="mb-3 text-xs italic leading-relaxed text-slate-500">
              &ldquo;{item.description}&rdquo;
            </p>
          )}

          {/* Sell value estimate */}
          <div className="mb-1 flex items-center justify-between rounded-xl border border-slate-700/30 bg-slate-900/40 px-3 py-2.5 text-sm text-slate-400">
            <span className="flex items-center gap-1.5">
              <GameIcon name="gold" size={16} /> Sell value
            </span>
            <span className="font-bold text-yellow-400">
              {Math.round((item.buyPrice ?? 0) * 0.4).toLocaleString()}
            </span>
          </div>
        </div>

        {/* ── Footer: Price + Buy ── */}
        <div className="border-t border-slate-700/40 bg-slate-900/60 px-5 py-4">
          <div className="mb-3 flex items-center justify-center gap-2">
            <GameIcon name="gold" size={22} />
            <span className={`text-lg font-black ${canAfford ? "text-yellow-400" : "text-red-400"}`}>
              {(item.buyPrice ?? 0).toLocaleString()}
            </span>
          </div>
          <GameButton
            variant={canAfford ? "primary" : "secondary"}
            onClick={() => onBuy(item.id)}
            disabled={!canAfford || isBuying}
            aria-label={`Buy ${item.itemName}`}
            tabIndex={0}
            className="w-full justify-center"
          >
            {isBuying ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Buying...
              </span>
            ) : !canAfford ? (
              "Not enough gold"
            ) : (
              "Buy"
            )}
          </GameButton>
        </div>
      </div>
    </div>
  );
};

/* ────────────────── Success Toast ────────────────── */

const BuyToast = ({ itemName, onClose }: { itemName: string; onClose: () => void }) => {
  useEffect(() => {
    const id = setTimeout(onClose, 3000);
    return () => clearTimeout(id);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-[slideUp_0.3s_ease-out] rounded-xl border border-green-700/50 bg-green-950/90 px-5 py-3 shadow-2xl shadow-green-500/10 backdrop-blur">
      <div className="flex items-center gap-3">
        <span className="text-xl">✅</span>
        <div>
          <p className="text-sm font-bold text-green-400">Purchase successful!</p>
          <p className="text-xs text-green-400/60">{itemName} added to inventory</p>
        </div>
      </div>
    </div>
  );
};

/* ────────────────── Consumable Tile (compact, same as ShopItemTile) ────────────────── */

const ConsumableTile = ({
  consumable,
  ownedQty,
  onSelect,
}: {
  consumable: ConsumableDef;
  ownedQty: number;
  onSelect: (c: ConsumableDef) => void;
}) => {
  const currencyIconKey: GameIconKey = consumable.currency === "gold" ? "gold" : "gems";

  return (
    <button
      type="button"
      onClick={() => onSelect(consumable)}
      className={`
        group relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-xl border-2 transition-all duration-200
        border-emerald-700/50 bg-emerald-950/20 shadow-[0_0_12px_rgba(16,185,129,0.06)]
        hover:scale-105 hover:brightness-125 active:scale-95
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
      `}
      aria-label={`${consumable.name} — +${consumable.staminaRestore} stamina`}
      tabIndex={0}
    >
      {/* Owned badge */}
      {ownedQty > 0 && (
        <span className="absolute left-1 top-1 z-10 rounded bg-emerald-700/80 px-1 text-[9px] font-bold text-white">
          x{ownedQty}
        </span>
      )}

      {/* Item image */}
      <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden p-2">
        <Image
          src={getConsumableImagePath(consumable.type)}
          alt={consumable.name}
          width={64}
          height={64}
          className="object-contain transition-transform duration-200 group-hover:scale-110"
        />
      </div>

      {/* Price strip at bottom */}
      <div className="flex w-full items-center justify-center gap-1 border-t border-emerald-700/30 bg-slate-900/60 py-1">
        <GameIcon name={currencyIconKey} size={20} />
        <span className="text-[15px] font-bold leading-none text-yellow-400">
          {consumable.cost.toLocaleString()}
        </span>
      </div>
    </button>
  );
};

/* ────────────────── Consumable Detail Modal ────────────────── */

const ConsumableDetailModal = ({
  consumable,
  ownedQty,
  canAfford,
  onBuy,
  buying,
  onClose,
}: {
  consumable: ConsumableDef;
  ownedQty: number;
  canAfford: boolean;
  onBuy: (type: ConsumableType) => void;
  buying: string | null;
  onClose: () => void;
}) => {
  const isBuying = buying === consumable.type;
  const atMaxStack = ownedQty >= consumable.maxStack;
  const currencyIconKey: GameIconKey = consumable.currency === "gold" ? "gold" : "gems";
  const canBuy = canAfford && !atMaxStack;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={consumable.name}
    >
      <div
        className="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl border-2 border-emerald-700/50 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl shadow-[0_0_12px_rgba(16,185,129,0.08)]"
        style={{ animation: "scaleIn 0.2s ease-out" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close btn */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-slate-300"
          aria-label="Close"
          tabIndex={0}
        >
          ✕
        </button>

        {/* ── Header: name + image on right (same layout as ItemDetailModal) ── */}
        <div className="flex items-start gap-4 border-b border-slate-700/40 bg-emerald-950/20 px-5 pb-4 pt-4">
          {/* Text info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-emerald-900/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Consumable
              </span>
            </div>
            <h2 className="mt-1 font-display text-lg font-bold leading-tight text-emerald-400">
              {consumable.name}
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Potion · +{consumable.staminaRestore} Stamina
            </p>
          </div>
          {/* Potion image on right */}
          <div className="flex h-44 w-44 shrink-0 items-center justify-center">
            <Image
              src={getConsumableImagePath(consumable.type)}
              alt={consumable.name}
              width={176}
              height={176}
              className="object-contain"
            />
          </div>
        </div>

        {/* ── Body ── */}
        <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
          {/* Primary stat (big number) */}
          <div className="mb-4 text-center">
            <p className="text-3xl font-black tabular-nums text-white">+{consumable.staminaRestore}</p>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Stamina Restore</p>
          </div>

          {/* Stats list */}
          <div className="mb-3 space-y-1.5 rounded-xl border border-slate-700/30 bg-slate-900/40 px-3 py-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-slate-400">
                <GameIcon name="stamina" size={16} /> Stamina restore
              </span>
              <span className="font-bold text-emerald-400">+{consumable.staminaRestore}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Owned</span>
              <span className={`font-bold ${atMaxStack ? "text-amber-400" : "text-slate-300"}`}>
                {ownedQty} / {consumable.maxStack}
              </span>
            </div>
          </div>

          {/* Stack limit warning */}
          {atMaxStack && (
            <div className="mb-3 rounded-xl border border-amber-700/30 bg-amber-950/20 px-3 py-2">
              <p className="text-xs font-medium text-amber-400/90">
                ✦ Max stack reached — use from inventory first
              </p>
            </div>
          )}

          {/* Description */}
          <p className="mb-3 text-xs italic leading-relaxed text-slate-500">
            &ldquo;{consumable.description}&rdquo;
          </p>
        </div>

        {/* ── Footer: Price + Buy (same layout as ItemDetailModal) ── */}
        <div className="border-t border-slate-700/40 bg-slate-900/60 px-5 py-4">
          <div className="mb-3 flex items-center justify-center gap-2">
            <GameIcon name={currencyIconKey} size={22} />
            <span className={`text-lg font-black ${canBuy ? "text-yellow-400" : "text-red-400"}`}>
              {consumable.cost.toLocaleString()}
            </span>
          </div>
          <GameButton
            variant={canBuy ? "primary" : "secondary"}
            onClick={() => onBuy(consumable.type)}
            disabled={!canBuy || isBuying}
            aria-label={`Buy ${consumable.name}`}
            tabIndex={0}
            className="w-full justify-center"
          >
            {isBuying ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Buying...
              </span>
            ) : atMaxStack ? (
              "Max stack"
            ) : !canAfford ? (
              `Not enough ${consumable.currency}`
            ) : (
              "Buy"
            )}
          </GameButton>
        </div>
      </div>
    </div>
  );
};

/* ────────────────── Main Shop ────────────────── */

function ShopContent() {
  const searchParams = useSearchParams();
  const characterId = searchParams.get("characterId");
  const [character, setCharacter] = useState<Character | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const initialTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<Tab>(
    initialTab && TABS.some((t) => t.key === initialTab) ? (initialTab as Tab) : "all"
  );
  const [sortBy, setSortBy] = useState<"price_asc" | "price_desc" | "level" | "rarity">("rarity");
  const [goldModalOpen, setGoldModalOpen] = useState(false);
  const [buyingConsumable, setBuyingConsumable] = useState<string | null>(null);
  const [consumableInv, setConsumableInv] = useState<ConsumableInventoryItem[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedConsumable, setSelectedConsumable] = useState<ConsumableDef | null>(null);

  /* ── Load data ── */
  useEffect(() => {
    if (!characterId) return;
    const controller = new AbortController();
    const loadData = async () => {
      setLoading(true);
      try {
        const [charRes, shopRes, consRes] = await Promise.all([
          fetch(`/api/characters/${characterId}`, { signal: controller.signal }),
          fetch(`/api/shop/items?characterId=${characterId}`, { signal: controller.signal }),
          fetch(`/api/consumables?characterId=${characterId}`, { signal: controller.signal }),
        ]);
        if (!charRes.ok || !shopRes.ok) throw new Error("Failed to load shop data");
        const [char, shop] = await Promise.all([charRes.json(), shopRes.json()]);
        setCharacter(char);
        setItems(shop.items ?? []);
        if (consRes.ok) {
          const consData = await consRes.json();
          setConsumableInv(consData.consumables ?? []);
        }
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Failed to load shop data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
    return () => controller.abort();
  }, [characterId]);

  /* ── Filter & sort ── */
  const filteredItems = useMemo(() => {
    if (activeTab === "potions") return [];
    let result = [...items];

    if (activeTab !== "all") {
      result = result.filter((i) => i.itemType === activeTab);
    }

    switch (sortBy) {
      case "price_asc":
        result.sort((a, b) => (a.buyPrice ?? 0) - (b.buyPrice ?? 0));
        break;
      case "price_desc":
        result.sort((a, b) => (b.buyPrice ?? 0) - (a.buyPrice ?? 0));
        break;
      case "level":
        result.sort((a, b) => b.itemLevel - a.itemLevel);
        break;
      case "rarity":
        result.sort(
          (a, b) => RARITY_ORDER.indexOf(b.rarity as Rarity) - RARITY_ORDER.indexOf(a.rarity as Rarity)
        );
        break;
    }
    return result;
  }, [items, activeTab, sortBy]);

  /* ── Buy handler ── */
  const handleBuy = useCallback(
    async (itemId: string) => {
      if (!characterId || buying) return;
      setError(null);
      setBuying(itemId);
      try {
        const res = await fetch("/api/shop/buy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ characterId, itemId }),
        });
        const data = await res.json();
        if (res.ok) {
          const item = items.find((i) => i.id === itemId);
          setCharacter((c) => (c ? { ...c, gold: c.gold - (item?.buyPrice ?? 0) } : null));
          setToast(item?.itemName ?? "Item");
          // Notify sidebar to refresh character data
          window.dispatchEvent(new Event("character-updated"));
        } else {
          setError(data.error ?? "Purchase error");
        }
      } catch {
        setError("Network error");
      } finally {
        setBuying(null);
      }
    },
    [characterId, buying, items]
  );

  /* ── Gold purchase handler ── */
  const handleGoldPurchase = useCallback((goldAdded: number, newBalance: number) => {
    setCharacter((c) => (c ? { ...c, gold: newBalance } : null));
    setToast(`+${goldAdded.toLocaleString()} Gold`);
    setGoldModalOpen(false);
  }, []);

  /* ── Buy consumable handler ── */
  const handleBuyConsumable = useCallback(
    async (consumableType: ConsumableType) => {
      if (!characterId || buyingConsumable) return;
      setError(null);
      setBuyingConsumable(consumableType);
      try {
        const res = await fetch("/api/shop/buy-consumable", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ characterId, consumableType }),
        });
        const data = await res.json();
        if (res.ok) {
          // Update gold/gems from response
          setCharacter((c) =>
            c ? { ...c, gold: data.gold ?? c.gold, gems: data.gems ?? c.gems } : null
          );
          // Update consumable inventory
          setConsumableInv((prev) => {
            const idx = prev.findIndex((ci) => ci.consumableType === consumableType);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = { ...updated[idx], quantity: data.quantity };
              return updated;
            }
            return [...prev, { consumableType, quantity: data.quantity }];
          });
          const def = CONSUMABLE_CATALOG.find((c) => c.type === consumableType);
          setToast(`${def?.icon ?? "🧪"} ${def?.name ?? "Potion"} added to inventory`);
          // Notify sidebar to refresh consumables
          window.dispatchEvent(new Event("character-updated"));
        } else {
          setError(data.error ?? "Purchase error");
        }
      } catch {
        setError("Network error");
      } finally {
        setBuyingConsumable(null);
      }
    },
    [characterId, buyingConsumable]
  );

  /* ── Category counts ── */
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: items.length + CONSUMABLE_CATALOG.length, potions: CONSUMABLE_CATALOG.length };
    for (const item of items) {
      counts[item.itemType] = (counts[item.itemType] ?? 0) + 1;
    }
    return counts;
  }, [items]);

  /* ── Loading state ── */
  if (loading || !character) {
    return <PageLoader emoji="🪙" text="Loading shop…" />;
  }

  return (
    <PageContainer>
      {/* ── Header ── */}
      <PageHeader title="Shop" />
      {/* ── Error ── */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-800/50 bg-red-950/30 px-4 py-2.5">
          <span>⚠️</span>
          <p className="text-sm text-red-400">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-auto text-xs text-red-500 hover:text-red-400"
            aria-label="Close error"
            tabIndex={0}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Toolbar: Resources + Filter + Sort in one row ── */}
      <div className="relative mb-5 flex flex-wrap items-center gap-2">
        {/* Stamina — click to jump to potions tab */}
        <button
          type="button"
          onClick={() => setActiveTab("potions")}
          className="flex items-center gap-1.5 rounded-xl border border-emerald-700/40 bg-emerald-950/30 px-3 py-1.5 transition-all duration-200 hover:border-emerald-600/60 hover:bg-emerald-900/40 active:scale-95"
          aria-label="View Potions"
          tabIndex={0}
        >
          <GameIcon name="stamina" size={18} />
          <span className="text-sm font-bold tabular-nums text-emerald-400">
            {character.currentStamina}<span className="text-xs font-medium text-emerald-600">/{character.maxStamina}</span>
          </span>
        </button>

        {/* Gems */}
        <div
          className="flex items-center gap-1.5 rounded-xl border border-purple-700/40 bg-purple-950/30 px-3 py-1.5"
          aria-label="Gems"
        >
          <GameIcon name="gems" size={18} />
          <span className="text-sm font-bold tabular-nums text-purple-400">{character.gems.toLocaleString()}</span>
        </div>

        {/* Gold — click to buy */}
        <button
          type="button"
          onClick={() => setGoldModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl border border-amber-700/40 bg-amber-950/30 px-3 py-1.5 transition-all duration-200 hover:border-amber-600/60 hover:bg-amber-900/40 active:scale-95"
          aria-label="Buy Gold"
          tabIndex={0}
        >
          <GameIcon name="gold" size={18} />
          <span className="text-sm font-bold tabular-nums text-yellow-400">{character.gold.toLocaleString()}</span>
          <span className="text-xs text-amber-500/60">+</span>
        </button>

        {/* Spacer pushes filter & sort to the right */}
        <div className="flex-1" />

        {/* Category dropdown */}
        <div className="relative min-w-[160px]">
          <button
            type="button"
            onClick={() => setFiltersOpen((prev) => !prev)}
            className="flex h-9 w-full items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-3 transition-colors hover:bg-slate-900/80"
            aria-expanded={filtersOpen}
            aria-controls="shop-category-tabs"
            aria-label="Toggle category filter"
            tabIndex={0}
          >
            <div className="flex items-center gap-2 text-sm">
              {(() => { const tab = TABS.find((t) => t.key === activeTab); return tab?.icon ? <GameIcon name={tab.icon} size={16} /> : <span className="text-sm">{tab?.iconEmoji ?? "🏪"}</span>; })()}
              <span className="font-medium text-white">
                {TABS.find((t) => t.key === activeTab)?.label ?? "All"}
              </span>
              <span className="rounded-full bg-indigo-500/30 px-1.5 py-0.5 text-[10px] font-bold text-indigo-300">
                {categoryCounts[activeTab] ?? 0}
              </span>
            </div>
            <span
              className={`text-slate-400 transition-transform duration-200 ${filtersOpen ? "rotate-180" : ""}`}
            >
              ▾
            </span>
          </button>

          {/* Collapsible tabs panel */}
          <div
            id="shop-category-tabs"
            className={`absolute right-0 top-full z-20 grid transition-all duration-200 ease-in-out ${
              filtersOpen ? "mt-1.5 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"
            }`}
          >
            <div className="overflow-hidden">
              <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-800 bg-slate-900 p-1.5 shadow-xl shadow-black/30">
                {TABS.map((tab) => {
                  const count = categoryCounts[tab.key] ?? 0;
                  const active = activeTab === tab.key;
                  if (tab.key !== "all" && count === 0) return null;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab.key);
                        setFiltersOpen(false);
                      }}
                      className={`
                        flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all
                        ${active
                          ? "border border-indigo-500/40 bg-indigo-500/15 text-white shadow-sm"
                          : "border border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                        }
                      `}
                      aria-label={tab.label}
                      aria-pressed={active}
                      tabIndex={filtersOpen ? 0 : -1}
                    >
                      {tab.icon ? <GameIcon name={tab.icon} size={16} /> : <span className="text-sm">{tab.iconEmoji}</span>}
                      <span>{tab.label}</span>
                      <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? "bg-indigo-500/30 text-indigo-300" : "bg-slate-800 text-slate-500"}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Sort (hidden on potions tab) */}
        {activeTab !== "potions" && (
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="h-9 rounded-xl border border-slate-800 bg-slate-900/50 px-2.5 text-xs text-slate-300 outline-none transition focus:border-indigo-500"
            aria-label="Sort items"
          >
            <option value="rarity">By rarity</option>
            <option value="price_asc">Price ↑</option>
            <option value="price_desc">Price ↓</option>
            <option value="level">By level</option>
          </select>
        )}
      </div>

      {/* ── Consumables Grid ── */}
      {activeTab === "potions" ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
          {CONSUMABLE_CATALOG.map((consumable) => {
            const owned = consumableInv.find((ci) => ci.consumableType === consumable.type)?.quantity ?? 0;
            return (
              <ConsumableTile
                key={consumable.type}
                consumable={consumable}
                ownedQty={owned}
                onSelect={setSelectedConsumable}
              />
            );
          })}
        </div>
      ) : /* ── Item Grid (compact icon tiles) ── */
      filteredItems.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
            {filteredItems.map((item) => (
              <ShopItemTile
                key={item.id}
                item={item}
                canAfford={character.gold >= (item.buyPrice ?? 0)}
                onSelect={setSelectedItem}
              />
            ))}
          </div>

          {/* Show potions at the bottom when viewing "All" */}
          {activeTab === "all" && (
            <>
              <h3 className="mt-6 mb-2 flex items-center gap-2 text-sm font-bold text-emerald-400">
                <span>🧪</span> Potions
              </h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
                {CONSUMABLE_CATALOG.map((consumable) => {
                  const owned = consumableInv.find((ci) => ci.consumableType === consumable.type)?.quantity ?? 0;
                  return (
                    <ConsumableTile
                      key={consumable.type}
                      consumable={consumable}
                      ownedQty={owned}
                      onSelect={setSelectedConsumable}
                    />
                  );
                })}
              </div>
            </>
          )}
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center py-16">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-slate-700">
            <GameIcon name="shop" size={48} />
          </div>
          <p className="text-sm font-medium text-slate-400">No items match current filters</p>
          <p className="mt-1 text-xs text-slate-600">Try changing category</p>
          {activeTab !== "all" && (
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className="mt-3 rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-700"
              aria-label="Reset Filters"
              tabIndex={0}
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* ── Footer info ── */}
      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-slate-500">
          <span>📦 Inventory limit: 50 items</span>
          <span>🔧 Repair and upgrades available in Inventory</span>
          <span>📈 Stock depends on your level ({character.level})</span>
        </div>
      </div>

      {/* ── Item Detail Modal ── */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          canAfford={character.gold >= (selectedItem.buyPrice ?? 0)}
          onBuy={(id) => {
            handleBuy(id);
            setSelectedItem(null);
          }}
          buying={buying}
          characterClass={character.class}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {/* ── Consumable Detail Modal ── */}
      {selectedConsumable && (
        <ConsumableDetailModal
          consumable={selectedConsumable}
          ownedQty={consumableInv.find((ci) => ci.consumableType === selectedConsumable.type)?.quantity ?? 0}
          canAfford={
            selectedConsumable.currency === "gold"
              ? character.gold >= selectedConsumable.cost
              : character.gems >= selectedConsumable.cost
          }
          onBuy={(type) => {
            handleBuyConsumable(type);
            setSelectedConsumable(null);
          }}
          buying={buyingConsumable}
          onClose={() => setSelectedConsumable(null)}
        />
      )}

      {/* ── Gold Purchase Modal ── */}
      {goldModalOpen && characterId && (
        <GoldPurchaseModal
          characterId={characterId}
          onClose={() => setGoldModalOpen(false)}
          onPurchase={handleGoldPurchase}
        />
      )}

      {/* ── Toast ── */}
      {toast && <BuyToast itemName={toast} onClose={() => setToast(null)} />}
    </PageContainer>
  );
}

/* ────────────────── Page Wrapper ────────────────── */

export default function ShopPage() {
  return (
    <Suspense fallback={<PageLoader emoji="🪙" text="Loading shop…" />}>
      <ShopContent />
    </Suspense>
  );
}
