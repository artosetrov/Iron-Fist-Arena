-- Change default pvp_rating from 1000 to 0
ALTER TABLE "characters" ALTER COLUMN "pvp_rating" SET DEFAULT 0;

-- Reset existing characters that have never fought (0 wins, 0 losses) to 0
UPDATE "characters" SET "pvp_rating" = 0 WHERE "pvp_wins" = 0 AND "pvp_losses" = 0;
