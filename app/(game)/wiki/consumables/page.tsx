"use client";

import PageHeader from "@/app/components/PageHeader";
import PageContainer from "@/app/components/ui/PageContainer";
import GameSection from "@/app/components/ui/GameSection";
import GameCard from "@/app/components/ui/GameCard";
import WikiEditableText from "@/app/components/wiki/WikiEditableText";
import { getWikiConsumables } from "@/lib/game/wiki";
import { useWikiAdmin } from "@/app/(game)/wiki/wiki-admin-context";

export default function WikiConsumablesPage() {
  const { isAdmin } = useWikiAdmin();
  const { inventory, shop } = getWikiConsumables();

  return (
    <PageContainer>
      <PageHeader title="Consumables" />
      <div className="space-y-8 pb-8">
        <GameSection title="Stamina potions (inventory)">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {inventory.map((c) => (
              <GameCard key={c.type} className="border-slate-700/80 bg-slate-900/60 p-4">
                <span className="text-2xl">{c.icon}</span>
                <span className="mt-2 block font-semibold text-slate-200">{c.name}</span>
                <WikiEditableText
                  textKey={`consumable/${c.type}/description`}
                  defaultValue={c.description}
                  isAdmin={isAdmin}
                  as="p"
                  className="mt-1 text-sm text-slate-400"
                />
                <p className="mt-2 text-amber-400">
                  +{c.staminaRestore} stamina · {c.cost} {c.currency} · max stack {c.maxStack}
                </p>
              </GameCard>
            ))}
          </div>
        </GameSection>

        <GameSection title="Stamina potions (shop, instant use)">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shop.map((p) => (
              <GameCard key={p.id} className="border-slate-700/80 bg-slate-900/60 p-4">
                <span className="text-2xl">{p.icon}</span>
                <span className="mt-2 block font-semibold text-slate-200">{p.name}</span>
                <WikiEditableText
                  textKey={`consumable/shop/${p.id}/description`}
                  defaultValue={p.description}
                  isAdmin={isAdmin}
                  as="p"
                  className="mt-1 text-sm text-slate-400"
                />
                <p className="mt-2 text-amber-400">
                  +{p.staminaRestore} stamina · {p.goldCost} gold · limit {p.dailyLimit}/day
                </p>
              </GameCard>
            ))}
          </div>
        </GameSection>
      </div>
    </PageContainer>
  );
}
