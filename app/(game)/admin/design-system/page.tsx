"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAdminGuard } from "@/lib/hooks/useAdminGuard";
import PageLoader from "@/app/components/PageLoader";
import FormInput from "@/app/components/FormInput";
import HeroCard from "@/app/components/HeroCard";
import {
  DEFAULT_TOKENS,
  TOKEN_META,
  getTokenGroups,
  mergeWithDefaults,
  tokensToCss,
  type DesignTokens,
} from "@/lib/design-tokens";

/* ────────────────── Types ────────────────── */

type SaveState = "idle" | "saving" | "saved" | "error";

/* ────────────────── Color Input ────────────────── */

const ColorTokenInput = ({
  label,
  tokenKey,
  value,
  onChange,
}: {
  label: string;
  tokenKey: string;
  value: string;
  onChange: (key: string, val: string) => void;
}) => {
  /** Convert various colour formats to #hex for the native input */
  const toHex = (v: string): string => {
    if (v.startsWith("#")) return v.length <= 7 ? v : v.slice(0, 7);
    // Try to parse rgba / rgb through a temporary element
    if (typeof document === "undefined") return "#000000";
    const el = document.createElement("div");
    el.style.color = v;
    document.body.appendChild(el);
    const computed = getComputedStyle(el).color;
    document.body.removeChild(el);
    const match = computed.match(/\d+/g);
    if (!match) return "#000000";
    const [r, g, b] = match.map(Number);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  const hexValue = useMemo(() => toHex(value), [value]);

  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={hexValue}
        onChange={(e) => onChange(tokenKey, e.target.value)}
        className="h-8 w-8 cursor-pointer rounded border border-slate-600 bg-transparent"
        aria-label={label}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-slate-300">{label}</p>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(tokenKey, e.target.value)}
          className="mt-0.5 w-full rounded border border-slate-700 bg-slate-800/60 px-2 py-1 font-mono text-[11px] text-slate-400 outline-none focus:border-amber-500/50"
          aria-label={`${label} value`}
        />
      </div>
    </div>
  );
};

/* ────────────────── Size / Number Input ────────────────── */

const SizeTokenInput = ({
  label,
  tokenKey,
  value,
  onChange,
}: {
  label: string;
  tokenKey: string;
  value: string;
  onChange: (key: string, val: string) => void;
}) => (
  <div className="flex items-center gap-3">
    <div className="flex h-8 w-8 items-center justify-center rounded border border-slate-600 bg-slate-800 text-[10px] font-bold text-slate-400">
      px
    </div>
    <div className="min-w-0 flex-1">
      <p className="truncate text-xs font-medium text-slate-300">{label}</p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(tokenKey, e.target.value)}
        className="mt-0.5 w-full rounded border border-slate-700 bg-slate-800/60 px-2 py-1 font-mono text-[11px] text-slate-400 outline-none focus:border-amber-500/50"
        aria-label={`${label} value`}
      />
    </div>
  </div>
);

/* ────────────────── Section Wrapper ────────────────── */

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="rounded-xl border border-slate-700/50 bg-slate-900/80">
    <div className="border-b border-slate-700/50 px-5 py-3">
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
        {title}
      </h2>
    </div>
    <div className="p-5">{children}</div>
  </section>
);

/* ────────────────── Preview: Buttons ────────────────── */

