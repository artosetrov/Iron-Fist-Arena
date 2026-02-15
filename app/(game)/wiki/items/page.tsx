"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/app/components/PageHeader";
import PageContainer from "@/app/components/ui/PageContainer";
import GameSection from "@/app/components/ui/GameSection";
import GameCard from "@/app/components/ui/GameCard";
import { getWikiItems } from "@/lib/game/wiki";
import type { CatalogItem, ItemSlot } from "@/lib/game/item-catalog";

const SLOTS: { value: string; label: string }[] = [
  { value: "", label: "All slots" },
  { value: "helmet", label: "Helmet" },
  { value: "gloves", label: "Gloves" },
  { value: "chest", label: "Chest" },
  { value: "boots", label: "Boots" },
  { value: "weapon", label: "Weapon" },
  { value: "amulet", label: "Amulet" },
  { value: "belt", label: "Belt" },
  { value: "relic", label: "Relic" },
  { value: "legs", label: "Legs" },
  { value: "necklace", label: "Necklace" },
  { value: "ring", label: "Ring" },
];

const RARITIES: { value: string; label: string }[] = [
  { value: "", label: "All rarities" },
  { value: "common", label: "Common" },
  { value: "rare", label: "Rare" },
  { value: "epic", label: "Epic" },
  { value: "legendary", label: "Legendary" },
];

const CLASSES: { value: string; label: string }[] = [
  { value: "", label: "Any class" },
  { value: "warrior", label: "Warrior" },
  { value: "rogue", label: "Rogue" },
  { value: "mage", label: "Mage" },
  { value: "tank", label: "Tank" },
];

export default function WikiItemsPage() {
  const searchParams = useSearchParams();
  const characterId = searchParams.get("characterId");
  const qs = characterId ? `?characterId=${encodeURIComponent(characterId)}` : "";

  const [slot, setSlot] = useState("");
  const [rarity, setRarity] = useState("");
  const [classRestriction, setClassRestriction] = useState("");

  const items = useMemo(
    () =>
      getWikiItems({
        slot: (slot || undefined) as ItemSlot | undefined,
        rarity: (rarity || undefined) as CatalogItem["rarity"] | undefined,
        classRestriction: (classRestriction || undefined) as "warrior" | "rogue" | "mage" | "tank" | undefined,
      }),
    [slot, rarity, classRestriction]
  );

  return (
    <PageContainer>
      <PageHeader title="Items" />
      <GameSection title="Filters">
        <div className="flex flex-wrap gap-4">
          <select
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
            className="rounded border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200"
            aria-label="Filter by slot"
          >
            {SLOTS.map((o) => (
              <option key={o.value || "all"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={rarity}
            onChange={(e) => setRarity(e.target.value)}
            className="rounded border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200"
            aria-label="Filter by rarity"
          >
            {RARITIES.map((o) => (
              <option key={o.value || "all"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={classRestriction}
            onChange={(e) => setClassRestriction(e.target.value)}
            className="rounded border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200"
            aria-label="Filter by class"
          >
            {CLASSES.map((o) => (
              <option key={o.value || "all"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-2 text-sm text-slate-500">{items.length} items</p>
      </GameSection>

      <GameSection title="Catalog">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <Link
              key={item.catalogId}
              href={`/wiki/items/${encodeURIComponent(item.catalogId)}${qs}`}
            >
              <GameCard className="flex flex-col gap-1 border-slate-700/80 bg-slate-900/60 p-3 transition hover:border-amber-500/40">
                <span className="font-medium capitalize text-slate-200">{item.name}</span>
                <span className="text-xs capitalize text-slate-500">
                  {item.slot} · {item.rarity}
                </span>
              </GameCard>
            </Link>
          ))}
        </div>
      </GameSection>
    </PageContainer>
  );
}
