-- AlterTable
ALTER TABLE "characters" ADD COLUMN "bonus_trainings" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "characters" ADD COLUMN "bonus_trainings_date" DATE;
ALTER TABLE "characters" ADD COLUMN "bonus_trainings_buys" INTEGER NOT NULL DEFAULT 0;
