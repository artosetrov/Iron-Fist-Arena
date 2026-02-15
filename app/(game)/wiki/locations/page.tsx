"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/app/components/PageHeader";
import PageContainer from "@/app/components/ui/PageContainer";
import GameSection from "@/app/components/ui/GameSection";
import GameCard from "@/app/components/ui/GameCard";
import WikiEditableText from "@/app/components/wiki/WikiEditableText";
import { getWikiLocations } from "@/lib/game/wiki";
import { useWikiAdmin } from "@/app/(game)/wiki/wiki-admin-context";
import { getLocationAssetKey } from "@/lib/game/asset-registry";
import { useAssetUrl } from "@/lib/hooks/useAssetOverrides";

const LocationImage = ({ buildingId, imagePath, name }: { buildingId: string; imagePath: string; name: string }) => {
  const assetKey = getLocationAssetKey(buildingId);
  const src = useAssetUrl(assetKey, imagePath);

  return (
    <div className="relative h-36 w-full overflow-hidden">
      <Image
        src={src}
        alt={name}
        fill
        className="object-cover"
        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
        unoptimized={src.startsWith("http")}
      />
      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
      {/* Name overlay at bottom */}
      <div className="absolute inset-x-0 bottom-0 p-3">
        <span className="font-display text-base font-bold capitalize text-slate-100 drop-shadow-lg">
          {name}
        </span>
      </div>
    </div>
  );
};

export default function WikiLocationsPage() {
  const searchParams = useSearchParams();
  const characterId = searchParams.get("characterId");
  const qs = characterId ? `?characterId=${encodeURIComponent(characterId)}` : "";
  const { isAdmin } = useWikiAdmin();
  const locations = getWikiLocations();

  return (
    <PageContainer>
      <PageHeader title="Locations" />
      <GameSection title="Hub buildings">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {locations.map((loc) => (
            <GameCard
              key={loc.id}
              className="flex flex-col overflow-hidden border-slate-700/80 bg-slate-900/60"
            >
              <LocationImage
                buildingId={loc.id}
                imagePath={loc.imagePath}
                name={loc.name}
              />
              <div className="flex flex-1 flex-col gap-2 p-4">
                <WikiEditableText
                  textKey={`building/${loc.id}/description`}
                  defaultValue={loc.description}
                  isAdmin={isAdmin}
                  as="p"
                  className="text-sm text-slate-400"
                />
                <Link
                  href={`${loc.href}${qs}`}
                  className="mt-auto pt-2 text-sm font-medium text-amber-400 transition-colors hover:text-amber-300 hover:underline"
                  tabIndex={0}
                  aria-label={`Go to ${loc.name}`}
                >
                  Go &rarr;
                </Link>
              </div>
            </GameCard>
          ))}
        </div>
      </GameSection>
    </PageContainer>
  );
}
