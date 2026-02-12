"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import PageLoader from "@/app/components/PageLoader";
import {
  CONSUMABLE_CATALOG,
  type ConsumableDef,
  type ConsumableType,
} from "@/lib/game/consumable-catalog";

/* ────────────────── Constants ────────────────── */

type ItemType = "weapon" | "helmet" | "chest" | "gloves" | "legs" | "boots" | "accessory";
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

const ITEM_TYPE_CONFIG: Record<ItemType, { label: string; icon: string }> = {
  weapon: { label: "Weapon", icon: "⚔️" },
  helmet: { label: "Helmet", icon: "🪖" },
  chest: { label: "Chestplate", icon: "🛡️" },
  gloves: { label: "Gloves", icon: "🧤" },
  legs: { label: "Leggings", icon: "👖" },
  boots: { label: "Boots", icon: "🥾" },
  accessory: { label: "Accessory", icon: "💍" },
};

const STAT_LABELS: Record<string, { label: string; icon: string }> = {
  strength: { label: "Strength", icon: "💪" },
  agility: { label: "Agility", icon: "🏃" },
  vitality: { label: "Vitality", icon: "❤️" },
  intelligence: { label: "Intelligence", icon: "🧠" },
  wisdom: { label: "Wisdom", icon: "📖" },
  luck: { label: "Luck", icon: "🍀" },
  charisma: { label: "Charisma", icon: "✨" },
  crit_chance: { label: "Crit", icon: "💥" },
  crit_damage: { label: "Crit Damage", icon: "🔥" },
  armor: { label: "Armor", icon: "🛡️" },
  magic_resist: { label: "Magic Resist", icon: "🔮" },
  dodge: { label: "Dodge", icon: "💨" },
  attack: { label: "Attack", icon: "⚔️" },
  defense: { label: "Defense", icon: "🛡️" },
  hp: { label: "HP", icon: "❤️" },
  mp: { label: "MP", icon: "🔵" },
  // Item System v1.0 stats
  ATK: { label: "Attack", icon: "⚔️" },
  DEF: { label: "Defense", icon: "🛡️" },
  HP: { label: "Health", icon: "❤️" },
  CRIT: { label: "Crit", icon: "💥" },
  SPEED: { label: "Speed", icon: "⚡" },
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

type Tab = "all" | ItemType | "potions";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "all", label: "All", icon: "🏪" },
  { key: "weapon", label: "Weapons", icon: "⚔️" },
  { key: "helmet", label: "Helmets", icon: "🪖" },
  { key: "chest", label: "Armor", icon: "🛡️" },
  { key: "gloves", label: "Gloves", icon: "🧤" },
  { key: "legs", label: "Leggings", icon: "👖" },
  { key: "boots", label: "Boots", icon: "🥾" },
  { key: "accessory", label: "Accessories", icon: "💍" },
  { key: "potions", label: "Potions", icon: "🧪" },
];

const RARITY_ORDER: Rarity[] = ["common", "uncommon", "rare", "epic", "legendary"];

/* ────────────────── Gold Packages ────────────────── */

type GoldPackage = {
  id: string;
  gold: number;
  priceUsd: number;
  label: string;
  icon: string;
  popular?: boolean;
};

