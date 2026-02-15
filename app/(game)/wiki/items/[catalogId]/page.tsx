"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/app/components/PageHeader";
import PageContainer from "@/app/components/ui/PageContainer";
import GameSection from "@/app/components/ui/GameSection";
import WikiAssetCard from "@/app/components/wiki/WikiAssetCard";
import WikiEditableText from "@/app/components/wiki/WikiEditableText";
import { getWikiItem, getItemImagePath } from "@/lib/game/wiki";
import { getItemAssetKey } from "@/lib/game/asset-registry";
import { useWikiAdmin } from "@/app/(game)/wiki/wiki-admin-context";

export default function WikiItemDetailPage() {
  const params = useParams();
  const catalogId = decodeURIComponent(params.catalogId as string);
  const item = getWikiItem(catalogId);
  const { isAdmin } = useWikiAdmin();

  if (!item) {
    return (
      <PageContainer>
        <PageHeader title="Item" />
        <p className="text-slate-400">Item not found.</p>
      </PageContainer>
    );
  }

  const imagePath = getItemImagePath(item);
  const assetKey = getItemAssetKey(item);

  return (
    <PageContainer>
      <PageHeader
        title={item.name}
        leftHref="/wiki/items"
        leftLabel="Back to Items"
      />
      <div className="space-y-8 pb-8">
        <GameSection title="">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <WikiAssetCard
              assetKey={assetKey}
              defaultPath={imagePath}
              label={item.name}
              isAdmin={isAdmin}
              size={128}
              objectFit="contain"
            />
            <div>
              <p className="capitalize text-slate-400">
                {item.slot} · {item.rarity}
                {item.classRestriction && ` · ${item.classRestriction}`}
              </p>
              {item.setName && (
                <p className="mt-1 text-sm text-amber-400">Set: {item.setName.replace(/_/g, " ")}</p>
              )}
              {(item.description || isAdmin) && (
                <WikiEditableText
                  textKey={`item/${catalogId}/description`}
                  defaultValue={item.description ?? ""}
                  isAdmin={isAdmin}
                  as="p"
                  className="mt-2 text-slate-300"
                />
              )}
            </div>
          </div>
        </GameSection>

        {item.baseStats && Object.keys(item.baseStats).length > 0 && (
          <GameSection title="Base stats">
            <ul className="flex flex-wrap gap-3">
              {Object.entries(item.baseStats).map(([key, value]) => (
                <li key={key} className="rounded bg-slate-800 px-3 py-1 text-sm">
                  <span className="text-slate-400">{key}:</span>{" "}
                  <span className="text-slate-200">{value}</span>
                </li>
              ))}
            </ul>
          </GameSection>
        )}

        {(item.uniquePassive || isAdmin) && (
          <GameSection title="Unique passive">
            <WikiEditableText
              textKey={`item/${catalogId}/uniquePassive`}
              defaultValue={item.uniquePassive ?? ""}
              isAdmin={isAdmin}
              as="p"
              className="text-slate-300"
            />
          </GameSection>
        )}

        <p>
          <Link href="/wiki/items" className="text-amber-400 hover:underline">
            ← Back to Items
          </Link>
        </p>
      </div>
    </PageContainer>
  );
}
