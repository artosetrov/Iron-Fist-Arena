"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Item = {
  id: string;
  itemName: string;
  itemType: string;
  rarity: string;
  itemLevel: number;
  buyPrice: number | null;
  baseStats: object;
};

type Character = { id: string; characterName: string; gold: number; level: number };

function ShopContent() {
  const searchParams = useSearchParams();
  const characterId = searchParams.get("characterId");
  const [character, setCharacter] = useState<Character | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!characterId) return;
    Promise.all([
      fetch(`/api/characters/${characterId}`).then((r) => r.json()),
      fetch(`/api/shop/items?characterId=${characterId}`).then((r) => r.json()),
    ]).then(([char, shop]) => {
      setCharacter(char);
      setItems(shop.items ?? []);
    }).finally(() => setLoading(false));
  }, [characterId]);

  const handleBuy = async (itemId: string) => {
    setError(null);
    const res = await fetch("/api/shop/buy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ characterId, itemId }),
    });
    const data = await res.json();
    if (res.ok) {
      setCharacter((c) => c ? { ...c, gold: c.gold - (items.find((i) => i.id === itemId)?.buyPrice ?? 0) } : null);
    } else {
      setError(data.error ?? "Ошибка");
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
        <h1 className="text-2xl font-bold">Магазин</h1>
        <div className="flex gap-2">
          <span className="rounded bg-amber-100 px-3 py-1">Золото: {character.gold}</span>
          <Link
            href={`/hub?characterId=${characterId}`}
            className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
          >
            В хаб
          </Link>
        </div>
      </header>

      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="font-medium">{item.itemName}</p>
            <p className="text-sm text-slate-600">
              {item.rarity} · ур. {item.itemLevel} · {item.itemType}
            </p>
            <p className="mt-2 font-semibold">{item.buyPrice ?? 0} золота</p>
            <button
              type="button"
              onClick={() => handleBuy(item.id)}
              disabled={character.gold < (item.buyPrice ?? 0)}
              className="mt-2 rounded bg-slate-800 px-3 py-1 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
            >
              Купить
            </button>
          </li>
        ))}
      </ul>
      {items.length === 0 && (
        <p className="text-slate-600">Нет товаров по вашему уровню. Зайдите после прогресса.</p>
      )}
    </main>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center p-8"><p>Загрузка…</p></main>}>
      <ShopContent />
    </Suspense>
  );
}
