"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Character = {
  id: string;
  characterName: string;
  level: number;
  currentStamina: number;
  maxStamina: number;
  gold?: number;
};

function DungeonContent() {
  const searchParams = useSearchParams();
  const characterId = searchParams.get("characterId");
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [runId, setRunId] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<"easy" | "normal" | "hard">("normal");
  const [fighting, setFighting] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [result, setResult] = useState<{
    victory?: boolean;
    dungeonComplete?: boolean;
    rewards?: { gold: number; xp: number };
    next?: { floor: number; room: string; enemy: { name: string; hp: number; maxHp: number } };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!characterId) return;
    fetch(`/api/characters/${characterId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => data && setCharacter(data))
      .finally(() => setLoading(false));
  }, [characterId]);

  const handleStart = async () => {
    if (!characterId) return;
    setError(null);
    setResult(null);
    setLog([]);
    setRunId(null);
    const cost = difficulty === "easy" ? 15 : difficulty === "hard" ? 25 : 20;
    if (character && character.currentStamina < cost) {
      setError("Недостаточно стамины");
      return;
    }
    const res = await fetch("/api/dungeons/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ characterId, difficulty }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Ошибка");
      return;
    }
    setRunId(data.runId);
    setResult({
      next: {
        floor: data.currentFloor,
        room: data.room,
        enemy: { name: data.enemy.name, hp: data.enemy.hp, maxHp: data.enemy.maxHp },
      },
    });
    setCharacter((c) => c ? { ...c, currentStamina: c.currentStamina - cost } : null);
  };

  const handleFight = async () => {
    if (!runId) return;
    setError(null);
    setFighting(true);
    try {
      const res = await fetch(`/api/dungeons/run/${runId}/fight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.log?.length) {
        setLog((prev) => [...prev, ...data.log.map((e: { message: string }) => e.message)]);
      }
      setResult(data);
      if (data.dungeonComplete && data.rewards) {
        setRunId(null);
        setCharacter((c) =>
          c
            ? { ...c, gold: (c.gold ?? 0) + data.rewards.gold }
            : null
        );
      } else if (data.victory && data.next) {
        setResult({ ...data, next: data.next });
      } else if (!data.victory) {
        setRunId(null);
      }
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

  const cost = difficulty === "easy" ? 15 : difficulty === "hard" ? 25 : 20;

  return (
    <main className="min-h-screen p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Подземелья</h1>
        <Link
          href={`/hub?characterId=${character.id}`}
          className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
        >
          В хаб
        </Link>
      </header>

      <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <p className="mb-2">
          <strong>{character.characterName}</strong> · Стамина {character.currentStamina}/{character.maxStamina}
        </p>
        {!runId ? (
          <>
            <div className="mb-2 flex gap-2">
              {(["easy", "normal", "hard"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`rounded px-3 py-1 text-sm ${
                    difficulty === d ? "bg-slate-800 text-white" : "bg-slate-100"
                  }`}
                >
                  {d === "easy" ? "Лёгкий (15)" : d === "hard" ? "Сложный (25)" : "Обычный (20)"}
                </button>
              ))}
            </div>
            {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
            <button
              type="button"
              onClick={handleStart}
              disabled={character.currentStamina < cost}
              className="rounded bg-amber-600 px-4 py-2 text-white hover:bg-amber-700 disabled:opacity-50"
            >
              Начать подземелье
            </button>
          </>
        ) : (
          <>
            {result?.next && !result.dungeonComplete && result.victory !== false && (
              <p className="mb-2">
                Этаж {result.next.floor} · {result.next.room} · {result.next.enemy.name} (HP {result.next.enemy.maxHp})
              </p>
            )}
            {result?.dungeonComplete && (
              <p className="mb-2 font-semibold text-green-700">
                Подземелье пройдено! Золото: +{result.rewards?.gold}, XP: +{result.rewards?.xp}
              </p>
            )}
            {result?.victory === false && (
              <p className="mb-2 font-semibold text-red-600">Поражение</p>
            )}
            {runId && !result?.dungeonComplete && result?.victory !== false && (
              <button
                type="button"
                onClick={handleFight}
                disabled={fighting}
                className="rounded bg-amber-600 px-4 py-2 text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {fighting ? "Бой…" : "Сражаться"}
              </button>
            )}
          </>
        )}
      </section>

      {log.length > 0 && (
        <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h2 className="mb-2 font-semibold">Лог боя</h2>
          <ul className="max-h-64 overflow-y-auto text-sm">
            {log.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

export default function DungeonPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center p-8"><p>Загрузка…</p></main>}>
      <DungeonContent />
    </Suspense>
  );
}
