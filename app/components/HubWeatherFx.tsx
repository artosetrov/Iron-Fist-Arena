"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/* ────────────────── Types ────────────────── */

type WeatherType = "clear" | "wind" | "sunrays" | "fireflies" | "mist";

type Particle = {
  id: number;
  /** CSS inline styles for this particle */
  style: React.CSSProperties;
  /** Extra className (animation, color, etc.) */
  className: string;
  /** Visual content — SVG leaf, glow, etc. */
  content: React.ReactNode;
};

/* ────────────────── Config ────────────────── */

const WEATHER_CYCLE_MIN_MS = 12_000;
const WEATHER_CYCLE_MAX_MS = 22_000;

/** Probability weights — higher = more likely */
const WEATHER_WEIGHTS: Record<WeatherType, number> = {
  clear: 2,
  wind: 3,
  sunrays: 2,
  fireflies: 3,
  mist: 2,
};

/* ────────────────── Custom SVG Leaves ────────────────── */

/** Leaf color palettes — autumn/fantasy mix */
const LEAF_COLORS = [
  { fill: "#c0692b", stroke: "#8a4a1b" }, // warm brown-orange
  { fill: "#d4903a", stroke: "#a06828" }, // golden
  { fill: "#b8432e", stroke: "#7d2e1e" }, // red-brown
  { fill: "#8b9e3a", stroke: "#5e6e28" }, // olive green
  { fill: "#d97748", stroke: "#a55430" }, // burnt orange
  { fill: "#6b8c42", stroke: "#486030" }, // forest green
  { fill: "#cc5c3a", stroke: "#8e3e28" }, // terracotta
];

/** Different leaf SVG shapes */
const leafShapes: ((fill: string, stroke: string, size: number) => React.ReactNode)[] = [
  // Rounded oval leaf (like birch)
  (fill, stroke, size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path
        d="M16 2C10 8 4 14 6 22c2 6 8 8 10 8s8-2 10-8c2-8-4-14-10-20z"
        fill={fill}
        stroke={stroke}
        strokeWidth={1.2}
      />
      <path d="M16 6v20M12 12c2 1 4 2 4 3M20 14c-2 1-4 2-4 3" stroke={stroke} strokeWidth={0.8} opacity={0.5} />
    </svg>
  ),
  // Pointy maple-like leaf
  (fill, stroke, size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path
        d="M16 2l-3 8-7-2 4 7-6 3 7 2-1 8 6-5 6 5-1-8 7-2-6-3 4-7-7 2z"
        fill={fill}
        stroke={stroke}
        strokeWidth={1}
        strokeLinejoin="round"
      />
    </svg>
  ),
  // Simple elongated leaf
  (fill, stroke, size) => (
    <svg width={size} height={size} viewBox="0 0 24 32" fill="none">
      <path
        d="M12 2C6 10 2 18 6 26c2 3 4 4 6 4s4-1 6-4c4-8 0-16-6-24z"
        fill={fill}
        stroke={stroke}
        strokeWidth={1.1}
      />
      <path d="M12 6v22" stroke={stroke} strokeWidth={0.7} opacity={0.4} />
    </svg>
  ),
  // Wide oak-like leaf
  (fill, stroke, size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path
        d="M16 3c-2 3-5 5-8 6-2 2-3 5-2 8 1 4 4 7 6 9 1 2 3 4 4 4s3-2 4-4c2-2 5-5 6-9 1-3 0-6-2-8-3-1-6-3-8-6z"
        fill={fill}
        stroke={stroke}
        strokeWidth={1}
      />
      <path d="M16 7v20M10 14c3 1 5 3 6 4M22 14c-3 1-5 3-6 4" stroke={stroke} strokeWidth={0.6} opacity={0.4} />
    </svg>
  ),
  // Tiny round petal / seed
  (fill, stroke, size) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <ellipse cx="10" cy="10" rx="7" ry="9" fill={fill} stroke={stroke} strokeWidth={1} />
      <path d="M10 3v14" stroke={stroke} strokeWidth={0.6} opacity={0.35} />
    </svg>
  ),
];

/* ────────────────── Helpers ────────────────── */

const rand = (min: number, max: number) => Math.random() * (max - min) + min;
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));

const pickWeather = (prev: WeatherType): WeatherType => {
  const entries = Object.entries(WEATHER_WEIGHTS) as [WeatherType, number][];
  // Filter out current to avoid repetition
  const filtered = entries.filter(([t]) => t !== prev);
  const total = filtered.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [type, weight] of filtered) {
    r -= weight;
    if (r <= 0) return type;
  }
  return "clear";
};

/* ────────────────── Particle Generators ────────────────── */

let particleIdCounter = 0;

