"use client";

import PageHeader from "@/app/components/PageHeader";
import PageContainer from "@/app/components/ui/PageContainer";
import GameSection from "@/app/components/ui/GameSection";
import WikiEditableText from "@/app/components/wiki/WikiEditableText";
import { getWikiWorld } from "@/lib/game/wiki";
import { useWikiAdmin } from "@/app/(game)/wiki/wiki-admin-context";

export default function WikiWorldPage() {
  const { isAdmin } = useWikiAdmin();
  const { world, arena, seasons } = getWikiWorld();

  return (
    <PageContainer>
      <PageHeader title="World" />
      <div className="space-y-8 pb-8">
        <GameSection title={world.name}>
          <WikiEditableText
            textKey="world/city-description"
            defaultValue={world.cityDescription}
            isAdmin={isAdmin}
            as="p"
            className="text-slate-300"
          />
          <WikiEditableText
            textKey="world/legend"
            defaultValue={world.legend}
            isAdmin={isAdmin}
            as="p"
            className="mt-2 text-slate-400"
          />
        </GameSection>

        <GameSection title={arena.name}>
          <WikiEditableText
            textKey="world/arena-purpose"
            defaultValue={arena.purpose}
            isAdmin={isAdmin}
            as="p"
            className="text-slate-300"
          />
          <WikiEditableText
            textKey="world/arena-rule"
            defaultValue={arena.rule}
            isAdmin={isAdmin}
            as="p"
            className="mt-2 text-slate-400"
          />
          <WikiEditableText
            textKey="world/arena-motto"
            defaultValue={arena.motto}
            isAdmin={isAdmin}
            as="p"
            className="mt-1 text-slate-500 italic"
          />
        </GameSection>

        <GameSection title="Seasonal threats">
          <p className="mb-4 text-slate-400">
            Every season a new threat emerges from beyond the Barrier. The Top 100 fighters face it.
          </p>
          <ul className="space-y-4">
            {seasons.map((s) => (
              <li key={s.id} className="rounded-lg border border-slate-700/80 bg-slate-900/50 p-4">
                <h3 className="font-semibold text-amber-400">{s.name}</h3>
                <WikiEditableText
                  textKey={`season/${s.id}/tagline`}
                  defaultValue={s.tagline}
                  isAdmin={isAdmin}
                  as="p"
                  className="text-sm italic text-slate-500"
                />
                <WikiEditableText
                  textKey={`season/${s.id}/description`}
                  defaultValue={s.description}
                  isAdmin={isAdmin}
                  as="p"
                  className="mt-2 text-slate-300"
                />
              </li>
            ))}
          </ul>
        </GameSection>
      </div>
    </PageContainer>
  );
}
