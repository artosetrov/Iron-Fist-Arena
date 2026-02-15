import Image from "next/image";

/* ────────────────── Game Icon Key Registry ────────────────── */

export type GameIconKey =
  /* Resources */
  | "gold" | "gems" | "pvp-rating" | "wins" | "losses" | "stamina-timer" | "stamina" | "xp"
  /* Navigation */
  | "tavern" | "lobby" | "shell-game" | "gold-mine" | "dungeon-rush"
  | "fights" | "arena" | "dungeons" | "training" | "shop" | "leaderboard"
  /* Classes */
  | "warrior" | "rogue" | "mage" | "tank"
  /* Stats */
  | "strength" | "agility" | "intelligence" | "vitality"
  | "luck" | "endurance" | "wisdom" | "charisma"
  /* Equipment slots */
  | "helmet" | "weapon" | "weapon-offhand" | "chest" | "gloves"
  | "legs" | "boots" | "ring" | "accessory" | "amulet" | "belt" | "relic"
  /* Admin & utility */
  | "admin" | "balance" | "design-system" | "settings" | "switch-char" | "wiki";

const I = "/images/ui/icons/sidebar";

export const GAME_ICON_MAP: Record<GameIconKey, string> = {
  /* Resources */
  gold: `${I}/icon-gold.png`,
  gems: `${I}/icon-gems.png`,
  "pvp-rating": `${I}/icon-pvp-rating.png`,
  wins: `${I}/icon-wins.png`,
  losses: `${I}/icon-losses.png`,
  "stamina-timer": `${I}/icon-stamina-timer.png`,
  stamina: `${I}/icon-stamina.png`,
  xp: `${I}/icon-xp.png`,
  /* Navigation */
  tavern: `${I}/icon-tavern.png`,
  lobby: `${I}/icon-lobby.png`,
  "shell-game": `${I}/icon-shell-game.png`,
  "gold-mine": `${I}/icon-gold-mine.png`,
  "dungeon-rush": `${I}/icon-dungeon-rush.png`,
  fights: `${I}/icon-fights.png`,
  arena: `${I}/icon-arena.png`,
  dungeons: `${I}/icon-dungeons.png`,
  training: `${I}/icon-training.png`,
  shop: `${I}/icon-shop.png`,
  leaderboard: `${I}/icon-leaderboard.png`,
  /* Classes (warrior reuses fights icon) */
  warrior: `${I}/icon-fights.png`,
  rogue: `${I}/icon-rogue.png`,
  mage: `${I}/icon-mage.png`,
  tank: `${I}/icon-tank.png`,
  /* Stats */
  strength: `${I}/icon-strength.png`,
  agility: `${I}/icon-agility.png`,
  intelligence: `${I}/icon-intelligence.png`,
  vitality: `${I}/icon-vitality.png`,
  luck: `${I}/icon-luck.png`,
  endurance: `${I}/icon-endurance.png`,
  wisdom: `${I}/icon-wisdom.png`,
  charisma: `${I}/icon-charisma.png`,
  /* Equipment slots (weapon reuses fights icon) */
  helmet: `${I}/icon-helmet.png`,
  weapon: `${I}/icon-fights.png`,
  "weapon-offhand": `${I}/icon-weapon-offhand.png`,
  chest: `${I}/icon-chest.png`,
  gloves: `${I}/icon-gloves.png`,
  legs: `${I}/icon-legs.png`,
  boots: `${I}/icon-boots.png`,
  ring: `${I}/icon-ring.png`,
  accessory: `${I}/icon-ring.png`,
  amulet: `${I}/icon-amulet.png`,
  belt: `${I}/icon-belt.png`,
  relic: `${I}/icon-relic.png`,
  /* Admin & utility */
  admin: `${I}/icon-dev-panel.png`,
  balance: `${I}/icon-balance.png`,
  "design-system": `${I}/icon-design-system.png`,
  settings: `${I}/icon-settings.png`,
  "switch-char": `${I}/icon-switch-char.png`,
  wiki: `${I}/icon-dungeons.png`,
};

/* ────────────────── Component ────────────────── */

type GameIconProps = {
  name: GameIconKey;
  size?: number;
  className?: string;
};

const GameIcon = ({ name, size = 24, className = "" }: GameIconProps) => (
  <Image
    src={GAME_ICON_MAP[name]}
    alt={name}
    width={size}
    height={size}
    className={`inline-block shrink-0 object-contain ${className}`}
    sizes={`${size}px`}
    draggable={false}
  />
);

export default GameIcon;