const ButtonPreview = () => (
  <div className="flex flex-wrap gap-3">
    <button
      type="button"
      className="font-bold text-white shadow-lg transition hover:brightness-110"
      style={{
        background: `linear-gradient(to right, var(--ds-primary-from), var(--ds-primary-to))`,
        borderRadius: "var(--ds-btn-radius)",
        paddingInline: "var(--ds-btn-px)",
        paddingBlock: "var(--ds-btn-py)",
        fontSize: "var(--ds-btn-font-size)",
        fontWeight: "var(--ds-btn-font-weight)" as unknown as number,
      }}
    >
      Primary Button
    </button>
    <button
      type="button"
      className="border font-bold text-slate-300 transition hover:text-white"
      style={{
        borderColor: "var(--ds-border)",
        backgroundColor: "var(--ds-bg-card)",
        borderRadius: "var(--ds-btn-radius)",
        paddingInline: "var(--ds-btn-px)",
        paddingBlock: "var(--ds-btn-py)",
        fontSize: "var(--ds-btn-font-size)",
      }}
    >
      Secondary Button
    </button>
    <button
      type="button"
      className="font-bold text-white transition hover:brightness-110"
      style={{
        backgroundColor: "var(--ds-danger)",
        borderRadius: "var(--ds-btn-radius)",
        paddingInline: "var(--ds-btn-px)",
        paddingBlock: "var(--ds-btn-py)",
        fontSize: "var(--ds-btn-font-size)",
      }}
    >
      Danger Button
    </button>
    <button
      type="button"
      disabled
      className="cursor-not-allowed font-bold text-slate-500 opacity-50"
      style={{
        backgroundColor: "var(--ds-bg-card)",
        borderRadius: "var(--ds-btn-radius)",
        paddingInline: "var(--ds-btn-px)",
        paddingBlock: "var(--ds-btn-py)",
        fontSize: "var(--ds-btn-font-size)",
      }}
    >
      Disabled
    </button>
  </div>
);

/* ────────────────── Preview: Inputs ────────────────── */

const InputPreview = () => {
  const [val1, setVal1] = useState("Example text");
  const [val2, setVal2] = useState("");

  return (
    <div className="flex flex-col gap-4 max-w-sm">
      <FormInput
        label="Username"
        type="text"
        value={val1}
        onChange={setVal1}
        placeholder="Enter username…"
      />
      <FormInput
        label="Password"
        type="password"
        value={val2}
        onChange={setVal2}
        placeholder="Enter password…"
      />
    </div>
  );
};

/* ────────────────── Preview: HeroCards ────────────────── */

const HeroCardPreview = () => {
  const classes = ["warrior", "rogue", "mage", "tank"];
  const mockStats = {
    strength: 25,
    agility: 18,
    intelligence: 12,
    vitality: 30,
    luck: 8,
  };

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4" style={{ maxWidth: 720 }}>
      {classes.map((cls) => (
        <HeroCard
          key={cls}
          name={`${cls.charAt(0).toUpperCase() + cls.slice(1)} Hero`}
          className={cls}
          origin="human"
          level={42}
          rating={1500}
          hp={{ current: 750, max: 1000 }}
          stats={mockStats}
          statSize="sm"
        />
      ))}
    </div>
  );
};

/* ────────────────── Preview: Progress Bars ────────────────── */

