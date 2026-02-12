-- Iron Fist Arena - Initial schema (GDD §9.2)
-- Run in Supabase SQL Editor or via supabase db push

CREATE TYPE character_class AS ENUM ('warrior', 'rogue', 'mage', 'tank');
CREATE TYPE item_type AS ENUM ('weapon', 'helmet', 'chest', 'gloves', 'legs', 'boots', 'accessory');
CREATE TYPE rarity AS ENUM ('common', 'uncommon', 'rare', 'epic', 'legendary');
CREATE TYPE equipped_slot AS ENUM ('weapon', 'helmet', 'chest', 'gloves', 'legs', 'boots', 'accessory');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  auth_provider VARCHAR(50) DEFAULT 'email',
  gems INTEGER DEFAULT 0,
  premium_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ DEFAULT NOW(),
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason TEXT
);

CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  character_name VARCHAR(50) UNIQUE NOT NULL,
  class character_class NOT NULL,
  level INTEGER DEFAULT 1,
  current_xp INTEGER DEFAULT 0,
  prestige_level INTEGER DEFAULT 0,
  stat_points_available INTEGER DEFAULT 0,
  strength INTEGER DEFAULT 10,
  agility INTEGER DEFAULT 10,
  vitality INTEGER DEFAULT 10,
  endurance INTEGER DEFAULT 10,
  intelligence INTEGER DEFAULT 10,
  wisdom INTEGER DEFAULT 10,
  luck INTEGER DEFAULT 10,
  charisma INTEGER DEFAULT 10,
  gold INTEGER DEFAULT 500,
  arena_tokens INTEGER DEFAULT 0,
  max_hp INTEGER DEFAULT 100,
  current_hp INTEGER DEFAULT 100,
  armor INTEGER DEFAULT 0,
  magic_resist INTEGER DEFAULT 0,
  current_stamina INTEGER DEFAULT 100,
  max_stamina INTEGER DEFAULT 100,
  last_stamina_update TIMESTAMPTZ DEFAULT NOW(),
  pvp_rating INTEGER DEFAULT 1000,
  pvp_wins INTEGER DEFAULT 0,
  pvp_losses INTEGER DEFAULT 0,
  pvp_win_streak INTEGER DEFAULT 0,
  highest_pvp_rank VARCHAR(50) DEFAULT 'Bronze V',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_played TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_characters_user ON characters(user_id);
CREATE INDEX idx_characters_rating ON characters(pvp_rating DESC);
CREATE INDEX idx_characters_level ON characters(level DESC);

CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name VARCHAR(100) NOT NULL,
  item_type item_type NOT NULL,
  rarity rarity NOT NULL,
  item_level INTEGER NOT NULL,
  base_stats JSONB NOT NULL,
  special_effect TEXT,
  unique_passive TEXT,
  buy_price INTEGER,
  sell_price INTEGER,
  description TEXT,
  image_url VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE equipment_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id),
  upgrade_level INTEGER DEFAULT 0,
  durability INTEGER DEFAULT 100,
  max_durability INTEGER DEFAULT 100,
  is_equipped BOOLEAN DEFAULT FALSE,
  equipped_slot equipped_slot,
  rolled_stats JSONB,
  acquired_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inv_character ON equipment_inventory(character_id);
CREATE INDEX idx_inv_equipped ON equipment_inventory(character_id, is_equipped);

CREATE TABLE pvp_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id UUID NOT NULL REFERENCES characters(id),
  player2_id UUID NOT NULL REFERENCES characters(id),
  player1_rating_before INTEGER NOT NULL,
  player2_rating_before INTEGER NOT NULL,
  player1_rating_after INTEGER NOT NULL,
  player2_rating_after INTEGER NOT NULL,
  winner_id UUID NOT NULL REFERENCES characters(id),
  loser_id UUID NOT NULL REFERENCES characters(id),
  combat_log JSONB NOT NULL,
  match_duration INTEGER,
  turns_taken INTEGER NOT NULL,
  player1_gold_reward INTEGER,
  player2_gold_reward INTEGER,
  player1_xp_reward INTEGER,
  player2_xp_reward INTEGER,
  match_type VARCHAR(20) DEFAULT 'ranked',
  season_number INTEGER NOT NULL,
  played_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pvp_season ON pvp_matches(season_number, played_at DESC);

CREATE TABLE dungeon_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  difficulty VARCHAR(20) NOT NULL,
  current_floor INTEGER DEFAULT 1,
  state JSONB NOT NULL,
  seed INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dungeon_character ON dungeon_runs(character_id);

CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number INTEGER UNIQUE NOT NULL,
  theme VARCHAR(100),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE daily_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL,
  quest_type VARCHAR(50) NOT NULL,
  progress INTEGER DEFAULT 0,
  target INTEGER NOT NULL,
  reward_gold INTEGER NOT NULL,
  reward_xp INTEGER NOT NULL,
  reward_gems INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  day DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(character_id, quest_type, day)
);

CREATE TABLE battle_pass (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL,
  season_id UUID NOT NULL REFERENCES seasons(id),
  premium BOOLEAN DEFAULT FALSE,
  bp_xp INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(character_id, season_id)
);

CREATE TABLE cosmetics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  ref_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cosmetics_user ON cosmetics(user_id);
