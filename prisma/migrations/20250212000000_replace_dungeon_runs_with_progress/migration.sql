-- Drop old dungeon_runs table
DROP TABLE IF EXISTS "dungeon_runs";

-- Create dungeon_progress table
CREATE TABLE "dungeon_progress" (
    "id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "dungeon_id" TEXT NOT NULL,
    "boss_index" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "dungeon_progress_pkey" PRIMARY KEY ("id")
);

-- Unique constraint: one record per character per dungeon
CREATE UNIQUE INDEX "dungeon_progress_character_id_dungeon_id_key" ON "dungeon_progress"("character_id", "dungeon_id");

-- Index for fast lookups by character
CREATE INDEX "dungeon_progress_character_id_idx" ON "dungeon_progress"("character_id");

-- Foreign key to characters
ALTER TABLE "dungeon_progress" ADD CONSTRAINT "dungeon_progress_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
