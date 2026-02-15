"use client";

import { useMemo, useState } from "react";
import PageHeader from "@/app/components/PageHeader";
import PageContainer from "@/app/components/ui/PageContainer";
import GameSection from "@/app/components/ui/GameSection";
import WikiAssetCard from "@/app/components/wiki/WikiAssetCard";
import {
  getCachedAssetRegistry,
  ASSET_CATEGORIES,
  type AssetCategory,
} from "@/lib/game/asset-registry";
import { useWikiAdmin } from "@/app/(game)/wiki/wiki-admin-context";

const CATEGORY_LABELS: Record<AssetCategory, string> = {
  bosses: "Bosses",
  items: "Items",
  consumables: "Consumables",
  classes: "Classes",
  origins: "Origins",
  dungeons: "Dungeons",
  buildings: "Buildings",
  npcs: "NPCs",
  minigames: "Minigames",
  skills: "Skills",
  ui: "UI",
};

export default function WikiAssetsPage() {
  const { isAdmin } = useWikiAdmin();
  const [category, setCategory] = useState<string>("");
  const [search, setSearch] = useState("");

  const registry = useMemo(() => getCachedAssetRegistry(), []);

  const filtered = useMemo(() => {
    let list = registry;
    if (category) {
      list = list.filter((e) => e.category === category);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (e) =>
          e.key.toLowerCase().includes(q) || e.label.toLowerCase().includes(q)
      );
    }
    return list;
  }, [registry, category, search]);

  return (
    <PageContainer>
      <PageHeader title="Asset Manager" />
      <div className="space-y-6 pb-8">
        <GameSection title="Filters">
          <div className="flex flex-wrap items-center gap-4">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200"
              aria-label="Filter by category"
            >
              <option value="">All categories</option>
              {ASSET_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or key…"
              className="min-w-[200px] rounded border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200 placeholder:text-slate-500"
              aria-label="Search assets"
            />
            <span className="text-sm text-slate-500">
              {filtered.length} asset{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        </GameSection>

        <GameSection title="Assets">
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((entry) => (
              <WikiAssetCard
                key={entry.key}
                assetKey={entry.key}
                defaultPath={entry.defaultPath}
                label={entry.label}
                isAdmin={isAdmin}
                size={128}
                objectFit="contain"
              />
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="text-slate-500">No assets match the filters.</p>
          )}
        </GameSection>
      </div>
    </PageContainer>
  );
}
