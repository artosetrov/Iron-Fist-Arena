"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Character = {
  id: string;
  characterName: string;
  level: number;
  gold: number;
  currentStamina: number;
  maxStamina: number;
  pvpRating: number;
};

type MatchResult = {
  winnerId: string | null;
  loserId: string | null;
  draw: boolean;
  turns: number;
  log: { message: string }[];
  rewards: {
    gold: number;
    xp: number;
    ratingChange: number;
    newRating: number;
    won: boolean;
  };
};

function ArenaContent() {
  const searchParams = useSearchParams();
  const characterId = searchParams.get("characterId");
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [fighting, setFighting] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!characterId) return;
    const load = async () => {
      const res = await fetch(`/api/characters/${characterId}`);
      if (res.ok) {
        const data = await res.json();
        setCharacter(data);
      }
      setLoading(false);
    };
    load();
  }, [characterId]);

  const handleFindMatch = async () => {
    if (!characterId) return;
    setError(null);
    setResult(null);
    setFighting(true);
    try {
      const res = await fetch("/api/pvp/find-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Ошибка");
        return;
      }
      setResult(data);
      setCharacter((c) =>
        c
          ? {
              ...c,
              currentStamina: c.currentStamina - 10,
              gold: c.gold + (data.rewards?.gold ?? 0),
              pvpRating: data.rewards?.newRating ?? c.pvpRating,
            }
          : null
      );
    } finally {
      setFighting(false);
    }
  };

  if (loading || !character) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <p>Загрузка…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Арена</h1>
        <Link
          href={`/hub?characterId=${character.id}`}
          className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
        >
          В хаб
        </Link>
      </header>

      <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <p className="mb-2">
          <strong>{character.characterName}</strong> · Рейтинг {character.pvpRating} · Стамина {character.currentStamina}/{" "}
          {character.maxStamina}
        </p>
        <p className="mb-4 text-sm text-slate-600">
          Бой стоит 10 стамины. Вы сразитесь с билдом другого игрока под управлением ИИ.
        </p>
        {error && (
          <p className="mb-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={handleFindMatch}
          disabled={fighting || character.currentStamina < 10}
          className="rounded bg-amber-600 px-4 py-2 text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {fighting ? "Поиск и бой…" : "Найти бой"}
        </button>
      </section>

      {result && (
        <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h2 className="mb-2 font-semibold">
            {result.draw ? "Ничья" : result.rewards.won ? "Победа!" : "Поражение"}{" "}
            за {result.turns} ходов
          </h2>
          <p className="mb-2 text-sm">
            Золото: +{result.rewards.gold} · XP: +{result.rewards.xp} · Рейтинг:{" "}
            {result.rewards.ratingChange >= 0 ? "+" : ""}
            {result.rewards.ratingChange} = {result.rewards.newRating}
          </p>
          <ul className="max-h-64 overflow-y-auto text-sm">
            {result.log.map((entry, i) => (
              <li key={i} className="border-b border-slate-100 py-1">
                {entry.message}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

export default function ArenaPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center p-8"><p>Загрузка…</p></main>}>
      <ArenaContent />
    </Suspense>
  );
}
