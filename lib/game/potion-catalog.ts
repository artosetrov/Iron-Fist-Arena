/** Stamina potions sold for gold in the shop (instant use on purchase). */

export type StaminaPotion = {
  id: string;
  name: string;
  description: string;
  icon: string;
  staminaRestore: number;
  goldCost: number;
  dailyLimit: number;
};

export const STAMINA_POTIONS: StaminaPotion[] = [
  {
    id: "minor_stamina_potion",
    name: "Minor Stamina Potion",
    description: "A small flask of invigorating brew. Restores a bit of energy.",
    icon: "🧪",
    staminaRestore: 15,
    goldCost: 200,
    dailyLimit: 10,
  },
  {
    id: "stamina_potion",
    name: "Stamina Potion",
    description: "A hearty elixir that replenishes your energy reserves.",
    icon: "⚗️",
    staminaRestore: 30,
    goldCost: 350,
    dailyLimit: 5,
  },
  {
    id: "greater_stamina_potion",
    name: "Greater Stamina Potion",
    description: "A potent concoction that surges through your body with raw vitality.",
    icon: "🍶",
    staminaRestore: 60,
    goldCost: 600,
    dailyLimit: 3,
  },
];

export const getPotionById = (id: string): StaminaPotion | undefined =>
  STAMINA_POTIONS.find((p) => p.id === id);
