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

-- Re-create dungeon_runs table (needed by schema)
CREATE TABLE "dungeon_runs" (
    "id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "current_floor" INTEGER NOT NULL DEFAULT 1,
    "state" JSONB NOT NULL,
    "seed" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dungeon_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "dungeon_runs_character_id_idx" ON "dungeon_runs"("character_id");

ALTER TABLE "dungeon_runs" ADD CONSTRAINT "dungeon_runs_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
