"use client";

import { useEffect, useState } from "react";
import PageLoader from "@/app/components/PageLoader";

type Entry = {
  rank: number;
  characterName: string;
  class: string;
  level: number;
  pvpRating: number;
  pvpWins: number;
  pvpLosses: number;
  highestPvpRank: string;
};

const CLASS_LABEL: Record<string, string> = {
  warrior: "Warrior",
  rogue: "Rogue",
  mage: "Mage",
  tank: "Tank",
};

export default function LeaderboardPage() {
  const [data, setData] = useState<{ season: number; leaderboard: Entry[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const res = await fetch("/api/leaderboard?limit=50", { signal: controller.signal });
        if (!res.ok) throw new Error("Failed to load leaderboard");
        const json = await res.json();
        setData(json);
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Error");
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, []);

  if (error) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 p-8">
        <p className="text-red-400" role="alert">{error}</p>
        <button
          type="button"
          onClick={() => { setError(null); setLoading(true); window.location.reload(); }}
          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading || !data) {
    return <PageLoader emoji="🏆" text="Loading leaderboard…" />;
  }

  return (
    <div className="p-4 lg:p-6">
      <h1 className="mb-4 text-xl font-bold text-white">🏆 Leaderboard · Season {data.season}</h1>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-left text-xs uppercase tracking-wider text-slate-400">
              <th className="px-3 py-2.5">#</th>
              <th className="px-3 py-2.5">Name</th>
              <th className="px-3 py-2.5">Class</th>
              <th className="px-3 py-2.5">Lv.</th>
              <th className="px-3 py-2.5">Rating</th>
              <th className="px-3 py-2.5">W / L</th>
              <th className="px-3 py-2.5">Rank</th>
            </tr>
          </thead>
          <tbody>
            {data.leaderboard.map((e) => (
              <tr
                key={e.rank}
                className="border-b border-slate-800/50 text-slate-300 transition hover:bg-slate-800/30"
              >
                <td className="px-3 py-2 font-bold text-white">
                  {e.rank <= 3 ? (
                    <span className={e.rank === 1 ? "text-yellow-400" : e.rank === 2 ? "text-slate-300" : "text-amber-700"}>
                      {e.rank === 1 ? "🥇" : e.rank === 2 ? "🥈" : "🥉"}
                    </span>
                  ) : (
                    e.rank
                  )}
                </td>
                <td className="px-3 py-2 font-medium text-white">{e.characterName}</td>
                <td className="px-3 py-2">{CLASS_LABEL[e.class] ?? e.class}</td>
                <td className="px-3 py-2">{e.level}</td>
                <td className="px-3 py-2 font-bold text-amber-400">{e.pvpRating}</td>
                <td className="px-3 py-2">
                  <span className="text-green-400">{e.pvpWins}</span>
                  {" / "}
                  <span className="text-red-400">{e.pvpLosses}</span>
                </td>
                <td className="px-3 py-2">{e.highestPvpRank}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
