"use client";

import { memo, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import PageHeader from "@/app/components/PageHeader";
import PageLoader from "@/app/components/PageLoader";
import { xpForLevel } from "@/lib/game/progression";
import { goldCostForStatTraining } from "@/lib/game/stat-training";
import { isWeaponTwoHanded } from "@/lib/game/item-catalog";
import { MAX_STAT_VALUE } from "@/lib/game/balance";
import {
  WEAPON_AFFINITY_BONUS,
  getWeaponCategory,
  hasWeaponAffinity,
} from "@/lib/game/weapon-affinity";
import useCharacterAvatar from "@/app/hooks/useCharacterAvatar";

/* ────────────────── Types ────────────────── */

type BaseStats = Record<string, number>;

type ItemDef = {
  id: string;
  catalogId: string | null;
  itemName: string;
  itemType: string;
  rarity: string;
  itemLevel: number;
  baseStats: BaseStats;
  specialEffect: string | null;
  uniquePassive: string | null;
  description: string | null;
  imageUrl: string | null;
};

type InventoryItem = {
  id: string;
  item: ItemDef;
  isEquipped: boolean;
  equippedSlot: string | null;
  durability: number;
  maxDurability: number;
  upgradeLevel: number;
  rolledStats: BaseStats | null;
};

type CharStats = { str: number; agi: number; vit: number; end: number; int: number; wis: number; lck: number; cha: number };
type DerivedStats = {
  physicalDamage: number;
  magicDamage: number;
  defense: number;
  magicDefense: number;
  critChance: number;
  critDamage: number;
  dodgeChance: number;
  armorReduction: number;
  magicResistPercent: number;
  maxHp: number;
};

type CharacterData = {
  id: string;
  characterName: string;
  class: string;
  origin?: string;
  level: number;
  currentXp: number;
  prestigeLevel: number;
  gold: number;
  maxHp: number;
  currentHp: number;
  armor: number;
  magicResist: number;
  pvpRating: number;
  pvpWins: number;
  pvpLosses: number;
  statPointsAvailable: number;
  currentStamina: number;
  maxStamina: number;
  stats: CharStats;
  derived: DerivedStats;
};

type ApiResponse = {
  character: CharacterData;
  equipped: InventoryItem[];
  unequipped: InventoryItem[];
  items: InventoryItem[];
};

/* ────────────────── Constants ────────────────── */

const CLASS_ICON: Record<string, string> = {
  warrior: "⚔️",
  rogue: "🗡️",
  mage: "🔮",
  tank: "🛡️",
};

const ORIGIN_IMAGE: Record<string, string> = {
  human: "/images/origins/Avatar/origin-human_avatar_1.png",
  orc: "/images/origins/Avatar/origin-orc_avatar_1.png",
  skeleton: "/images/origins/Avatar/origin-skeleton_avatar_1.png",
  demon: "/images/origins/Avatar/origin-demon_avatar_1.png",
  dogfolk: "/images/origins/Avatar/origin-dogfolk_avatar_1.png",
};

const SLOT_ORDER = ["helmet", "weapon", "weapon_offhand", "chest", "gloves", "legs", "boots", "ring", "accessory", "amulet", "belt", "relic"] as const;
type SlotKey = (typeof SLOT_ORDER)[number];

const SLOT_LABELS: Record<SlotKey, string> = {
  helmet: "Helmet",
  weapon: "Main Hand",
  weapon_offhand: "Off Hand",
  chest: "Chestplate",
  gloves: "Gloves",
  legs: "Pants",
  boots: "Boots",
  ring: "Ring",
  accessory: "Accessory",
  amulet: "Amulet",
  belt: "Belt",
  relic: "Relic",
};

const SLOT_ICONS: Record<SlotKey, string> = {
  helmet: "👑",
  weapon: "⚔️",
  weapon_offhand: "🗡️",
  chest: "🛡️",
  gloves: "🧤",
  legs: "👖",
  boots: "👢",
  ring: "💍",
  accessory: "💍",
  amulet: "🧿",
  belt: "🪢",
  relic: "🔮",
};

const RARITY_BORDER: Record<string, string> = {
  common: "border-slate-400",
  uncommon: "border-green-500",
  rare: "border-blue-500",
  epic: "border-purple-500",
  legendary: "border-amber-500",
};

const RARITY_BG: Record<string, string> = {
  common: "bg-slate-800/60",
  uncommon: "bg-green-950/60",
  rare: "bg-blue-950/60",
  epic: "bg-purple-950/60",
  legendary: "bg-amber-950/60",
};

const RARITY_TEXT: Record<string, string> = {
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

const CLASS_LABEL: Record<string, string> = {
  warrior: "Warrior",
  rogue: "Rogue",
  mage: "Mage",
  tank: "Tank",
};

const CLASS_BADGE_ICON: Record<string, string> = {
  warrior: "⚔️",
  rogue: "🗡️",
  mage: "🔮",
  tank: "🛡️",
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

/** Determine the recommended class for an inventory item */
const getInvItemClass = (inv: InventoryItem): string | null => {
  if (inv.item.itemType !== "weapon") return null;
  const cat = getWeaponCategory(inv.item);
  if (cat) return WEAPON_CATEGORY_CLASS[cat] ?? null;
  return null;
};

const INVENTORY_SLOTS_TOTAL = 50;

/* ────────────────── Helpers ────────────────── */

const getItemStats = (inv: InventoryItem): BaseStats => {
  const base = typeof inv.item.baseStats === "object" && inv.item.baseStats ? inv.item.baseStats : {};
  const rolled = typeof inv.rolledStats === "object" && inv.rolledStats ? inv.rolledStats : {};
  const merged: BaseStats = { ...base };
  for (const [k, v] of Object.entries(rolled)) {
    merged[k] = (merged[k] ?? 0) + (typeof v === "number" ? v : 0);
  }
  return merged;
};

const statLabel: Record<string, string> = {
  strength: "Strength",
  agility: "Agility",
  vitality: "Vitality",
  endurance: "Endurance",
  intelligence: "Intelligence",
  wisdom: "Wisdom",
  luck: "Luck",
  charisma: "Charisma",
  armor: "Armor",
  crit_chance: "Crit%",
  crit_damage: "Crit Damage",
  dodge: "Dodge%",
  hp: "Health",
  // Item System v1.0 stats
  ATK: "Attack",
  DEF: "Defense",
  HP: "Health",
  CRIT: "Crit",
  SPEED: "Speed",
};

/** Check if an inventory weapon item has class affinity */
const checkWeaponAffinity = (inv: InventoryItem, characterClass: string): boolean => {
  if (inv.item.itemType !== "weapon") return false;
  const category = getWeaponCategory(inv.item);
  if (!category) return false;
  return hasWeaponAffinity(characterClass, category);
};

/* ────────────────── Item Tooltip ────────────────── */

type TooltipProps = {
  inv: InventoryItem;
  /** Currently equipped item in the same slot — for stat comparison */
  equippedItem?: InventoryItem | null;
  style?: React.CSSProperties;
  /** Character class for affinity check */
  characterClass?: string;
};

const ItemTooltip = ({ inv, equippedItem, style, characterClass }: TooltipProps) => {
  const stats = getItemStats(inv);
  const equippedStats = equippedItem ? getItemStats(equippedItem) : null;
  const rarity = inv.item.rarity;
  const showAffinity = characterClass ? checkWeaponAffinity(inv, characterClass) : false;
  const itemClass = getInvItemClass(inv);

  /* Collect all stat keys from both items for comparison */
  const allStatKeys = equippedStats
    ? Array.from(new Set([...Object.keys(stats), ...Object.keys(equippedStats)]))
    : Object.keys(stats);

  return (
    <div
      className={`pointer-events-none absolute z-50 w-72 rounded-lg border-2 p-3 shadow-2xl ${RARITY_BORDER[rarity] ?? "border-slate-600"} bg-slate-900/95 text-sm`}
      style={style}
    >
      <p className={`font-bold ${RARITY_TEXT[rarity] ?? "text-white"}`}>
        {inv.item.itemName}
        {inv.upgradeLevel > 0 && <span className="text-yellow-400"> +{inv.upgradeLevel}</span>}
      </p>
      <p className="text-xs text-slate-400">
        {RARITY_LABEL[rarity] ?? rarity} · {SLOT_LABELS[inv.item.itemType as SlotKey] ?? inv.item.itemType} · Lv. {inv.item.itemLevel}
      </p>
      {itemClass && (
        <span className={`mt-1 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold ${CLASS_BADGE_STYLE[itemClass] ?? "bg-slate-800 text-slate-400 border-slate-700"}`}>
          <span className="text-xs">{CLASS_BADGE_ICON[itemClass] ?? "👤"}</span>
          {CLASS_LABEL[itemClass] ?? itemClass}
        </span>
      )}
      {showAffinity && (
        <p className="mt-1 text-xs font-semibold text-emerald-400">
          +{Math.round(WEAPON_AFFINITY_BONUS * 100)}% Affinity Bonus
        </p>
      )}

      {allStatKeys.length > 0 && (
        <div className="mt-2 space-y-0.5">
          {allStatKeys.map((k) => {
            const val = stats[k] ?? 0;
            const eqVal = equippedStats?.[k] ?? 0;
            const diff = equippedStats ? val - eqVal : 0;

            return (
              <p key={k} className="flex items-center gap-1 text-green-400">
                <span>+{val} {statLabel[k] ?? k}</span>
                {equippedStats && diff !== 0 && (
                  <span className={`text-xs font-semibold ${diff > 0 ? "text-emerald-400" : "text-red-400"}`}>
                    ({diff > 0 ? "▲" : "▼"}{Math.abs(diff)})
                  </span>
                )}
              </p>
            );
          })}
        </div>
      )}

      {inv.item.specialEffect && (
        <p className="mt-2 text-xs text-yellow-300">✨ {inv.item.specialEffect}</p>
      )}

      {inv.item.uniquePassive && (
        <p className="mt-2 text-xs text-cyan-300">🔮 {inv.item.uniquePassive}</p>
      )}

      {inv.item.description && (
        <p className="mt-2 text-xs italic text-slate-400">{inv.item.description}</p>
      )}

      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
        <span>Durability: {inv.durability}/{inv.maxDurability}</span>
      </div>

      {/* Equipped item comparison header */}
      {equippedItem && (
        <div className="mt-2 border-t border-slate-700 pt-2">
          <p className="text-[10px] text-slate-500">
            Compared to: <span className={RARITY_TEXT[equippedItem.item.rarity] ?? "text-white"}>{equippedItem.item.itemName}{equippedItem.upgradeLevel > 0 ? ` +${equippedItem.upgradeLevel}` : ""}</span>
          </p>
        </div>
      )}
    </div>
  );
};

/* ────────────────── Equipment Slot Component ────────────────── */

type EquipSlotProps = {
  slotKey: SlotKey;
  item: InventoryItem | undefined;
  onUnequip: (id: string) => void;
  onHoverItem: (inv: InventoryItem | null, e?: React.MouseEvent) => void;
  onSelectItem: (inv: InventoryItem | null) => void;
  /** Visually lock the slot (e.g. offhand blocked by two-handed weapon) */
  locked?: boolean;
  lockReason?: string;
  /* ── Drag & Drop ── */
  onDragStart?: (inv: InventoryItem, source: "equip", slot: SlotKey) => void;
  onDragEnd?: () => void;
  onDropItem?: (targetSlot: SlotKey) => void;
  isDragOver?: boolean;
  onDragOverSlot?: (slot: SlotKey) => void;
  onDragLeaveSlot?: () => void;
  /** This slot is a valid drop target for the currently dragged item */
  isValidTarget?: boolean;
  /** Show affinity indicator on weapon slots */
  hasAffinity?: boolean;
};

const EquipmentSlot = ({
  slotKey, item, onUnequip, onHoverItem, onSelectItem,
  locked, lockReason,
  onDragStart, onDragEnd, onDropItem,
  isDragOver, onDragOverSlot, onDragLeaveSlot,
  isValidTarget,
  hasAffinity,
}: EquipSlotProps) => {
  const rarity = item?.item.rarity ?? "";

  const handleDragStart = (e: React.DragEvent) => {
    if (locked || !item || !onDragStart) return;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", item.id);
    onDragStart(item, "equip", slotKey);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (locked) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    onDragOverSlot?.(slotKey);
  };

  const handleDragLeave = () => {
    onDragLeaveSlot?.();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDragLeaveSlot?.();
    if (locked) return;
    onDropItem?.(slotKey);
  };

  return (
    <button
      type="button"
      draggable={!locked && !!item}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`group relative flex h-16 w-16 items-center justify-center rounded-lg border-2 transition-all
        ${isDragOver && !locked
          ? "ring-2 ring-indigo-400 border-indigo-400 scale-110 bg-indigo-900/30"
          : isValidTarget && !locked
            ? "ring-2 ring-emerald-400/60 border-emerald-400 bg-emerald-900/20 animate-pulse"
            : ""
        }
        ${locked
          ? "border-slate-700/30 bg-slate-900/60 opacity-40 cursor-not-allowed"
          : item
            ? `${!isDragOver && !isValidTarget ? RARITY_BORDER[rarity] : ""} ${RARITY_BG[rarity]} hover:brightness-125`
            : `${!isDragOver && !isValidTarget ? "border-slate-600/50" : ""} bg-slate-800/40 hover:border-slate-500`
        }
      `}
      aria-label={locked ? `${SLOT_LABELS[slotKey]} (${lockReason ?? "locked"})` : `${SLOT_LABELS[slotKey]}${item ? `: ${item.item.itemName}` : " (empty)"}`}
      tabIndex={locked ? -1 : 0}
      disabled={locked}
      onClick={() => {
        if (!locked && item) onSelectItem(item);
      }}
      onMouseEnter={(e) => !locked && item && onHoverItem(item, e)}
      onMouseLeave={() => onHoverItem(null)}
      onContextMenu={(e) => {
        e.preventDefault();
        if (!locked && item) onUnequip(item.id);
      }}
    >
      {locked ? (
        <span className="text-xl opacity-20">🔒</span>
      ) : item ? (
        <span className="text-2xl" title={item.item.itemName}>
          {SLOT_ICONS[slotKey === "weapon_offhand" ? "weapon_offhand" : (item.item.itemType as SlotKey)] ?? "📦"}
        </span>
      ) : (
        <span className="text-xl opacity-20">{SLOT_ICONS[slotKey]}</span>
      )}

      {!locked && item && item.upgradeLevel > 0 && (
        <span className="absolute -right-1 -top-1 rounded bg-yellow-600 px-1 text-[10px] font-bold text-white">
          +{item.upgradeLevel}
        </span>
      )}

      {!locked && item && hasAffinity && (
        <span
          className="absolute -bottom-1 -left-1 rounded bg-emerald-600 px-1 text-[8px] font-bold text-white"
          title={`Affinity +${Math.round(WEAPON_AFFINITY_BONUS * 100)}%`}
        >
          +{Math.round(WEAPON_AFFINITY_BONUS * 100)}%
        </span>
      )}

    </button>
  );
};

/* ────────────────── Inventory Cell Component ────────────────── */

type InvCellProps = {
  inv?: InventoryItem;
  onEquip: (inventoryId: string, itemType: string) => void;
  onHoverItem: (inv: InventoryItem | null, e?: React.MouseEvent) => void;
  onSelectItem: (inv: InventoryItem | null) => void;
  /* ── Drag & Drop ── */
  onDragStart?: (inv: InventoryItem, source: "bag") => void;
  onDragEnd?: () => void;
  /** Drop of an equipped item onto the bag area → unequip */
  onDropToBag?: () => void;
  isDragOver?: boolean;
  onDragOverBag?: () => void;
  onDragLeaveBag?: () => void;
};

const InventoryCell = memo(({
  inv, onEquip, onHoverItem, onSelectItem,
  onDragStart, onDragEnd,
  onDropToBag, isDragOver, onDragOverBag, onDragLeaveBag,
}: InvCellProps) => {

  const handleDragStart = (e: React.DragEvent) => {
    if (!inv || !onDragStart) return;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", inv.id);
    onDragStart(inv, "bag");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    onDragOverBag?.();
  };

  const handleDragLeave = () => {
    onDragLeaveBag?.();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDragLeaveBag?.();
    onDropToBag?.();
  };

  if (!inv) {
    return (
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-md border transition-all
          ${isDragOver ? "border-indigo-400 bg-indigo-900/30 ring-2 ring-indigo-400 scale-105" : "border-slate-700/40 bg-slate-800/30"}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      />
    );
  }

  const rarity = inv.item.rarity;

  return (
    <button
      type="button"
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex h-14 w-14 items-center justify-center rounded-md border-2 transition-all hover:brightness-125 cursor-grab active:cursor-grabbing
        ${isDragOver ? "ring-2 ring-indigo-400 scale-105" : ""}
        ${RARITY_BORDER[rarity] ?? "border-slate-600"} ${RARITY_BG[rarity] ?? "bg-slate-800/60"}
      `}
      aria-label={`${inv.item.itemName} — drag to equip or click to select`}
      tabIndex={0}
      onClick={() => onSelectItem(inv)}
      onDoubleClick={() => onEquip(inv.id, inv.item.itemType)}
      onMouseEnter={(e) => onHoverItem(inv, e)}
      onMouseLeave={() => onHoverItem(null)}
    >
      <span className="text-lg">{SLOT_ICONS[inv.item.itemType as SlotKey] ?? "📦"}</span>
      {inv.upgradeLevel > 0 && (
        <span className="absolute -right-0.5 -top-0.5 rounded bg-yellow-600 px-0.5 text-[9px] font-bold text-white">
          +{inv.upgradeLevel}
        </span>
      )}
      {inv.durability < inv.maxDurability * 0.3 && (
        <span className="absolute -bottom-0.5 -left-0.5 rounded bg-red-600 px-0.5 text-[9px] text-white">⚠</span>
      )}
      {(() => {
        const cls = getInvItemClass(inv);
        if (!cls) return null;
        return (
          <span
            className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[8px] shadow ring-1 ring-slate-700"
            title={CLASS_LABEL[cls] ?? cls}
          >
            {CLASS_BADGE_ICON[cls] ?? "👤"}
          </span>
        );
      })()}
    </button>
  );
});
InventoryCell.displayName = "InventoryCell";

/* ────────────────── Tab: Attributes ────────────────── */


type AttrTabProps = {
  stats: CharStats;
  derived: DerivedStats;
  armor: number;
  gold: number;
  statPointsAvailable: number;
  upgradeMode: "points" | "gold";
  onToggleMode: () => void;
  onAllocate: (statKey: string, mode: "points" | "gold") => void;
  isAllocating: boolean;
};

const AttributesTab = ({
  stats,
  derived,
  armor,
  gold,
  statPointsAvailable,
  upgradeMode,
  onToggleMode,
  onAllocate,
  isAllocating,
}: AttrTabProps) => {
  const rows: { label: string; statKey: string | null; value: number; secondary: string; secondaryValue: string; color: string }[] = [
    { label: "STR", statKey: "strength", value: stats.str, secondary: "DMG", secondaryValue: `${derived.physicalDamage}`, color: "text-red-400" },
    { label: "VIT", statKey: "vitality", value: stats.vit, secondary: "HP", secondaryValue: `${derived.maxHp}`, color: "text-green-400" },
    { label: "AGI", statKey: "agility", value: stats.agi, secondary: "DODGE", secondaryValue: `${derived.dodgeChance}%`, color: "text-cyan-400" },
    { label: "LCK", statKey: "luck", value: stats.lck, secondary: "CRIT", secondaryValue: `${derived.critChance}%`, color: "text-yellow-400" },
    { label: "INT", statKey: "intelligence", value: stats.int, secondary: "MDMG", secondaryValue: `${derived.magicDamage}`, color: "text-blue-400" },
    { label: "ARMOR", statKey: null, value: armor, secondary: "DMG RED.", secondaryValue: `${derived.armorReduction}%`, color: "text-orange-400" },
  ];

  const canUpgradeWithPoints = statPointsAvailable > 0;
  const hasMode = upgradeMode === "points" ? canUpgradeWithPoints : true;

  return (
    <div className="space-y-2">
      {/* Mode toggle + info bar */}
      <div className="flex items-center justify-between rounded-lg bg-slate-800/80 px-3 py-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleMode}
            className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
              upgradeMode === "points"
                ? "bg-indigo-600 text-white"
                : "bg-slate-700 text-slate-400 hover:text-white"
            }`}
            aria-label="Switch to stat points mode"
            tabIndex={0}
          >
            SP: {statPointsAvailable}
          </button>
          <button
            type="button"
            onClick={onToggleMode}
            className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
              upgradeMode === "gold"
                ? "bg-yellow-600 text-white"
                : "bg-slate-700 text-slate-400 hover:text-white"
            }`}
            aria-label="Switch to gold training mode"
            tabIndex={0}
          >
            Gold: {gold.toLocaleString()}
          </button>
        </div>
        <span className="text-[10px] text-slate-500">
          {upgradeMode === "points" ? "Free points" : "Gold training"}
        </span>
      </div>

      {/* Stat rows */}
      <div className="grid grid-cols-2 gap-2">
        {rows.map((r) => {
          const isUpgradeable = r.statKey !== null;
          const cost = isUpgradeable ? goldCostForStatTraining(r.value) : 0;
          const canAfford = upgradeMode === "gold" ? gold >= cost : canUpgradeWithPoints;
          const canUpgrade = isUpgradeable && hasMode && canAfford && r.value < MAX_STAT_VALUE;

          return (
            <div
              key={r.label}
              className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-bold ${r.color}`}>{r.label}</p>
                <p className="text-[10px] text-slate-400">
                  {r.secondary}
                  <span className="ml-1 text-slate-300">{r.secondaryValue}</span>
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-display text-xl text-white">{r.value}</span>
                {isUpgradeable && (
                  <div className="group/btn relative">
                    <button
                      type="button"
                      disabled={!canUpgrade || isAllocating}
                      onClick={() => r.statKey && onAllocate(r.statKey, upgradeMode)}
                      className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold transition
                        ${canUpgrade && !isAllocating
                          ? upgradeMode === "points"
                            ? "bg-indigo-600 text-white hover:bg-indigo-500"
                            : "bg-yellow-600 text-white hover:bg-yellow-500"
                          : "cursor-not-allowed bg-slate-700/50 text-slate-600"
                        }
                      `}
                      aria-label={`Upgrade ${r.label}${upgradeMode === "gold" ? ` for ${cost.toLocaleString()} gold` : ""}`}
                      tabIndex={0}
                    >
                      +
                    </button>
                    <div
                      className="pointer-events-none absolute -top-9 right-0 z-50 hidden whitespace-nowrap rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-xs shadow-lg group-hover/btn:block"
                      role="tooltip"
                    >
                      {upgradeMode === "gold" ? (
                        <span className={canAfford ? "text-yellow-400" : "text-red-400"}>
                          {cost.toLocaleString()} gold
                        </span>
                      ) : (
                        <span className={canUpgradeWithPoints ? "text-indigo-300" : "text-red-400"}>
                          1 SP
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ────────────────── Tab: Description ────────────────── */

type DescTabProps = {
  character: CharacterData;
};

const DescriptionTab = ({ character }: DescTabProps) => (
  <div className="space-y-3 text-sm text-slate-300">
    <div className="flex items-center gap-3">
      <span className="text-xl">⚔️</span>
      <div>
        <p className="font-bold text-white">{character.characterName}</p>
        <p className="text-xs text-slate-400">{CLASS_LABEL[character.class] ?? character.class}</p>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div className="rounded bg-slate-800/50 px-2 py-1.5">
        <span className="text-slate-400">Level:</span>{" "}
        <span className="font-bold text-white">{character.level}</span>
      </div>
      <div className="rounded bg-slate-800/50 px-2 py-1.5">
        <span className="text-slate-400">Prestige:</span>{" "}
        <span className="font-bold text-amber-400">P{character.prestigeLevel}</span>
      </div>
      <div className="rounded bg-slate-800/50 px-2 py-1.5">
        <span className="text-slate-400">Gold:</span>{" "}
        <span className="font-bold text-yellow-400">{character.gold}</span>
      </div>
      <div className="rounded bg-slate-800/50 px-2 py-1.5">
        <span className="text-slate-400">Rating:</span>{" "}
        <span className="font-bold text-white">{character.pvpRating}</span>
      </div>
      <div className="rounded bg-slate-800/50 px-2 py-1.5">
        <span className="text-slate-400">Wins:</span>{" "}
        <span className="font-bold text-green-400">{character.pvpWins}</span>
      </div>
      <div className="rounded bg-slate-800/50 px-2 py-1.5">
        <span className="text-slate-400">Losses:</span>{" "}
        <span className="font-bold text-red-400">{character.pvpLosses}</span>
      </div>
    </div>
    {character.statPointsAvailable > 0 && (
      <p className="rounded bg-amber-900/30 px-2 py-1.5 text-xs text-amber-300">
        🔔 Stat points available: {character.statPointsAvailable}
      </p>
    )}
  </div>
);

/* ────────────────── Tab: Info (full stats) ────────────────── */

type InfoTabProps = {
  stats: CharStats;
  derived: DerivedStats;
  armor: number;
};

const InfoTab = ({ stats, derived, armor }: InfoTabProps) => {
  const allStats: { label: string; value: string }[] = [
    { label: "Strength (STR)", value: `${stats.str}` },
    { label: "Agility (AGI)", value: `${stats.agi}` },
    { label: "Vitality (VIT)", value: `${stats.vit}` },
    { label: "Endurance (END)", value: `${stats.end}` },
    { label: "Intelligence (INT)", value: `${stats.int}` },
    { label: "Wisdom (WIS)", value: `${stats.wis}` },
    { label: "Luck (LCK)", value: `${stats.lck}` },
    { label: "Charisma (CHA)", value: `${stats.cha}` },
  ];

  const derivedRows: { label: string; value: string }[] = [
    { label: "Phys. Damage", value: `${derived.physicalDamage}` },
    { label: "Magic Damage", value: `${derived.magicDamage}` },
    { label: "Crit Chance", value: `${derived.critChance}%` },
    { label: "Crit Multiplier", value: `×${derived.critDamage}` },
    { label: "Dodge", value: `${derived.dodgeChance}%` },
    { label: "Armor", value: `${armor}` },
    { label: "Dmg Reduction", value: `${derived.armorReduction}%` },
    { label: "Magic Resist", value: `${derived.magicResistPercent}%` },
    { label: "Max HP", value: `${derived.maxHp}` },
  ];

  return (
    <div className="space-y-3 text-xs">
      <div>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Base Stats</p>
        <div className="space-y-0.5">
          {allStats.map((s) => (
            <div key={s.label} className="flex justify-between rounded px-2 py-0.5 odd:bg-slate-800/30">
              <span className="text-slate-300">{s.label}</span>
              <span className="font-bold text-white">{s.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Derived Stats</p>
        <div className="space-y-0.5">
          {derivedRows.map((s) => (
            <div key={s.label} className="flex justify-between rounded px-2 py-0.5 odd:bg-slate-800/30">
              <span className="text-slate-300">{s.label}</span>
              <span className="font-bold text-white">{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ────────────────── Sell Price (GDD §7.2) ────────────────── */

const SELL_RARITY_MULT: Record<string, number> = {
  common: 1,
  uncommon: 2,
  rare: 4,
  epic: 10,
  legendary: 25,
};

const getSellPrice = (inv: InventoryItem): number => {
  const stats = getItemStats(inv);
  const rarityMult = SELL_RARITY_MULT[inv.item.rarity] ?? 1;
  const statBonusValue = Object.values(stats).reduce((sum, v) => sum + v, 0) * 5;
  return inv.item.itemLevel * rarityMult * 10 + statBonusValue;
};

/* ────────────────── Selected Item Detail Panel ────────────────── */

type ItemDetailProps = {
  inv: InventoryItem;
  onEquip: (id: string, type: string) => void;
  onUnequip: (id: string) => void;
  onSell: (id: string) => void;
  isSelling: boolean;
  onClose: () => void;
  /** Whether main-hand weapon is two-handed (blocks off-hand) */
  mainHandTwoHanded?: boolean;
  /** Character class for affinity check */
  characterClass?: string;
};

const ItemDetailPanel = ({ inv, onEquip, onUnequip, onSell, isSelling, onClose, mainHandTwoHanded, characterClass }: ItemDetailProps) => {
  const rarity = inv.item.rarity;
  const stats = getItemStats(inv);
  const isWeapon = inv.item.itemType.toLowerCase() === "weapon";
  const isTwoHanded = isWeapon && !!inv.item.catalogId && isWeaponTwoHanded(inv.item.catalogId);
  const showAffinity = characterClass ? checkWeaponAffinity(inv, characterClass) : false;
  const itemClass = getInvItemClass(inv);

  return (
    <div className={`rounded-xl border-2 p-4 ${RARITY_BORDER[rarity]} bg-slate-900/90`}>
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className={`text-lg font-bold ${RARITY_TEXT[rarity]}`}>
            {inv.item.itemName}
            {inv.upgradeLevel > 0 && <span className="text-yellow-400"> +{inv.upgradeLevel}</span>}
          </p>
          <p className="text-xs text-slate-400">
            {RARITY_LABEL[rarity]} · {SLOT_LABELS[inv.item.itemType as SlotKey]} · Lv. {inv.item.itemLevel}
            {isTwoHanded && <span className="ml-1 text-amber-400">(Two-Handed)</span>}
          </p>
          {itemClass && (
            <span className={`mt-1 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold ${CLASS_BADGE_STYLE[itemClass] ?? "bg-slate-800 text-slate-400 border-slate-700"}`}>
              <span className="text-xs">{CLASS_BADGE_ICON[itemClass] ?? "👤"}</span>
              {CLASS_LABEL[itemClass] ?? itemClass}
            </span>
          )}
          {showAffinity && (
            <p className="mt-1 text-xs font-semibold text-emerald-400">
              +{Math.round(WEAPON_AFFINITY_BONUS * 100)}% Affinity Bonus
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {Object.keys(stats).length > 0 && (
        <div className="mb-3 space-y-1">
          {Object.entries(stats).map(([k, v]) => (
            <p key={k} className="text-sm text-green-400">
              +{v} {statLabel[k] ?? k}
            </p>
          ))}
        </div>
      )}

      {inv.item.specialEffect && (
        <p className="mb-2 text-xs text-yellow-300">✨ {inv.item.specialEffect}</p>
      )}

      {inv.item.uniquePassive && (
        <p className="mb-2 text-xs text-cyan-300">🔮 {inv.item.uniquePassive}</p>
      )}

      {inv.item.description && (
        <p className="mb-3 text-xs italic text-slate-400">{inv.item.description}</p>
      )}

      <div className="mb-3 text-xs text-slate-500">
        Durability: {inv.durability}/{inv.maxDurability}
        <div className="mt-1 h-1.5 w-full rounded-full bg-slate-700">
          <div
            className={`h-full rounded-full ${inv.durability / inv.maxDurability > 0.5 ? "bg-green-500" : inv.durability / inv.maxDurability > 0.2 ? "bg-yellow-500" : "bg-red-500"}`}
            style={{ width: `${(inv.durability / inv.maxDurability) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex gap-2">
        {inv.isEquipped ? (
          <button
            type="button"
            onClick={() => onUnequip(inv.id)}
            className="flex-1 rounded-lg bg-slate-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-500"
          >
            Unequip
          </button>
        ) : isWeapon ? (
          <>
            <button
              type="button"
              onClick={() => onEquip(inv.id, "weapon")}
              className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
            >
              {isTwoHanded ? "Equip (2H)" : "Main Hand"}
            </button>
            {!isTwoHanded && (
              <button
                type="button"
                onClick={() => onEquip(inv.id, "weapon_offhand")}
                disabled={mainHandTwoHanded}
                className="flex-1 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
                title={mainHandTwoHanded ? "Main hand is two-handed" : undefined}
              >
                Off Hand
              </button>
            )}
            <button
              type="button"
              disabled={isSelling}
              onClick={() => onSell(inv.id)}
              className="rounded-lg bg-yellow-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={`Sell for ${getSellPrice(inv)} gold`}
            >
              🪙
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onEquip(inv.id, inv.item.itemType)}
              className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
            >
              Equip
            </button>
            <button
              type="button"
              disabled={isSelling}
              onClick={() => onSell(inv.id)}
              className="flex-1 rounded-lg bg-yellow-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={`Sell for ${getSellPrice(inv)} gold`}
            >
              Sell 🪙{getSellPrice(inv)}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

/* ────────────────── Main Inventory Content ────────────────── */

function InventoryContent() {
  const searchParams = useSearchParams();
  const characterId = searchParams.get("characterId");

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const avatarSrc = useCharacterAvatar(characterId);
  const [activeTab, setActiveTab] = useState<"attributes" | "description" | "info">("attributes");
  const [hoveredItem, setHoveredItem] = useState<{ inv: InventoryItem; x: number; y: number } | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [upgradeMode, setUpgradeMode] = useState<"points" | "gold">("points");
  const [isAllocating, setIsAllocating] = useState(false);
  const [isSelling, setIsSelling] = useState(false);

  /* ── Drag & Drop state ── */
  const dragRef = useRef<{
    inv: InventoryItem;
    source: "bag" | "equip";
    sourceSlot?: SlotKey;
  } | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{ type: "slot"; slot: SlotKey } | { type: "bag"; idx?: number } | null>(null);
  /** Which slots light up as valid targets during drag */
  const [dragValidSlots, setDragValidSlots] = useState<Set<SlotKey>>(new Set());

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!characterId) return;
    setError(null);
    try {
      const res = await fetch(`/api/inventory?characterId=${characterId}`, { signal });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Loading error");
        return;
      }
      const json = await res.json();
      setData(json);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Error");
    }
  }, [characterId]);

  useEffect(() => {
    if (!characterId) return;
    const controller = new AbortController();
    load(controller.signal).finally(() => setLoading(false));
    return () => controller.abort();
  }, [characterId, load]);

  /* Auto-retry on error after 3 seconds */
  useEffect(() => {
    if (loading || data || !error || !characterId) return;
    const timer = setTimeout(() => {
      setLoading(true);
      const controller = new AbortController();
      load(controller.signal).finally(() => setLoading(false));
    }, 3000);
    return () => clearTimeout(timer);
  }, [loading, data, error, characterId, load]);

  /** Optimistically move item from bag → equipped slot, then sync with server */
  const handleEquip = useCallback(async (inventoryId: string, slot: string) => {
    // Optimistic update
    setData((prev) => {
      if (!prev) return prev;
      const item = prev.unequipped.find((i) => i.id === inventoryId)
        ?? prev.equipped.find((i) => i.id === inventoryId);
      if (!item) return prev;

      // Remove previously equipped item in the same slot (goes back to bag)
      const displaced = prev.equipped.find((i) => i.equippedSlot === slot);

      const newEquipped = [
        ...prev.equipped.filter((i) => i.equippedSlot !== slot && i.id !== inventoryId),
        { ...item, isEquipped: true, equippedSlot: slot },
      ];
      const newUnequipped = [
        ...prev.unequipped.filter((i) => i.id !== inventoryId),
        ...(displaced ? [{ ...displaced, isEquipped: false, equippedSlot: null }] : []),
      ];

      return {
        ...prev,
        equipped: newEquipped,
        unequipped: newUnequipped,
        items: [...newEquipped, ...newUnequipped],
      };
    });
    setSelectedItem(null);

    // Server sync
    try {
      const res = await fetch("/api/inventory/equip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId, inventoryId, slot }),
      });
      if (res.ok) {
        await load(); // re-sync with server truth
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Equipment error");
        await load(); // rollback on error
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      await load();
    }
  }, [characterId, load]);

  /** Optimistically move item from equipped → bag, then sync with server */
  const handleUnequip = useCallback(async (inventoryId: string) => {
    // Optimistic update
    setData((prev) => {
      if (!prev) return prev;
      const item = prev.equipped.find((i) => i.id === inventoryId);
      if (!item) return prev;

      const newEquipped = prev.equipped.filter((i) => i.id !== inventoryId);
      const newUnequipped = [
        ...prev.unequipped,
        { ...item, isEquipped: false, equippedSlot: null },
      ];

      return {
        ...prev,
        equipped: newEquipped,
        unequipped: newUnequipped,
        items: [...newEquipped, ...newUnequipped],
      };
    });
    setSelectedItem(null);

    // Server sync
    try {
      const res = await fetch("/api/inventory/unequip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId, inventoryId }),
      });
      if (res.ok) {
        await load();
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Unequip error");
        await load();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      await load();
    }
  }, [characterId, load]);

  const handleHoverItem = useCallback((inv: InventoryItem | null, e?: React.MouseEvent) => {
    if (!inv || !e) {
      setHoveredItem(null);
      return;
    }
    setHoveredItem({ inv, x: e.clientX + 16, y: e.clientY - 20 });
  }, []);

  const handleSelectItem = useCallback((inv: InventoryItem | null) => {
    setSelectedItem((prev) => (prev?.id === inv?.id ? null : inv));
  }, []);

  const handleToggleMode = useCallback(() => {
    setUpgradeMode((prev) => (prev === "points" ? "gold" : "points"));
  }, []);

  const handleAllocateStat = useCallback(
    async (statKey: string, mode: "points" | "gold") => {
      if (!characterId || isAllocating) return;
      setIsAllocating(true);
      try {
        const res = await fetch(`/api/characters/${characterId}/allocate-stats`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stat: statKey, mode }),
        });
        if (res.ok) {
          await load();
        } else {
          const body = await res.json().catch(() => ({}));
          setError(body.error ?? "Allocation failed");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      } finally {
        setIsAllocating(false);
      }
    },
    [characterId, isAllocating, load]
  );

  const handleSell = useCallback(
    async (inventoryId: string) => {
      if (!characterId || isSelling) return;
      setIsSelling(true);
      try {
        const res = await fetch("/api/inventory/sell", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ characterId, inventoryId }),
        });
        if (res.ok) {
          setSelectedItem(null);
          await load();
          window.dispatchEvent(new Event("character-updated"));
        } else {
          const body = await res.json().catch(() => ({}));
          setError(body.error ?? "Sell failed");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      } finally {
        setIsSelling(false);
      }
    },
    [characterId, isSelling, load]
  );

  /* ── Drag & Drop handlers ── */

  /** Given an item type, return the set of equipment slots it can go into */
  const getValidSlotsForItem = useCallback((itemType: string): Set<SlotKey> => {
    const type = itemType.toLowerCase();
    if (type === "weapon") return new Set(["weapon", "weapon_offhand"] as SlotKey[]);
    // All other types map 1:1 to their slot
    if (SLOT_ORDER.includes(type as SlotKey)) return new Set([type as SlotKey]);
    return new Set();
  }, []);

  const handleDragStartBag = useCallback((inv: InventoryItem, source: "bag") => {
    dragRef.current = { inv, source };
    setHoveredItem(null);
    setDragValidSlots(getValidSlotsForItem(inv.item.itemType));
  }, [getValidSlotsForItem]);

  const handleDragStartEquip = useCallback((inv: InventoryItem, source: "equip", slot: SlotKey) => {
    dragRef.current = { inv, source, sourceSlot: slot };
    setHoveredItem(null);
    setDragValidSlots(new Set()); // equip→bag doesn't highlight slots
  }, []);

  const handleDragEnd = useCallback(() => {
    dragRef.current = null;
    setDragOverTarget(null);
    setDragValidSlots(new Set());
  }, []);

  const handleDragOverSlot = useCallback((slot: SlotKey) => {
    setDragOverTarget((prev) => (prev?.type === "slot" && (prev as { slot: SlotKey }).slot === slot) ? prev : { type: "slot", slot });
  }, []);

  const handleDragLeaveSlot = useCallback(() => {
    setDragOverTarget(null);
  }, []);

  const handleDragOverBag = useCallback(() => {
    setDragOverTarget((prev) => prev?.type === "bag" ? prev : { type: "bag" });
  }, []);

  const handleDragLeaveBag = useCallback(() => {
    setDragOverTarget(null);
  }, []);

  /** Drop a bag item onto an equipment slot → equip */
  const handleDropOnSlot = useCallback((targetSlot: SlotKey) => {
    const drag = dragRef.current;
    if (!drag) return;

    if (drag.source === "bag") {
      const itemType = drag.inv.item.itemType;
      const isWeapon = itemType.toLowerCase() === "weapon";
      const slot = isWeapon ? targetSlot : itemType;
      handleEquip(drag.inv.id, slot);
    }
    dragRef.current = null;
    setDragOverTarget(null);
    setDragValidSlots(new Set());
  }, [handleEquip]);

  /** Drop an equipped item onto the bag area → unequip */
  const handleDropOnBag = useCallback(() => {
    const drag = dragRef.current;
    if (!drag) return;

    if (drag.source === "equip") {
      handleUnequip(drag.inv.id);
    }
    dragRef.current = null;
    setDragOverTarget(null);
    setDragValidSlots(new Set());
  }, [handleUnequip]);

  /* Build equipped map */
  const equippedMap = useMemo(() => {
    const map: Partial<Record<SlotKey, InventoryItem>> = {};
    if (!data) return map;
    for (const inv of data.equipped) {
      if (inv.equippedSlot) {
        map[inv.equippedSlot as SlotKey] = inv;
      }
    }
    return map;
  }, [data]);

  /** Common drag props for EquipmentSlot */
  const equipDragProps = useMemo(() => ({
    onDragStart: handleDragStartEquip,
    onDragEnd: handleDragEnd,
    onDropItem: handleDropOnSlot,
    onDragOverSlot: handleDragOverSlot,
    onDragLeaveSlot: handleDragLeaveSlot,
  }), [handleDragStartEquip, handleDragEnd, handleDropOnSlot, handleDragOverSlot, handleDragLeaveSlot]);

  const isSlotDragOver = useCallback((slot: SlotKey) =>
    dragOverTarget?.type === "slot" && (dragOverTarget as { slot: SlotKey }).slot === slot
  , [dragOverTarget]);

  const isSlotValidTarget = useCallback((slot: SlotKey) =>
    dragValidSlots.has(slot)
  , [dragValidSlots]);

  /* Check if main hand weapon is two-handed (blocks off-hand slot) */
  const mainHandIsTwoHanded = useMemo(() => {
    const mainHand = equippedMap.weapon;
    if (!mainHand?.item.catalogId) return false;
    return isWeaponTwoHanded(mainHand.item.catalogId);
  }, [equippedMap.weapon]);

  /* Unequipped items for bag grid */
  const bagItems = useMemo(() => data?.unequipped ?? [], [data]);

  if (loading || !characterId || !data) {
    const loaderText = !characterId ? "Loading…" : error ? "Retrying…" : "Loading inventory…";

    return <PageLoader emoji="🎒" text={loaderText} avatarSrc={avatarSrc} />;
  }

  const { character } = data;
  const xpNeeded = xpForLevel(character.level);
  const xpPercent = xpNeeded > 0 ? Math.min(100, (character.currentXp / xpNeeded) * 100) : 0;
  const staminaPercent = character.maxStamina > 0 ? Math.min(100, (character.currentStamina / character.maxStamina) * 100) : 0;

  const tabs = [
    { key: "attributes" as const, label: "Attributes" },
    { key: "description" as const, label: "Description" },
    { key: "info" as const, label: "Info" },
  ];

  return (
    <div className="relative min-h-full text-white">
      <PageHeader title="Inventory" />

      {error && (
        <div className="border-b border-red-900/50 bg-red-950/30 px-4 py-2 text-xs text-red-400">{error}</div>
      )}

      <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4 lg:flex-row">
        {/* ──── Left Panel: Character + Equipment + Tabs ──── */}
        <section className="flex w-full flex-col rounded-xl border border-slate-800 bg-slate-900/50 lg:w-[420px]">
          {/* Character portrait + equipment grid */}
          <div className="p-4">
            {/* Equipment paper-doll layout */}
            <div className="flex gap-4">
              {/* Left column: helmet, chest, gloves, legs, ring */}
              <div className="flex flex-col items-center gap-2">
                {(["helmet", "chest", "gloves", "legs", "ring"] as const).map((slot) => (
                  <EquipmentSlot
                    key={slot}
                    slotKey={slot}
                    item={equippedMap[slot]}
                    onUnequip={handleUnequip}
                    onHoverItem={handleHoverItem}
                    onSelectItem={handleSelectItem}
                    isDragOver={isSlotDragOver(slot)}
                    isValidTarget={isSlotValidTarget(slot)}
                    {...equipDragProps}
                  />
                ))}
              </div>

              {/* Center: avatar + name + level */}
              <div className="flex flex-1 flex-col items-center">
                <div className="relative mb-2 flex h-[208px] w-[208px] items-center justify-center overflow-hidden rounded-xl border-2 border-slate-700 bg-gradient-to-b from-slate-800 to-slate-900">
                  {character.origin && ORIGIN_IMAGE[character.origin] ? (
                    <Image
                      src={ORIGIN_IMAGE[character.origin]}
                      alt={character.origin}
                      width={1024}
                      height={1024}
                      className="h-full w-full object-cover"
                      sizes="208px"
                    />
                  ) : (
                    <span className="text-5xl">
                      {character.class === "warrior" ? "⚔️" : character.class === "rogue" ? "🗡️" : character.class === "mage" ? "🧙" : "🛡️"}
                    </span>
                  )}

                  {/* Level badge — top-right */}
                  <div className="absolute right-2 top-2 z-20 flex h-11 w-11 items-center justify-center rounded-full border-2 border-amber-500/80 bg-slate-900/90 text-base font-black text-amber-400 shadow-lg">
                    {character.level}
                  </div>

                  {/* Class icon badge — top-left */}
                  <div className="absolute left-2 top-2 z-20 flex h-11 w-11 items-center justify-center rounded-full border-2 border-slate-500/80 bg-slate-900/90 text-lg shadow-lg">
                    {CLASS_ICON[character.class] ?? "👤"}
                  </div>

                  <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 to-transparent px-2 pb-1.5 pt-6">
                    <p className="text-center text-sm font-bold text-white">{character.characterName}</p>
                  </div>
                </div>
                {/* Level bar */}
                <div className="relative mt-1 h-6 w-[208px] overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-green-600 to-green-400 transition-all"
                    style={{ width: `${xpPercent}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                    Lv. {character.level}
                  </span>
                </div>
                {/* Stamina bar */}
                <div className="relative mt-1 h-6 w-[208px] overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all"
                    style={{ width: `${staminaPercent}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                    ⚡ {character.currentStamina} / {character.maxStamina}
                  </span>
                </div>
                {/* Weapon slots under avatar: Main Hand + Off Hand */}
                <div className="mt-2 flex items-center gap-2">
                  <EquipmentSlot
                    slotKey="weapon"
                    item={equippedMap.weapon}
                    onUnequip={handleUnequip}
                    onHoverItem={handleHoverItem}
                    onSelectItem={handleSelectItem}
                    isDragOver={isSlotDragOver("weapon")}
                    isValidTarget={isSlotValidTarget("weapon")}
                    hasAffinity={!!equippedMap.weapon && checkWeaponAffinity(equippedMap.weapon, character.class)}
                    {...equipDragProps}
                  />
                  <EquipmentSlot
                    slotKey="weapon_offhand"
                    item={equippedMap.weapon_offhand}
                    onUnequip={handleUnequip}
                    onHoverItem={handleHoverItem}
                    onSelectItem={handleSelectItem}
                    locked={mainHandIsTwoHanded}
                    lockReason="Two-handed weapon equipped"
                    isDragOver={isSlotDragOver("weapon_offhand")}
                    isValidTarget={isSlotValidTarget("weapon_offhand")}
                    hasAffinity={!!equippedMap.weapon_offhand && checkWeaponAffinity(equippedMap.weapon_offhand, character.class)}
                    {...equipDragProps}
                  />
                </div>
              </div>

              {/* Right column: relic, amulet, accessory, belt, boots */}
              <div className="flex flex-col items-center gap-2">
                {(["relic", "amulet", "accessory", "belt", "boots"] as const).map((slot) => (
                  <EquipmentSlot
                    key={slot}
                    slotKey={slot}
                    item={equippedMap[slot]}
                    onUnequip={handleUnequip}
                    onHoverItem={handleHoverItem}
                    onSelectItem={handleSelectItem}
                    isDragOver={isSlotDragOver(slot)}
                    isValidTarget={isSlotValidTarget(slot)}
                    {...equipDragProps}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-t border-slate-800">
            <div className="flex">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key)}
                  className={`flex-1 border-b-2 px-3 py-2 text-xs font-bold uppercase tracking-wider transition
                    ${activeTab === t.key ? "border-indigo-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300"}
                  `}
                  aria-label={t.label}
                  tabIndex={0}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-3">
              {activeTab === "attributes" && (
                <AttributesTab
                  stats={character.stats}
                  derived={character.derived}
                  armor={character.armor}
                  gold={character.gold}
                  statPointsAvailable={character.statPointsAvailable}
                  upgradeMode={upgradeMode}
                  onToggleMode={handleToggleMode}
                  onAllocate={handleAllocateStat}
                  isAllocating={isAllocating}
                />
              )}
              {activeTab === "description" && <DescriptionTab character={character} />}
              {activeTab === "info" && <InfoTab stats={character.stats} derived={character.derived} armor={character.armor} />}
            </div>
          </div>
        </section>

        {/* ──── Right Panel: Bag inventory grid + selected item detail ──── */}
        <section className="flex flex-1 flex-col gap-4">
          {/* Selected item detail */}
          {selectedItem && (
            <ItemDetailPanel
              inv={selectedItem}
              onEquip={handleEquip}
              onUnequip={handleUnequip}
              onSell={handleSell}
              isSelling={isSelling}
              onClose={() => setSelectedItem(null)}
              mainHandTwoHanded={mainHandIsTwoHanded}
              characterClass={character.class}
            />
          )}

          {/* Bag grid */}
          <div
            className={`rounded-xl border p-4 transition-all ${
              dragOverTarget?.type === "bag" && dragRef.current?.source === "equip"
                ? "border-indigo-400 bg-indigo-950/20"
                : "border-slate-800 bg-slate-900/50"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (dragRef.current?.source === "equip") {
                handleDragOverBag();
              }
            }}
            onDragLeave={handleDragLeaveBag}
            onDrop={(e) => {
              e.preventDefault();
              if (dragRef.current?.source === "equip") {
                handleDropOnBag();
              }
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-base text-slate-300">
                Backpack
                <span className="ml-2 text-xs font-normal text-slate-500">
                  {bagItems.length}/{INVENTORY_SLOTS_TOTAL}
                </span>
              </h2>
              <p className="text-xs text-slate-500">Drag to equip · Double-click · Right-click slot to unequip</p>
            </div>

            <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-8">
              {Array.from({ length: INVENTORY_SLOTS_TOTAL }).map((_, i) => (
                <InventoryCell
                  key={i}
                  inv={bagItems[i]}
                  onEquip={handleEquip}
                  onHoverItem={handleHoverItem}
                  onSelectItem={handleSelectItem}
                  onDragStart={handleDragStartBag}
                  onDragEnd={handleDragEnd}
                  onDropToBag={handleDropOnBag}
                  isDragOver={dragOverTarget?.type === "bag" && dragRef.current?.source === "equip" && !bagItems[i]}
                  onDragOverBag={dragRef.current?.source === "equip" ? handleDragOverBag : undefined}
                  onDragLeaveBag={handleDragLeaveBag}
                />
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Floating tooltip */}
      {hoveredItem && !selectedItem && (
        <ItemTooltip
          inv={hoveredItem.inv}
          equippedItem={
            /* Compare with the currently equipped item in the same slot (only for unequipped items) */
            !hoveredItem.inv.isEquipped
              ? equippedMap[hoveredItem.inv.item.itemType as SlotKey] ?? null
              : null
          }
          style={{
            position: "fixed",
            left: Math.min(hoveredItem.x, window.innerWidth - 280),
            top: Math.min(hoveredItem.y, window.innerHeight - 300),
          }}
          characterClass={character.class}
        />
      )}
    </div>
  );
}

/* ────────────────── Page Export ────────────────── */

export default function InventoryPage() {
  return (
    <Suspense fallback={<PageLoader emoji="🎒" text="Loading inventory…" />}>
      <InventoryContent />
    </Suspense>
  );
}
