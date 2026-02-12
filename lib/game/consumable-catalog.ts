/**
 * Consumable Catalog — stamina potions that go into inventory.
 *
 * Plan specs:
 *  - Small:  +15 stamina, 200 Gold
 *  - Medium: +40 stamina, 500 Gold
 *  - Large:  +100 stamina, 150 Gems
 *
 * Stack limit: 10 per type.
 * Stamina overflow cap: 200 (from stamina.ts OVERFLOW_CAP).
 */

export type ConsumableType =
  | "stamina_potion_small"
  | "stamina_potion_medium"
  | "stamina_potion_large";

export type CurrencyType = "gold" | "gems";

export type ConsumableDef = {
  type: ConsumableType;
  name: string;
  description: string;
  icon: string;
  staminaRestore: number;
  cost: number;
  currency: CurrencyType;
  maxStack: number;
};

export const CONSUMABLE_CATALOG: ConsumableDef[] = [
  {
    type: "stamina_potion_small",
    name: "Small Energy Potion",
    description: "A modest sip of liquid vigor. Restores a small amount of stamina.",
    icon: "🧪",
    staminaRestore: 15,
    cost: 200,
    currency: "gold",
    maxStack: 10,
  },
  {
    type: "stamina_potion_medium",
    name: "Medium Energy Potion",
    description: "A hearty dose of concentrated energy. Restores a moderate amount of stamina.",
    icon: "⚗️",
    staminaRestore: 40,
    cost: 500,
    currency: "gold",
    maxStack: 10,
  },
  {
    type: "stamina_potion_large",
    name: "Large Energy Potion",
    description: "A legendary brew of pure vitality. Fully restores your stamina reserves.",
    icon: "🍶",
    staminaRestore: 100,
    cost: 150,
    currency: "gems",
    maxStack: 10,
  },
];

export const getConsumableDef = (type: ConsumableType): ConsumableDef | undefined =>
  CONSUMABLE_CATALOG.find((c) => c.type === type);

export const CONSUMABLE_TYPES = CONSUMABLE_CATALOG.map((c) => c.type);
