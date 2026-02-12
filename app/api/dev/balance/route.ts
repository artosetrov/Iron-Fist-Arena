import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

/* ── DEV-ONLY guard ────────────────────────────────────────────────── */

const isDev = process.env.NODE_ENV === "development";
const BALANCE_PATH = path.join(process.cwd(), "lib/game/balance.ts");

/* ── Section / field schema ────────────────────────────────────────── */

type FieldType = "number" | "object" | "array" | "nested_object";

type FieldDef = {
  name: string;
  type: FieldType;
  comment: string;
  /** For nested_object: dot-path keys like "helmet.common" */
  structure?: string;
};

type SectionDef = {
  id: string;
  title: string;
  gddRef: string;
  fields: FieldDef[];
};

/**
 * Static schema: defines every editable constant, its type, and doc comment.
 * Order here = order in the generated file.
 */
const SECTIONS: SectionDef[] = [
  {
    id: "combat",
    title: "Combat",
    gddRef: "GDD §2",
    fields: [
      { name: "BASE_CRIT_CHANCE", type: "number", comment: "GDD §2.1 — Critical hit" },
      { name: "MAX_CRIT_CHANCE", type: "number", comment: "" },
      { name: "BASE_CRIT_DAMAGE", type: "number", comment: "" },
      { name: "MAX_CRIT_DAMAGE_MULT", type: "number", comment: "" },
      { name: "BASE_DODGE", type: "number", comment: "GDD §2.1 — Dodge" },
      { name: "MAX_DODGE", type: "number", comment: "" },
      { name: "ARMOR_REDUCTION_CAP", type: "number", comment: "GDD §2.1 — Armor & magic resist" },
      { name: "ARMOR_DENOMINATOR", type: "number", comment: "" },
      { name: "MAGIC_RESIST_CAP", type: "number", comment: "" },
      { name: "MAGIC_RESIST_DENOM", type: "number", comment: "" },
      { name: "HP_PER_VIT", type: "number", comment: "GDD §2.1 — HP" },
      { name: "END_DEFENSE_FACTOR", type: "number", comment: "GDD §2.1 — Defence factors in damage formula" },
      { name: "WIS_DEFENSE_FACTOR", type: "number", comment: "" },
      { name: "DAMAGE_VARIANCE_MIN", type: "number", comment: "GDD §2.1 — Random variance" },
      { name: "DAMAGE_VARIANCE_MAX", type: "number", comment: "" },
      { name: "MAX_TURNS", type: "number", comment: "GDD §2 — Turn limit" },
      { name: "MAX_STAT_VALUE", type: "number", comment: "Hard cap for any single stat" },
      { name: "STATUS_EFFECT_PCT", type: "object", comment: "GDD §2.3 — Status effect damage (% of maxHP per turn)" },
      { name: "ARMOR_BREAK_MULT", type: "number", comment: "GDD §2.3 — Armor break reduces armor by this multiplier (= -40%)" },
      { name: "RESIST_CHANCE_CAP", type: "number", comment: "GDD §2.3 — Resist chance cap" },
      { name: "ENEMY_SKILL_USE_CHANCE", type: "number", comment: "Enemy (boss) AI: probability of using a skill when available" },
      { name: "BASE_SPELL_MULT", type: "number", comment: "Base spell multiplier used for magic damage preview" },
    ],
  },
  {
    id: "progression",
    title: "Progression",
    gddRef: "GDD §3",
    fields: [
      { name: "XP_BASE_MULT", type: "number", comment: "GDD §3.1 — XP formula: 100 * N^1.8 + 50 * N" },
      { name: "XP_EXP", type: "number", comment: "" },
      { name: "XP_LINEAR", type: "number", comment: "" },
      { name: "XP_REWARD", type: "object", comment: "GDD §3.1 — XP rewards per activity" },
      { name: "XP_ENEMY_LEVEL_DIVISOR", type: "number", comment: "GDD §3.1 — XP scaling by enemy level divisor" },
      { name: "STAT_POINTS_PER_LEVEL", type: "number", comment: "GDD §3.2 — Per-level gains" },
      { name: "SKILL_POINT_INTERVAL", type: "number", comment: "" },
      { name: "GOLD_PER_LEVEL_MULT", type: "number", comment: "" },
      { name: "STAT_SOFT_CAP", type: "object", comment: "GDD §2.1 — Stat soft caps" },
      { name: "STAT_HARD_CAP", type: "number", comment: "" },
    ],
  },
  {
    id: "stamina",
    title: "Stamina",
    gddRef: "GDD §4",
    fields: [
      { name: "STAMINA_REGEN_MINUTES", type: "number", comment: "GDD §4 — Regen: 1 per 12 min, max 100, VIP +20, overflow 200" },
      { name: "MAX_STAMINA_BASE", type: "number", comment: "" },
      { name: "MAX_STAMINA_VIP_BONUS", type: "number", comment: "" },
      { name: "OVERFLOW_CAP", type: "number", comment: "" },
      { name: "STAMINA_COST", type: "object", comment: "GDD §4 — Costs per activity" },
      { name: "STAMINA_REFILL", type: "nested_object", comment: "GDD §4 — Gem-based refills" },
    ],
  },
  {
    id: "pvp",
    title: "PvP / ELO",
    gddRef: "GDD §6",
    fields: [
      { name: "ELO_K", type: "number", comment: "GDD §6.2 — ELO" },
      { name: "RATING_FLOOR", type: "number", comment: "" },
      { name: "LOSS_STREAK_THRESHOLD", type: "number", comment: "" },
      { name: "LOSS_STREAK_REDUCTION", type: "number", comment: "" },
      { name: "PVP_OPPONENTS_RATING_RANGE", type: "number", comment: "GDD §6.2 — Matchmaking" },
      { name: "PVP_MATCHMAKING_RATING_RANGE", type: "number", comment: "" },
      { name: "RANK_TIERS", type: "array", comment: "GDD §6.3 — Rank tiers" },
      { name: "PVP_WIN_BASE_GOLD", type: "number", comment: "GDD §6.4 — PvP gold rewards" },
      { name: "PVP_LOSS_GOLD", type: "number", comment: "" },
      { name: "WIN_STREAK_BONUSES", type: "object", comment: "" },
      { name: "BOSS_KILL_RATING_BASE", type: "number", comment: "GDD §5 — Dungeon rating rewards" },
      { name: "BOSS_KILL_RATING_PER_LEVEL", type: "number", comment: "" },
      { name: "DUNGEON_COMPLETE_RATING_BASE", type: "number", comment: "" },
      { name: "DUNGEON_COMPLETE_RATING_PER_LEVEL", type: "number", comment: "" },
    ],
  },
  {
    id: "loot",
    title: "Loot",
    gddRef: "GDD §5.3",
    fields: [
      { name: "RARITY_THRESHOLDS", type: "array", comment: "GDD §5.3 — Enhanced roll thresholds" },
      { name: "DIFFICULTY_BONUS", type: "object", comment: "" },
      { name: "MAX_ENHANCED_ROLL", type: "number", comment: "" },
      { name: "DROP_CHANCE", type: "object", comment: "GDD §5.3 — Drop chance per difficulty (boss always 100%)" },
      { name: "STAT_RANGE", type: "object", comment: "GDD §5.3 — Primary stat ranges per rarity" },
      { name: "SECONDARY_STAT_RANGE", type: "object", comment: "GDD §5.3 — Secondary stat ranges per rarity" },
      { name: "SECONDARY_STAT_COUNT", type: "object", comment: "GDD §5.3 — How many secondary stats each rarity gets" },
      { name: "ARMOR_RANGE", type: "nested_object", comment: "Armor ranges per slot per rarity" },
    ],
  },
  {
    id: "economy",
    title: "Economy",
    gddRef: "GDD §7",
    fields: [
      { name: "STARTING_GOLD", type: "number", comment: "Starting character resources" },
      { name: "STARTING_STAMINA", type: "number", comment: "" },
      { name: "STARTING_MAX_STAMINA", type: "number", comment: "" },
      { name: "REPAIR_COST_PCT", type: "number", comment: "GDD §7.4 — Repair: cost = basePrice * REPAIR_COST_PCT * (lost / maxDur)" },
      { name: "REPAIR_FALLBACK_PRICE", type: "number", comment: "" },
      { name: "UPGRADE_MAX_LEVEL", type: "number", comment: "GDD §7.5 — Upgrade system" },
      { name: "UPGRADE_BASE_CHANCE", type: "number", comment: "" },
      { name: "UPGRADE_CHANCE_PER_LEVEL", type: "number", comment: "" },
      { name: "UPGRADE_COST_MULT", type: "number", comment: "" },
      { name: "UPGRADE_COST_EXP", type: "number", comment: "" },
      { name: "UPGRADE_FALLBACK_PRICE", type: "number", comment: "" },
      { name: "UPGRADE_FAIL_STAY", type: "number", comment: "On failure: cumulative thresholds (0-50: stay, 50-80: downgrade, 80-100: destroy)" },
      { name: "UPGRADE_FAIL_DOWNGRADE", type: "number", comment: "" },
      { name: "SELL_RARITY_MULT", type: "object", comment: "GDD §7.2 — Sell price rarity multipliers" },
      { name: "SELL_BASE_MULT", type: "number", comment: "" },
      { name: "SELL_STAT_MULT", type: "number", comment: "" },
      { name: "BUY_RARITY_PRICE_MULT", type: "object", comment: "GDD §7 — Buy price rarity multipliers (same as sell)" },
      { name: "BUY_BASE_MULT", type: "number", comment: "" },
      { name: "STAT_TRAIN_BASE", type: "number", comment: "GDD §7.6 — Stat training: cost = floor(BASE * GROWTH^statValue)" },
      { name: "STAT_TRAIN_GROWTH", type: "number", comment: "" },
      { name: "INVENTORY_LIMIT", type: "number", comment: "Inventory limit" },
      { name: "GOLD_PACKAGES", type: "nested_object", comment: "GDD §7.1 — Gold packages (IAP)" },
      { name: "ORIGIN_CHANGE_COST", type: "number", comment: "GDD — Origin change cost" },
    ],
  },
  {
    id: "dungeon",
    title: "Dungeon",
    gddRef: "GDD §5",
    fields: [
      { name: "BOSSES_PER_DUNGEON", type: "number", comment: "Bosses per dungeon" },
      { name: "BOSS_STAT_BASE_CONST", type: "number", comment: "Boss stat generation: base = max(10, floor(30 + playerLevel * 4))" },
      { name: "BOSS_STAT_LEVEL_MULT", type: "number", comment: "" },
      { name: "BOSS_STAT_MIN", type: "number", comment: "" },
      { name: "BOSS_STAT_FACTORS", type: "object", comment: "Per-stat multipliers for boss generation" },
      { name: "BOSS_ARMOR_FACTOR", type: "number", comment: "Boss armor = floor(END * 0.8)" },
      { name: "BOSS_INDEX_SCALING", type: "number", comment: "Boss index scaling: mult + index * 0.15" },
      { name: "DUNGEON_GOLD_BASE", type: "number", comment: "Dungeon gold reward: base + dungeonIndex * perDungeon" },
      { name: "DUNGEON_GOLD_PER_DUNGEON", type: "number", comment: "" },
      { name: "DUNGEON_GOLD_BOSS_SCALE", type: "number", comment: "" },
      { name: "DUNGEON_XP_BASE", type: "number", comment: "Dungeon XP reward" },
      { name: "DUNGEON_XP_PER_DUNGEON", type: "number", comment: "" },
      { name: "DUNGEON_XP_BOSS_SCALE", type: "number", comment: "" },
      { name: "DUNGEON_COMPLETION_GOLD_BASE", type: "number", comment: "Dungeon completion bonus" },
      { name: "DUNGEON_COMPLETION_GOLD_PER_DUNGEON", type: "number", comment: "" },
      { name: "DUNGEON_COMPLETION_XP_BASE", type: "number", comment: "" },
      { name: "DUNGEON_COMPLETION_XP_PER_DUNGEON", type: "number", comment: "" },
      { name: "ITEM_LEVEL_VARIANCE_MIN", type: "number", comment: "Item level variance when dropping from dungeon: level + random(-2 to +3)" },
      { name: "ITEM_LEVEL_VARIANCE_MAX", type: "number", comment: "" },
      { name: "ITEM_LEVEL_VARIANCE_RANGE", type: "number", comment: "" },
    ],
  },
  {
    id: "quests",
    title: "Quests",
    gddRef: "Quests",
    fields: [
      { name: "QUEST_POOL", type: "array", comment: "" },
      { name: "DAILY_QUEST_COUNT", type: "number", comment: "" },
    ],
  },
];