const ProgressBarPreview = () => {
  const bars = [
    { label: "HP (High)", pct: 85, from: "var(--ds-success)", to: "#4ade80" },
    { label: "HP (Medium)", pct: 45, from: "#ea580c", to: "#f97316" },
    { label: "HP (Low)", pct: 15, from: "var(--ds-danger)", to: "#f87171" },
    { label: "XP", pct: 60, from: "var(--ds-accent)", to: "#818cf8" },
    { label: "Stamina", pct: 70, from: "var(--ds-primary-from)", to: "var(--ds-primary-to)" },
  ];

  return (
    <div className="flex flex-col gap-3 max-w-md">
      {bars.map((bar) => (
        <div key={bar.label}>
          <p className="mb-1 text-xs font-medium text-slate-400">{bar.label}</p>
          <div className="relative h-7 w-full overflow-hidden rounded-full border border-slate-600/80 bg-slate-900/80">
            <div
              className="absolute inset-y-0 left-0 transition-all duration-500 ease-out"
              style={{
                width: `${bar.pct}%`,
                background: `linear-gradient(to right, ${bar.from}, ${bar.to})`,
              }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {bar.pct}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ────────────────── Preview: Loader ────────────────── */

const LoaderPreview = () => (
  <div className="h-40">
    <PageLoader emoji="⚔️" text="Loading preview…" />
  </div>
);

/* ────────────────── Preview: Typography ────────────────── */

const TypographyPreview = () => (
  <div className="space-y-3">
    <h1 className="text-2xl font-bold" style={{ color: "var(--ds-text)" }}>
      Heading 1 — Iron Fist Arena
    </h1>
    <h2 className="text-xl font-bold" style={{ color: "var(--ds-text)" }}>
      Heading 2 — Battle Report
    </h2>
    <h3 className="text-lg font-semibold" style={{ color: "var(--ds-text)" }}>
      Heading 3 — Item Details
    </h3>
    <p className="text-sm" style={{ color: "var(--ds-text-muted)" }}>
      Body text — muted. This is how secondary information appears throughout the game UI. Stats,
      descriptions, and help text all use this style.
    </p>
    <p className="text-xs" style={{ color: "var(--ds-text-muted)" }}>
      Caption — smallest text used for labels, timestamps and abbreviations.
    </p>
  </div>
);

/* ────────────────── Preview: Nav Items ────────────────── */

const NavPreview = () => (
  <div className="flex flex-col gap-2 max-w-xs">
    <div
      className="flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium text-white"
      style={{ borderColor: "var(--ds-nav-active-border)", backgroundColor: "var(--ds-nav-active-bg)" }}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700/50 bg-slate-800/80 text-lg">
        🏠
      </span>
      <div>
        <p className="font-bold tracking-wide">Hub</p>
        <p className="text-[10px] text-slate-500">Home</p>
      </div>
    </div>
    <div className="flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm font-medium text-slate-400">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700/50 bg-slate-800/80 text-lg">
        ⚔️
      </span>
      <div>
        <p className="font-bold tracking-wide">Arena</p>
        <p className="text-[10px] text-slate-500">PvP Battles</p>
      </div>
    </div>
    <div
      className="flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium text-white"
      style={{ borderColor: "var(--ds-nav-admin-active-border)", backgroundColor: "var(--ds-nav-admin-active-bg)" }}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-700/50 bg-amber-900/30 text-lg">
        🛠
      </span>
      <div>
        <p className="font-bold tracking-wide">Dev Panel</p>
        <p className="text-[10px] text-slate-500">Admin active</p>
      </div>
    </div>
  </div>
);

/* ────────────────── Main Page ────────────────── */

const DesignSystemPage = () => {
  const { isAdmin, loading: guardLoading } = useAdminGuard();
  const [tokens, setTokens] = useState<DesignTokens>(DEFAULT_TOKENS);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const previewStyleRef = useRef<HTMLStyleElement | null>(null);

  const groups = useMemo(() => getTokenGroups(), []);

  /* ── Load tokens from DB ── */
  useEffect(() => {
    if (!isAdmin) return;
    const controller = new AbortController();
    fetch("/api/design-tokens", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.tokens) {
          setTokens(mergeWithDefaults(data.tokens));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => controller.abort();
  }, [isAdmin]);

  /* ── Inject live preview styles ── */
  useEffect(() => {
    const css = tokensToCss(tokens);
    if (!previewStyleRef.current) {
      const el = document.createElement("style");
      el.setAttribute("data-ds-preview", "true");
      document.head.appendChild(el);
      previewStyleRef.current = el;
    }
    previewStyleRef.current.textContent = css;

    return () => {
      if (previewStyleRef.current) {
        previewStyleRef.current.remove();
        previewStyleRef.current = null;
      }
    };
  }, [tokens]);

  /* ── Token change handler ── */
  const handleTokenChange = useCallback((key: string, value: string) => {
    setTokens((prev) => ({ ...prev, [key]: value }));
    setSaveState("idle");
  }, []);

  /* ── Save tokens ── */
  const handleSave = useCallback(async () => {
    setSaveState("saving");
    try {
      // Only save non-default values to keep the payload lean
      const diff: Partial<DesignTokens> = {};
      for (const [k, v] of Object.entries(tokens)) {
        if (v !== DEFAULT_TOKENS[k as keyof DesignTokens]) {
          (diff as Record<string, string>)[k] = v;
        }
      }

      const res = await fetch("/api/design-tokens", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokens: diff }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2500);
    } catch {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 3000);
    }
  }, [tokens]);

  /* ── Reset to defaults ── */
  const handleReset = useCallback(async () => {
    setTokens({ ...DEFAULT_TOKENS });
    setSaveState("saving");
    try {
      const res = await fetch("/api/design-tokens", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokens: {} }),
      });
      if (!res.ok) throw new Error("Reset failed");
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2500);
    } catch {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 3000);
    }
  }, []);

  /* ── Guard ── */
  if (guardLoading || !isAdmin) return <PageLoader text="Checking access…" />;
  if (loading) return <PageLoader text="Loading design tokens…" />;

  const saveLabel =
    saveState === "saving"
      ? "Saving…"
      : saveState === "saved"
        ? "Saved!"
        : saveState === "error"
          ? "Error!"
          : "Save Changes";

  const saveColor =
    saveState === "saved"
      ? "from-green-600 to-green-500"
      : saveState === "error"
        ? "from-red-600 to-red-500"
        : "from-amber-600 to-orange-600";

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Design System</h1>
          <p className="text-sm text-slate-400">
            Master components — changes here apply globally across the entire product.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={saveState === "saving"}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-white disabled:opacity-50"
            aria-label="Reset to defaults"
          >
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saveState === "saving"}
            className={`rounded-lg bg-gradient-to-r ${saveColor} px-5 py-2 text-sm font-bold text-white shadow-lg transition hover:brightness-110 disabled:opacity-70`}
            aria-label="Save design tokens"
          >
            {saveLabel}
          </button>
        </div>
      </div>

      {/* ── Group tabs ── */}
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-800 bg-slate-900/50 p-1.5">
        <button
          type="button"
          onClick={() => setActiveGroup(null)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition
            ${activeGroup === null
              ? "border border-amber-500/40 bg-amber-500/15 text-white"
              : "border border-transparent text-slate-400 hover:text-white"
            }
          `}
          aria-label="Show all sections"
        >
          All
        </button>
        {groups.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setActiveGroup(g)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition
              ${activeGroup === g
                ? "border border-amber-500/40 bg-amber-500/15 text-white"
                : "border border-transparent text-slate-400 hover:text-white"
              }
            `}
            aria-label={`Show ${g} section`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* ── Token Sections ── */}
      {groups
        .filter((g) => activeGroup === null || activeGroup === g)
        .map((group) => {
          const groupTokens = TOKEN_META.filter((m) => m.group === group);

          return (
            <Section key={group} title={group}>
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Controls */}
                <div className="space-y-3">
                  {groupTokens.map((meta) => {
                    const value = tokens[meta.key];
                    if (meta.type === "color") {
                      return (
                        <ColorTokenInput
                          key={meta.key}
                          label={meta.label}
                          tokenKey={meta.key}
                          value={value}
                          onChange={handleTokenChange}
                        />
                      );
                    }
                    return (
                      <SizeTokenInput
                        key={meta.key}
                        label={meta.label}
                        tokenKey={meta.key}
                        value={value}
                        onChange={handleTokenChange}
                      />
                    );
                  })}
                </div>

                {/* Preview */}
                <div className="rounded-lg border border-slate-700/30 bg-slate-950/60 p-4">
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                    Live Preview
                  </p>
                  {group === "Colors" && <TypographyPreview />}
                  {group === "Button" && <ButtonPreview />}
                  {group === "Input" && <InputPreview />}
                  {group === "Card" && <HeroCardPreview />}
                  {group === "Loader" && <LoaderPreview />}
                  {group === "Classes" && <HeroCardPreview />}
                  {group === "Nav" && <NavPreview />}
                </div>
              </div>
            </Section>
          );
        })}

      {/* ── Full Component Gallery ── */}
      {activeGroup === null && (
        <>
          <Section title="Full Component Gallery">
            <div className="space-y-8">
              <div>
                <h3 className="mb-3 text-sm font-bold text-slate-300">Buttons</h3>
                <ButtonPreview />
              </div>
              <div>
                <h3 className="mb-3 text-sm font-bold text-slate-300">Form Inputs</h3>
                <InputPreview />
              </div>
              <div>
                <h3 className="mb-3 text-sm font-bold text-slate-300">Hero Cards</h3>
                <HeroCardPreview />
              </div>
              <div>
                <h3 className="mb-3 text-sm font-bold text-slate-300">Progress Bars</h3>
                <ProgressBarPreview />
              </div>
              <div>
                <h3 className="mb-3 text-sm font-bold text-slate-300">Navigation</h3>
                <NavPreview />
              </div>
              <div>
                <h3 className="mb-3 text-sm font-bold text-slate-300">Page Loader</h3>
                <LoaderPreview />
              </div>
              <div>
                <h3 className="mb-3 text-sm font-bold text-slate-300">Typography</h3>
                <TypographyPreview />
              </div>
            </div>
          </Section>
        </>
      )}
    </div>
  );
};

export default DesignSystemPage;
