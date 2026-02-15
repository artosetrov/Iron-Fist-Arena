/**
 * Tavern activities config — minigames and their map positions.
 * Used by minigames page and wiki.
 */

export type TavernActivity = {
  id: string;
  label: string;
  description: string;
  href: string;
  pinIcon: string;
  available: boolean;
  tag?: string;
  /** Pin position as % of background image */
  top: number;
  left: number;
  /** Glow hitbox as % of background */
  hitbox: { top: number; left: number; width: number; height: number };
};

/**
 * Coordinates mapped to the custom tavern interior background.
 * Visual zones: center table (Dungeon Rush), left table (Shell Game),
 * lower-right (Gold Mine), lower-left (Coin Flip), right (Dice Roll).
 */
export const TAVERN_ACTIVITIES: TavernActivity[] = [
  {
    id: "dungeon-rush",
    label: "Dungeon Rush",
    description: "5-wave PvE gauntlet. Fight mobs, earn XP and Gold!",
    href: "/minigames/dungeon-rush",
    pinIcon: "/images/minigames/pins/pin-dungeon-rush.png",
    available: true,
    tag: "3 Energy",
    top: 35,
    left: 48,
    hitbox: { top: 25, left: 30, width: 35, height: 45 },
  },
  {
    id: "shell-game",
    label: "Shell Game",
    description: "Find the ball under the right cup. Bet gold, track the shuffle, pick wisely!",
    href: "/minigames/shell-game",
    pinIcon: "/images/minigames/pins/pin-shell-game.png",
    available: true,
    tag: "x2 Payout",
    top: 38,
    left: 14,
    hitbox: { top: 25, left: 2, width: 25, height: 40 },
  },
  {
    id: "gold-mine",
    label: "Gold Mine",
    description: "Start mining and collect gold over time. Idle income!",
    href: "/minigames/gold-mine",
    pinIcon: "/images/minigames/pins/pin-gold-mine.png",
    available: true,
    tag: "Idle",
    top: 50,
    left: 82,
    hitbox: { top: 40, left: 72, width: 24, height: 35 },
  },
  {
    id: "coin-flip",
    label: "Coin Flip",
    description: "Heads or tails? Double or nothing!",
    href: "/minigames/coin-flip",
    pinIcon: "/images/minigames/pins/pin-coin-flip.png",
    available: false,
    tag: "Coming Soon",
    top: 65,
    left: 15,
    hitbox: { top: 55, left: 2, width: 25, height: 30 },
  },
  {
    id: "dice-roll",
    label: "Dice Roll",
    description: "Roll the dice and test your luck against the house.",
    href: "/minigames/dice-roll",
    pinIcon: "/images/minigames/pins/pin-dice-roll.png",
    available: false,
    tag: "Coming Soon",
    top: 28,
    left: 85,
    hitbox: { top: 15, left: 72, width: 24, height: 30 },
  },
];

/** Only activities that are currently playable (for wiki minigames list). */
export const TAVERN_ACTIVITIES_AVAILABLE = TAVERN_ACTIVITIES.filter((a) => a.available);