/* ── Parse balance.ts → values map ─────────────────────────────────── */

const parseBalanceFile = (): Record<string, unknown> => {
  const src = fs.readFileSync(BALANCE_PATH, "utf-8");
  const values: Record<string, unknown> = {};

  // Match: export const NAME = <value>;  or  export const NAME: Type = <value>;
  // Capture everything between = and the final ; (including multiline)
  const re = /export\s+const\s+(\w+)(?:\s*:\s*[^=]+)?\s*=\s*([\s\S]*?);\s*$/gm;
  let m: RegExpExecArray | null;

  while ((m = re.exec(src)) !== null) {
    const name = m[1];
    let raw = m[2].trim();
    // Strip trailing "as const"
    raw = raw.replace(/\s+as\s+const\s*$/, "");
    // Replace Infinity with a placeholder for JSON
    raw = raw.replace(/\bInfinity\b/g, "99999");
    try {
      // Convert JS object literal to JSON-safe: unquoted keys → quoted
      const jsonSafe = raw
        .replace(/'/g, '"')
        .replace(/(\w+)\s*:/g, '"$1":')
        // Fix double-quoting already quoted keys
        .replace(/""/g, '"');
      values[name] = JSON.parse(jsonSafe);
    } catch {
      // If it's a simple number or string
      const num = Number(raw);
      if (!isNaN(num)) {
        values[name] = num;
      } else {
        values[name] = raw;
      }
    }
  }

  return values;
};

/* ── Generate balance.ts from values ───────────────────────────────── */

const serializeValue = (val: unknown, indent = 0): string => {
  const pad = "  ".repeat(indent);
  const pad1 = "  ".repeat(indent + 1);

  if (val === null || val === undefined) return "0";
  if (typeof val === "number") {
    if (val === 99999) return "Infinity";
    return String(val);
  }
  if (typeof val === "string") return JSON.stringify(val);
  if (typeof val === "boolean") return String(val);

  if (Array.isArray(val)) {
    if (val.length === 0) return "[]";
    // Check if array of primitives (tuples like [5, 15])
    if (val.every((v) => typeof v === "number" || typeof v === "string")) {
      return `[${val.map((v) => (typeof v === "string" ? JSON.stringify(v) : v === 99999 ? "Infinity" : String(v))).join(", ")}]`;
    }
    // Array of objects
    const items = val.map((item) => {
      if (typeof item === "object" && item !== null) {
        const entries = Object.entries(item)
          .map(([k, v]) => `${k}: ${serializeValue(v)}`)
          .join(", ");
        return `${pad1}{ ${entries} }`;
      }
      return `${pad1}${serializeValue(item)}`;
    });
    return `[\n${items.join(",\n")},\n${pad}]`;
  }

  if (typeof val === "object") {
    const entries = Object.entries(val as Record<string, unknown>);
    if (entries.length === 0) return "{}";

    // Check if all values are primitives (flat object)
    const allPrimitive = entries.every(
      ([, v]) => typeof v === "number" || typeof v === "string" || typeof v === "boolean"
    );
    if (allPrimitive && entries.length <= 6) {
      const inner = entries
        .map(([k, v]) => `${pad1}${/^\d+$/.test(k) ? k : k}: ${serializeValue(v)}`)
        .join(",\n");
      return `{\n${inner},\n${pad}}`;
    }

    // Nested objects
    const inner = entries
      .map(([k, v]) => `${pad1}${k}: ${serializeValue(v, indent + 1)}`)
      .join(",\n");
    return `{\n${inner},\n${pad}}`;
  }

  return String(val);
};

/** Type annotations that certain constants need */
const TYPE_ANNOTATIONS: Record<string, string> = {
  RANK_TIERS: "RankTierDef[]",
  RARITY_THRESHOLDS: "{ rarity: Rarity; minRoll: number }[]",
  DIFFICULTY_BONUS: "Record<string, number>",
  DROP_CHANCE: "Record<string, number>",
  STAT_RANGE: "Record<Rarity, [number, number]>",
  SECONDARY_STAT_RANGE: "Record<Rarity, [number, number]>",
  SECONDARY_STAT_COUNT: "Record<Rarity, number>",
  ARMOR_RANGE: "Record<string, Record<Rarity, [number, number]>>",
  SELL_RARITY_MULT: "Record<string, number>",
  BUY_RARITY_PRICE_MULT: "Record<string, number>",
  WIN_STREAK_BONUSES: "Record<number, number>",
};

/** Constants that need "as const" suffix */
const AS_CONST = new Set([
  "STATUS_EFFECT_PCT", "XP_REWARD", "STAT_SOFT_CAP", "STAMINA_COST",
  "STAMINA_REFILL", "BOSS_STAT_FACTORS", "GOLD_PACKAGES", "QUEST_POOL",
]);

const SECTION_HEADERS: Record<string, { marker: string; title: string }> = {
  combat: { marker: "§2  COMBAT", title: "§2  COMBAT" },
  progression: { marker: "§3  PROGRESSION", title: "§3  PROGRESSION" },
  stamina: { marker: "§4  STAMINA", title: "§4  STAMINA" },
  pvp: { marker: "§6  PVP / ELO", title: "§6  PVP / ELO" },
  loot: { marker: "§5.3  LOOT", title: "§5.3  LOOT" },
  economy: { marker: "§7  ECONOMY", title: "§7  ECONOMY" },
  dungeon: { marker: "§5  DUNGEON", title: "§5  DUNGEON" },
  quests: { marker: "QUESTS", title: "QUESTS" },
};

const generateBalanceFile = (values: Record<string, unknown>): string => {
  const lines: string[] = [];

  lines.push(`/**`);
  lines.push(` * ${"═".repeat(67)}`);
  lines.push(` *  Iron Fist Arena — Centralised Game Balance & Constants`);
  lines.push(` *  All numbers taken directly from docs/iron_fist_arena_gdd.md`);
  lines.push(` *  This file exports ONLY constants and types — NO logic / functions.`);
  lines.push(` * ${"═".repeat(67)}`);
  lines.push(` */`);
  lines.push(``);
  lines.push(`/** Rarity type used across loot & economy systems */`);
  lines.push(`export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";`);

  for (const section of SECTIONS) {
    const hdr = SECTION_HEADERS[section.id];
    lines.push(``);
    lines.push(`/* ${"─".repeat(70)}`);
    lines.push(`   ${hdr?.title ?? section.title}`);
    lines.push(`   ${"─".repeat(70)} */`);

    // Inject types for specific sections
    if (section.id === "pvp") {
      lines.push(``);
      lines.push(`/** GDD §6.3 — Rank tiers */`);
      lines.push(`export type RankTierDef = {`);
      lines.push(`  name: string;`);
      lines.push(`  floor: number;`);
      lines.push(`  ceiling: number; // exclusive`);
      lines.push(`  divisions: boolean;`);
      lines.push(`};`);
    }

    if (section.id === "progression") {
      // StatKey type after STAT_SOFT_CAP — handled inline below
    }

    if (section.id === "stamina") {
      // StaminaActivity and StaminaRefillSize types — handled inline below
    }

    let lastComment = "";
    for (const field of section.fields) {
      if (field.comment && field.comment !== lastComment) {
        lines.push(``);
        lines.push(`/** ${field.comment} */`);
        lastComment = field.comment;
      }

      const val = values[field.name];
      const typeAnno = TYPE_ANNOTATIONS[field.name];
      const asConst = AS_CONST.has(field.name) ? " as const" : "";
      const typeStr = typeAnno ? `: ${typeAnno}` : "";

      lines.push(`export const ${field.name}${typeStr} = ${serializeValue(val)}${asConst};`);

      // Inject derived types after specific constants
      if (field.name === "STAT_SOFT_CAP") {
        lines.push(``);
        lines.push(`export type StatKey = keyof typeof STAT_SOFT_CAP;`);
      }
      if (field.name === "STAMINA_COST") {
        lines.push(``);
        lines.push(`export type StaminaActivity = keyof typeof STAMINA_COST;`);
      }
      if (field.name === "STAMINA_REFILL") {
        lines.push(``);
        lines.push(`export type StaminaRefillSize = keyof typeof STAMINA_REFILL;`);
      }
      if (field.name === "GOLD_PACKAGES") {
        lines.push(``);
        lines.push(`export type GoldPackageId = keyof typeof GOLD_PACKAGES;`);
      }
    }
  }

  lines.push(``);
  return lines.join("\n");
};

/* ── GET handler ───────────────────────────────────────────────────── */

export async function GET() {
  if (!isDev) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const values = parseBalanceFile();
    const sections = SECTIONS.map((s) => ({
      ...s,
      fields: s.fields.map((f) => ({
        ...f,
        value: values[f.name] ?? null,
      })),
    }));
    return NextResponse.json({ sections });
  } catch (err) {
    console.error("[api/dev/balance GET]", err);
    return NextResponse.json({ error: "Failed to parse balance.ts" }, { status: 500 });
  }
}

/* ── POST handler ──────────────────────────────────────────────────── */

export async function POST(request: Request) {
  if (!isDev) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const values: Record<string, unknown> = body.values;

    if (!values || typeof values !== "object") {
      return NextResponse.json({ error: "Missing values object" }, { status: 400 });
    }

    const fileContent = generateBalanceFile(values);
    fs.writeFileSync(BALANCE_PATH, fileContent, "utf-8");

    return NextResponse.json({ ok: true, bytesWritten: fileContent.length });
  } catch (err) {
    console.error("[api/dev/balance POST]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to write balance.ts" },
      { status: 500 }
    );
  }
}
