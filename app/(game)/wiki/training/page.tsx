"use client";

import PageHeader from "@/app/components/PageHeader";
import PageContainer from "@/app/components/ui/PageContainer";
import GameSection from "@/app/components/ui/GameSection";
import GameCard from "@/app/components/ui/GameCard";
import GameIcon from "@/app/components/ui/GameIcon";
import WikiEditableText from "@/app/components/wiki/WikiEditableText";
import { getWikiTraining } from "@/lib/game/wiki";
import { useWikiAdmin } from "@/app/(game)/wiki/wiki-admin-context";
import type { GameIconKey } from "@/app/components/ui/GameIcon";

const CLASS_ICON: Record<string, GameIconKey> = {
  warrior: "warrior",
  rogue: "rogue",
  mage: "mage",
  tank: "tank",
};

export default function WikiTrainingPage() {
  const { isAdmin } = useWikiAdmin();
  const dummies = getWikiTraining();

  return (
    <PageContainer>
      <PageHeader title="Training" />
      <GameSection title="Training dummies">
        <p className="mb-4 text-slate-400">
          At the Training Grounds you fight class-flavored dummies. No stamina cost, no rating, no loot — just XP on win.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {dummies.map((d) => (
            <GameCard key={d.class} className="flex flex-col items-center gap-2 border-slate-700/80 bg-slate-900/60 p-4">
              <GameIcon name={CLASS_ICON[d.class] ?? "warrior"} size={48} />
              <span className="font-semibold capitalize text-slate-200">{d.name}</span>
              <WikiEditableText
                textKey={`training/${d.class}/description`}
                defaultValue={d.description}
                isAdmin={isAdmin}
                as="p"
                className="text-center text-sm text-slate-500"
              />
            </GameCard>
          ))}
        </div>
      </GameSection>
    </PageContainer>
  );
}
