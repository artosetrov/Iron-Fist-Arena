/* ────────────────── Design Tokens ────────────────── */

/** All token groups that can be customised from the Design System admin page. */

export type DesignTokens = {
  /* ── Global colors ── */
  "--ds-primary-from": string;
  "--ds-primary-to": string;
  "--ds-primary-hover-from": string;
  "--ds-primary-hover-to": string;
  "--ds-accent": string;
  "--ds-danger": string;
  "--ds-success": string;
  "--ds-bg-card": string;
  "--ds-bg-input": string;
  "--ds-border": string;
  "--ds-border-focus": string;
  "--ds-ring-focus": string;
  "--ds-text": string;
  "--ds-text-muted": string;

  /* ── Button ── */
  "--ds-btn-radius": string;
  "--ds-btn-px": string;
  "--ds-btn-py": string;
  "--ds-btn-font-size": string;
  "--ds-btn-font-weight": string;

  /* ── Card ── */
  "--ds-card-radius": string;
  "--ds-card-border-width": string;

  /* ── Input ── */
  "--ds-input-radius": string;
  "--ds-input-px": string;
  "--ds-input-py": string;

  /* ── Loader ── */
  "--ds-loader-accent-1": string;
  "--ds-loader-accent-2": string;

  /* ── Class colours ── */
  "--ds-class-warrior-border": string;
  "--ds-class-warrior-glow": string;
  "--ds-class-warrior-accent-from": string;
  "--ds-class-warrior-accent-via": string;
  "--ds-class-warrior-accent-to": string;
  "--ds-class-warrior-gradient-from": string;
  "--ds-class-warrior-gradient-to": string;

  "--ds-class-rogue-border": string;
  "--ds-class-rogue-glow": string;
  "--ds-class-rogue-accent-from": string;
  "--ds-class-rogue-accent-via": string;
  "--ds-class-rogue-accent-to": string;
  "--ds-class-rogue-gradient-from": string;
  "--ds-class-rogue-gradient-to": string;

  "--ds-class-mage-border": string;
  "--ds-class-mage-glow": string;
  "--ds-class-mage-accent-from": string;
  "--ds-class-mage-accent-via": string;
  "--ds-class-mage-accent-to": string;
  "--ds-class-mage-gradient-from": string;
  "--ds-class-mage-gradient-to": string;

  "--ds-class-tank-border": string;
  "--ds-class-tank-glow": string;
  "--ds-class-tank-accent-from": string;
  "--ds-class-tank-accent-via": string;
  "--ds-class-tank-accent-to": string;
  "--ds-class-tank-gradient-from": string;
  "--ds-class-tank-gradient-to": string;

  /* ── Nav ── */
  "--ds-nav-active-border": string;
  "--ds-nav-active-bg": string;
  "--ds-nav-admin-active-border": string;
  "--ds-nav-admin-active-bg": string;
};

