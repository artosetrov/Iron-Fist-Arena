"use client";

import PageHeader from "@/app/components/PageHeader";
import PageContainer from "@/app/components/ui/PageContainer";
import GameSection from "@/app/components/ui/GameSection";
import GameCard from "@/app/components/ui/GameCard";
import WikiEditableText from "@/app/components/wiki/WikiEditableText";
import { getWikiSeasons } from "@/lib/game/wiki";
import { useWikiAdmin } from "@/app/(game)/wiki/wiki-admin-context";

export default function WikiSeasonsPage() {
  const { isAdmin } = useWikiAdmin();
  const seasons = getWikiSeasons();

  return (
    <PageContainer>
      <PageHeader title="Seasons" />
      <GameSection title="Seasonal threats">
        <p className="mb-4 text-slate-400">
          Each season a new threat emerges. The Top 100 fighters form the Fist and face it.
        </p>
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
          {seasons.map((s) => (
            <GameCard key={s.id} className="border-slate-700/80 bg-slate-900/60 p-4">
              <span className="font-semibold text-amber-400">{s.name}</span>
              <WikiEditableText
                textKey={`season/${s.id}/tagline`}
                defaultValue={s.tagline}
                isAdmin={isAdmin}
                as="p"
                className="mt-1 text-sm italic text-slate-500"
              />
              <WikiEditableText
                textKey={`season/${s.id}/description`}
                defaultValue={s.description}
                isAdmin={isAdmin}
                as="p"
                className="mt-2 text-slate-300"
              />
            </GameCard>
          ))}
        </div>
      </GameSection>
    </PageContainer>
  );
}
