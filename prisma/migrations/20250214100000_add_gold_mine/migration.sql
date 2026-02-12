-- AlterTable: add gold_mine_slots to characters
ALTER TABLE "characters" ADD COLUMN "gold_mine_slots" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "gold_mine_sessions" (
    "id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "slot_index" INTEGER NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "collected" BOOLEAN NOT NULL DEFAULT false,
    "reward" INTEGER NOT NULL,
    "boosted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gold_mine_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gold_mine_sessions_character_id_idx" ON "gold_mine_sessions"("character_id");

-- CreateIndex
CREATE INDEX "gold_mine_sessions_character_id_collected_idx" ON "gold_mine_sessions"("character_id", "collected");

-- AddForeignKey
ALTER TABLE "gold_mine_sessions" ADD CONSTRAINT "gold_mine_sessions_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