/** Default (factory) token values — matches existing hardcoded styles. */
export const DEFAULT_TOKENS: DesignTokens = {
  /* ── Global colors ── */
  "--ds-primary-from": "#d97706", // amber-600
  "--ds-primary-to": "#ea580c", // orange-600
  "--ds-primary-hover-from": "#b45309", // amber-700
  "--ds-primary-hover-to": "#c2410c", // orange-700
  "--ds-accent": "#6366f1", // indigo-500
  "--ds-danger": "#ef4444", // red-500
  "--ds-success": "#22c55e", // green-500
  "--ds-bg-card": "rgba(15,23,42,0.8)", // slate-900/80
  "--ds-bg-input": "rgba(30,41,59,0.6)", // slate-800/60
  "--ds-border": "#334155", // slate-700
  "--ds-border-focus": "rgba(245,158,11,0.5)", // amber-500/50
  "--ds-ring-focus": "rgba(245,158,11,0.3)", // amber-500/30
  "--ds-text": "#ffffff",
  "--ds-text-muted": "#94a3b8", // slate-400

  /* ── Button ── */
  "--ds-btn-radius": "1rem", // rounded-2xl ≈ 16px
  "--ds-btn-px": "1.5rem",
  "--ds-btn-py": "0.75rem",
  "--ds-btn-font-size": "0.875rem",
  "--ds-btn-font-weight": "700",

  /* ── Card ── */
  "--ds-card-radius": "1rem",
  "--ds-card-border-width": "2px",

  /* ── Input ── */
  "--ds-input-radius": "0.75rem", // rounded-xl
  "--ds-input-px": "1rem",
  "--ds-input-py": "0.75rem",

  /* ── Loader ── */
  "--ds-loader-accent-1": "#818cf8", // indigo-400
  "--ds-loader-accent-2": "#c084fc", // purple-400

  /* ── Class colours ── */
  "--ds-class-warrior-border": "rgba(185,28,28,0.8)", // red-700/80
  "--ds-class-warrior-glow": "rgba(220,38,38,0.4)", // red-600/40
  "--ds-class-warrior-accent-from": "#991b1b", // red-800
  "--ds-class-warrior-accent-via": "#7f1d1d", // red-900
  "--ds-class-warrior-accent-to": "#450a0a", // red-950
  "--ds-class-warrior-gradient-from": "#7f1d1d", // red-900
  "--ds-class-warrior-gradient-to": "#450a0a", // red-950

  "--ds-class-rogue-border": "rgba(4,120,87,0.8)", // emerald-700/80
  "--ds-class-rogue-glow": "rgba(5,150,105,0.4)", // emerald-600/40
  "--ds-class-rogue-accent-from": "#065f46", // emerald-800
  "--ds-class-rogue-accent-via": "#064e3b", // emerald-900
  "--ds-class-rogue-accent-to": "#022c22", // emerald-950
  "--ds-class-rogue-gradient-from": "#064e3b", // emerald-900
  "--ds-class-rogue-gradient-to": "#022c22", // emerald-950

  "--ds-class-mage-border": "rgba(29,78,216,0.8)", // blue-700/80
  "--ds-class-mage-glow": "rgba(37,99,235,0.4)", // blue-600/40
  "--ds-class-mage-accent-from": "#1e40af", // blue-800
  "--ds-class-mage-accent-via": "#1e3a8a", // blue-900
  "--ds-class-mage-accent-to": "#172554", // blue-950
  "--ds-class-mage-gradient-from": "#1e3a8a", // blue-900
  "--ds-class-mage-gradient-to": "#172554", // blue-950

  "--ds-class-tank-border": "rgba(180,83,9,0.8)", // amber-700/80
  "--ds-class-tank-glow": "rgba(217,119,6,0.4)", // amber-600/40
  "--ds-class-tank-accent-from": "#92400e", // amber-800
  "--ds-class-tank-accent-via": "#78350f", // amber-900
  "--ds-class-tank-accent-to": "#451a03", // amber-950
  "--ds-class-tank-gradient-from": "#78350f", // amber-900
  "--ds-class-tank-gradient-to": "#451a03", // amber-950

  /* ── Nav ── */
  "--ds-nav-active-border": "rgba(99,102,241,0.3)", // indigo-500/30
  "--ds-nav-active-bg": "rgba(99,102,241,0.1)", // indigo-500/10
  "--ds-nav-admin-active-border": "rgba(245,158,11,0.3)", // amber-500/30
  "--ds-nav-admin-active-bg": "rgba(245,158,11,0.1)", // amber-500/10
};

/** Token metadata for the editor UI */
export type TokenMeta = {
  key: keyof DesignTokens;
  label: string;
  group: string;
  type: "color" | "size" | "number";
};

