"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/app/components/PageHeader";
import PageContainer from "@/app/components/ui/PageContainer";
import GameSection from "@/app/components/ui/GameSection";
import GameCard from "@/app/components/ui/GameCard";
import GameIcon from "@/app/components/ui/GameIcon";
import { getWikiClasses } from "@/lib/game/wiki";
import type { GameIconKey } from "@/app/components/ui/GameIcon";

const CLASS_ICON: Record<string, GameIconKey> = {
  warrior: "warrior",
  rogue: "rogue",
  mage: "mage",
  tank: "tank",
};

export default function WikiClassesPage() {
  const searchParams = useSearchParams();
  const characterId = searchParams.get("characterId");
  const qs = characterId ? `?characterId=${encodeURIComponent(characterId)}` : "";

  const classes = getWikiClasses();

  return (
    <PageContainer>
      <PageHeader title="Classes" />
      <GameSection title="Hero classes">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {classes.map((cls) => (
            <Link key={cls.id} href={`/wiki/classes/${cls.id}${qs}`}>
              <GameCard className="flex flex-col items-center gap-2 border-slate-700/80 bg-slate-900/60 p-4 transition hover:border-amber-500/40">
                <GameIcon name={CLASS_ICON[cls.id] ?? "warrior"} size={48} />
                <span className="font-semibold text-slate-200">{cls.name}</span>
                <span className="text-center text-sm text-slate-500">{cls.tagline}</span>
              </GameCard>
            </Link>
          ))}
        </div>
      </GameSection>
    </PageContainer>
  );
}
