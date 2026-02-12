"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Item = {
  id: string;
  item: { itemName: string; itemType: string; rarity: string; itemLevel: number; baseStats: object };
  isEquipped: boolean;
  equippedSlot: string | null;
  durability: number;
  maxDurability: number;
  upgradeLevel: number;
};

const SLOTS = ["weapon", "helmet", "chest", "gloves", "legs", "boots", "accessory"];
const RARITY_COLOR: Record<string, string> = {
  common: "text-slate-600",
  uncommon: "text-green-600",
  rare: "text-blue-600",
  epic: "text-purple-600",
  legendary: "text-amber-600",
};

function InventoryContent() {
  const searchParams = useSearchParams();
  const characterId = searchParams.get("characterId");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!characterId) return;
    const res = await fetch(`/api/inventory?characterId=${characterId}`);
    if (!res.ok) return;
    const data = await res.json();
    setItems(data.items ?? []);
  };

  useEffect(() => {
    if (!characterId) return;
    load().finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterId]);

  const handleEquip = async (inventoryId: string, itemType: string) => {
    const slot = itemType;
    const res = await fetch("/api/inventory/equip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ characterId, inventoryId, slot }),
    });
    if (res.ok) await load();
    else setError((await res.json()).error);
  };

  const handleUnequip = async (inventoryId: string) => {
    const res = await fetch("/api/inventory/unequip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ characterId, inventoryId }),
    });
    if (res.ok) await load();
    else setError((await res.json()).error);
  };

  if (loading || !characterId) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <p>Загрузка…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Инвентарь</h1>
        <Link
          href={`/hub?characterId=${characterId}`}
          className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
        >
          В хаб
        </Link>
      </header>

      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((inv) => (
          <li
            key={inv.id}
            className={`rounded-lg border p-4 ${inv.isEquipped ? "border-amber-500 bg-amber-50" : "border-slate-200 bg-white"}`}
          >
            <p className={`font-medium ${RARITY_COLOR[inv.item.rarity] ?? ""}`}>
              {inv.item.itemName} {inv.upgradeLevel > 0 ? `+${inv.upgradeLevel}` : ""}
            </p>
            <p className="text-sm text-slate-600">
              {inv.item.rarity} · ур. {inv.item.itemLevel} · {inv.durability}/{inv.maxDurability} прочность
            </p>
            <div className="mt-2 flex gap-2">
              {inv.isEquipped ? (
                <button
                  type="button"
                  onClick={() => handleUnequip(inv.id)}
                  className="rounded bg-slate-200 px-2 py-1 text-sm hover:bg-slate-300"
                >
                  Снять
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleEquip(inv.id, inv.item.itemType)}
                  className="rounded bg-slate-800 px-2 py-1 text-sm text-white hover:bg-slate-700"
                >
                  Надеть
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {items.length === 0 && <p className="text-slate-600">Инвентарь пуст.</p>}
    </main>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center p-8"><p>Загрузка…</p></main>}>
      <InventoryContent />
    </Suspense>
  );
}
