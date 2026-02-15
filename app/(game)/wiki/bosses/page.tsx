"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/app/components/PageHeader";
import PageContainer from "@/app/components/ui/PageContainer";
import GameSection from "@/app/components/ui/GameSection";
import { getWikiBosses, getBossSlug } from "@/lib/game/wiki";
import { getDungeonById } from "@/lib/game/dungeon-data";

const DUNGEON_ORDER = [
    "training_camp",
    "desecrated_catacombs",
    "fungal_grotto",
    "scorched_mines",
    "frozen_abyss",
    "realm_of_light",
    "shadow_realm",
    "clockwork_citadel",
    "abyssal_depths",
    "infernal_throne",
];

export default function WikiBossesPage() {
  const searchParams = useSearchParams();
  const characterId = searchParams.get("characterId");
  const qs = characterId ? `?characterId=${encodeURIComponent(characterId)}` : "";

  const bosses = getWikiBosses();
  const byDungeon = bosses.reduce<Record<string, typeof bosses>>((acc, b) => {
    if (!acc[b.dungeonId]) acc[b.dungeonId] = [];
    acc[b.dungeonId].push(b);
    return acc;
  }, {});

  const dungeonOrder = Array.from(
    new Set(bosses.map((b) => b.dungeonId))
  ).sort((a, b) => {
    const ia = DUNGEON_ORDER.indexOf(a);
    const ib = DUNGEON_ORDER.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    const da = getDungeonById(a);
    const db = getDungeonById(b);
    return (da?.minLevel ?? 0) - (db?.minLevel ?? 0);
  });

  return (
    <PageContainer>
      <PageHeader title="Bosses" />
      <GameSection title="All bosses by dungeon">
        <div className="space-y-8">
          {dungeonOrder.map((dungeonId) => {
            const list = byDungeon[dungeonId] ?? [];
            const dungeon = getDungeonById(dungeonId);
            if (list.length === 0) return null;
            return (
              <div key={dungeonId}>
                <h3 className="mb-3 text-lg font-semibold text-slate-200">
                  {dungeon?.theme.icon} {dungeon?.name ?? dungeonId}
                </h3>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                  {list.map((b) => (
                    <Link
                      key={`${b.dungeonId}-${b.bossIndex}`}
                      href={`/wiki/bosses/${getBossSlug(b.dungeonId, b.bossIndex)}${qs}`}
                    >
                      <div className="rounded-lg border border-slate-700/80 bg-slate-900/60 px-3 py-2 transition hover:border-amber-500/40">
                        <span className="font-medium text-slate-200">{b.name}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </GameSection>
    </PageContainer>
  );
}