export const TOKEN_META: TokenMeta[] = [
  /* ── Global colors ── */
  { key: "--ds-primary-from", label: "Primary gradient start", group: "Colors", type: "color" },
  { key: "--ds-primary-to", label: "Primary gradient end", group: "Colors", type: "color" },
  { key: "--ds-primary-hover-from", label: "Primary hover start", group: "Colors", type: "color" },
  { key: "--ds-primary-hover-to", label: "Primary hover end", group: "Colors", type: "color" },
  { key: "--ds-accent", label: "Accent (indigo)", group: "Colors", type: "color" },
  { key: "--ds-danger", label: "Danger", group: "Colors", type: "color" },
  { key: "--ds-success", label: "Success", group: "Colors", type: "color" },
  { key: "--ds-bg-card", label: "Card background", group: "Colors", type: "color" },
  { key: "--ds-bg-input", label: "Input background", group: "Colors", type: "color" },
  { key: "--ds-border", label: "Border color", group: "Colors", type: "color" },
  { key: "--ds-border-focus", label: "Border focus", group: "Colors", type: "color" },
  { key: "--ds-ring-focus", label: "Ring focus", group: "Colors", type: "color" },
  { key: "--ds-text", label: "Text", group: "Colors", type: "color" },
  { key: "--ds-text-muted", label: "Muted text", group: "Colors", type: "color" },

  /* ── Button ── */
  { key: "--ds-btn-radius", label: "Border radius", group: "Button", type: "size" },
  { key: "--ds-btn-px", label: "Padding X", group: "Button", type: "size" },
  { key: "--ds-btn-py", label: "Padding Y", group: "Button", type: "size" },
  { key: "--ds-btn-font-size", label: "Font size", group: "Button", type: "size" },
  { key: "--ds-btn-font-weight", label: "Font weight", group: "Button", type: "number" },

  /* ── Card ── */
  { key: "--ds-card-radius", label: "Border radius", group: "Card", type: "size" },
  { key: "--ds-card-border-width", label: "Border width", group: "Card", type: "size" },

  /* ── Input ── */
  { key: "--ds-input-radius", label: "Border radius", group: "Input", type: "size" },
  { key: "--ds-input-px", label: "Padding X", group: "Input", type: "size" },
  { key: "--ds-input-py", label: "Padding Y", group: "Input", type: "size" },

  /* ── Loader ── */
  { key: "--ds-loader-accent-1", label: "Spinner ring 1", group: "Loader", type: "color" },
  { key: "--ds-loader-accent-2", label: "Spinner ring 2", group: "Loader", type: "color" },

  /* ── Class: Warrior ── */
  { key: "--ds-class-warrior-border", label: "Warrior border", group: "Classes", type: "color" },
  { key: "--ds-class-warrior-glow", label: "Warrior glow", group: "Classes", type: "color" },
  { key: "--ds-class-warrior-accent-from", label: "Warrior accent from", group: "Classes", type: "color" },
  { key: "--ds-class-warrior-accent-via", label: "Warrior accent via", group: "Classes", type: "color" },
  { key: "--ds-class-warrior-accent-to", label: "Warrior accent to", group: "Classes", type: "color" },
  { key: "--ds-class-warrior-gradient-from", label: "Warrior bg from", group: "Classes", type: "color" },
  { key: "--ds-class-warrior-gradient-to", label: "Warrior bg to", group: "Classes", type: "color" },

  /* ── Class: Rogue ── */
  { key: "--ds-class-rogue-border", label: "Rogue border", group: "Classes", type: "color" },
  { key: "--ds-class-rogue-glow", label: "Rogue glow", group: "Classes", type: "color" },
  { key: "--ds-class-rogue-accent-from", label: "Rogue accent from", group: "Classes", type: "color" },
  { key: "--ds-class-rogue-accent-via", label: "Rogue accent via", group: "Classes", type: "color" },
  { key: "--ds-class-rogue-accent-to", label: "Rogue accent to", group: "Classes", type: "color" },
  { key: "--ds-class-rogue-gradient-from", label: "Rogue bg from", group: "Classes", type: "color" },
  { key: "--ds-class-rogue-gradient-to", label: "Rogue bg to", group: "Classes", type: "color" },

  /* ── Class: Mage ── */
  { key: "--ds-class-mage-border", label: "Mage border", group: "Classes", type: "color" },
  { key: "--ds-class-mage-glow", label: "Mage glow", group: "Classes", type: "color" },
  { key: "--ds-class-mage-accent-from", label: "Mage accent from", group: "Classes", type: "color" },
  { key: "--ds-class-mage-accent-via", label: "Mage accent via", group: "Classes", type: "color" },
  { key: "--ds-class-mage-accent-to", label: "Mage accent to", group: "Classes", type: "color" },
  { key: "--ds-class-mage-gradient-from", label: "Mage bg from", group: "Classes", type: "color" },
  { key: "--ds-class-mage-gradient-to", label: "Mage bg to", group: "Classes", type: "color" },

  /* ── Class: Tank ── */
  { key: "--ds-class-tank-border", label: "Tank border", group: "Classes", type: "color" },
  { key: "--ds-class-tank-glow", label: "Tank glow", group: "Classes", type: "color" },
  { key: "--ds-class-tank-accent-from", label: "Tank accent from", group: "Classes", type: "color" },
  { key: "--ds-class-tank-accent-via", label: "Tank accent via", group: "Classes", type: "color" },
  { key: "--ds-class-tank-accent-to", label: "Tank accent to", group: "Classes", type: "color" },
  { key: "--ds-class-tank-gradient-from", label: "Tank bg from", group: "Classes", type: "color" },
  { key: "--ds-class-tank-gradient-to", label: "Tank bg to", group: "Classes", type: "color" },

  /* ── Nav ── */
  { key: "--ds-nav-active-border", label: "Nav active border", group: "Nav", type: "color" },
  { key: "--ds-nav-active-bg", label: "Nav active bg", group: "Nav", type: "color" },
  { key: "--ds-nav-admin-active-border", label: "Admin nav border", group: "Nav", type: "color" },
  { key: "--ds-nav-admin-active-bg", label: "Admin nav bg", group: "Nav", type: "color" },
];

/** Convert a partial or full token map into a CSS :root block string. */
export const tokensToCss = (tokens: Partial<DesignTokens>): string => {
  const entries = Object.entries(tokens)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");
  return entries ? `:root {\n${entries}\n}` : "";
};

/** Merge saved (partial) tokens with defaults to get a full set. */
export const mergeWithDefaults = (saved: Partial<DesignTokens>): DesignTokens => ({
  ...DEFAULT_TOKENS,
  ...saved,
});

/** Get unique group names in order. */
export const getTokenGroups = (): string[] => {
  const seen = new Set<string>();
  const groups: string[] = [];
  for (const meta of TOKEN_META) {
    if (!seen.has(meta.group)) {
      seen.add(meta.group);
      groups.push(meta.group);
    }
  }
  return groups;
};
