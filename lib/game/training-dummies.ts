/**
 * Training dummy presets — class-flavored stat weights for practice opponents.
 * Used by combat/simulate API and by wiki/training page.
 */

export type CharacterClass = "warrior" | "rogue" | "mage" | "tank";

export type DummyClassWeights = {
  class: CharacterClass;
  name: string;
  description: string;
  strW: number;
  agiW: number;
  vitW: number;
  endW: number;
  intW: number;
  wisW: number;
  lckW: number;
  chaW: number;
};

/** Class-flavored base stats for training dummies — later scaled by player stats in API. */
export const DUMMY_CLASS_WEIGHTS: Record<string, DummyClassWeights> = {
  warrior: {
    class: "warrior",
    name: "Training Dummy — Warrior",
    description: "High STR, moderate VIT. Hits hard but predictable.",
    strW: 1.4,
    agiW: 0.6,
    vitW: 1.0,
    endW: 0.8,
    intW: 0.3,
    wisW: 0.3,
    lckW: 0.5,
    chaW: 0.3,
  },
  rogue: {
    class: "rogue",
    name: "Training Dummy — Rogue",
    description: "High AGI & LCK. Fast and evasive, but fragile.",
    strW: 0.8,
    agiW: 1.4,
    vitW: 0.6,
    endW: 0.5,
    intW: 0.3,
    wisW: 0.3,
    lckW: 1.2,
    chaW: 0.3,
  },
  mage: {
    class: "mage",
    name: "Training Dummy — Mage",
    description: "High INT & WIS. Devastating spells, low HP.",
    strW: 0.3,
    agiW: 0.6,
    vitW: 0.7,
    endW: 0.3,
    intW: 1.5,
    wisW: 1.0,
    lckW: 0.5,
    chaW: 0.3,
  },
  tank: {
    class: "tank",
    name: "Training Dummy — Tank",
    description: "High VIT & END. Extremely tanky but slow.",
    strW: 0.7,
    agiW: 0.4,
    vitW: 1.3,
    endW: 1.2,
    intW: 0.3,
    wisW: 0.5,
    lckW: 0.3,
    chaW: 0.3,
  },
};

export const TRAINING_DUMMY_PRESET_IDS = Object.keys(DUMMY_CLASS_WEIGHTS) as string[];
