-- CreateTable
CREATE TABLE "training_sessions" (
    "id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "xp_awarded" INTEGER NOT NULL,
    "won" BOOLEAN NOT NULL,
    "turns" INTEGER NOT NULL,
    "opponent_type" TEXT NOT NULL,
    "played_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "training_sessions_character_id_played_at_idx" ON "training_sessions"("character_id", "played_at");

-- AddForeignKey
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
