/* ────────────────────────────────────────────────────────────
 * Combat Asset Preloader
 *
 * Collects all unique image URLs needed for a specific battle
 * (based on the combat log and VFX_MAP) and preloads them
 * into the browser cache via <Image> elements.
 * ──────────────────────────────────────────────────────────── */

import { resolveVfx, STATUS_VFX, collectAllVfxAssets } from "./combat-vfx-map";

type MinimalLogEntry = {
  action: string;
  actorId: string;
  dodge?: boolean;
  crit?: boolean;
  statusTicks?: { type: string }[];
};

type MinimalSnapshot = {
  id: string;
  class: string;
};

/**
 * Collect all unique image paths that a specific battle will use.
 * Scans the combat log and resolves each entry against VFX_MAP.
 */
export const collectBattleAssets = (
  log: MinimalLogEntry[],
  playerSnapshot: MinimalSnapshot,
  enemySnapshot: MinimalSnapshot,
): string[] => {
  const set = new Set<string>();

  const classById: Record<string, string> = {
    [playerSnapshot.id]: playerSnapshot.class,
    [enemySnapshot.id]: enemySnapshot.class,
  };

  for (const entry of log) {
    const actorClass = classById[entry.actorId] ?? "warrior";

    // Action VFX
    const config = resolveVfx(entry.action, actorClass);
    if (config) {
      if (config.projectile) set.add(config.projectile);
      set.add(config.impact);
      for (const p of config.popups) set.add(p);
    }

    // Dodge overlay
    if (entry.dodge) {
      const dodgeVfx = resolveVfx("dodge", actorClass);
      if (dodgeVfx) {
        set.add(dodgeVfx.impact);
        for (const p of dodgeVfx.popups) set.add(p);
      }
    }

    // Crit overlay
    if (entry.crit) {
      const critVfx = resolveVfx("crit", actorClass);
      if (critVfx) {
        set.add(critVfx.impact);
        for (const p of critVfx.popups) set.add(p);
      }
    }

    // Status ticks
    if (entry.statusTicks) {
      for (const tick of entry.statusTicks) {
        const statusSrc = STATUS_VFX[tick.type];
        if (statusSrc) set.add(statusSrc);
      }
    }
  }

  return Array.from(set);
};

/**
 * Preload an array of image URLs into browser cache.
 * Returns a Promise that resolves when ALL images are loaded
 * (errors are swallowed — missing images won't block the battle).
 *
 * Optional `onProgress` callback reports loaded count.
 */
export const preloadImages = (
  urls: string[],
  onProgress?: (loaded: number, total: number) => void,
): Promise<void> => {
  if (urls.length === 0) return Promise.resolve();

  let loaded = 0;
  const total = urls.length;

  return Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new window.Image();
          img.onload = () => {
            loaded++;
            onProgress?.(loaded, total);
            resolve();
          };
          img.onerror = () => {
            loaded++;
            onProgress?.(loaded, total);
            resolve(); // Don't block on missing assets
          };
          img.src = url;
        }),
    ),
  ).then(() => {});
};

/**
 * Preload ALL combat VFX assets (for eager preloading).
 * Call this once on the loading screen.
 */
export const preloadAllCombatAssets = (
  onProgress?: (loaded: number, total: number) => void,
): Promise<void> => {
  const allAssets = collectAllVfxAssets();
  return preloadImages(allAssets, onProgress);
};
