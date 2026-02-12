"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type Character = {
  id: string;
  characterName: string;
  class: string;
  level: number;
  gold: number;
  currentStamina: number;
  maxStamina: number;
  lastStaminaUpdate: string;
  pvpRating: number;
};

const STAMINA_REGEN_MINUTES = 12;

function useStaminaRealtime(current: number, max: number, lastUpdate: string) {
  const [stamina, setStamina] = useState(current);
  const [nextIn, setNextIn] = useState<number | null>(null);

  useEffect(() => {
    const maxStamina = max;
    const last = new Date(lastUpdate).getTime();

    const tick = () => {
      const now = Date.now();
      const minutesPassed = (now - last) / (60 * 1000);
      const regenerated = Math.floor(minutesPassed / STAMINA_REGEN_MINUTES);
      const newCurrent = Math.min(maxStamina, current + regenerated);
      setStamina(newCurrent);
      if (newCurrent >= maxStamina) {
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
}

const FETCH_TIMEOUT_MS = 15_000;

function HubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const characterId = searchParams.get("characterId");
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    const ac = new AbortController();
    const timeoutId = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);

    try {
      if (characterId) {
        const res = await fetch(`/api/characters/${characterId}`, { signal: ac.signal });
        if (res.ok) {
          const data = await res.json();
          setCharacter(data);
          setLoading(false);
          return;
        }
        if (res.status === 401) {
          router.push("/login");
          return;
        }
      }
      const listRes = await fetch("/api/characters", { signal: ac.signal });
      if (listRes.status === 401) {
        router.push("/login");
        return;
      }
      if (!listRes.ok) {
        const data = await listRes.json().catch(() => ({}));
        const msg = data?.error ?? `Ошибка сервера: ${listRes.status}`;
        setError(msg);
        return;
      }
      const list = await listRes.json();
      const chars = list.characters ?? [];
      if (chars.length === 0) {
        router.push("/character");
        return;
      }
      const first = chars[0];
      setCharacter(first);
      router.replace(`/hub?characterId=${first.id}`);
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        setError("Превышено время ожидания. Проверьте интернет и повторите.");
      } else {
        setError((e as Error).message || "Ошибка загрузки");
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [characterId, router]);

  useEffect(() => {
    load();
  }, [load]);

  const { stamina, nextIn } = useStaminaRealtime(
    character?.currentStamina ?? 0,
    character?.maxStamina ?? 100,
    character?.lastStaminaUpdate ?? new Date().toISOString()
  );

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
        <p className="text-red-600" role="alert">
          {error}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => load()}
            className="rounded border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50"
          >
            Повторить
          </button>
          <Link
            href="/login"
            className="rounded border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
          >
            На страницу входа
          </Link>
        </div>
      </main>
    );
  }

  if (loading || !character) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <p>Загрузка…</p>
      </main>
    );
  }

  const nextInStr =
    nextIn != null
      ? `${Math.floor(nextIn / 60)}:${String(nextIn % 60).padStart(2, "0")}`
      : "полный";

  return (
    <main className="min-h-screen p-6">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{character.characterName}</h1>
          <p className="text-slate-600">
            Ур. {character.level} · {character.gold} золота · Рейтинг {character.pvpRating}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="rounded bg-slate-100 px-3 py-2" aria-label="Стамина">
            <span className="font-medium">Стамина </span>
            <span>{stamina}/{character.maxStamina}</span>
            <span className="ml-2 text-sm text-slate-600">(след. через {nextInStr})</span>
          </div>
          <Link
            href="/character"
            className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
          >
            Сменить персонажа
          </Link>
        </div>
      </header>

      <nav className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href={`/arena?characterId=${character.id}`}
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow"
        >
          <h2 className="text-lg font-semibold">Арена</h2>
          <p className="text-sm text-slate-600">PvP бои, рейтинг</p>
        </Link>
        <Link
          href={`/dungeon?characterId=${character.id}`}
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow"
        >
          <h2 className="text-lg font-semibold">Подземелья</h2>
          <p className="text-sm text-slate-600">PvE, лут</p>
        </Link>
        <Link
          href={`/inventory?characterId=${character.id}`}
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow"
        >
          <h2 className="text-lg font-semibold">Инвентарь</h2>
          <p className="text-sm text-slate-600">Экипировка</p>
        </Link>
        <Link
          href={`/shop?characterId=${character.id}`}
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow"
        >
          <h2 className="text-lg font-semibold">Магазин</h2>
          <p className="text-sm text-slate-600">Покупки</p>
        </Link>
        <Link
          href={`/combat?characterId=${character.id}`}
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow"
        >
          <h2 className="text-lg font-semibold">Тестовый бой</h2>
          <p className="text-sm text-slate-600">Симуляция боя</p>
        </Link>
        <Link
          href="/leaderboard"
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow"
        >
          <h2 className="text-lg font-semibold">Лидерборд</h2>
          <p className="text-sm text-slate-600">Рейтинг игроков</p>
        </Link>
      </nav>
    </main>
  );
}

export default function HubPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center p-8"><p>Загрузка…</p></main>}>
      <HubContent />
    </Suspense>
  );
}
