"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import PageLoader from "@/app/components/PageLoader";
import { useAdminGuard } from "@/lib/hooks/useAdminGuard";

/* ────────────────── Types ────────────────── */

type HealthCheck = {
  status: "ok" | "error";
  latencyMs: number;
  detail?: string;
};

type HealthData = {
  status: "healthy" | "degraded";
  version: string;
  nodeEnv: string;
  uptime: number;
  checks: Record<string, HealthCheck>;
  env: Record<string, boolean>;
  timestamp: string;
};

type TestFile = {
  name: string;
  status: string;
  numTests: number;
  numPassed: number;
  numFailed: number;
  durationMs: number;
  failures: string[];
};

type TestResult = {
  success: boolean;
  numTotalTests: number;
  numPassed: number;
  numFailed: number;
  numPending: number;
  numFiles: number;
  testFiles: TestFile[];
  durationMs: number;
  error?: string;
};

type GameStats = {
  users: number;
  characters: number;
  avgLevel: number;
  maxLevel: number;
  avgPvpRating: number;
  maxPvpRating: number;
  pvpMatches: number;
  items: number;
  dungeonProgress: number;
  equipment: number;
  timestamp: string;
};

type ApiPingResult = {
  path: string;
  method: string;
  status: number | null;
  latencyMs: number;
  ok: boolean;
};

/* ────────────────── Constants ────────────────── */

const API_ENDPOINTS: { path: string; method: string }[] = [
  { path: "/api/me", method: "GET" },
  { path: "/api/characters", method: "GET" },
  { path: "/api/combat/simulate", method: "POST" },
  { path: "/api/pvp/find-match", method: "POST" },
  { path: "/api/pvp/opponents", method: "GET" },
  { path: "/api/consumables", method: "GET" },
  { path: "/api/dungeons", method: "GET" },
  { path: "/api/inventory", method: "GET" },
  { path: "/api/leaderboard", method: "GET" },
  { path: "/api/quests/daily", method: "GET" },
  { path: "/api/shop/items", method: "GET" },
  { path: "/api/stamina/refill", method: "POST" },
  { path: "/api/minigames/shell-game", method: "POST" },
  { path: "/api/dev/health", method: "GET" },
  { path: "/api/dev/stats", method: "GET" },
];

/* ────────────────── Helpers ────────────────── */

const formatUptime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

const latencyBadge = (ms: number) => {
  if (ms < 100) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  if (ms < 300) return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  return "bg-red-500/20 text-red-400 border-red-500/30";
};

const statusDot = (ok: boolean) =>
  ok
    ? "h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]"
    : "h-2.5 w-2.5 rounded-full bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.5)]";

/* ────────────────── Section: System Health ────────────────── */

