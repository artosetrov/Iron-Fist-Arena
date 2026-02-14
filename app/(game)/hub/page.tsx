"use client";

import { Suspense, useRef, useCallback, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import PageHeader from "@/app/components/PageHeader";
import PageLoader from "@/app/components/PageLoader";
import GameModal from "@/app/components/ui/GameModal";
import { WORLD, ARENA_LORE, NPC_QUOTES, HUB_BUILDING_LORE } from "@/lib/game/lore";
import { STARTING_GOLD, STARTING_STAMINA } from "@/lib/game/balance";
import dynamic from "next/dynamic";

/* ────────────────── Welcome modal snapshot ────────────────── */

const HUB_SNAPSHOT_KEY = "hub_char_snapshot";

type CharSnapshot = {
  id: string;
  gold: number;
  currentStamina: number;
  level: number;
  pvpWins: number;
  pvpLosses: number;
  pvpRating: number;
  savedAt: number;
};

const saveSnapshot = (char: {
  id: string;
  gold: number;
  currentStamina: number;
  level: number;
  pvpWins: number;
  pvpLosses: number;
  pvpRating: number;
}) => {
  try {
    const snap: CharSnapshot = {
      ...char,
      savedAt: Date.now(),
    };
    localStorage.setItem(HUB_SNAPSHOT_KEY, JSON.stringify(snap));
  } catch {
    // ignore
  }
};

const loadSnapshot = (): CharSnapshot | null => {
  try {
    const raw = localStorage.getItem(HUB_SNAPSHOT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CharSnapshot;
  } catch {
    return null;
  }
};

const formatClass = (c: string) =>
  c.charAt(0).toUpperCase() + c.slice(1).toLowerCase();

const HubWeatherFx = dynamic(
  () => import("@/app/components/HubWeatherFx"),
  { ssr: false },
);

/* ────────────────── Constants ────────────────── */

const DRAG_THRESHOLD = 5;
/** Native image dimensions for aspect ratio */
const BG_WIDTH = 5504;
const BG_HEIGHT = 3072;

/* ────────────────── Building Config ────────────────── */

type HubBuilding = {
  id: string;
  label: string;
  description: string;
  href: string;
  pinIcon: string;
  /** Pin position as % of background image (center of pin) */
  top: number;
  left: number;
  /** Glow hitbox as % of background image */
  hitbox: { top: number; left: number; width: number; height: number };
  /** Tooltip direction: "top" (default), "left", "right" */
  tooltip?: "top" | "left" | "right";
};

/**
 * Coordinates mapped to the custom Stray City background (5504x3072).
 * All values in % so they scale with any render size.
 *
 * Layout on the image:
 *   [Dungeon]       [Arena]        [Shop/Market]
 *   [Tavern]       (fountain)      [Training]
 *   [Hall of Fame] [Blacksmith]    [Warehouse]
 */
const BUILDINGS: HubBuilding[] = [
  {
    id: "arena",
    label: HUB_BUILDING_LORE.arena.name,
    description: HUB_BUILDING_LORE.arena.description,
    href: "/arena",
    pinIcon: "/images/buildings/pins/pin-arena.png",
    top: 30,
    left: 48,
    hitbox: { top: 20, left: 33, width: 28, height: 32 },
  },
  {
    id: "dungeon",
    label: HUB_BUILDING_LORE.dungeon.name,
    description: HUB_BUILDING_LORE.dungeon.description,
    href: "/dungeon",
    pinIcon: "/images/buildings/pins/pin-dungeon.png",
    top: 15,
    left: 5,
    hitbox: { top: 5, left: -7, width: 24, height: 28 },
    tooltip: "right",
  },
  {
    id: "shop",
    label: HUB_BUILDING_LORE.shop.name,
    description: HUB_BUILDING_LORE.shop.description,
    href: "/shop",
    pinIcon: "/images/buildings/pins/pin-shop.png",
    top: 18,
    left: 86,
    hitbox: { top: 8, left: 72, width: 28, height: 30 },
    tooltip: "left",
  },
  {
    id: "tavern",
    label: HUB_BUILDING_LORE.tavern.name,
    description: HUB_BUILDING_LORE.tavern.description,
    href: "/minigames",
    pinIcon: "/images/buildings/pins/pin-tavern.png",
    top: 54,
    left: 32,
    hitbox: { top: 46, left: 20, width: 24, height: 24 },
    tooltip: "right",
  },
  {
    id: "training",
    label: HUB_BUILDING_LORE.training.name,
    description: HUB_BUILDING_LORE.training.description,
    href: "/combat",
    pinIcon: "/images/buildings/pins/pin-training.png",
    top: 41,
    left: 78,
    hitbox: { top: 33, left: 64, width: 28, height: 26 },
    tooltip: "left",
  },
  {
    id: "leaderboard",
    label: HUB_BUILDING_LORE.leaderboard.name,
    description: HUB_BUILDING_LORE.leaderboard.description,
    href: "/leaderboard",
    pinIcon: "/images/buildings/pins/pin-leaderboard.png",
    top: 72,
    left: 10,
    hitbox: { top: 64, left: 0, width: 22, height: 26 },
    tooltip: "right",
  },
  {
    id: "blacksmith",
    label: HUB_BUILDING_LORE.blacksmith.name,
    description: HUB_BUILDING_LORE.blacksmith.description,
    href: "/inventory",
    pinIcon: "/images/buildings/pins/pin-blacksmith.png",
    top: 70,
    left: 62,
    hitbox: { top: 62, left: 48, width: 28, height: 28 },
  },
  {
    id: "warehouse",
    label: HUB_BUILDING_LORE.warehouse.name,
    description: HUB_BUILDING_LORE.warehouse.description,
    href: "/inventory",
    pinIcon: "/images/buildings/pins/pin-warehouse.png",
    top: 68,
    left: 82,
    hitbox: { top: 60, left: 68, width: 26, height: 28 },
    tooltip: "left",
  },
];

/* ────────────────── Fire / Torch Points ────────────────── */

type FirePoint = {
  id: string;
  /** Position as % of background image (center of glow) */
  top: number;
  left: number;
  /** Size of glow as % of background */
  size: number;
  /** Color theme */
  color: "orange" | "green" | "blue";
  /** Full CSS class for animation */
  animClass: string;
};

/**
 * Mapped from the hub-bg.png (5504×3072).
 * Coordinates are approximate center of each visible flame / torch / glow.
 */
const FIRE_POINTS: FirePoint[] = [
  /* ── Arena torches (4 pillars around the ring + 2 banner torches on top) ── */
  { id: "arena-banner-l", top: 13, left: 36.5, size: 3, color: "orange", animClass: "animate-fire-flicker" },
  { id: "arena-banner-r", top: 13, left: 52, size: 3, color: "orange", animClass: "animate-fire-flicker-alt" },
  { id: "arena-pillar-tl", top: 22, left: 34, size: 2.5, color: "orange", animClass: "animate-fire-flicker-fast" },
  { id: "arena-pillar-tr", top: 22, left: 56, size: 2.5, color: "orange", animClass: "animate-fire-flicker" },
  { id: "arena-pillar-bl", top: 36, left: 32, size: 2.5, color: "orange", animClass: "animate-fire-flicker-alt" },
  { id: "arena-pillar-br", top: 36, left: 58, size: 2.5, color: "orange", animClass: "animate-fire-flicker-fast" },
  /* ── Arena gate torches (lower entrance) ── */
  { id: "arena-gate-l", top: 42, left: 39, size: 2, color: "orange", animClass: "animate-fire-flicker" },
  { id: "arena-gate-r", top: 42, left: 51, size: 2, color: "orange", animClass: "animate-fire-flicker-alt" },

  /* ── Dungeon cave — green magical flames ── */
  { id: "dungeon-glow-l", top: 16, left: 8, size: 3.5, color: "green", animClass: "animate-fire-flicker-slow" },
  { id: "dungeon-glow-r", top: 20, left: 14, size: 3, color: "green", animClass: "animate-fire-flicker" },
  { id: "dungeon-glow-top", top: 8, left: 11, size: 2.5, color: "green", animClass: "animate-fire-flicker-alt" },

  /* ── Blacksmith forge (big fire pit) ── */
  { id: "forge-main", top: 68, left: 47, size: 5, color: "orange", animClass: "animate-fire-flicker-fast" },
  { id: "forge-glow", top: 66, left: 46, size: 3.5, color: "orange", animClass: "animate-fire-flicker" },

  /* ── Hall of Fame / Leaderboard — blue mystic flames ── */
  { id: "hof-flame-l", top: 76, left: 7, size: 2.5, color: "blue", animClass: "animate-fire-flicker-slow" },
  { id: "hof-flame-r", top: 76, left: 13, size: 2.5, color: "blue", animClass: "animate-fire-flicker" },

  /* ── Tavern windows (warm glow) ── */
  { id: "tavern-window-1", top: 43, left: 16, size: 2, color: "orange", animClass: "animate-fire-flicker-slow" },
  { id: "tavern-window-2", top: 45, left: 19, size: 1.8, color: "orange", animClass: "animate-fire-flicker" },

  /* ── Shop lanterns (market area) ── */
  { id: "shop-lantern-1", top: 10, left: 75, size: 2, color: "orange", animClass: "animate-fire-flicker-alt" },
  { id: "shop-lantern-2", top: 12, left: 82, size: 2, color: "orange", animClass: "animate-fire-flicker" },

  /* ── Training ground torch ── */
  { id: "training-torch", top: 40, left: 74, size: 2.5, color: "orange", animClass: "animate-fire-flicker-fast" },

  /* ── Scattered street torches ── */
  { id: "street-torch-1", top: 52, left: 44, size: 2, color: "orange", animClass: "animate-fire-flicker-slow" },
  { id: "street-torch-2", top: 58, left: 60, size: 1.8, color: "orange", animClass: "animate-fire-flicker" },
];

/** Radial gradient presets per fire color */
const FIRE_GRADIENTS: Record<FirePoint["color"], string> = {
  orange:
    "radial-gradient(ellipse at 50% 60%, rgba(255,160,30,0.45) 0%, rgba(255,100,0,0.2) 35%, rgba(255,60,0,0.08) 60%, transparent 80%)",
  green:
    "radial-gradient(ellipse at 50% 60%, rgba(80,255,120,0.4) 0%, rgba(40,200,80,0.18) 35%, rgba(20,150,60,0.06) 60%, transparent 80%)",
  blue:
    "radial-gradient(ellipse at 50% 60%, rgba(100,180,255,0.4) 0%, rgba(60,130,220,0.18) 35%, rgba(30,80,180,0.06) 60%, transparent 80%)",
};

/* ────────────────── Component ────────────────── */

type HubCharacter = {
  id: string;
  characterName: string;
  class: string;
  level: number;
  gold: number;
  currentStamina: number;
  maxStamina: number;
  pvpWins: number;
  pvpLosses: number;
  pvpRating: number;
};

const HubContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const characterId = searchParams.get("characterId");

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const hasDragged = useRef(false);
  const dragState = useRef({ startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0, pointerId: 0 });
  const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null);
  const [isLoreOpen, setIsLoreOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<HubBuilding | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  const [hubCharacter, setHubCharacter] = useState<HubCharacter | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showWelcomeBackModal, setShowWelcomeBackModal] = useState(false);
  const [welcomeBackDeltas, setWelcomeBackDeltas] = useState<{
    gold: number;
    stamina: number;
    level: number;
    pvpWins: number;
    pvpLosses: number;
    pvpRating: number;
  } | null>(null);

  /* Fetch welcome status and character; decide which modal to show */
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    Promise.all([
      fetch("/api/user/welcome", { signal }).then((r) => r.json()),
      fetch("/api/characters", { signal }).then((r) => r.json()),
    ])
      .then(([welcomeRes, charRes]) => {
        const seen = welcomeRes.hasSeenWelcome === true;
        const chars = charRes.characters as HubCharacter[] | undefined;
        const char = chars?.length ? chars[0] : null;
        setHasSeenWelcome(seen);
        setHubCharacter(char ?? null);
        if (!char) return;
        if (!seen) {
          setShowWelcomeModal(true);
          return;
        }
        const snap = loadSnapshot();
        if (snap && snap.id === char.id) {
          setWelcomeBackDeltas({
            gold: char.gold - snap.gold,
            stamina: char.currentStamina - snap.currentStamina,
            level: char.level - snap.level,
            pvpWins: char.pvpWins - snap.pvpWins,
            pvpLosses: char.pvpLosses - snap.pvpLosses,
            pvpRating: char.pvpRating - snap.pvpRating,
          });
        } else {
          setWelcomeBackDeltas(null);
        }
        setShowWelcomeBackModal(true);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
      });
    return () => controller.abort();
  }, []);

  const handleCloseWelcomeModal = useCallback(() => {
    setShowWelcomeModal(false);
    fetch("/api/user/welcome", { method: "POST" }).catch(() => {});
    setHasSeenWelcome(true);
    if (hubCharacter) {
      saveSnapshot({
        id: hubCharacter.id,
        gold: hubCharacter.gold,
        currentStamina: hubCharacter.currentStamina,
        level: hubCharacter.level,
        pvpWins: hubCharacter.pvpWins,
        pvpLosses: hubCharacter.pvpLosses,
        pvpRating: hubCharacter.pvpRating,
      });
    }
  }, [hubCharacter]);

  const handleCloseWelcomeBackModal = useCallback(() => {
    setShowWelcomeBackModal(false);
    setWelcomeBackDeltas(null);
    if (hubCharacter) {
      saveSnapshot({
        id: hubCharacter.id,
        gold: hubCharacter.gold,
        currentStamina: hubCharacter.currentStamina,
        level: hubCharacter.level,
        pvpWins: hubCharacter.pvpWins,
        pvpLosses: hubCharacter.pvpLosses,
        pvpRating: hubCharacter.pvpRating,
      });
    }
  }, [hubCharacter]);

  /* Detect mobile viewport */
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 768px)");
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(e.matches);
    handleChange(mql);
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  /* Center scroll on mount */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Small delay to ensure image has set container size
    const timer = setTimeout(() => {
      el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
      el.scrollTop = (el.scrollHeight - el.clientHeight) / 2;
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const buildHref = useCallback(
    (base: string) => {
      if (!characterId) return base;
      return `${base}?characterId=${characterId}`;
    },
    [characterId],
  );

  /* ── Google Maps style drag-to-scroll ── */

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Only primary button
      if (e.button !== 0) return;
      // Don't capture pointer if the event originated on a pin button
      const target = e.target as HTMLElement;
      if (target.closest("button")) return;
      const el = scrollRef.current;
      if (!el) return;
      setIsDragging(true);
      hasDragged.current = false;
      dragState.current = {
        startX: e.clientX,
        startY: e.clientY,
        scrollLeft: el.scrollLeft,
        scrollTop: el.scrollTop,
        pointerId: e.pointerId,
      };
      el.setPointerCapture(e.pointerId);
      e.preventDefault();
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      const el = scrollRef.current;
      if (!el) return;
      const dx = e.clientX - dragState.current.startX;
      const dy = e.clientY - dragState.current.startY;
      if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
        hasDragged.current = true;
      }
      el.scrollLeft = dragState.current.scrollLeft - dx;
      el.scrollTop = dragState.current.scrollTop - dy;
    },
    [isDragging],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      setIsDragging(false);
      hasDragged.current = false;
      scrollRef.current?.releasePointerCapture(e.pointerId);
    },
    [isDragging],
  );

  const handleBuildingClick = useCallback(
    (building: HubBuilding) => {
      if (hasDragged.current) return;
      if (isMobile) {
        setSelectedBuilding(building);
        return;
      }
      router.push(buildHref(building.href));
    },
    [router, buildHref, isMobile],
  );

  const handleMobileEnter = useCallback(() => {
    if (!selectedBuilding) return;
    router.push(buildHref(selectedBuilding.href));
    setSelectedBuilding(null);
  }, [router, buildHref, selectedBuilding]);

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* PageHeader overlay */}
      <div className="absolute inset-x-0 top-0 z-20 p-4 lg:p-6">
        <PageHeader
          title={WORLD.cityName}
          hideClose
          actions={
            <button
              type="button"
              onClick={() => setIsLoreOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg transition hover:bg-slate-800/60"
              aria-label="World Info"
              tabIndex={0}
            >
              <Image
                src="/images/ui/icon-world-info.png"
                alt="World Info"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
            </button>
          }
        />
      </div>

      {/* ── Scrollable map (Google Maps style) ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto scrollbar-hide select-none touch-pan-x touch-pan-y"
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="region"
        aria-label="Hub world map — Stray City"
        tabIndex={0}
      >
        {/* Map container — sized by the background image, all children in % */}
        <div
          className="relative"
          style={{
            /* Map fills viewport height, width follows aspect ratio */
            height: "max(100%, 700px)",
            aspectRatio: `${BG_WIDTH} / ${BG_HEIGHT}`,
          }}
        >
          {/* Background image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/ui/hub-bg.png"
            alt="Stray City — Hub"
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover pointer-events-none"
          />

          {/* Subtle vignette */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/15 via-transparent to-slate-950/25 pointer-events-none" />

          {/* Animated fire / torch glows */}
          {FIRE_POINTS.map((f) => (
            <div
              key={f.id}
              className={`absolute rounded-full pointer-events-none ${f.animClass}`}
              style={{
                top: `${f.top}%`,
                left: `${f.left}%`,
                width: `${f.size}%`,
                height: `${f.size * 1.3}%`,
                transform: "translate(-50%, -50%)",
                background: FIRE_GRADIENTS[f.color],
                filter: "blur(3px)",
                mixBlendMode: "screen",
              }}
            />
          ))}

          {/* Dynamic weather particles (leaves, sun rays, fireflies, mist) */}
          <HubWeatherFx />

          {/* Hitbox glow overlays */}
          {BUILDINGS.map((b) => {
            const isHovered = hoveredBuilding === b.id;
            if (!isHovered || isDragging) return null;
            return (
              <div
                key={`glow-${b.id}`}
                className="absolute rounded-3xl pointer-events-none transition-opacity duration-300"
                style={{
                  top: `${b.hitbox.top}%`,
                  left: `${b.hitbox.left}%`,
                  width: `${b.hitbox.width}%`,
                  height: `${b.hitbox.height}%`,
                  background: "radial-gradient(ellipse at center, rgba(251,191,36,0.15) 0%, rgba(251,191,36,0.05) 50%, transparent 75%)",
                  boxShadow: "0 0 60px 16px rgba(251,191,36,0.08)",
                }}
              />
            );
          })}

          {/* Pin markers */}
          {BUILDINGS.map((b) => {
            const isHovered = hoveredBuilding === b.id;
            return (
              <button
                key={b.id}
                type="button"
                className="absolute outline-none p-3 sm:p-2"
                style={{
                  top: `${b.top}%`,
                  left: `${b.left}%`,
                  transform: "translate(-50%, -50%)",
                  cursor: isDragging ? "grabbing" : "pointer",
                  zIndex: isHovered ? 30 : 10,
                  touchAction: "manipulation",
                }}
                onClick={() => handleBuildingClick(b)}
                onMouseEnter={() => setHoveredBuilding(b.id)}
                onMouseLeave={() => setHoveredBuilding(null)}
                onFocus={() => setHoveredBuilding(b.id)}
                onBlur={() => setHoveredBuilding(null)}
                aria-label={b.label}
                tabIndex={0}
              >
                {/* Pin icon */}
                <div
                  className={`relative transition-all duration-200 ease-out ${
                    isHovered && !isDragging
                      ? "-translate-y-2 scale-110 drop-shadow-[0_6px_16px_rgba(251,191,36,0.5)]"
                      : "animate-hub-pin-float drop-shadow-[0_3px_8px_rgba(0,0,0,0.6)]"
                  }`}
                >
                  <Image
                    src={b.pinIcon}
                    alt={b.label}
                    width={128}
                    height={128}
                    draggable={false}
                    className="pointer-events-none h-28 w-28 sm:h-28 sm:w-28 md:h-32 md:w-32 lg:h-36 lg:w-36"
                    sizes="112px"
                  />
                </div>

                {/* Tooltip */}
                {b.tooltip === "left" ? (
                  <div
                    className={`absolute right-full top-1/2 -translate-y-1/2 mr-3 w-52 rounded-xl border border-amber-500/30 bg-slate-900/95 px-4 py-3 shadow-xl shadow-amber-900/20 backdrop-blur-sm transition-all duration-200 pointer-events-none ${
                      isHovered && !isDragging
                        ? "opacity-100 translate-x-0"
                        : "opacity-0 translate-x-2"
                    }`}
                  >
                    <h3 className="font-display text-sm font-bold text-amber-300">
                      {b.label}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">
                      {b.description}
                    </p>
                    <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 h-3 w-3 rotate-45 border-t border-r border-amber-500/30 bg-slate-900/95" />
                  </div>
                ) : b.tooltip === "right" ? (
                  <div
                    className={`absolute left-full top-1/2 -translate-y-1/2 ml-3 w-52 rounded-xl border border-amber-500/30 bg-slate-900/95 px-4 py-3 shadow-xl shadow-amber-900/20 backdrop-blur-sm transition-all duration-200 pointer-events-none ${
                      isHovered && !isDragging
                        ? "opacity-100 translate-x-0"
                        : "opacity-0 -translate-x-2"
                    }`}
                  >
                    <h3 className="font-display text-sm font-bold text-amber-300">
                      {b.label}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">
                      {b.description}
                    </p>
                    <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 h-3 w-3 rotate-45 border-b border-l border-amber-500/30 bg-slate-900/95" />
                  </div>
                ) : (
                  <div
                    className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-52 rounded-xl border border-amber-500/30 bg-slate-900/95 px-4 py-3 shadow-xl shadow-amber-900/20 backdrop-blur-sm transition-all duration-200 pointer-events-none ${
                      isHovered && !isDragging
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-2"
                    }`}
                  >
                    <h3 className="font-display text-sm font-bold text-amber-300">
                      {b.label}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">
                      {b.description}
                    </p>
                    <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 h-3 w-3 rotate-45 border-b border-r border-amber-500/30 bg-slate-900/95" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile building popup */}
      <GameModal
        open={!!selectedBuilding}
        onClose={() => setSelectedBuilding(null)}
        size="sm"
        title={selectedBuilding?.label}
      >
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-slate-300">
            {selectedBuilding?.description}
          </p>
          <button
            type="button"
            onClick={handleMobileEnter}
            className="w-full rounded-xl border border-amber-500/40 bg-gradient-to-b from-amber-600 to-amber-700 px-4 py-3 font-display text-sm font-bold text-white shadow-lg shadow-amber-900/30 transition hover:from-amber-500 hover:to-amber-600 active:scale-[0.98]"
          >
            Enter
          </button>
        </div>
      </GameModal>

      {/* Lore Modal */}
      <GameModal
        open={isLoreOpen}
        onClose={() => setIsLoreOpen(false)}
        size="lg"
        title={WORLD.name}
      >
        <div className="max-h-[60vh] space-y-5 overflow-y-auto pr-1 text-sm leading-relaxed text-slate-300 scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600">
          <section>
            <h3 className="mb-1 font-display text-base font-bold text-amber-400">
              {WORLD.cityName}
            </h3>
            <p>{WORLD.cityDescription}</p>
          </section>

          <section>
            <h3 className="mb-1 font-display text-base font-bold text-amber-400">
              The Legend
            </h3>
            <p>{WORLD.legend}</p>
          </section>

          <section>
            <h3 className="mb-1 font-display text-base font-bold text-amber-400">
              {ARENA_LORE.name}
            </h3>
            <p>{ARENA_LORE.purpose}</p>
            <p className="mt-1 italic text-slate-400">{ARENA_LORE.rule}</p>
            <p className="mt-2 text-xs font-semibold tracking-wide text-amber-500/80">
              &ldquo;{ARENA_LORE.motto}&rdquo;
            </p>
          </section>

          <section>
            <h3 className="mb-2 font-display text-base font-bold text-amber-400">
              Voices of Stray City
            </h3>
            <ul className="space-y-3">
              {NPC_QUOTES.map((npc) => (
                <li key={npc.name}>
                  <p className="italic text-slate-400">&ldquo;{npc.quote}&rdquo;</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    — <span className="font-semibold text-slate-400">{npc.name}</span>,{" "}
                    {npc.title}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </GameModal>

      {/* Welcome (first-time) modal */}
      <GameModal
        open={showWelcomeModal}
        onClose={handleCloseWelcomeModal}
        size="lg"
        title="Welcome to Stray City"
      >
        <div className="space-y-5 text-sm leading-relaxed text-slate-300">
          {hubCharacter && (
            <p>
              Welcome, <span className="font-semibold text-amber-400">{hubCharacter.characterName}</span>{" "}
              — {formatClass(hubCharacter.class)} of the Iron Fist. Here is what you need to know.
            </p>
          )}
          <section>
            <h3 className="mb-1 font-display font-bold text-amber-400">
              Your starting resources
            </h3>
            <p>
              You begin with <span className="font-semibold text-amber-300">{STARTING_GOLD} gold</span> and{" "}
              <span className="font-semibold text-amber-300">{STARTING_STAMINA} energy</span>. Both are vital:
              gold buys equipment and upgrades; energy is spent on arena fights, dungeons, and minigames, and it regenerates over time. Use them wisely.
            </p>
          </section>
          <section>
            <h3 className="mb-2 font-display font-bold text-amber-400">
              Around the city
            </h3>
            <ul className="space-y-2">
              <li><span className="font-semibold text-slate-200">{HUB_BUILDING_LORE.arena.name}</span> — PvP battles and ranking.</li>
              <li><span className="font-semibold text-slate-200">{HUB_BUILDING_LORE.dungeon.name}</span> — Dungeons and loot.</li>
              <li><span className="font-semibold text-slate-200">{HUB_BUILDING_LORE.shop.name}</span> — Buy gear and consumables.</li>
              <li><span className="font-semibold text-slate-200">{HUB_BUILDING_LORE.training.name}</span> — Train and fight.</li>
              <li><span className="font-semibold text-slate-200">{HUB_BUILDING_LORE.tavern.name}</span> — Minigames and side activities.</li>
              <li><span className="font-semibold text-slate-200">{HUB_BUILDING_LORE.blacksmith.name}</span> — Inventory and equipment.</li>
            </ul>
          </section>
          <button
            type="button"
            onClick={handleCloseWelcomeModal}
            className="w-full rounded-xl border border-amber-500/40 bg-gradient-to-b from-amber-600 to-amber-700 px-4 py-3 font-display text-sm font-bold text-white shadow-lg shadow-amber-900/30 transition hover:from-amber-500 hover:to-amber-600 active:scale-[0.98]"
            aria-label="Let's go"
          >
            Let&apos;s go!
          </button>
        </div>
      </GameModal>

      {/* Welcome back (returning) modal */}
      <GameModal
        open={showWelcomeBackModal}
        onClose={handleCloseWelcomeBackModal}
        size="md"
        title="Welcome back"
      >
        <div className="space-y-4 text-sm">
          {hubCharacter && (
            <>
              <p className="text-slate-300">
                <span className="font-semibold text-amber-400">{hubCharacter.characterName}</span> — {formatClass(hubCharacter.class)}, Level {hubCharacter.level}
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="rounded-lg border border-slate-600 bg-slate-800/80 px-3 py-1.5 text-slate-200">
                  Gold: {hubCharacter.gold}
                  {welcomeBackDeltas && welcomeBackDeltas.gold !== 0 && (
                    <span className={welcomeBackDeltas.gold > 0 ? " ml-1 text-emerald-400" : " ml-1 text-red-400"}>
                      {welcomeBackDeltas.gold > 0 ? "+" : ""}{welcomeBackDeltas.gold}
                    </span>
                  )}
                </span>
                <span className="rounded-lg border border-slate-600 bg-slate-800/80 px-3 py-1.5 text-slate-200">
                  Energy: {hubCharacter.currentStamina}/{hubCharacter.maxStamina}
                  {welcomeBackDeltas && welcomeBackDeltas.stamina !== 0 && (
                    <span className={welcomeBackDeltas.stamina > 0 ? " ml-1 text-emerald-400" : " ml-1 text-red-400"}>
                      {welcomeBackDeltas.stamina > 0 ? "+" : ""}{welcomeBackDeltas.stamina}
                    </span>
                  )}
                </span>
                <span className="rounded-lg border border-slate-600 bg-slate-800/80 px-3 py-1.5 text-slate-200">
                  PvP: {hubCharacter.pvpRating} ({hubCharacter.pvpWins}W / {hubCharacter.pvpLosses}L)
                  {welcomeBackDeltas && (welcomeBackDeltas.pvpWins !== 0 || welcomeBackDeltas.pvpLosses !== 0) && (
                    <span className="ml-1 text-slate-400">
                      ({welcomeBackDeltas.pvpWins > 0 ? "+" : ""}{welcomeBackDeltas.pvpWins}W{" "}
                      {welcomeBackDeltas.pvpLosses > 0 ? "+" : ""}{welcomeBackDeltas.pvpLosses}L)
                    </span>
                  )}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCloseWelcomeBackModal}
                className="w-full rounded-xl border border-amber-500/40 bg-gradient-to-b from-amber-600 to-amber-700 px-4 py-3 font-display text-sm font-bold text-white shadow-lg shadow-amber-900/30 transition hover:from-amber-500 hover:to-amber-600 active:scale-[0.98]"
                aria-label="To battle"
              >
                To battle!
              </button>
            </>
          )}
        </div>
      </GameModal>
    </div>
  );
};

export default function HubPage() {
  return (
    <Suspense fallback={<PageLoader emoji="🏠" text="Loading hub…" />}>
      <HubContent />
    </Suspense>
  );
}