const GOLD_PACKAGES: GoldPackage[] = [
  { id: "gold_1000", gold: 1000, priceUsd: 0.99, label: "Pouch of Gold", icon: "💰" },
  { id: "gold_5000", gold: 5000, priceUsd: 3.99, label: "Chest of Gold", icon: "🏆", popular: true },
  { id: "gold_10000", gold: 10000, priceUsd: 6.99, label: "Vault of Gold", icon: "👑" },
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
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-amber-600/50 bg-gradient-to-br from-amber-800/30 to-amber-900/50 text-3xl shadow-lg shadow-amber-500/20">
            🪙
          </div>
          <h2 className="text-xl font-bold text-white">Buy Gold</h2>
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
                      flex h-12 w-12 items-center justify-center rounded-xl text-2xl
                      ${pkg.popular
                        ? "border-2 border-amber-600/40 bg-amber-900/40"
                        : "border border-slate-700 bg-slate-800"
                      }
                    `}
                  >
                    {pkg.icon}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{pkg.label}</p>
                    <p className="flex items-center gap-1 text-lg font-black text-yellow-400">
                      🪙 {pkg.gold.toLocaleString()}
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
                      : "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-500 hover:to-indigo-400 active:scale-95"
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

/* ────────────────── Item Card ────────────────── */

const ItemCard = ({
  item,
  canAfford,
  onBuy,
  buying,
}: {
  item: Item;
  canAfford: boolean;
  onBuy: (id: string) => void;
  buying: string | null;
}) => {
  const [hovered, setHovered] = useState(false);
  const rarity = RARITY_CONFIG[item.rarity] ?? RARITY_CONFIG.common;
  const itemType = ITEM_TYPE_CONFIG[item.itemType] ?? { label: item.itemType, icon: "📦" };
  const stats = item.baseStats ?? {};
  const statEntries = Object.entries(stats).filter(([, v]) => v !== 0);
  const isBuying = buying === item.id;

  return (
    <div
      className={`
        group relative flex flex-col overflow-hidden rounded-xl border transition-all duration-300
        ${rarity.border} ${rarity.bg} ${rarity.glow}
        hover:scale-[1.02] hover:brightness-110
      `}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="article"
      aria-label={`${item.itemName} — ${rarity.label}`}
    >
      {/* Top badge row */}
      <div className="flex items-center justify-between px-3 pt-3">
        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${rarity.badge}`}>
          {rarity.label}
        </span>
        <span className="rounded-md bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-slate-400">
          Lv. {item.itemLevel}
        </span>
      </div>

      {/* Item icon + name */}
      <div className="flex flex-col items-center px-3 pb-2 pt-3">
        <div
          className={`
            mb-2 flex h-16 w-16 items-center justify-center rounded-xl border-2 
            ${rarity.border} bg-slate-900/80 text-3xl transition-transform duration-300
            ${hovered ? "scale-110 rotate-3" : ""}
          `}
        >
          {itemType.icon}
        </div>
        <p className={`text-center text-sm font-bold leading-tight ${rarity.text}`}>{item.itemName}</p>
        <p className="mt-0.5 text-center text-[11px] text-slate-500">{itemType.label}</p>
      </div>

      {/* Stats */}
      {statEntries.length > 0 && (
        <div className="mx-3 mb-2 space-y-1 rounded-lg border border-slate-700/30 bg-slate-900/40 px-2.5 py-2">
          {statEntries.map(([key, value]) => {
            const stat = STAT_LABELS[key] ?? { label: key, icon: "📊" };
            return (
              <div key={key} className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">
                  {stat.icon} {stat.label}
                </span>
                <span className="font-bold text-emerald-400">+{value}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Set / class restriction badge */}
      {item.setName && (
        <div className="mx-3 mb-2 rounded-lg border border-amber-600/30 bg-amber-950/30 px-2.5 py-1.5">
          <p className="text-[10px] font-bold text-amber-400">
            {SET_DISPLAY_NAMES[item.setName] ?? item.setName}
          </p>
          {item.classRestriction && (
            <p className="text-[9px] text-amber-500/70">
              {CLASS_LABELS[item.classRestriction] ?? item.classRestriction} only
            </p>
          )}
        </div>
      )}

      {/* Description */}
      {item.description && (
        <div className="mx-3 mb-2">
          <p className="text-[10px] italic text-slate-500">{item.description}</p>
        </div>
      )}

      {/* Special effect */}
      {item.specialEffect && (
        <div className="mx-3 mb-2 rounded-lg border border-amber-700/30 bg-amber-950/20 px-2.5 py-1.5">
          <p className="text-[10px] font-medium text-amber-400/80">
            ✦ {item.specialEffect}
          </p>
        </div>
      )}

      {/* Price + Buy */}
      <div className="mt-auto border-t border-slate-700/30 bg-slate-900/40 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-lg">🪙</span>
            <span className={`text-sm font-bold ${canAfford ? "text-yellow-400" : "text-red-400"}`}>
              {(item.buyPrice ?? 0).toLocaleString()}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onBuy(item.id)}
            disabled={!canAfford || isBuying}
            className={`
              rounded-lg px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-all duration-200
              ${canAfford
                ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-500 hover:to-indigo-400 hover:shadow-indigo-500/30 active:scale-95"
                : "cursor-not-allowed bg-slate-800 text-slate-600"
              }
              disabled:opacity-60
            `}
            aria-label={`Buy ${item.itemName}`}
            tabIndex={0}
          >
            {isBuying ? (
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white" />
                ...
              </span>
            ) : (
              "Buy"
            )}
          </button>
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

/* ────────────────── Consumable Card ────────────────── */

const ConsumableCard = ({
  consumable,
  ownedQty,
  canAfford,
  onBuy,
  buying,
}: {
  consumable: ConsumableDef;
  ownedQty: number;
  canAfford: boolean;
  onBuy: (type: ConsumableType) => void;
  buying: string | null;
}) => {
  const [hovered, setHovered] = useState(false);
  const isBuying = buying === consumable.type;
  const atMaxStack = ownedQty >= consumable.maxStack;
  const currencyIcon = consumable.currency === "gold" ? "🪙" : "💎";

  return (
    <div
      className={`
        group relative flex flex-col overflow-hidden rounded-xl border transition-all duration-300
        border-emerald-700/50 bg-emerald-950/20
        shadow-[0_0_16px_rgba(16,185,129,0.08)]
        hover:scale-[1.02] hover:brightness-110
      `}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="article"
      aria-label={consumable.name}
    >
      {/* Top badge */}
      <div className="flex items-center justify-between px-3 pt-3">
        <span className="rounded-md bg-emerald-900/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
          Consumable
        </span>
        <span className="rounded-md bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
          +{consumable.staminaRestore} ⚡
        </span>
      </div>

      {/* Icon + name */}
      <div className="flex flex-col items-center px-3 pb-2 pt-3">
        <div
          className={`
            mb-2 flex h-16 w-16 items-center justify-center rounded-xl border-2 
            border-emerald-700/50 bg-slate-900/80 text-3xl transition-transform duration-300
            ${hovered ? "scale-110 rotate-3" : ""}
          `}
        >
          {consumable.icon}
        </div>
        <p className="text-center text-sm font-bold leading-tight text-emerald-400">{consumable.name}</p>
      </div>

      {/* Description */}
      <div className="mx-3 mb-2">
        <p className="text-[10px] italic text-slate-500">{consumable.description}</p>
      </div>

      {/* Stats */}
      <div className="mx-3 mb-2 space-y-1.5 rounded-lg border border-slate-700/30 bg-slate-900/40 px-2.5 py-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400">⚡ Stamina restore</span>
          <span className="font-bold text-emerald-400">+{consumable.staminaRestore}</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400">📦 Owned</span>
          <span className={`font-bold ${ownedQty >= consumable.maxStack ? "text-amber-400" : "text-slate-300"}`}>
            {ownedQty} / {consumable.maxStack}
          </span>
        </div>
      </div>

      {/* Stack limit info */}
      <div className="mx-3 mb-2 rounded-lg border border-amber-700/30 bg-amber-950/20 px-2.5 py-1.5">
        <p className="text-[10px] font-medium text-amber-400/80">
          ✦ Max stack: {consumable.maxStack} · Use from inventory
        </p>
      </div>

      {/* Price + Buy */}
      <div className="mt-auto border-t border-slate-700/30 bg-slate-900/40 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-lg">{currencyIcon}</span>
            <span className={`text-sm font-bold ${canAfford && !atMaxStack ? "text-yellow-400" : "text-red-400"}`}>
              {consumable.cost.toLocaleString()}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onBuy(consumable.type)}
            disabled={!canAfford || isBuying || atMaxStack}
            className={`
              rounded-lg px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-all duration-200
              ${canAfford && !atMaxStack
                ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-emerald-400 hover:shadow-emerald-500/30 active:scale-95"
                : "cursor-not-allowed bg-slate-800 text-slate-600"
              }
              disabled:opacity-60
            `}
            aria-label={`Buy ${consumable.name}`}
            tabIndex={0}
          >
            {isBuying ? (
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white" />
                ...
              </span>
            ) : atMaxStack ? (
              "Max"
            ) : (
              "Buy"
            )}
          </button>
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

  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [rarityFilter, setRarityFilter] = useState<Rarity | "all">("all");
  const [sortBy, setSortBy] = useState<"price_asc" | "price_desc" | "level" | "rarity">("rarity");
  const [goldModalOpen, setGoldModalOpen] = useState(false);
  const [buyingConsumable, setBuyingConsumable] = useState<string | null>(null);
  const [consumableInv, setConsumableInv] = useState<ConsumableInventoryItem[]>([]);

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
    if (rarityFilter !== "all") {
      result = result.filter((i) => i.rarity === rarityFilter);
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
  }, [items, activeTab, rarityFilter, sortBy]);

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
    const counts: Record<string, number> = { all: items.length, potions: CONSUMABLE_CATALOG.length };
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
    <div className="flex min-h-full flex-col p-4 lg:p-6">
      {/* ── Header ── */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-amber-700/50 bg-gradient-to-br from-amber-900/40 to-amber-950/60 text-2xl shadow-lg shadow-amber-500/10">
              🏪
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Shop</h1>
              <p className="text-xs text-slate-500">Items matched to your level</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Stamina display */}
            <div
              className="flex items-center gap-2 rounded-xl border border-emerald-700/40 bg-gradient-to-r from-emerald-900/30 to-emerald-950/50 px-4 py-2 shadow-lg shadow-emerald-500/5"
              aria-label="Current Stamina"
            >
              <span className="text-xl">⚡</span>
              <div className="text-left">
                <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-600">Stamina</p>
                <p className="text-lg font-black tabular-nums text-emerald-400">
                  {character.currentStamina}
                  <span className="text-sm font-medium text-emerald-600">/{character.maxStamina}</span>
                </p>
              </div>
            </div>

            {/* Gems display */}
            <div
              className="flex items-center gap-2 rounded-xl border border-purple-700/40 bg-gradient-to-r from-purple-900/30 to-purple-950/50 px-4 py-2 shadow-lg shadow-purple-500/5"
              aria-label="Gems"
            >
              <span className="text-xl">💎</span>
              <div className="text-left">
                <p className="text-[10px] font-medium uppercase tracking-wider text-purple-600">Gems</p>
                <p className="text-lg font-black tabular-nums text-purple-400">{character.gems.toLocaleString()}</p>
              </div>
            </div>

            {/* Gold display — clickable to open purchase modal */}
            <button
              type="button"
              onClick={() => setGoldModalOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-amber-700/40 bg-gradient-to-r from-amber-900/30 to-amber-950/50 px-4 py-2 shadow-lg shadow-amber-500/5 transition-all duration-200 hover:border-amber-600/60 hover:shadow-amber-500/15 hover:brightness-110 active:scale-95"
              aria-label="Buy Gold"
              tabIndex={0}
            >
              <span className="text-xl">🪙</span>
              <div className="text-left">
                <p className="text-[10px] font-medium uppercase tracking-wider text-amber-600">Gold</p>
                <p className="text-lg font-black tabular-nums text-yellow-400">{character.gold.toLocaleString()}</p>
              </div>
              <span className="ml-1 text-lg text-amber-500/60">+</span>
            </button>
          </div>
        </div>
      </div>

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

      {/* ── Category Tabs ── */}
      <div className="mb-4 overflow-x-auto">
        <div className="flex gap-1.5 rounded-xl border border-slate-800 bg-slate-900/50 p-1.5">
          {TABS.map((tab) => {
            const count = categoryCounts[tab.key] ?? 0;
            const active = activeTab === tab.key;
            if (tab.key !== "all" && count === 0) return null;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`
                  flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-all
                  ${active
                    ? "border border-indigo-500/40 bg-indigo-500/15 text-white shadow-sm"
                    : "border border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  }
                `}
                aria-label={tab.label}
                aria-pressed={active}
                tabIndex={0}
              >
                <span className="text-sm">{tab.icon}</span>
                <span>{tab.label}</span>
                <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? "bg-indigo-500/30 text-indigo-300" : "bg-slate-800 text-slate-500"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Filters row (hidden on potions tab) ── */}
      {activeTab !== "potions" && (
        <div className="mb-5 flex flex-wrap items-center gap-3">
          {/* Rarity filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-600">Rarity:</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setRarityFilter("all")}
                className={`rounded-md px-2 py-1 text-[11px] font-medium transition ${rarityFilter === "all" ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300"}`}
                aria-label="All rarities"
                aria-pressed={rarityFilter === "all"}
                tabIndex={0}
              >
                All
              </button>
              {RARITY_ORDER.map((r) => {
                const conf = RARITY_CONFIG[r];
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRarityFilter(r)}
                    className={`rounded-md px-2 py-1 text-[11px] font-medium transition ${rarityFilter === r ? `${conf.badge}` : "text-slate-500 hover:text-slate-300"}`}
                    aria-label={conf.label}
                    aria-pressed={rarityFilter === r}
                    tabIndex={0}
                  >
                    {conf.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sort */}
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-600">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-300 outline-none transition focus:border-indigo-500"
              aria-label="Sort items"
            >
              <option value="rarity">By rarity</option>
              <option value="price_asc">Price ↑</option>
              <option value="price_desc">Price ↓</option>
              <option value="level">By level</option>
            </select>
          </div>
        </div>
      )}

      {/* ── Consumables Grid ── */}
      {activeTab === "potions" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {CONSUMABLE_CATALOG.map((consumable) => {
            const owned = consumableInv.find((ci) => ci.consumableType === consumable.type)?.quantity ?? 0;
            const canAfford = consumable.currency === "gold"
              ? character.gold >= consumable.cost
              : character.gems >= consumable.cost;
            return (
              <ConsumableCard
                key={consumable.type}
                consumable={consumable}
                ownedQty={owned}
                canAfford={canAfford}
                onBuy={handleBuyConsumable}
                buying={buyingConsumable}
              />
            );
          })}
        </div>
      ) : /* ── Item Grid ── */
      filteredItems.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              canAfford={character.gold >= (item.buyPrice ?? 0)}
              onBuy={handleBuy}
              buying={buying}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center py-16">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-slate-700 text-4xl">
            🏪
          </div>
          <p className="text-sm font-medium text-slate-400">No items match current filters</p>
          <p className="mt-1 text-xs text-slate-600">Try changing category or rarity</p>
          {activeTab !== "all" && (
            <button
              type="button"
              onClick={() => { setActiveTab("all"); setRarityFilter("all"); }}
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
    </div>
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
