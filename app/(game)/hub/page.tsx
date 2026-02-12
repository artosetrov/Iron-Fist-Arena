"use client";

import { Suspense, useRef, useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import PageLoader from "@/app/components/PageLoader";

const DRAG_THRESHOLD = 5;

type HubBuilding = {
  id: string;
  label: string;
  href: string;
  image: string;
  /** Position as % of the background image */
  top: string;
  left: string;
  /** Size as % of the background image height */
  size: string;
};

const BUILDINGS: HubBuilding[] = [
  {
    id: "dungeon",
    label: "Dungeons",
    href: "/dungeon",
    image: "/images/building-dungeon.png",
    top: "42%",
    left: "15%",
    size: "14%",
  },
  {
    id: "arena",
    label: "Arena",
    href: "/arena",
    image: "/images/building-arena.png",
    top: "15%",
    left: "45%",
    size: "14%",
  },
  {
    id: "shop",
    label: "Shop",
    href: "/shop",
    image: "/images/building-shop.png",
    top: "25%",
    left: "65%",
    size: "14%",
  },
  {
    id: "tavern",
    label: "Tavern",
    href: "/minigames",
    image: "/images/Taverna.png",
    top: "48%",
    left: "42%",
    size: "14%",
  },
  {
    id: "training",
    label: "Training",
    href: "/combat",
    image: "/images/Traning.png",
    top: "45%",
    left: "68%",
    size: "14%",
  },
];

function HubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const characterId = searchParams.get("characterId");

  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const hasDragged = useRef(false);
  const dragState = useRef({ startX: 0, scrollLeft: 0, pointerId: 0 });
  const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null);

  const buildHref = useCallback(
    (base: string) => {
      if (!characterId) return base;
      return `${base}?characterId=${characterId}`;
    },
    [characterId],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const container = containerRef.current;
      if (!container) return;
      setIsDragging(true);
      hasDragged.current = false;
      dragState.current.startX = e.clientX;
      dragState.current.scrollLeft = container.scrollLeft;
      dragState.current.pointerId = e.pointerId;
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      const container = containerRef.current;
      if (!container) return;
      const dx = e.clientX - dragState.current.startX;
      if (Math.abs(dx) > DRAG_THRESHOLD && !hasDragged.current) {
        hasDragged.current = true;
        container.setPointerCapture(dragState.current.pointerId);
      }
      container.scrollLeft = dragState.current.scrollLeft - dx;
    },
    [isDragging],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      setIsDragging(false);
      if (hasDragged.current) {
        containerRef.current?.releasePointerCapture(e.pointerId);
      }
    },
    [isDragging],
  );

  const handleBuildingClick = useCallback(
    (href: string) => {
      if (hasDragged.current) return;
      router.push(buildHref(href));
    },
    [router, buildHref],
  );

  return (
    <div
      ref={containerRef}
      className="relative h-full overflow-x-auto overflow-y-hidden scrollbar-hide select-none"
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      role="region"
      aria-label="Hub world map"
      tabIndex={0}
    >
      <div className="relative h-full w-max min-w-full">
        <Image
          src="/images/hub-bg.png"
          alt="Hub background"
          width={2048}
          height={1024}
          priority
          draggable={false}
          className="h-full w-auto object-cover pointer-events-none"
        />
        <div className="absolute inset-0 bg-slate-950/30 pointer-events-none" />

        {/* Clickable buildings */}
        {BUILDINGS.map((b) => {
          const isHovered = hoveredBuilding === b.id;
          return (
            <button
              key={b.id}
              type="button"
              className="absolute group outline-none"
              style={{
                top: b.top,
                left: b.left,
                height: b.size,
                cursor: isDragging ? "grabbing" : "pointer",
              }}
              onClick={() => handleBuildingClick(b.href)}
              onMouseEnter={() => setHoveredBuilding(b.id)}
              onMouseLeave={() => setHoveredBuilding(null)}
              aria-label={b.label}
              tabIndex={0}
            >
              <Image
                src={b.image}
                alt={b.label}
                width={512}
                height={512}
                draggable={false}
                className={`h-full w-auto drop-shadow-2xl transition-transform duration-300 pointer-events-none ${
                  isHovered && !isDragging
                    ? "scale-105 brightness-110"
                    : "scale-100"
                }`}
              />
              {/* Label tooltip */}
              <span
                className={`absolute left-1/2 -translate-x-1/2 -top-2 whitespace-nowrap rounded-lg border border-amber-500/40 bg-slate-900/90 px-3 py-1.5 text-sm font-bold text-amber-300 shadow-lg shadow-amber-900/30 backdrop-blur-sm transition-all duration-200 ${
                  isHovered && !isDragging
                    ? "opacity-100 -translate-y-full"
                    : "opacity-0 -translate-y-3/4 pointer-events-none"
                }`}
              >
                {b.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function HubPage() {
  return (
    <Suspense fallback={<PageLoader emoji="🏠" text="Loading hub…" />}>
      <HubContent />
    </Suspense>
  );
}
