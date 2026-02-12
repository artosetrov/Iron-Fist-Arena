-- CreateEnum
CREATE TYPE "CharacterOrigin" AS ENUM ('alley_rat', 'street_veteran', 'dumpster_mystic', 'scrap_knight', 'sewer_shadow');

-- AlterTable
ALTER TABLE "characters" ADD COLUMN "origin" "CharacterOrigin" NOT NULL DEFAULT 'alley_rat';
