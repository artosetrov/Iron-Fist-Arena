"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import GameIcon, { type GameIconKey } from "@/app/components/ui/GameIcon";
import {
  CONSUMABLE_CATALOG,
  type ConsumableType,
} from "@/lib/game/consumable-catalog";
import { xpForLevel } from "@/lib/game/progression";
import { useMobileSidebar } from "@/app/components/MobileSidebarProvider";

/* ────────────────── Types ────────────────── */

type Character = {
  id: string;
  characterName: string;
  class: string;
  origin: string;
  level: number;
  currentXp: number;
  gold: number;
  gems: number;
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

const ORIGIN_IMAGE: Record<string, string> = {
  human: "/images/origins/Avatar/origin-human_avatar_1.png",
  orc: "/images/origins/Avatar/origin-orc_avatar_1.png",
  skeleton: "/images/origins/Avatar/origin-skeleton_avatar_1.png",
  demon: "/images/origins/Avatar/origin-demon_avatar_1.png",
  dogfolk: "/images/origins/Avatar/origin-dogfolk_avatar_1.png",
};

type NavChild = {
  href: string;
  label: string;
  icon: GameIconKey;
};

type NavItem =
  | { kind: "link"; href: string; label: string; icon: GameIconKey }
  | { kind: "group"; id: string; label: string; icon: GameIconKey; children: NavChild[] };

const NAV_ITEMS: NavItem[] = [
  { kind: "link", href: "/minigames", label: "TAVERN", icon: "tavern" },
  { kind: "link", href: "/arena", label: "ARENA", icon: "arena" },
  { kind: "link", href: "/dungeon", label: "DUNGEONS", icon: "dungeons" },
  { kind: "link", href: "/combat", label: "TRAINING", icon: "training" },
  { kind: "link", href: "/shop", label: "SHOP", icon: "shop" },
  { kind: "link", href: "/leaderboard", label: "LEADERBOARD", icon: "leaderboard" },
];

const ADMIN_HREF = "/admin";

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
  const { open: mobileOpen, setOpen: setMobileOpen } = useMobileSidebar();

  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
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
  }, [pathname, setMobileOpen]);

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

  /* ── Accordion open state (auto-open group containing active route) ── */
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const item of NAV_ITEMS) {
      if (item.kind === "group" && item.children.some((c) => pathname === c.href || pathname.startsWith(c.href + "/"))) {
        initial.add(item.id);
      }
    }
    return initial;
  });

  // Auto-open group when navigating into it
  useEffect(() => {
    for (const item of NAV_ITEMS) {
      if (item.kind === "group" && item.children.some((c) => pathname === c.href || pathname.startsWith(c.href + "/"))) {
        setOpenGroups((prev) => {
          if (prev.has(item.id)) return prev;
          const next = new Set(prev);
          next.add(item.id);
          return next;
        });
      }
    }
  }, [pathname]);

  const handleToggleGroup = useCallback((groupId: string) => {
    setOpenGroups((prev) => {
      if (prev.has(groupId)) {
        // Closing the currently open group
        const next = new Set(prev);
        next.delete(groupId);
        return next;
      }
      // Opening a new group — close all others
      return new Set([groupId]);
    });
  }, []);

  const buildHref = (base: string) => {
    if (!characterId) return base;
    return `${base}?characterId=${characterId}`;
  };

  const isActive = (href: string) => pathname === href;

  /** Is any child of this group currently active? */
  const isGroupActive = (item: Extract<NavItem, { kind: "group" }>) =>
    item.children.some((c) => pathname === c.href || pathname.startsWith(c.href + "/"));


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
                className="group relative flex h-[96px] w-[96px] shrink-0 items-center justify-center rounded-xl border-2 border-slate-700 bg-slate-950 transition hover:border-indigo-500"
                aria-label="Open Inventory"
              >
                <div className="absolute inset-0 overflow-hidden rounded-[10px]">
                  {character.origin && ORIGIN_IMAGE[character.origin] ? (
                    <Image
                      src={ORIGIN_IMAGE[character.origin]}
                      alt={character.origin}
                      width={1024}
                      height={1024}
                      className="h-full w-full object-cover"
                      sizes="96px"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">
                      <GameIcon name="fights" size={48} />
                    </span>
                  )}
                </div>
                <span className="absolute -bottom-1 -right-1 z-10 rounded bg-slate-700 px-1.5 font-display text-xs text-white">
                  {character.level}
                </span>
              </Link>

              {/* Resources */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-0.5 font-display text-base font-bold">
                  <span className="flex items-center gap-1.5 text-yellow-400">
                    <GameIcon name="gold" size={18} /> {(character.gold ?? 0).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1.5 text-purple-400">
                    <GameIcon name="gems" size={18} /> {(character.gems ?? 0).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <GameIcon name="pvp-rating" size={18} /> {character.pvpRating}
                  </span>
                  {nextInStr && (
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <GameIcon name="stamina-timer" size={16} /> {nextInStr}
                    </span>
                  )}
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

            {/* Stamina bar — click to go to potions shop */}
            <Link
              href={buildHref("/shop") + (characterId ? "&tab=potions" : "?tab=potions")}
              className="mt-1 block"
              aria-label="Buy potions"
              tabIndex={0}
            >
              <div className="relative h-6 w-full overflow-hidden rounded-full bg-slate-800 transition hover:brightness-125">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500"
                  style={{ width: `${staminaPercent}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center gap-1 text-sm font-bold leading-none text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                  <GameIcon name="stamina" size={16} /> {stamina}
                </span>
              </div>
            </Link>

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
            if (item.kind === "link") {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={buildHref(item.href)}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-1.5 text-base font-medium transition-all
                      ${active
                        ? "border text-white shadow-lg shadow-amber-900/10"
                        : "border border-slate-700/60 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:bg-slate-800/80 hover:text-white"
                      }
                    `}
                    style={active ? { borderColor: "var(--ds-nav-active-border)", backgroundColor: "var(--ds-nav-active-bg)" } : undefined}
                    aria-label={item.label}
                    aria-current={active ? "page" : undefined}
                    tabIndex={0}
                  >
                    <span className="flex h-10 w-10 items-center justify-center">
                      <GameIcon name={item.icon} size={34} />
                    </span>
                    <span className="min-w-0 truncate font-display text-lg font-bold uppercase tracking-wider">{item.label}</span>
                  </Link>
                </li>
              );
            }

            /* ── Accordion group ── */
            const groupActive = isGroupActive(item);
            const isOpen = openGroups.has(item.id);

            return (
              <li key={item.id}>
                {/* Group header — clickable to toggle */}
                <button
                  type="button"
                  onClick={() => handleToggleGroup(item.id)}
                  className={`group flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-base font-medium transition-all
                    ${groupActive
                      ? "border text-white shadow-lg shadow-amber-900/10"
                      : "border border-slate-700/60 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:bg-slate-800/80 hover:text-white"
                    }
                  `}
                  style={groupActive ? { borderColor: "var(--ds-nav-active-border)", backgroundColor: "var(--ds-nav-active-bg)" } : undefined}
                  aria-expanded={isOpen}
                  aria-label={item.label}
                >
                  <span className="flex h-10 w-10 items-center justify-center">
                    <GameIcon name={item.icon} size={34} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-left font-display text-lg font-bold uppercase tracking-wider">{item.label}</span>
                  {/* Chevron */}
                  <svg
                    className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Collapsible children */}
                <div
                  className="overflow-hidden transition-all duration-200"
                  style={{ maxHeight: isOpen ? "72px" : "0px", opacity: isOpen ? 1 : 0 }}
                >
                  <ul className="mt-1 flex items-center gap-2 px-2">
                    {item.children.map((child) => {
                      const childActive = isActive(child.href);
                      return (
                        <li key={child.href}>
                          <Link
                            href={buildHref(child.href)}
                            className={`flex h-12 w-12 items-center justify-center rounded-lg transition-all
                              ${childActive
                                ? "border border-slate-600 bg-slate-800/80"
                                : "border border-transparent hover:border-slate-700 hover:bg-slate-800/40"
                              }
                            `}
                            aria-label={child.label}
                            aria-current={childActive ? "page" : undefined}
                            tabIndex={0}
                            title={child.label}
                          >
                            <GameIcon name={child.icon} size={32} />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </li>
            );
          })}

          {/* Admin-only navigation — single button */}
          {userRole === "admin" && (
            <li className="pt-2">
              <Link
                href={buildHref(ADMIN_HREF)}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium transition-all
                  ${isActive(ADMIN_HREF) || pathname.startsWith(ADMIN_HREF)
                    ? "border text-white"
                    : "border border-transparent text-slate-400 hover:border-amber-700/50 hover:bg-amber-900/20 hover:text-white"
                  }
                `}
                style={isActive(ADMIN_HREF) || pathname.startsWith(ADMIN_HREF) ? { borderColor: "var(--ds-nav-admin-active-border)", backgroundColor: "var(--ds-nav-admin-active-bg)" } : undefined}
                aria-label="Admin Panel"
                aria-current={isActive(ADMIN_HREF) ? "page" : undefined}
                tabIndex={0}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-700/40 bg-amber-900/20 transition group-hover:border-amber-600/60">
                  <GameIcon name="admin" size={28} />
                </span>
                <span className="min-w-0 truncate font-display text-lg font-bold uppercase tracking-wider">Admin</span>
              </Link>
            </li>
          )}
        </ul>
      </nav>

      {/* Bottom: settings & switch character */}
      <div className="border-t border-slate-700/50 p-3 flex items-center justify-between">
        <Link
          href={buildHref("/settings")}
          className={`flex h-14 w-14 items-center justify-center rounded-lg text-lg transition
            ${isActive("/settings")
              ? "text-white"
              : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
            }
          `}
          style={isActive("/settings") ? { backgroundColor: "var(--ds-nav-active-bg)" } : undefined}
          aria-label="Settings"
          aria-current={isActive("/settings") ? "page" : undefined}
          title="Settings"
        >
          <GameIcon name="settings" size={32} />
        </Link>
        <Link
          href="/character"
          className="flex h-14 w-14 items-center justify-center rounded-lg transition hover:bg-slate-800/60"
          aria-label="Switch Character"
          title="Switch Character"
        >
          <GameIcon name="switch-char" size={32} />
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          onKeyDown={(e) => { if (e.key === "Escape") setMobileOpen(false); }}
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
