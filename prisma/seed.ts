import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/* ------------------------------------------------------------------ */
/*  Original generic items seed                                        */
/* ------------------------------------------------------------------ */

async function seedGenericItems() {
  const count = await prisma.item.count({ where: { catalogId: null } });
  if (count > 0) {
    console.log("Generic items already seeded, skip.");
    return;
  }
  const types = ["weapon", "helmet", "chest", "gloves", "legs", "boots", "accessory"] as const;
  const rarities = ["common", "uncommon", "rare", "epic", "legendary"] as const;
  for (const rarity of rarities) {
    for (let level = 1; level <= 25; level += 2) {
      const base = level * 4 + 10;
      const buyPrice = Math.floor(100 * Math.pow(1 + level / 10, 1.5) * (rarity === "legendary" ? 50 : rarity === "epic" ? 15 : rarity === "rare" ? 6 : rarity === "uncommon" ? 2.5 : 1));
      for (const itemType of types) {
        await prisma.item.create({
          data: {
            itemName: `${rarity} ${itemType} Lv.${level}`,
            itemType,
            rarity,
            itemLevel: level,
            baseStats: { strength: base, armor: itemType !== "weapon" ? Math.floor(base * 0.5) : 0 },
            buyPrice,
            sellPrice: Math.floor(buyPrice * 0.5),
          },
        });
      }
    }
  }
  console.log("Generic items seed done.");
}

/* ------------------------------------------------------------------ */
/*  Catalog items seed (116 fixed items from Item System v1.0)         */
/* ------------------------------------------------------------------ */

type CatalogEntry = {
  catalogId: string;
  name: string;
  slot: "helmet" | "gloves" | "chest" | "boots" | "weapon";
  rarity: "common" | "rare" | "epic" | "legendary";
  baseStats: Record<string, number>;
  classRestriction?: "warrior" | "rogue" | "mage" | "tank";
  setName?: string;
  description?: string;
};

/** Sell price multipliers per rarity */
const SELL_MULT: Record<string, number> = {
  common: 1.0,
  rare: 1.2,
  epic: 1.5,
  legendary: 2.2,
};

/** Buy price multipliers per rarity */
const BUY_MULT: Record<string, number> = {
  common: 1.0,
  rare: 4.0,
  epic: 10.0,
  legendary: 25.0,
};

const calcBuyPrice = (rarity: string): number => {
  const basePrice = 200;
  return Math.floor(basePrice * (BUY_MULT[rarity] ?? 1));
};

const calcSellPrice = (rarity: string, stats: Record<string, number>): number => {
  const statSum = Object.values(stats).reduce((s, v) => s + v, 0);
  const rarityMult = SELL_MULT[rarity] ?? 1;
  return Math.floor((30 * rarityMult * 10 + statSum * 5) * rarityMult);
};

async function seedCatalogItems() {
  // Dynamic import to work with ts-node CommonJS
  const { ITEM_CATALOG } = await import("../lib/game/item-catalog");

  const catalog: CatalogEntry[] = ITEM_CATALOG as CatalogEntry[];

  let created = 0;
  let skipped = 0;

  for (const item of catalog) {
    const existing = await prisma.item.findUnique({
      where: { catalogId: item.catalogId },
    });

    if (existing) {
      skipped++;
      continue;
    }

    const buyPrice = calcBuyPrice(item.rarity);
    const sellPrice = calcSellPrice(item.rarity, item.baseStats);

    await prisma.item.create({
      data: {
        catalogId: item.catalogId,
        itemName: item.name,
        itemType: item.slot,
        rarity: item.rarity,
        itemLevel: 30,
        baseStats: item.baseStats,
        classRestriction: item.classRestriction ?? null,
        setName: item.setName ?? null,
        description: item.description ?? null,
        buyPrice,
        sellPrice,
      },
    });
    created++;
  }

  console.log(`Catalog items seed done: ${created} created, ${skipped} skipped (already exist).`);
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

async function main() {
  await seedGenericItems();
  await seedCatalogItems();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
