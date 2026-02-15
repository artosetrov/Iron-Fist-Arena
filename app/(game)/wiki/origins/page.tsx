"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/app/components/PageHeader";
import PageContainer from "@/app/components/ui/PageContainer";
import GameSection from "@/app/components/ui/GameSection";
import GameCard from "@/app/components/ui/GameCard";
import { getWikiOrigins } from "@/lib/game/wiki";

export default function WikiOriginsPage() {
  const searchParams = useSearchParams();
  const characterId = searchParams.get("characterId");
  const qs = characterId ? `?characterId=${encodeURIComponent(characterId)}` : "";

  const origins = getWikiOrigins();

  return (
    <PageContainer>
      <PageHeader title="Origins" />
      <GameSection title="Character races">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {origins.map((o) => (
            <Link key={o.id} href={`/wiki/origins/${o.id}${qs}`}>
              <GameCard className="flex flex-col gap-2 border-slate-700/80 bg-slate-900/60 p-4 transition hover:border-amber-500/40">
                <span className="text-2xl">{o.icon}</span>
                <span className="font-semibold text-slate-200">{o.label}</span>
                <span className="text-sm text-slate-500">{o.tagline}</span>
              </GameCard>
            </Link>
          ))}
        </div>
      </GameSection>
    </PageContainer>
  );
}
