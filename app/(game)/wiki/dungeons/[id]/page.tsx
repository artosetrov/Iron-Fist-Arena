"use client";

import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/app/components/PageHeader";
import PageContainer from "@/app/components/ui/PageContainer";
import GameSection from "@/app/components/ui/GameSection";
import GameCard from "@/app/components/ui/GameCard";
import WikiAssetCard from "@/app/components/wiki/WikiAssetCard";
import WikiEditableText from "@/app/components/wiki/WikiEditableText";
import { getWikiDungeon, getBossSlug } from "@/lib/game/wiki";
import { getDungeonAssetKey } from "@/lib/game/asset-registry";
import { useWikiAdmin } from "@/app/(game)/wiki/wiki-admin-context";

export default function WikiDungeonDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const characterId = searchParams.get("characterId");
  const qs = characterId ? `?characterId=${encodeURIComponent(characterId)}` : "";
  const { isAdmin } = useWikiAdmin();

  const dungeon = getWikiDungeon(id);

  if (!dungeon) {
    return (
      <PageContainer>
        <PageHeader title="Dungeon" />
        <p className="text-slate-400">Dungeon not found.</p>
      </PageContainer>
    );
  }

  const slug = dungeon.id.replace(/_/g, "-");
  const assetKey = getDungeonAssetKey(dungeon.id);
  const defaultPath = `/images/dungeons/dungeon-${slug}.png`;

  return (
    <PageContainer>
      <PageHeader
        title={`${dungeon.theme.icon} ${dungeon.name}`}
        leftHref="/wiki/dungeons"
        leftLabel="Back to Dungeons"
      />
      <div className="space-y-8 pb-8">
        <GameSection title="">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <WikiAssetCard
              assetKey={assetKey}
              defaultPath={defaultPath}
              label={`${dungeon.name} background`}
              isAdmin={isAdmin}
              size={192}
              objectFit="cover"
            />
            <div>
              <WikiEditableText
                textKey={`dungeon/${id}/subtitle`}
                defaultValue={dungeon.subtitle}
                isAdmin={isAdmin}
                as="p"
                className="text-lg text-amber-400"
              />
              <p className="mt-2 text-slate-400">
                Min level {dungeon.minLevel} · {dungeon.staminaCost} stamina per run · 10 bosses
              </p>
            </div>
          </div>
        </GameSection>

        <GameSection title="Bosses">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {dungeon.bosses.map((boss) => (
              <Link key={boss.index} href={`/wiki/bosses/${getBossSlug(dungeon.id, boss.index)}${qs}`}>
                <GameCard className="border-slate-700/80 bg-slate-900/60 p-3 transition hover:border-amber-500/40">
                  <span className="font-medium text-slate-200">{boss.name}</span>
                  <span className="block text-xs text-slate-500">Lv{boss.level}</span>
                </GameCard>
              </Link>
            ))}
          </div>
        </GameSection>

        <p>
          <Link href="/wiki/dungeons" className="text-amber-400 hover:underline">
            ← Back to Dungeons
          </Link>
        </p>
      </div>
    </PageContainer>
  );
}
