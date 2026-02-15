"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/app/components/PageHeader";
import PageContainer from "@/app/components/ui/PageContainer";
import GameCard from "@/app/components/ui/GameCard";
import GameSection from "@/app/components/ui/GameSection";
import { getWikiWorld } from "@/lib/game/wiki";

const SECTION_LINKS: { href: string; label: string }[] = [
  { href: "/wiki/world", label: "World & Lore" },
  { href: "/wiki/onboarding", label: "Onboarding" },
  { href: "/wiki/classes", label: "Classes" },
  { href: "/wiki/origins", label: "Origins" },
  { href: "/wiki/locations", label: "Locations" },
  { href: "/wiki/dungeons", label: "Dungeons" },
  { href: "/wiki/bosses", label: "Bosses" },
  { href: "/wiki/items", label: "Items" },
  { href: "/wiki/consumables", label: "Consumables" },
  { href: "/wiki/minigames", label: "Minigames" },
  { href: "/wiki/training", label: "Training" },
  { href: "/wiki/npcs", label: "NPCs" },
  { href: "/wiki/seasons", label: "Seasons" },
];

export default function WikiPage() {
  const searchParams = useSearchParams();
  const characterId = searchParams.get("characterId");
  const qs = characterId ? `?characterId=${encodeURIComponent(characterId)}` : "";

  const { world, arena } = getWikiWorld();

  return (
    <PageContainer>
      <PageHeader title="Wiki" />
      <div className="space-y-8 pb-8">
        <GameSection title="Welcome to the Codex">
          <p className="text-slate-300">
            This is the knowledge base of <strong className="text-amber-400">{world.name}</strong> and{" "}
            <strong className="text-amber-400">{world.cityName}</strong>. {world.cityDescription}
          </p>
          <p className="mt-2 text-slate-400">{world.legend}</p>
          <p className="mt-4 text-slate-300">
            <strong className="text-amber-400">{arena.name}</strong>: {arena.purpose} {arena.rule}
          </p>
          <p className="mt-1 text-slate-500 italic">{arena.motto}</p>
        </GameSection>

        <GameSection title="Sections">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SECTION_LINKS.map(({ href, label }) => (
              <Link key={href} href={`${href}${qs}`}>
                <GameCard className="h-full border-slate-700/80 bg-slate-900/60 transition hover:border-amber-500/40 hover:bg-slate-800/60">
                  <span className="font-medium text-slate-200">{label}</span>
                </GameCard>
              </Link>
            ))}
          </div>
        </GameSection>
      </div>
    </PageContainer>
  );
}
