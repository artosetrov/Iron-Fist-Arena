"use client";

import PageHeader from "@/app/components/PageHeader";
import PageContainer from "@/app/components/ui/PageContainer";
import GameSection from "@/app/components/ui/GameSection";
import GameCard from "@/app/components/ui/GameCard";
import WikiEditableText from "@/app/components/wiki/WikiEditableText";
import WikiAssetCard from "@/app/components/wiki/WikiAssetCard";
import { getWikiNpcs } from "@/lib/game/wiki";
import { useWikiAdmin } from "@/app/(game)/wiki/wiki-admin-context";
import { getNpcAssetKey } from "@/lib/game/asset-registry";

const npcQuoteKey = (name: string) =>
  `npc/${name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}/quote`;

export default function WikiNpcsPage() {
  const { isAdmin } = useWikiAdmin();
  const npcs = getWikiNpcs();

  return (
    <PageContainer>
      <PageHeader title="NPCs" />
      <GameSection title="Notable characters">
        <div className="grid gap-4 sm:grid-cols-2">
          {npcs.map((npc) => (
            <GameCard key={npc.id} className="border-slate-700/80 bg-slate-900/60 p-4">
              <div className="flex gap-4">
                <WikiAssetCard
                  assetKey={getNpcAssetKey(npc.id)}
                  defaultPath={npc.imagePath}
                  label={npc.name}
                  isAdmin={isAdmin}
                  size={128}
                  objectFit="cover"
                />
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-slate-200">{npc.name}</span>
                  <span className="ml-2 text-sm text-slate-500">— {npc.title}</span>
                  <blockquote className="mt-2 border-l-2 border-amber-500/50 pl-3 italic text-slate-400">
                    &ldquo;
                    <WikiEditableText
                      textKey={npcQuoteKey(npc.name)}
                      defaultValue={npc.quote}
                      isAdmin={isAdmin}
                      as="span"
                      className="italic"
                    />
                    &rdquo;
                  </blockquote>
                </div>
              </div>
            </GameCard>
          ))}
        </div>
      </GameSection>
    </PageContainer>
  );
}
