"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/app/components/PageHeader";
import PageContainer from "@/app/components/ui/PageContainer";
import GameSection from "@/app/components/ui/GameSection";
import WikiAssetCard from "@/app/components/wiki/WikiAssetCard";
import WikiEditableText from "@/app/components/wiki/WikiEditableText";
import { getWikiOrigin } from "@/lib/game/wiki";
import { getOriginAvatarAssetKey, getOriginPortraitAssetKey } from "@/lib/game/asset-registry";
import { useWikiAdmin } from "@/app/(game)/wiki/wiki-admin-context";

export default function WikiOriginDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const origin = getWikiOrigin(id);
  const { isAdmin } = useWikiAdmin();

  if (!origin) {
    return (
      <PageContainer>
        <PageHeader title="Origin" />
        <p className="text-slate-400">Origin not found.</p>
      </PageContainer>
    );
  }

  const statMods = origin.statModifiers;
  const statEntries = statMods
    ? Object.entries(statMods).filter(([, v]) => v !== undefined)
    : [];
  const avatarKey = getOriginAvatarAssetKey(origin.id);
  const avatarPath = `/images/origins/Avatar/origin-${origin.id}_avatar_1.png`;
  const portraitKey = getOriginPortraitAssetKey(origin.id);
  const portraitPath = `/images/origins/origin-${origin.id}.png`;

  return (
    <PageContainer>
      <PageHeader title={origin.label} leftHref="/wiki/origins" leftLabel="Back to Origins" />
      <div className="space-y-8 pb-8">
        <GameSection title="">
          <div className="flex flex-wrap items-start gap-4">
            <WikiAssetCard
              assetKey={avatarKey}
              defaultPath={avatarPath}
              label={`${origin.label} avatar`}
              isAdmin={isAdmin}
              size={192}
              objectFit="contain"
            />
            <WikiAssetCard
              assetKey={portraitKey}
              defaultPath={portraitPath}
              label={`${origin.label} portrait`}
              isAdmin={isAdmin}
              size={192}
              objectFit="contain"
            />
            <div className="min-w-0 flex-1">
              <span className="text-4xl">{origin.icon}</span>
              <WikiEditableText
                textKey={`origin/${id}/tagline`}
                defaultValue={origin.tagline}
                isAdmin={isAdmin}
                as="p"
                className="mt-2 text-lg text-amber-400"
              />
              <WikiEditableText
                textKey={`origin/${id}/description`}
                defaultValue={origin.description}
                isAdmin={isAdmin}
                as="p"
                className="mt-2 text-slate-300"
              />
            </div>
          </div>
        </GameSection>

        <GameSection title="Lore">
          <WikiEditableText
            textKey={`origin/${id}/lore`}
            defaultValue={origin.loreDescription}
            isAdmin={isAdmin}
            as="p"
            className="text-slate-300"
          />
          <div className="mt-4 rounded-lg border border-slate-700/80 bg-slate-900/50 p-4">
            <p className="text-sm italic text-slate-400">
              &ldquo;
              <WikiEditableText
                textKey={`origin/${id}/prologue`}
                defaultValue={origin.prologueText}
                isAdmin={isAdmin}
                as="span"
                className="italic"
              />
              &rdquo;
            </p>
          </div>
        </GameSection>

        <GameSection title="Bonuses">
          <WikiEditableText
            textKey={`origin/${id}/bonusDescription`}
            defaultValue={origin.bonusDescription}
            isAdmin={isAdmin}
            as="p"
            className="text-slate-400"
          />
          {statEntries.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-sm text-slate-400">
              {statEntries.map(([stat, value]) => (
                <li key={stat}>
                  {stat}: {value && value > 0 ? "+" : ""}{(value ?? 0) * 100}%
                </li>
              ))}
            </ul>
          )}
          {origin.passive && (
            <div className="mt-3 rounded border border-amber-500/30 bg-amber-500/10 p-3">
              <span className="font-medium text-amber-400">{origin.passive.name}</span>
              <WikiEditableText
                textKey={`origin/${id}/passive`}
                defaultValue={origin.passive.description}
                isAdmin={isAdmin}
                as="p"
                className="text-sm text-slate-300"
              />
            </div>
          )}
        </GameSection>

        <p>
          <Link href="/wiki/origins" className="text-amber-400 hover:underline">
            ← Back to Origins
          </Link>
        </p>
      </div>
    </PageContainer>
  );
}
