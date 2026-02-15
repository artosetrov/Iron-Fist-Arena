"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/app/components/PageHeader";
import PageContainer from "@/app/components/ui/PageContainer";
import GameSection from "@/app/components/ui/GameSection";
import GameIcon from "@/app/components/ui/GameIcon";
import WikiAssetCard from "@/app/components/wiki/WikiAssetCard";
import WikiEditableText from "@/app/components/wiki/WikiEditableText";
import { getWikiClass } from "@/lib/game/wiki";
import {
  getClassPortraitAssetKey,
  getClassBgAssetKey,
} from "@/lib/game/asset-registry";
import { useWikiAdmin } from "@/app/(game)/wiki/wiki-admin-context";
import type { GameIconKey } from "@/app/components/ui/GameIcon";
import type { CharacterClass } from "@/lib/game/types";

const CLASS_ICON: Record<string, GameIconKey> = {
  warrior: "warrior",
  rogue: "rogue",
  mage: "mage",
  tank: "tank",
};

const formatAbilityEffect = (a: { type: string; multiplier?: number; status?: { type: string }; selfBuff?: Record<string, number>; critBonus?: number; dodgeBonus?: number; armorBreak?: number; executeThreshold?: number }) => {
  const parts: string[] = [];
  if (a.type === "physical" && a.multiplier) parts.push(`${a.multiplier}x STR damage`);
  if (a.type === "magic" && a.multiplier) parts.push(`${a.multiplier}x INT damage`);
  if (a.status) parts.push(`Chance: ${a.status.type}`);
  if (a.selfBuff?.str) parts.push(`+${a.selfBuff.str * 100}% STR`);
  if (a.selfBuff?.armor) parts.push(`+${a.selfBuff.armor * 100}% armor`);
  if (a.selfBuff?.resist) parts.push(`+${a.selfBuff.resist * 100}% resist`);
  if (a.critBonus) parts.push(`+${a.critBonus}% crit`);
  if (a.dodgeBonus) parts.push(`+${a.dodgeBonus}% dodge`);
  if (a.armorBreak) parts.push(`${a.armorBreak * 100}% armor break`);
  if (a.executeThreshold) parts.push(`Auto-crit below ${a.executeThreshold * 100}% HP`);
  return parts.length ? parts.join(" · ") : a.type;
};

export default function WikiClassDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const cls = getWikiClass(id);
  const { isAdmin } = useWikiAdmin();

  if (!cls) {
    return (
      <PageContainer>
        <PageHeader title="Class" />
        <p className="text-slate-400">Class not found.</p>
      </PageContainer>
    );
  }

  const classId = cls.id as CharacterClass;
  const portraitKey = getClassPortraitAssetKey(classId);
  const bgKey = getClassBgAssetKey(classId);

  return (
    <PageContainer>
      <PageHeader title={cls.name} leftHref="/wiki/classes" leftLabel="Back to Classes" />
      <div className="space-y-8 pb-8">
        <GameSection title="">
          <div className="flex flex-wrap items-start gap-6">
            <WikiAssetCard
              assetKey={portraitKey}
              defaultPath={`/images/classes/class-${cls.id}.png`}
              label={`${cls.name} portrait`}
              isAdmin={isAdmin}
              size={192}
              objectFit="contain"
            />
            <WikiAssetCard
              assetKey={bgKey}
              defaultPath={`/images/classes/class-${cls.id}-bg.png`}
              label={`${cls.name} background`}
              isAdmin={isAdmin}
              size={192}
              objectFit="cover"
            />
            <div className="min-w-0 flex-1">
              <WikiEditableText
                textKey={`class/${id}/tagline`}
                defaultValue={cls.tagline}
                isAdmin={isAdmin}
                as="p"
                className="text-lg text-amber-400"
              />
            </div>
          </div>
        </GameSection>

        <GameSection title="Abilities">
          <ul className="space-y-4">
            {cls.abilities.map((a) => (
              <li key={a.id} className="rounded-lg border border-slate-700/80 bg-slate-900/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-slate-200">{a.name}</span>
                  <span className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-400">
                    Lv{a.unlockLevel} · {a.type}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-400">{formatAbilityEffect(a)}</p>
                {a.cooldown > 0 && (
                  <p className="mt-1 text-xs text-slate-500">Cooldown: {a.cooldown} turns</p>
                )}
              </li>
            ))}
          </ul>
        </GameSection>

        <p>
          <Link href="/wiki/classes" className="text-amber-400 hover:underline">
            ← Back to Classes
          </Link>
        </p>
      </div>
    </PageContainer>
  );
}
