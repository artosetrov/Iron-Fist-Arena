"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/app/components/PageHeader";
import PageContainer from "@/app/components/ui/PageContainer";
import GameSection from "@/app/components/ui/GameSection";
import GameCard from "@/app/components/ui/GameCard";
import { getWikiDungeons } from "@/lib/game/wiki";

export default function WikiDungeonsPage() {
  const searchParams = useSearchParams();
  const characterId = searchParams.get("characterId");
  const qs = characterId ? `?characterId=${encodeURIComponent(characterId)}` : "";

  const dungeons = getWikiDungeons();

  return (
    <PageContainer>
      <PageHeader title="Dungeons" />
      <GameSection title="PvE dungeons">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dungeons.map((d) => (
            <Link key={d.id} href={`/wiki/dungeons/${d.id}${qs}`}>
              <GameCard className="flex flex-col gap-2 border-slate-700/80 bg-slate-900/60 p-4 transition hover:border-amber-500/40">
                <span className="text-2xl">{d.theme.icon}</span>
                <span className="font-semibold text-slate-200">{d.name}</span>
                <span className="text-sm text-slate-500">{d.subtitle}</span>
                <span className="text-xs text-slate-600">
                  Lv{d.minLevel}+ · {d.staminaCost} stamina · 10 bosses
                </span>
              </GameCard>
            </Link>
          ))}
        </div>
      </GameSection>
    </PageContainer>
  );
}
