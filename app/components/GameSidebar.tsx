"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ORIGIN_DEFS, type CharacterOrigin } from "@/lib/game/origins";
import {
  CONSUMABLE_CATALOG,
  type ConsumableType,
} from "@/lib/game/consumable-catalog";
import { xpForLevel } from "@/lib/game/progression";

/* ────────────────── Types ────────────────── */

type Character = {
  id: string;
  characterName: string;
  class: string;
  origin: string;
  level: number;
  currentXp: number;
  gold: number;
  currentStamina: number;
  maxStamina: number;
  lastStaminaUpdate: string;
  pvpRating: number;
};

type ConsumableInventoryItem = {
  consumableType: ConsumableType;
  quantity: number;
};

/* ────────────────── Constants ────────────────── */

const STAMINA_REGEN_MINUTES = 12;

const CLASS_ICON: Record<string, string> = {
  warrior: "⚔️",
  rogue: "🗡️",
  mage: "🧙",
  tank: "🛡️",
};

const ORIGIN_IMAGE: Record<string, string> = {
  human: "/images/origins/origin-human.png",
  orc: "/images/origins/origin-orc.png",
  skeleton: "/images/origins/origin-skeleton.png",
  demon: "/images/origins/origin-demon.png",
  dogfolk: "/images/origins/origin-dogfolk.png",
};

type NavItem = {
  href: string;
  label: string;
  icon: string;
  description: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/hub", label: "Hub", icon: "🏠", description: "Home" },
  { href: "/arena", label: "Arena", icon: "⚔️", description: "PvP Battles" },
  { href: "/dungeon", label: "Dungeons", icon: "🏰", description: "PvE, Loot" },
  { href: "/shop", label: "Shop", icon: "🪙", description: "Buy Items" },
  { href: "/minigames", label: "Tavern", icon: "🍺", description: "Mini Games & Gambling" },
  { href: "/combat", label: "Training", icon: "🎯", description: "Practice & XP" },
  { href: "/leaderboard", label: "Leaderboard", icon: "🏆", description: "Rankings" },
];

const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/dev-dashboard", label: "Dev Panel", icon: "🛠", description: "Monitoring" },
  { href: "/balance-editor", label: "Balance", icon: "⚖️", description: "Game Balance Editor" },
  { href: "/admin/design-system", label: "Design System", icon: "🎨", description: "Master Components" },
];

/* ────────────────── Stamina Hook ────────────────── */

