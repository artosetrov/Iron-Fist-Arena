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
  const armorTypes = ["helmet", "chest", "gloves", "legs", "boots", "accessory"] as const;
  const weaponCategories = [
    { name: "Sword", description: "Sword" },
    { name: "Dagger", description: "Dagger" },
    { name: "Mace", description: "Mace" },
    { name: "Staff", description: "Staff" },
  ] as const;
  const rarities = ["common", "uncommon", "rare", "epic", "legendary"] as const;
  const RARITY_MULT: Record<string, number> = { legendary: 50, epic: 15, rare: 6, uncommon: 2.5, common: 1 };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const batch: any[] = [];
  for (const rarity of rarities) {
    for (let level = 1; level <= 50; level++) {
      const base = level * 4 + 10;
      const buyPrice = Math.floor(100 * Math.pow(1 + level / 10, 1.5) * (RARITY_MULT[rarity] ?? 1));
      // Armor types
      for (const itemType of armorTypes) {
        batch.push({
          itemName: `${rarity} ${itemType} Lv.${level}`,
          itemType,
          rarity,
          itemLevel: level,
          baseStats: { strength: base, armor: Math.floor(base * 0.5) },
          buyPrice,
          sellPrice: Math.floor(buyPrice * 0.5),
        });
      }
      // Weapon types — one per category (Sword, Dagger, Mace, Staff)
      for (const wep of weaponCategories) {
        batch.push({
          itemName: `${rarity} ${wep.name} Lv.${level}`,
          itemType: "weapon",
          rarity,
          itemLevel: level,
          baseStats: { strength: base },
          description: wep.description,
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

/** Buy price multipliers per rarity (GDD formula) */
const BUY_MULT: Record<string, number> = {
  common: 1.0,
  uncommon: 2.5,
  rare: 6.0,
  epic: 15.0,
  legendary: 50.0,
};

/** Catalog items get itemLevel based on rarity tier */
const CATALOG_LEVEL: Record<string, number> = {
  common: 5,
  rare: 15,
  epic: 25,
  legendary: 35,
};

/** GDD formula: Equipment_Price = 100 × (1 + Item_Level/10)^1.5 × Rarity_Mult */
const calcBuyPrice = (rarity: string): number => {
  const level = CATALOG_LEVEL[rarity] ?? 10;
  return Math.floor(100 * Math.pow(1 + level / 10, 1.5) * (BUY_MULT[rarity] ?? 1));
};

/** GDD: Sell price = 50% of buy price */
const calcSellPrice = (rarity: string): number => {
  return Math.floor(calcBuyPrice(rarity) * 0.5);
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
      // Always update itemLevel and prices to match GDD formula
      const targetLevel = CATALOG_LEVEL[item.rarity] ?? 20;
      const buyPrice = calcBuyPrice(item.rarity);
      const sellPrice = calcSellPrice(item.rarity);

      await prisma.item.update({
        where: { catalogId: item.catalogId },
        data: { itemLevel: targetLevel, buyPrice, sellPrice },
      });
      skipped++;
      continue;
    }

    const buyPrice = calcBuyPrice(item.rarity);
    const sellPrice = calcSellPrice(item.rarity);

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
