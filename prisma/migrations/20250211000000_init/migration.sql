-- CreateEnum
CREATE TYPE "CharacterClass" AS ENUM ('warrior', 'rogue', 'mage', 'tank');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('weapon', 'helmet', 'chest', 'gloves', 'legs', 'boots', 'accessory');

-- CreateEnum
CREATE TYPE "Rarity" AS ENUM ('common', 'uncommon', 'rare', 'epic', 'legendary');

-- CreateEnum
CREATE TYPE "EquippedSlot" AS ENUM ('weapon', 'helmet', 'chest', 'gloves', 'legs', 'boots', 'accessory');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT,
    "auth_provider" TEXT NOT NULL DEFAULT 'email',
    "gems" INTEGER NOT NULL DEFAULT 0,
    "premium_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_banned" BOOLEAN NOT NULL DEFAULT false,
    "ban_reason" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "characters" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "character_name" TEXT NOT NULL,
    "class" "CharacterClass" NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "current_xp" INTEGER NOT NULL DEFAULT 0,
    "prestige_level" INTEGER NOT NULL DEFAULT 0,
    "stat_points_available" INTEGER NOT NULL DEFAULT 0,
    "strength" INTEGER NOT NULL DEFAULT 10,
    "agility" INTEGER NOT NULL DEFAULT 10,
    "vitality" INTEGER NOT NULL DEFAULT 10,
    "endurance" INTEGER NOT NULL DEFAULT 10,
    "intelligence" INTEGER NOT NULL DEFAULT 10,
    "wisdom" INTEGER NOT NULL DEFAULT 10,
    "luck" INTEGER NOT NULL DEFAULT 10,
    "charisma" INTEGER NOT NULL DEFAULT 10,
    "gold" INTEGER NOT NULL DEFAULT 500,
    "arena_tokens" INTEGER NOT NULL DEFAULT 0,
    "max_hp" INTEGER NOT NULL DEFAULT 100,
    "current_hp" INTEGER NOT NULL DEFAULT 100,
    "armor" INTEGER NOT NULL DEFAULT 0,
    "magic_resist" INTEGER NOT NULL DEFAULT 0,
    "current_stamina" INTEGER NOT NULL DEFAULT 100,
    "max_stamina" INTEGER NOT NULL DEFAULT 100,
    "last_stamina_update" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pvp_rating" INTEGER NOT NULL DEFAULT 1000,
    "pvp_wins" INTEGER NOT NULL DEFAULT 0,
    "pvp_losses" INTEGER NOT NULL DEFAULT 0,
    "pvp_win_streak" INTEGER NOT NULL DEFAULT 0,
    "highest_pvp_rank" TEXT NOT NULL DEFAULT 'Bronze V',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_played" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "item_type" "ItemType" NOT NULL,
    "rarity" "Rarity" NOT NULL,
    "item_level" INTEGER NOT NULL,
    "base_stats" JSONB NOT NULL,
    "special_effect" TEXT,
    "unique_passive" TEXT,
    "buy_price" INTEGER,
    "sell_price" INTEGER,
    "description" TEXT,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentInventory" (
    "id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "upgrade_level" INTEGER NOT NULL DEFAULT 0,
    "durability" INTEGER NOT NULL DEFAULT 100,
    "max_durability" INTEGER NOT NULL DEFAULT 100,
    "is_equipped" BOOLEAN NOT NULL DEFAULT false,
    "equipped_slot" "EquippedSlot",
    "rolled_stats" JSONB,
    "acquired_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EquipmentInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PvpMatch" (
    "id" TEXT NOT NULL,
    "player1_id" TEXT NOT NULL,
    "player2_id" TEXT NOT NULL,
    "player1_rating_before" INTEGER NOT NULL,
    "player2_rating_before" INTEGER NOT NULL,
    "player1_rating_after" INTEGER NOT NULL,
    "player2_rating_after" INTEGER NOT NULL,
    "winner_id" TEXT NOT NULL,
    "loser_id" TEXT NOT NULL,
    "combat_log" JSONB NOT NULL,
    "match_duration" INTEGER,
    "turns_taken" INTEGER NOT NULL,
    "player1_gold_reward" INTEGER,
    "player2_gold_reward" INTEGER,
    "player1_xp_reward" INTEGER,
    "player2_xp_reward" INTEGER,
    "match_type" TEXT NOT NULL DEFAULT 'ranked',
    "season_number" INTEGER NOT NULL,
    "played_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PvpMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DungeonRun" (
    "id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "current_floor" INTEGER NOT NULL DEFAULT 1,
    "state" JSONB NOT NULL,
    "seed" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DungeonRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "theme" TEXT,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyQuest" (
    "id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "quest_type" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "target" INTEGER NOT NULL,
    "reward_gold" INTEGER NOT NULL,
    "reward_xp" INTEGER NOT NULL,
    "reward_gems" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "day" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyQuest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BattlePass" (
    "id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "season_id" TEXT NOT NULL,
    "premium" BOOLEAN NOT NULL DEFAULT false,
    "bp_xp" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BattlePass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cosmetic" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "ref_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cosmetic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "characters_character_name_key" ON "characters"("character_name");

-- CreateIndex
CREATE INDEX "EquipmentInventory_character_id_idx" ON "EquipmentInventory"("character_id");

-- CreateIndex
CREATE INDEX "EquipmentInventory_character_id_is_equipped_idx" ON "EquipmentInventory"("character_id", "is_equipped");

-- CreateIndex
CREATE INDEX "DungeonRun_character_id_idx" ON "DungeonRun"("character_id");

-- CreateIndex
CREATE UNIQUE INDEX "Season_number_key" ON "Season"("number");

-- CreateIndex
CREATE INDEX "DailyQuest_character_id_idx" ON "DailyQuest"("character_id");

-- CreateIndex
CREATE UNIQUE INDEX "DailyQuest_character_id_quest_type_day_key" ON "DailyQuest"("character_id", "quest_type", "day");

-- CreateIndex
CREATE UNIQUE INDEX "BattlePass_character_id_season_id_key" ON "BattlePass"("character_id", "season_id");

-- CreateIndex
CREATE INDEX "Cosmetic_user_id_idx" ON "Cosmetic"("user_id");

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentInventory" ADD CONSTRAINT "EquipmentInventory_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentInventory" ADD CONSTRAINT "EquipmentInventory_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PvpMatch" ADD CONSTRAINT "PvpMatch_player1_id_fkey" FOREIGN KEY ("player1_id") REFERENCES "characters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PvpMatch" ADD CONSTRAINT "PvpMatch_player2_id_fkey" FOREIGN KEY ("player2_id") REFERENCES "characters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DungeonRun" ADD CONSTRAINT "DungeonRun_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyQuest" ADD CONSTRAINT "DailyQuest_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattlePass" ADD CONSTRAINT "BattlePass_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattlePass" ADD CONSTRAINT "BattlePass_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cosmetic" ADD CONSTRAINT "Cosmetic_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