const generateWindLeaves = (): Particle[] =>
  Array.from({ length: randInt(6, 12) }, () => {
    const id = ++particleIdCounter;
    const duration = rand(4, 8);
    const delay = rand(0, 4);
    const startY = rand(8, 82);
    const size = randInt(14, 36); // varied sizes — small to big
    const color = LEAF_COLORS[randInt(0, LEAF_COLORS.length - 1)];
    const shape = leafShapes[randInt(0, leafShapes.length - 1)];
    const flipX = Math.random() > 0.5;
    return {
      id,
      content: shape(color.fill, color.stroke, size),
      className: "",
      style: {
        position: "absolute" as const,
        top: `${startY}%`,
        left: "-5%",
        width: `${size}px`,
        height: `${size}px`,
        animation: `weather-leaf ${duration}s ${delay}s ease-in-out forwards`,
        opacity: 0,
        pointerEvents: "none" as const,
        zIndex: 5,
        filter: `brightness(${rand(0.75, 1.15)})`,
        transform: flipX ? "scaleX(-1)" : undefined,
      },
    };
  });

const generateSunrays = (): Particle[] =>
  Array.from({ length: randInt(3, 5) }, () => {
    const id = ++particleIdCounter;
    const duration = rand(5, 8);
    const delay = rand(0, 2);
    const left = rand(15, 75);
    const width = rand(8, 18);
    return {
      id,
      content: "",
      className: "",
      style: {
        position: "absolute" as const,
        top: 0,
        left: `${left}%`,
        width: `${width}%`,
        height: "100%",
        background: `linear-gradient(175deg, rgba(255,220,130,0.18) 0%, rgba(255,200,80,0.06) 40%, transparent 70%)`,
        animation: `weather-sunray ${duration}s ${delay}s ease-in-out forwards`,
        opacity: 0,
        pointerEvents: "none" as const,
        zIndex: 4,
        transformOrigin: "top center",
      },
    };
  });

const generateFireflies = (): Particle[] =>
  Array.from({ length: randInt(8, 14) }, () => {
    const id = ++particleIdCounter;
    const duration = rand(3, 6);
    const delay = rand(0, 4);
    const left = rand(5, 92);
    const top = rand(30, 85);
    const size = rand(3, 6);
    const hue = randInt(0, 1) === 0 ? "rgba(255,200,60,0.9)" : "rgba(180,255,160,0.85)";
    return {
      id,
      content: "",
      className: "",
      style: {
        position: "absolute" as const,
        top: `${top}%`,
        left: `${left}%`,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        background: hue,
        boxShadow: `0 0 ${size * 2}px ${size}px ${hue}`,
        animation: `weather-firefly ${duration}s ${delay}s ease-in-out forwards`,
        opacity: 0,
        pointerEvents: "none" as const,
        zIndex: 5,
      },
    };
  });

const generateMist = (): Particle[] =>
  Array.from({ length: randInt(2, 3) }, () => {
    const id = ++particleIdCounter;
    const duration = rand(8, 14);
    const delay = rand(0, 3);
    const top = rand(40, 80);
    return {
      id,
      content: "",
      className: "",
      style: {
        position: "absolute" as const,
        top: `${top}%`,
        left: "-5%",
        width: "110%",
        height: `${rand(10, 20)}%`,
        background: "linear-gradient(90deg, transparent 0%, rgba(180,200,220,0.08) 30%, rgba(180,200,220,0.12) 50%, rgba(180,200,220,0.06) 70%, transparent 100%)",
        animation: `weather-mist ${duration}s ${delay}s ease-in-out forwards`,
        opacity: 0,
        pointerEvents: "none" as const,
        zIndex: 4,
        filter: "blur(8px)",
      },
    };
  });

const GENERATORS: Record<WeatherType, () => Particle[]> = {
  clear: () => [],
  wind: generateWindLeaves,
  sunrays: generateSunrays,
  fireflies: generateFireflies,
  mist: generateMist,
};

/* ────────────────── Component ────────────────── */

const HubWeatherFx = () => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const weatherRef = useRef<WeatherType>("clear");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const spawnWeather = useCallback(() => {
    const next = pickWeather(weatherRef.current);
    weatherRef.current = next;
    const generated = GENERATORS[next]();
    setParticles(generated);

    // Schedule next weather change
    const nextDelay = rand(WEATHER_CYCLE_MIN_MS, WEATHER_CYCLE_MAX_MS);
    timerRef.current = setTimeout(spawnWeather, nextDelay);
  }, []);

  useEffect(() => {
    // First weather event after short delay
    timerRef.current = setTimeout(spawnWeather, rand(2000, 5000));
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [spawnWeather]);

  if (particles.length === 0) return null;

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 6 }}
      aria-hidden="true"
    >
      {particles.map((p) => (
        <div key={p.id} className={p.className} style={p.style}>
          {p.content}
        </div>
      ))}
    </div>
  );
};

export default HubWeatherFx;