const useStaminaRealtime = (current: number, max: number, lastUpdate: string) => {
  const [stamina, setStamina] = useState(current);
  const [nextIn, setNextIn] = useState<number | null>(null);

  useEffect(() => {
    const last = new Date(lastUpdate).getTime();

    const tick = () => {
      const now = Date.now();
      const minutesPassed = (now - last) / (60 * 1000);
      const regenerated = Math.floor(minutesPassed / STAMINA_REGEN_MINUTES);
      const newCurrent = Math.min(max, current + regenerated);
      setStamina(newCurrent);
      if (newCurrent >= max) {
        setNextIn(null);
        return;
      }
      const nextPointIn = (STAMINA_REGEN_MINUTES - (minutesPassed % STAMINA_REGEN_MINUTES)) * 60 * 1000;
      setNextIn(Math.round(nextPointIn / 1000));
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [current, max, lastUpdate]);

  return { stamina, nextIn };
};

/* ────────────────── Sidebar Component ────────────────── */

const GameSidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const characterId = searchParams.get("characterId");

  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [consumables, setConsumables] = useState<ConsumableInventoryItem[]>([]);
  const [usingPotion, setUsingPotion] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("player");

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/me", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.role) setUserRole(data.role);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const loadConsumables = useCallback(async (charId: string, signal: AbortSignal) => {
    try {
      const res = await fetch(`/api/consumables?characterId=${charId}`, { signal });
      if (res.ok) {
        const data = await res.json();
        setConsumables(data.consumables ?? []);
      }
    } catch {
      // non-critical, silently fail
    }
  }, []);

  const loadCharacter = useCallback(async (signal: AbortSignal) => {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/7c8db375-0ae9-4264-956f-949ed59bd0c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameSidebar.tsx:loadCharacter',message:'loadCharacter called',data:{pathname,characterId},timestamp:Date.now(),hypothesisId:'H4'})}).catch(()=>{});
    // #endregion
    try {
      setFetchError(false);
      if (characterId) {
        const res = await fetch(`/api/characters/${characterId}`, { signal });
        if (res.ok) {
          setCharacter(await res.json());
          loadConsumables(characterId, signal);
          return;
        }
        if (res.status === 401) {
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/7c8db375-0ae9-4264-956f-949ed59bd0c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameSidebar.tsx:loadCharacter:401redirect',message:'redirecting to /login from loadCharacter',data:{pathname,characterId},timestamp:Date.now(),hypothesisId:'H4'})}).catch(()=>{});
          // #endregion
          router.push("/login");
          return;
        }
      }
      // Fallback: load first character
      const listRes = await fetch("/api/characters", { signal });
      if (listRes.status === 401) {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/7c8db375-0ae9-4264-956f-949ed59bd0c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameSidebar.tsx:loadCharacter:listRes401',message:'list 401 redirecting to /login',data:{pathname},timestamp:Date.now(),hypothesisId:'H4'})}).catch(()=>{});
        // #endregion
        router.push("/login");
        return;
      }
      if (!listRes.ok) return;
      const list = await listRes.json();
      const chars = list.characters ?? [];
      if (chars.length === 0) {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/7c8db375-0ae9-4264-956f-949ed59bd0c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameSidebar.tsx:loadCharacter:noChars',message:'no chars redirecting to /character',data:{pathname},timestamp:Date.now(),hypothesisId:'H4'})}).catch(()=>{});
        // #endregion
        router.push("/character");
        return;
      }
      setCharacter(chars[0]);
      loadConsumables(chars[0].id, signal);
      if (!characterId) {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/7c8db375-0ae9-4264-956f-949ed59bd0c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameSidebar.tsx:loadCharacter:replaceUrl',message:'replacing URL to add characterId',data:{pathname,newCharId:chars[0].id},timestamp:Date.now(),hypothesisId:'H4'})}).catch(()=>{});
        // #endregion
        router.replace(`${pathname}?characterId=${chars[0].id}`);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, [characterId, pathname, router, loadConsumables]);

  useEffect(() => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    loadCharacter(controller.signal);
    return () => {
      controller.abort();
    };
  }, [loadCharacter]);

  // Refresh character data when game state changes (e.g. after combat rewards)
  useEffect(() => {
    const handleRefresh = () => {
      const controller = new AbortController();
      loadCharacter(controller.signal);
    };
    window.addEventListener("character-updated", handleRefresh);
    window.addEventListener("focus", handleRefresh);
    return () => {
      window.removeEventListener("character-updated", handleRefresh);
      window.removeEventListener("focus", handleRefresh);
    };
  }, [loadCharacter]);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const { stamina, nextIn } = useStaminaRealtime(
    character?.currentStamina ?? 0,
    character?.maxStamina ?? 100,
    character?.lastStaminaUpdate ?? new Date().toISOString()
  );

  const staminaPercent = character ? (stamina / character.maxStamina) * 100 : 0;
  const xpNeeded = character ? xpForLevel(character.level) : 0;
  const xpPercent = xpNeeded > 0 && character ? Math.min(100, (character.currentXp / xpNeeded) * 100) : 0;
  const nextInStr = nextIn != null
    ? `${Math.floor(nextIn / 60)}:${String(nextIn % 60).padStart(2, "0")}`
    : null;

  const buildHref = (base: string) => {
    if (!characterId) return base;
    return `${base}?characterId=${characterId}`;
  };

  const isActive = (href: string) => pathname === href;

  // #region agent log
  // Debug: track pathname changes
  useEffect(() => {
    fetch('http://127.0.0.1:7244/ingest/7c8db375-0ae9-4264-956f-949ed59bd0c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameSidebar.tsx:pathChange',message:'pathname changed',data:{pathname,characterId},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
  }, [pathname]);
  // #endregion

  /* ── Available potions for quick use ── */
  const availablePotions = consumables
    .filter((ci) => ci.quantity > 0)
    .map((ci) => {
      const def = CONSUMABLE_CATALOG.find((c) => c.type === ci.consumableType);
      return def ? { ...def, quantity: ci.quantity } : null;
    })
    .filter(Boolean) as (typeof CONSUMABLE_CATALOG[number] & { quantity: number })[];

  const handleUsePotion = useCallback(
    async (consumableType: ConsumableType) => {
      const cId = characterId ?? character?.id;
      if (!cId || usingPotion) return;
      setUsingPotion(consumableType);
      try {
        const res = await fetch("/api/consumables/use", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ characterId: cId, consumableType }),
        });
        const data = await res.json();
        if (res.ok) {
          // Update character stamina locally
          setCharacter((c) =>
            c
              ? {
                  ...c,
                  currentStamina: data.currentStamina ?? c.currentStamina,
                  lastStaminaUpdate: new Date().toISOString(),
                }
              : null
          );
          // Update consumable inventory
          setConsumables((prev) =>
            prev
              .map((ci) =>
                ci.consumableType === consumableType
                  ? { ...ci, quantity: data.remainingQuantity }
                  : ci
              )
              .filter((ci) => ci.quantity > 0)
          );
          // Dispatch event so other components can react
          window.dispatchEvent(new Event("character-updated"));
        }
      } catch {
        // silently fail
      } finally {
        setUsingPotion(null);
      }
    },
    [characterId, character?.id, usingPotion]
  );

  /* ────── Sidebar content (shared between desktop & mobile) ────── */
  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Character card */}
      <div className="border-b border-slate-700/50 p-4">
        {loading ? (
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 animate-pulse rounded-xl bg-slate-800" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-slate-800" />
              <div className="h-3 w-16 animate-pulse rounded bg-slate-800" />
            </div>
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <p className="text-xs text-red-400">Failed to load character</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setFetchError(false);
                const controller = new AbortController();
                abortControllerRef.current = controller;
                loadCharacter(controller.signal);
              }}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-slate-700 hover:text-white"
            >
              Retry
            </button>
          </div>
        ) : character ? (
          <>
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <Link
                href={buildHref("/inventory")}
                className="group relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 border-slate-700 bg-gradient-to-b from-slate-800 to-slate-900 transition hover:border-indigo-500"
                aria-label="Open Inventory"
              >
                <div className="absolute inset-0 overflow-hidden rounded-[10px]">
                  {character.origin && ORIGIN_IMAGE[character.origin] ? (
                    <Image
                      src={ORIGIN_IMAGE[character.origin]}
                      alt={character.origin}
                      width={1024}
                      height={1024}
                      className="absolute left-1/2 -top-2 w-[300%] max-w-none -translate-x-1/2"
                      sizes="168px"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-2xl">{CLASS_ICON[character.class] ?? "⚔️"}</span>
                  )}
                </div>
                <span className="absolute -bottom-1 -right-1 z-10 rounded bg-slate-700 px-1.5 text-[10px] font-bold text-white">
                  {character.level}
                </span>
              </Link>

              {/* Name + resources */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">{character.characterName}</p>
                {character.origin && ORIGIN_DEFS[character.origin as CharacterOrigin] && (
                  <p className="truncate text-[10px] text-slate-500">
                    {ORIGIN_DEFS[character.origin as CharacterOrigin].icon}{" "}
                    {ORIGIN_DEFS[character.origin as CharacterOrigin].label}
                  </p>
                )}
                <div className="mt-0.5 grid grid-cols-2 gap-x-3 gap-y-0 text-[11px]">
                  <span className="text-yellow-400">🪙 {character.gold}</span>
                  <span className="text-slate-400">⚡ {stamina}/{character.maxStamina}</span>
                  <span className="text-slate-400">🏅 {character.pvpRating}</span>
                  {nextInStr && <span className="text-slate-500">⏱ {nextInStr}</span>}
                </div>
              </div>
            </div>

            {/* XP bar */}
            <div className="mt-2.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-500"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                {Math.round(xpPercent)}%
              </span>
            </div>

            {/* Stamina bar */}
            <div className="mt-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500"
                  style={{ width: `${staminaPercent}%` }}
                />
              </div>
            </div>

            {/* Quick potion use */}
            {availablePotions.length > 0 && (
              <div className="mt-2 flex gap-1">
                {availablePotions.map((p) => {
                  const isUsing = usingPotion === p.type;
                  return (
                    <button
                      key={p.type}
                      type="button"
                      onClick={() => handleUsePotion(p.type)}
                      disabled={!!usingPotion}
                      className="flex items-center gap-1 rounded-lg border border-emerald-700/40 bg-emerald-950/30 px-2 py-1 text-[10px] font-medium text-emerald-400 transition hover:border-emerald-600/60 hover:bg-emerald-900/40 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={`Use ${p.name} (+${p.staminaRestore} stamina)`}
                      tabIndex={0}
                      title={`${p.name}: +${p.staminaRestore} ⚡ (×${p.quantity})`}
                    >
                      {isUsing ? (
                        <span className="h-3 w-3 animate-spin rounded-full border border-emerald-400/30 border-t-emerald-400" />
                      ) : (
                        <span>{p.icon}</span>
                      )}
                      <span className="tabular-nums">×{p.quantity}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2" aria-label="Game Menu">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={buildHref(item.href)}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all
                    ${active
                      ? "border text-white"
                      : "border border-transparent text-slate-400 hover:border-slate-700 hover:bg-slate-800/60 hover:text-white"
                    }
                  `}
                  style={active ? { borderColor: "var(--ds-nav-active-border)", backgroundColor: "var(--ds-nav-active-bg)" } : undefined}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  tabIndex={0}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700/50 bg-slate-800/80 text-lg transition group-hover:border-slate-600">
                    {item.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-bold tracking-wide">{item.label}</p>
                    <p className="truncate text-[10px] text-slate-500">{item.description}</p>
                  </div>
                </Link>
              </li>
            );
          })}

          {/* Admin-only navigation — compact horizontal icons */}
          {userRole === "admin" && (
            <>
              <li className="pt-2">
                <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-amber-500/70">
                  Admin
                </div>
              </li>
              <li>
                <div className="flex items-center gap-1.5 px-2">
                  {ADMIN_NAV_ITEMS.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={buildHref(item.href)}
                        className={`group flex h-10 w-10 items-center justify-center rounded-lg text-lg transition-all
                          ${active
                            ? "border text-white"
                            : "border border-transparent text-slate-400 hover:border-amber-700/50 hover:bg-amber-900/20 hover:text-white"
                          }
                        `}
                        style={active ? { borderColor: "var(--ds-nav-admin-active-border)", backgroundColor: "var(--ds-nav-admin-active-bg)" } : undefined}
                        aria-label={item.label}
                        aria-current={active ? "page" : undefined}
                        tabIndex={0}
                        title={`${item.label} — ${item.description}`}
                      >
                        {item.icon}
                      </Link>
                    );
                  })}
                </div>
              </li>
            </>
          )}
        </ul>
      </nav>

      {/* Bottom: settings & switch character */}
      <div className="border-t border-slate-700/50 p-3 space-y-2">
        <Link
          href={buildHref("/settings")}
          className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs transition
            ${isActive("/settings")
              ? "text-white"
              : "border-slate-700/50 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:bg-slate-800 hover:text-white"
            }
          `}
          style={isActive("/settings") ? { borderColor: "var(--ds-nav-active-border)", backgroundColor: "var(--ds-nav-active-bg)" } : undefined}
          aria-label="Settings"
          aria-current={isActive("/settings") ? "page" : undefined}
        >
          <span>⚙️</span>
          <span>Settings</span>
        </Link>
        <Link
          href="/character"
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2 text-xs text-slate-400 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
          aria-label="Switch Character"
        >
          <span>🔄</span>
          <span>Switch Character</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Mobile burger button ── */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-3 top-3 z-40 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/90 text-white backdrop-blur transition hover:bg-slate-800 lg:hidden"
        aria-label="Open Menu"
        tabIndex={0}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setMobileOpen(false)}
          role="button"
          tabIndex={-1}
          aria-label="Close Menu"
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform border-r border-slate-800 bg-slate-900 transition-transform duration-300 lg:hidden
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        aria-label="Game Menu"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          aria-label="Close Menu"
        >
          ✕
        </button>
        {sidebarContent}
      </aside>

      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden w-64 shrink-0 border-r border-slate-800 bg-slate-900 lg:block"
        aria-label="Game Menu"
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default GameSidebar;
