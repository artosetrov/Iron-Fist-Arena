/* ────────────────────────────────────────────────────────────
 * Combat VFX Map
 * Maps (action + class) to visual effects: projectile, impact, popup sprites.
 * ──────────────────────────────────────────────────────────── */

export type VfxConfig = {
  /** Path to projectile PNG (flies from attacker to target) */
  projectile?: string;
  /** Path to impact PNG (appears on target card) */
  impact: string;
  /** Pool of pop-up sprite PNG paths (random pick each time) */
  popups: string[];
  /** If true, shake the entire battle area (for ultimates) */
  screenShake?: boolean;
};

/* ── Shorthand helpers ── */
const proj = (name: string) => `/images/combat/projectiles/${name}`;
const imp = (name: string) => `/images/combat/impacts/${name}`;
const pop = (name: string) => `/images/combat/popups/${name}`;
const stat = (name: string) => `/images/combat/status/${name}`;

/* ── Status tick VFX (separate from action VFX) ── */
export const STATUS_VFX: Record<string, string> = {
  bleed: stat("status-bleed.png"),
  poison: stat("status-poison.png"),
  burn: stat("status-burn.png"),
};

/* ── Main VFX map: key = "action:class" or special key ── */
export const VFX_MAP: Record<string, VfxConfig> = {
  /* ── Warrior ── */
  "basic:warrior": {
    projectile: proj("proj-sword.png"),
    impact: imp("impact-slash.png"),
    popups: [pop("pop-boom.png"), pop("pop-slash.png"), pop("pop-take-that.png")],
  },
  "heavy_strike:warrior": {
    projectile: proj("proj-sword.png"),
    impact: imp("impact-blood.png"),
    popups: [pop("pop-wrecked.png"), pop("pop-destroyed.png"), pop("pop-boom.png")],
    screenShake: true,
  },
  "battle_cry:warrior": {
    impact: imp("impact-buff.png"),
    popups: [pop("pop-power-up.png"), pop("pop-boosted.png")],
  },
  "whirlwind:warrior": {
    projectile: proj("proj-sword.png"),
    impact: imp("impact-slash.png"),
    popups: [pop("pop-slash.png"), pop("pop-wrecked.png")],
    screenShake: true,
  },
  "titan_slam:warrior": {
    projectile: proj("proj-sword.png"),
    impact: imp("impact-blood.png"),
    popups: [pop("pop-obliterated.png"), pop("pop-destroyed.png"), pop("pop-wrecked.png")],
    screenShake: true,
  },

  /* ── Rogue ── */
  "basic:rogue": {
    projectile: proj("proj-dagger.png"),
    impact: imp("impact-slash.png"),
    popups: [pop("pop-slash.png"), pop("pop-ouch.png")],
  },
  "quick_strike:rogue": {
    projectile: proj("proj-dagger.png"),
    impact: imp("impact-slash.png"),
    popups: [pop("pop-slash.png"), pop("pop-too-slow.png")],
  },
  "shadow_step:rogue": {
    impact: imp("impact-buff.png"),
    popups: [pop("pop-boosted.png"), pop("pop-power-up.png")],
  },
  "backstab:rogue": {
    projectile: proj("proj-dagger.png"),
    impact: imp("impact-poison.png"),
    popups: [pop("pop-hahaha.png"), pop("pop-ouch.png")],
  },
  "assassinate:rogue": {
    projectile: proj("proj-dagger.png"),
    impact: imp("impact-blood.png"),
    popups: [pop("pop-annihilated.png"), pop("pop-destroyed.png"), pop("pop-wrecked.png")],
    screenShake: true,
  },

  /* ── Mage ── */
  "basic:mage": {
    projectile: proj("proj-fireball.png"),
    impact: imp("impact-fire.png"),
    popups: [pop("pop-boom.png"), pop("pop-burn.png")],
  },
  "fireball:mage": {
    projectile: proj("proj-fireball.png"),
    impact: imp("impact-fire.png"),
    popups: [pop("pop-burn.png"), pop("pop-fireball.png"), pop("pop-incinerate.png")],
  },
  "frost_nova:mage": {
    projectile: proj("proj-ice-shard.png"),
    impact: imp("impact-ice.png"),
    popups: [pop("pop-freeze.png"), pop("pop-brrr.png"), pop("pop-ice-cold.png")],
  },
  "lightning_strike:mage": {
    projectile: proj("proj-lightning.png"),
    impact: imp("impact-lightning.png"),
    popups: [pop("pop-bzzzzt.png"), pop("pop-shocking.png"), pop("pop-thunder.png")],
    screenShake: true,
  },
  "meteor_storm:mage": {
    projectile: proj("proj-fireball.png"),
    impact: imp("impact-fire.png"),
    popups: [pop("pop-annihilated.png"), pop("pop-obliterated.png"), pop("pop-burn.png")],
    screenShake: true,
  },

  /* ── Tank ── */
  "basic:tank": {
    projectile: proj("proj-mace.png"),
    impact: imp("impact-slash.png"),
    popups: [pop("pop-boom.png"), pop("pop-ouch.png")],
  },
  "shield_bash:tank": {
    projectile: proj("proj-shield.png"),
    impact: imp("impact-shield.png"),
    popups: [pop("pop-boom.png"), pop("pop-ouch.png")],
  },
  "iron_wall:tank": {
    impact: imp("impact-buff.png"),
    popups: [pop("pop-fortified.png"), pop("pop-power-up.png")],
  },
  "counter_strike:tank": {
    projectile: proj("proj-mace.png"),
    impact: imp("impact-slash.png"),
    popups: [pop("pop-boom.png"), pop("pop-ouch.png")],
  },
  "immovable_object:tank": {
    impact: imp("impact-buff.png"),
    popups: [pop("pop-fortified.png"), pop("pop-boosted.png")],
  },

  /* ── Special events ── */
  dodge: {
    impact: imp("impact-shield.png"),
    popups: [
      pop("pop-missed.png"),
      pop("pop-dodged.png"),
      pop("pop-too-slow.png"),
      pop("pop-hahaha.png"),
      pop("pop-nope.png"),
    ],
  },
  crit: {
    impact: imp("impact-blood.png"),
    popups: [
      pop("pop-crit.png"),
      pop("pop-brutal.png"),
      pop("pop-ouch-crit.png"),
      pop("pop-mommy.png"),
    ],
  },
  stun: {
    impact: imp("impact-stun.png"),
    popups: [pop("pop-stunned.png"), pop("pop-seeing-stars.png"), pop("pop-where-am-i.png")],
  },
  heal: {
    impact: imp("impact-heal.png"),
    popups: [pop("pop-healed.png"), pop("pop-plus-hp.png"), pop("pop-refreshed.png")],
  },

  /* ── Unarmed fallback ── */
  "basic:unarmed": {
    projectile: proj("proj-fist.png"),
    impact: imp("impact-slash.png"),
    popups: [pop("pop-boom.png"), pop("pop-ouch.png"), pop("pop-oof.png")],
  },
};

/* ── Lookup helper ── */

/**
 * Resolve VFX config for a combat log entry.
 * Tries `action:class`, then `action` alone, then `basic:class`, then `basic:unarmed`.
 */
export const resolveVfx = (
  action: string,
  actorClass: string,
): VfxConfig | null => {
  const cls = actorClass.toLowerCase();
  return (
    VFX_MAP[`${action}:${cls}`] ??
    VFX_MAP[action] ??
    VFX_MAP[`basic:${cls}`] ??
    VFX_MAP["basic:unarmed"] ??
    null
  );
};

/**
 * Pick a random popup sprite path from a VFX config.
 */
export const pickPopup = (config: VfxConfig): string => {
  const { popups } = config;
  return popups[Math.floor(Math.random() * popups.length)];
};

/**
 * Collect all unique image paths used in the VFX system.
 * Useful for preloading.
 */
export const collectAllVfxAssets = (): string[] => {
  const set = new Set<string>();

  for (const config of Object.values(VFX_MAP)) {
    if (config.projectile) set.add(config.projectile);
    set.add(config.impact);
    for (const p of config.popups) set.add(p);
  }

  for (const path of Object.values(STATUS_VFX)) {
    set.add(path);
  }

  return Array.from(set);
};