const HealthSection = ({
  data,
  loading,
  onRefresh,
}: {
  data: HealthData | null;
  loading: boolean;
  onRefresh: () => void;
}) => (
  <section className="rounded-xl border border-slate-700/50 bg-slate-900/80">
    <div className="flex items-center justify-between border-b border-slate-700/50 px-5 py-3">
      <h2 className="font-display text-base text-white">System Health</h2>
      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300 transition hover:bg-slate-700 disabled:opacity-50"
        aria-label="Refresh health"
      >
        {loading ? "Checking..." : "Refresh"}
      </button>
    </div>
    <div className="p-5">
      {loading && !data ? (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-amber-400" />
          Checking system health...
        </div>
      ) : data ? (
        <div className="space-y-4">
          {/* Overall status */}
          <div className="flex items-center gap-3">
            <div className={statusDot(data.status === "healthy")} />
            <span className="text-sm font-medium text-white">
              {data.status === "healthy" ? "All Systems Operational" : "Degraded Performance"}
            </span>
            <span className="ml-auto text-xs text-slate-500">v{data.version}</span>
          </div>

          {/* Check cards */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {Object.entries(data.checks).map(([key, check]) => (
              <div
                key={key}
                className="flex items-center gap-3 rounded-lg border border-slate-700/40 bg-slate-800/50 px-3 py-2.5"
              >
                <div className={statusDot(check.status === "ok")} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold capitalize text-white">{key}</p>
                  {check.detail && (
                    <p className="truncate text-[10px] text-red-400">{check.detail}</p>
                  )}
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-mono ${latencyBadge(check.latencyMs)}`}>
                  {check.latencyMs}ms
                </span>
              </div>
            ))}
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-4 text-[11px] text-slate-500">
            <span>Env: {data.nodeEnv}</span>
            <span>Uptime: {formatUptime(data.uptime)}</span>
            <span>Updated: {new Date(data.timestamp).toLocaleTimeString()}</span>
          </div>

          {/* Env vars */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.env).map(([key, set]) => (
              <span
                key={key}
                className={`rounded-full border px-2 py-0.5 text-[10px] font-mono ${
                  set
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-red-500/30 bg-red-500/10 text-red-400"
                }`}
              >
                {set ? "✓" : "✗"} {key}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-red-400">Failed to load health data</p>
      )}
    </div>
  </section>
);

/* ────────────────── Section: Test Runner ────────────────── */

const TestRunnerSection = ({
  result,
  running,
  onRun,
}: {
  result: TestResult | null;
  running: boolean;
  onRun: () => void;
}) => (
  <section className="rounded-xl border border-slate-700/50 bg-slate-900/80">
    <div className="flex items-center justify-between border-b border-slate-700/50 px-5 py-3">
      <h2 className="font-display text-base text-white">Test Runner</h2>
      <button
        type="button"
        onClick={onRun}
        disabled={running}
        className="rounded-lg border border-amber-600/50 bg-amber-600/20 px-4 py-1.5 text-xs font-bold text-amber-300 transition hover:bg-amber-600/30 disabled:opacity-50"
        aria-label="Run all tests"
      >
        {running ? (
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-amber-400/30 border-t-amber-400" />
            Running...
          </span>
        ) : (
          "Run All Tests"
        )}
      </button>
    </div>
    <div className="p-5">
      {running && !result ? (
        <div className="flex flex-col items-center gap-3 py-8 text-sm text-slate-400">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-amber-400" />
          Running vitest...
        </div>
      ) : result ? (
        <div className="space-y-4">
          {/* Summary bar */}
          <div className="flex items-center gap-4">
            <div className={`rounded-lg border px-4 py-2 text-center ${
              result.success
                ? "border-emerald-500/30 bg-emerald-500/10"
                : "border-red-500/30 bg-red-500/10"
            }`}>
              <p className={`text-2xl font-black ${result.success ? "text-emerald-400" : "text-red-400"}`}>
                {result.success ? "PASS" : "FAIL"}
              </p>
            </div>
            <div className="flex-1 grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-xl font-bold text-white">{result.numTotalTests}</p>
                <p className="text-[10px] text-slate-500">Total</p>
              </div>
              <div>
                <p className="text-xl font-bold text-emerald-400">{result.numPassed}</p>
                <p className="text-[10px] text-slate-500">Passed</p>
              </div>
              <div>
                <p className="text-xl font-bold text-red-400">{result.numFailed}</p>
                <p className="text-[10px] text-slate-500">Failed</p>
              </div>
              <div>
                <p className="text-xl font-bold text-slate-400">{result.numFiles}</p>
                <p className="text-[10px] text-slate-500">Files</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-mono font-bold text-amber-400">
                {(result.durationMs / 1000).toFixed(1)}s
              </p>
              <p className="text-[10px] text-slate-500">Duration</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
              style={{
                width: `${result.numTotalTests > 0 ? (result.numPassed / result.numTotalTests) * 100 : 0}%`,
              }}
            />
          </div>

          {/* File results */}
          <div className="max-h-80 space-y-1 overflow-y-auto">
            {result.testFiles.map((file) => (
              <div
                key={file.name}
                className="flex items-center gap-3 rounded-lg border border-slate-700/30 bg-slate-800/40 px-3 py-2"
              >
                <div className={statusDot(file.numFailed === 0)} />
                <p className="min-w-0 flex-1 truncate text-xs font-mono text-slate-300">
                  {file.name}
                </p>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-emerald-400">{file.numPassed}P</span>
                  {file.numFailed > 0 && (
                    <span className="text-red-400">{file.numFailed}F</span>
                  )}
                  <span className={`rounded-full border px-2 py-0.5 font-mono ${latencyBadge(file.durationMs)}`}>
                    {file.durationMs}ms
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Show failure details */}
          {result.testFiles.some((f) => f.failures.length > 0) && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
              <p className="mb-2 text-xs font-bold text-red-400">Failed Tests:</p>
              {result.testFiles
                .filter((f) => f.failures.length > 0)
                .flatMap((f) => f.failures)
                .map((name, i) => (
                  <p key={i} className="text-[11px] text-red-300/80">
                    - {name}
                  </p>
                ))}
            </div>
          )}

          {result.error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
              <p className="text-xs text-red-400">{result.error}</p>
            </div>
          )}
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-slate-500">
          Click &quot;Run All Tests&quot; to execute the test suite
        </p>
      )}
    </div>
  </section>
);

/* ────────────────── Section: Game Stats ────────────────── */

type StatCardProps = { icon: string; label: string; value: string | number; sub?: string };

const StatCard = ({ icon, label, value, sub }: StatCardProps) => (
  <div className="flex items-center gap-3 rounded-lg border border-slate-700/40 bg-slate-800/50 px-4 py-3">
    <span className="text-2xl">{icon}</span>
    <div className="min-w-0 flex-1">
      <p className="text-xl font-black text-white">{value}</p>
      <p className="text-[10px] text-slate-500">{label}</p>
      {sub && <p className="text-[10px] text-slate-600">{sub}</p>}
    </div>
  </div>
);

const GameStatsSection = ({
  data,
  loading,
  onRefresh,
}: {
  data: GameStats | null;
  loading: boolean;
  onRefresh: () => void;
}) => (
  <section className="rounded-xl border border-slate-700/50 bg-slate-900/80">
    <div className="flex items-center justify-between border-b border-slate-700/50 px-5 py-3">
      <h2 className="font-display text-base text-white">Game Statistics</h2>
      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300 transition hover:bg-slate-700 disabled:opacity-50"
        aria-label="Refresh stats"
      >
        {loading ? "Loading..." : "Refresh"}
      </button>
    </div>
    <div className="p-5">
      {loading && !data ? (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-amber-400" />
          Loading stats...
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <StatCard icon="👤" label="Players" value={data.users} />
          <StatCard
            icon="⚔️"
            label="Characters"
            value={data.characters}
            sub={`Avg level: ${data.avgLevel} | Max: ${data.maxLevel}`}
          />
          <StatCard
            icon="🏆"
            label="PvP Matches"
            value={data.pvpMatches}
            sub={`Avg rating: ${data.avgPvpRating} | Top: ${data.maxPvpRating}`}
          />
          <StatCard icon="🗡️" label="Items in Catalog" value={data.items} />
          <StatCard icon="🏰" label="Dungeon Clears" value={data.dungeonProgress} />
          <StatCard icon="🎒" label="Equipment Owned" value={data.equipment} />
        </div>
      ) : (
        <p className="text-sm text-red-400">Failed to load stats</p>
      )}
    </div>
  </section>
);

/* ────────────────── Section: Audit Summary ────────────────── */

const AUDIT_ITEMS = [
  { label: "Status effect type collision", status: "fixed", detail: "Added str_buff, armor_buff, resist_buff, dodge_buff types" },
  { label: "Cheat Death edge case (1 HP)", status: "fixed", detail: "Changed >= 1 trigger condition" },
  { label: "Race condition: combat/simulate", status: "fixed", detail: "Daily limit check inside transaction" },
  { label: "Race condition: pvp/find-match", status: "fixed", detail: "Stamina re-validated atomically in tx" },
  { label: "Race condition: dungeons/start", status: "fixed", detail: "Stamina + active run check in tx" },
  { label: "Race condition: dungeon-rush/start", status: "fixed", detail: "Same pattern as dungeons/start" },
  { label: "Race condition: allocate-stats", status: "fixed", detail: "Entire operation wrapped in tx" },
  { label: "Free gold exploit: buy-gold", status: "fixed", detail: "Blocked in production until payment integration" },
  { label: "Draw handling", status: "fixed", detail: "AGI tie-break for exact HP% ties" },
  { label: "Win streak gold (cumulative)", status: "fixed", detail: "Changed to tiered (highest only)" },
  { label: "Rate limiting (13 endpoints)", status: "fixed", detail: "Added to all write endpoints" },
  { label: "Dev routes in production", status: "fixed", detail: "Gated behind NODE_ENV check" },
  { label: "CSP header", status: "fixed", detail: "Added to next.config.js" },
  { label: "DB indexes (10 missing)", status: "fixed", detail: "Added to Prisma schema" },
  { label: "Debug logging in useAdminGuard", status: "fixed", detail: "Removed 6 external fetch calls" },
  { label: "Duplicate FormInput", status: "fixed", detail: "Extracted to shared component" },
  { label: "GDD v1 → v3", status: "fixed", detail: "Rating, slots, prestige, formulas synced" },
  { label: "Set bonuses integration", status: "planned", detail: "Definitions ready, combat integration TBD" },
  { label: "Prestige system", status: "planned", detail: "Schema ready, logic not implemented" },
] as const;

const AuditSection = () => (
  <section className="rounded-xl border border-slate-700/50 bg-slate-900/80">
    <div className="flex items-center justify-between border-b border-slate-700/50 px-5 py-3">
      <h2 className="font-display text-base text-white">Audit Log (v3.0)</h2>
      <div className="flex items-center gap-2 text-[10px]">
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-emerald-400">
          {AUDIT_ITEMS.filter((i) => i.status === "fixed").length} fixed
        </span>
        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-amber-400">
          {AUDIT_ITEMS.filter((i) => i.status === "planned").length} planned
        </span>
      </div>
    </div>
    <div className="max-h-80 overflow-y-auto p-5">
      <div className="space-y-1">
        {AUDIT_ITEMS.map((item) => (
          <div
            key={item.label}
            className="flex items-start gap-3 rounded-lg border border-slate-700/30 bg-slate-800/40 px-3 py-2"
          >
            <div
              className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                item.status === "fixed"
                  ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]"
                  : "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]"
              }`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-200">{item.label}</p>
              <p className="text-[10px] text-slate-500">{item.detail}</p>
            </div>
            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                item.status === "fixed"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-400"
              }`}
            >
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ────────────────── Section: API Ping ────────────────── */

const ApiPingSection = ({
  results,
  running,
  onPing,
}: {
  results: ApiPingResult[];
  running: boolean;
  onPing: () => void;
}) => (
  <section className="rounded-xl border border-slate-700/50 bg-slate-900/80">
    <div className="flex items-center justify-between border-b border-slate-700/50 px-5 py-3">
      <h2 className="font-display text-base text-white">API Endpoints ({API_ENDPOINTS.length})</h2>
      <button
        type="button"
        onClick={onPing}
        disabled={running}
        className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300 transition hover:bg-slate-700 disabled:opacity-50"
        aria-label="Ping all endpoints"
      >
        {running ? "Pinging..." : "Ping All"}
      </button>
    </div>
    <div className="p-5">
      {results.length === 0 && !running ? (
        <p className="py-4 text-center text-sm text-slate-500">
          Click &quot;Ping All&quot; to check endpoint latency
        </p>
      ) : (
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {running && results.length === 0 ? (
            <div className="flex items-center gap-2 py-4 text-sm text-slate-400">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-amber-400" />
              Pinging endpoints...
            </div>
          ) : (
            results.map((r) => (
              <div
                key={r.path}
                className="flex items-center gap-3 rounded-lg border border-slate-700/30 bg-slate-800/40 px-3 py-2"
              >
                <div className={statusDot(r.ok)} />
                <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${
                  r.method === "GET"
                    ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                }`}>
                  {r.method}
                </span>
                <p className="min-w-0 flex-1 truncate text-xs font-mono text-slate-300">
                  {r.path}
                </p>
                <div className="flex items-center gap-2 text-[10px]">
                  {r.status && (
                    <span className={r.ok ? "text-emerald-400" : "text-red-400"}>
                      {r.status}
                    </span>
                  )}
                  <span className={`rounded-full border px-2 py-0.5 font-mono ${latencyBadge(r.latencyMs)}`}>
                    {r.latencyMs}ms
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  </section>
);

/* ────────────────── Main Dashboard ────────────────── */

const DevDashboardContent = () => {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testsRunning, setTestsRunning] = useState(false);

  const [stats, setStats] = useState<GameStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [apiResults, setApiResults] = useState<ApiPingResult[]>([]);
  const [apiPinging, setApiPinging] = useState(false);

  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const res = await fetch("/api/dev/health");
      if (res.ok) setHealth(await res.json());
    } catch { /* ignore */ }
    setHealthLoading(false);
  }, []);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/dev/stats");
      if (res.ok) setStats(await res.json());
    } catch { /* ignore */ }
    setStatsLoading(false);
  }, []);

  const handleRunTests = useCallback(async () => {
    setTestsRunning(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/dev/tests", { method: "POST" });
      if (res.ok) {
        setTestResult(await res.json());
      } else {
        const data = await res.json().catch(() => ({}));
        setTestResult({
          success: false,
          numTotalTests: 0,
          numPassed: 0,
          numFailed: 0,
          numPending: 0,
          numFiles: 0,
          testFiles: [],
          durationMs: 0,
          error: data.error ?? `HTTP ${res.status}`,
        });
      }
    } catch {
      setTestResult({
        success: false,
        numTotalTests: 0,
        numPassed: 0,
        numFailed: 0,
        numPending: 0,
        numFiles: 0,
        testFiles: [],
        durationMs: 0,
        error: "Network error",
      });
    }
    setTestsRunning(false);
  }, []);

  const handlePingAll = useCallback(async () => {
    setApiPinging(true);
    setApiResults([]);
    const results: ApiPingResult[] = [];

    for (const ep of API_ENDPOINTS) {
      const start = Date.now();
      try {
        const res = await fetch(ep.path, {
          method: ep.method === "GET" ? "GET" : "POST",
          headers: ep.method === "POST" ? { "Content-Type": "application/json" } : undefined,
          body: ep.method === "POST" ? "{}" : undefined,
        });
        results.push({
          path: ep.path,
          method: ep.method,
          status: res.status,
          latencyMs: Date.now() - start,
          ok: res.status < 500,
        });
      } catch {
        results.push({
          path: ep.path,
          method: ep.method,
          status: null,
          latencyMs: Date.now() - start,
          ok: false,
        });
      }
    }

    setApiResults(results);
    setApiPinging(false);
  }, []);

  // Initial load
  useEffect(() => {
    fetchHealth();
    fetchStats();
  }, [fetchHealth, fetchStats]);

  // Auto-refresh health every 30s
  useEffect(() => {
    const id = setInterval(fetchHealth, 30_000);
    return () => clearInterval(id);
  }, [fetchHealth]);

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="relative border-b border-slate-800 bg-slate-950/80 px-6 py-4 text-center">
        <Link
          href="/hub"
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/80 text-slate-400 transition hover:bg-slate-700 hover:text-white"
          aria-label="Back to Hub"
          tabIndex={0}
        >
          ✕
        </Link>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-white">Dev Dashboard</h1>
        <p className="text-xs text-slate-500">System monitoring, tests & game analytics</p>
      </div>

      {/* Content */}
      <div className="space-y-4 p-4 sm:p-6">
        <HealthSection data={health} loading={healthLoading} onRefresh={fetchHealth} />
        <TestRunnerSection result={testResult} running={testsRunning} onRun={handleRunTests} />
        <GameStatsSection data={stats} loading={statsLoading} onRefresh={fetchStats} />
        <AuditSection />
        <ApiPingSection results={apiResults} running={apiPinging} onPing={handlePingAll} />
      </div>
    </div>
  );
};

const DevDashboardPage = () => {
  const { isAdmin, loading } = useAdminGuard();

  if (loading || !isAdmin) {
    return <PageLoader emoji="🛠" text="Checking access..." />;
  }

  return (
    <Suspense fallback={<PageLoader emoji="🛠" text="Loading dashboard..." />}>
      <DevDashboardContent />
    </Suspense>
  );
};

export default DevDashboardPage;
