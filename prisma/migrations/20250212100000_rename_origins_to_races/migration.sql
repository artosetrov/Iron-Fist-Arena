-- Rename CharacterOrigin enum values from origin-themed to race-themed
ALTER TYPE "CharacterOrigin" RENAME VALUE 'alley_rat' TO 'human';
ALTER TYPE "CharacterOrigin" RENAME VALUE 'street_veteran' TO 'orc';
ALTER TYPE "CharacterOrigin" RENAME VALUE 'dumpster_mystic' TO 'skeleton';
ALTER TYPE "CharacterOrigin" RENAME VALUE 'scrap_knight' TO 'demon';
ALTER TYPE "CharacterOrigin" RENAME VALUE 'sewer_shadow' TO 'dogfolk';

-- Update default value
ALTER TABLE "characters" ALTER COLUMN "origin" SET DEFAULT 'human'::"CharacterOrigin";
