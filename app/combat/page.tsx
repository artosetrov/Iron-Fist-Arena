"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Character = {
  id: string;
  characterName: string;
  class: string;
  level: number;
  strength: number;
  agility: number;
  vitality: number;
  endurance: number;
  intelligence: number;
  wisdom: number;
  luck: number;
  charisma: number;
  armor: number;
};

type CombatLogEntry = {
  turn: number;
  actorId: string;
  targetId: string;
  action: string;
  damage?: number;
  dodge?: boolean;
  crit?: boolean;
  message: string;
};

type CombatResult = {
  winnerId: string | null;
  loserId: string | null;
  draw: boolean;
  turns: number;
  log: CombatLogEntry[];
};

const PRESETS = [
  { id: "warrior", label: "Воин" },
  { id: "rogue", label: "Разбойник" },
  { id: "mage", label: "Маг" },
  { id: "tank", label: "Танк" },
];

function CombatContent() {
  const searchParams = useSearchParams();
  const characterId = searchParams.get("characterId");
  const [character, setCharacter] = useState<Character | null>(null);
  const [preset, setPreset] = useState("warrior");
  const [loading, setLoading] = useState(true);
  const [fighting, setFighting] = useState(false);
  const [result, setResult] = useState<CombatResult | null>(null);

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

  const handleSimulate = async () => {
    if (!character) return;
    setFighting(true);
    setResult(null);
    try {
      const res = await fetch("/api/combat/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player: {
            id: character.id,
            name: character.characterName,
            class: character.class,
            level: character.level,
            strength: character.strength,
            agility: character.agility,
            vitality: character.vitality,
            endurance: character.endurance,
            intelligence: character.intelligence,
            wisdom: character.wisdom,
            luck: character.luck,
            charisma: character.charisma,
            armor: character.armor,
          },
          opponentPreset: preset,
        }),
      });
      const data = await res.json();
      setResult(data);
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
        <h1 className="text-2xl font-bold">Тестовый бой</h1>
        <Link
          href={`/hub?characterId=${character.id}`}
          className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
        >
          В хаб
        </Link>
      </header>

      <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <p className="mb-2">
          <strong>{character.characterName}</strong> (ур. {character.level}) vs
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPreset(p.id)}
              className={`rounded px-3 py-1 text-sm ${
                preset === p.id
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 hover:bg-slate-200"
              }`}
              aria-pressed={preset === p.id}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleSimulate}
          disabled={fighting}
          className="mt-4 rounded bg-amber-600 px-4 py-2 text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {fighting ? "Бой…" : "Запустить симуляцию"}
        </button>
      </section>

      {result && (
        <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h2 className="mb-2 font-semibold">
            {result.draw
              ? "Ничья"
              : result.winnerId === character.id
                ? "Победа"
                : "Поражение"}{" "}
            за {result.turns} ходов
          </h2>
          <ul className="max-h-96 overflow-y-auto text-sm">
            {result.log.map((entry, i) => (
              <li key={i} className="border-b border-slate-100 py-1">
                {entry.message}
                {entry.dodge && " (уклонение)"}
                {entry.crit && " (крит)"}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

export default function CombatPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center p-8"><p>Загрузка…</p></main>}>
      <CombatContent />
    </Suspense>
  );
}
