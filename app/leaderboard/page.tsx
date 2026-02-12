"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

export default function LeaderboardPage() {
  const [data, setData] = useState<{ season: number; leaderboard: Entry[] } | null>(null);

  useEffect(() => {
    fetch("/api/leaderboard?limit=50")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <p>Загрузка…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Лидерборд · Сезон {data.season}</h1>
        <Link href="/" className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">
          На главную
        </Link>
      </header>

      <table className="w-full border-collapse rounded-lg border border-slate-200 bg-white">
        <thead>
          <tr className="bg-slate-100">
            <th className="border-b p-2 text-left">#</th>
            <th className="border-b p-2 text-left">Имя</th>
            <th className="border-b p-2 text-left">Класс</th>
            <th className="border-b p-2 text-left">Ур.</th>
            <th className="border-b p-2 text-left">Рейтинг</th>
            <th className="border-b p-2 text-left">Победы / Поражения</th>
            <th className="border-b p-2 text-left">Ранг</th>
          </tr>
        </thead>
        <tbody>
          {data.leaderboard.map((e) => (
            <tr key={e.rank} className="border-b border-slate-100">
              <td className="p-2">{e.rank}</td>
              <td className="p-2 font-medium">{e.characterName}</td>
              <td className="p-2">{e.class}</td>
              <td className="p-2">{e.level}</td>
              <td className="p-2">{e.pvpRating}</td>
              <td className="p-2">{e.pvpWins} / {e.pvpLosses}</td>
              <td className="p-2">{e.highestPvpRank}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
