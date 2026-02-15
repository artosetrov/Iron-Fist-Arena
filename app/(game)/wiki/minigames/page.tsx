"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/app/components/PageHeader";
import PageContainer from "@/app/components/ui/PageContainer";
import GameSection from "@/app/components/ui/GameSection";
import GameCard from "@/app/components/ui/GameCard";
import WikiEditableText from "@/app/components/wiki/WikiEditableText";
import { getWikiMinigames } from "@/lib/game/wiki";
import { useWikiAdmin } from "@/app/(game)/wiki/wiki-admin-context";

export default function WikiMinigamesPage() {
  const searchParams = useSearchParams();
  const characterId = searchParams.get("characterId");
  const qs = characterId ? `?characterId=${encodeURIComponent(characterId)}` : "";
  const { isAdmin } = useWikiAdmin();
  const minigames = getWikiMinigames();

  return (
    <PageContainer>
      <PageHeader title="Minigames" />
      <GameSection title="Tavern activities">
        <p className="mb-4 text-slate-400">
          Available at Mama Grog&apos;s Tavern. Play for gold, XP, or idle rewards.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {minigames.map((m) => (
            <GameCard key={m.id} className="border-slate-700/80 bg-slate-900/60 p-4">
              <span className="font-semibold text-slate-200">{m.label}</span>
              {m.tag && (
                <span className="ml-2 rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
                  {m.tag}
                </span>
              )}
              <WikiEditableText
                textKey={`minigame/${m.id}/description`}
                defaultValue={m.description}
                isAdmin={isAdmin}
                as="p"
                className="mt-2 text-sm text-slate-400"
              />
              <Link
                href={`${m.href}${qs}`}
                className="mt-3 inline-block text-sm text-amber-400 hover:underline"
              >
                Play →
              </Link>
            </GameCard>
          ))}
        </div>
      </GameSection>
    </PageContainer>
  );
}
