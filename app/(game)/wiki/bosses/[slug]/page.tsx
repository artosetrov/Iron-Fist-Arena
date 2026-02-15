"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/app/components/PageHeader";
import PageContainer from "@/app/components/ui/PageContainer";
import GameSection from "@/app/components/ui/GameSection";
import WikiAssetCard from "@/app/components/wiki/WikiAssetCard";
import WikiEditableText from "@/app/components/wiki/WikiEditableText";
import { getWikiBossBySlug } from "@/lib/game/wiki";
import { getBossAssetKey } from "@/lib/game/asset-registry";
import { useWikiAdmin } from "@/app/(game)/wiki/wiki-admin-context";

export default function WikiBossDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const boss = getWikiBossBySlug(slug);
  const { isAdmin } = useWikiAdmin();

  if (!boss) {
    return (
      <PageContainer>
        <PageHeader title="Boss" />
        <p className="text-slate-400">Boss not found.</p>
      </PageContainer>
    );
  }

  const assetKey = getBossAssetKey(boss.name);

  return (
    <PageContainer>
      <PageHeader
        title={boss.name}
        leftHref="/wiki/bosses"
        leftLabel="Back to Bosses"
      />
      <div className="space-y-8 pb-8">
        <GameSection title="">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <WikiAssetCard
              assetKey={assetKey}
              defaultPath={boss.imagePath}
              label={boss.name}
              isAdmin={isAdmin}
              size={192}
              objectFit="cover"
            />
            <div>
              <WikiEditableText
                textKey={`boss/${slug}/description`}
                defaultValue={boss.description}
                isAdmin={isAdmin}
                as="p"
                className="text-slate-400"
              />
              <p className="mt-2 text-sm text-slate-500">
                {boss.dungeonName} · Level {boss.level}
              </p>
            </div>
          </div>
        </GameSection>

        <GameSection title="Abilities">
          <ul className="space-y-3">
            {boss.abilities.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-700/80 bg-slate-900/50 px-3 py-2"
              >
                <span className="font-medium text-slate-200">{a.name}</span>
                <span className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-400">
                  {a.type}
                  {a.multiplier > 0 && ` · ${a.multiplier}x`}
                </span>
              </li>
            ))}
          </ul>
        </GameSection>

        <p>
          <Link href="/wiki/bosses" className="text-amber-400 hover:underline">
            ← Back to Bosses
          </Link>
        </p>
      </div>
    </PageContainer>
  );
}
