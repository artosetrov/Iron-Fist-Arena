import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/* ------------------------------------------------------------------ */
/*  Original generic items seed                                        */
/* ------------------------------------------------------------------ */

async function seedGenericItems() {
  // Delete old generic items that are NOT referenced in any inventory
  const oldCount = await prisma.item.count({ where: { catalogId: null } });
  if (oldCount > 0) {
    const deleted = await prisma.item.deleteMany({
      where: {
        catalogId: null,
        equipmentInventory: { none: {} },
      },
    });
    console.log(`Cleaned up ${deleted.count} old generic items (${oldCount - deleted.count} kept — owned by players).`);
  }
  const types = ["weapon", "helmet", "chest", "gloves", "legs", "boots", "accessory"] as const;
  const rarities = ["common", "uncommon", "rare", "epic", "legendary"] as const;
  const RARITY_MULT: Record<string, number> = { legendary: 50, epic: 15, rare: 6, uncommon: 2.5, common: 1 };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const batch: any[] = [];
  for (const rarity of rarities) {
    for (let level = 1; level <= 50; level++) {
      const base = level * 4 + 10;
      const buyPrice = Math.floor(100 * Math.pow(1 + level / 10, 1.5) * (RARITY_MULT[rarity] ?? 1));
      for (const itemType of types) {
        batch.push({
          itemName: `${rarity} ${itemType} Lv.${level}`,
          itemType,
          rarity,
          itemLevel: level,
          baseStats: { strength: base, armor: itemType !== "weapon" ? Math.floor(base * 0.5) : 0 },
          buyPrice,
          sellPrice: Math.floor(buyPrice * 0.5),
        });
      }
    }
  }
  // Batch insert in chunks of 500 for performance
  for (let i = 0; i < batch.length; i += 500) {
    await prisma.item.createMany({ data: batch.slice(i, i + 500) });
  }
  console.log(`Generic items seed done: ${batch.length} items created.`);
}

/* ------------------------------------------------------------------ */
/*  Catalog items seed (116 fixed items from Item System v1.0)         */
/* ------------------------------------------------------------------ */

type CatalogEntry = {
  catalogId: string;
  name: string;
  slot: "helmet" | "gloves" | "chest" | "boots" | "weapon" | "amulet" | "belt" | "relic" | "legs" | "necklace" | "ring";
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

/** Catalog items get itemLevel based on rarity tier */
const CATALOG_LEVEL: Record<string, number> = {
  common: 5,
  rare: 15,
  epic: 25,
  legendary: 35,
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
      // Update itemLevel for existing catalog items (migration from flat 30 → rarity-based)
      const targetLevel = CATALOG_LEVEL[item.rarity] ?? 20;
      if (existing.itemLevel !== targetLevel) {
        await prisma.item.update({
          where: { catalogId: item.catalogId },
          data: { itemLevel: targetLevel },
        });
      }
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
        itemLevel: CATALOG_LEVEL[item.rarity] ?? 20,
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
