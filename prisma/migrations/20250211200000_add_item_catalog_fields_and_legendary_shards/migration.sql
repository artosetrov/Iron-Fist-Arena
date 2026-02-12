-- Add catalog fields to items table
ALTER TABLE "items" ADD COLUMN "catalog_id" TEXT;
ALTER TABLE "items" ADD COLUMN "class_restriction" "CharacterClass";
ALTER TABLE "items" ADD COLUMN "set_name" TEXT;

-- Create unique index on catalog_id
CREATE UNIQUE INDEX "items_catalog_id_key" ON "items"("catalog_id");

-- Create legendary_shards table
CREATE TABLE "legendary_shards" (
    "id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "shard_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legendary_shards_pkey" PRIMARY KEY ("id")
);

-- Create unique index on character_id
CREATE UNIQUE INDEX "legendary_shards_character_id_key" ON "legendary_shards"("character_id");

-- Add foreign key
ALTER TABLE "legendary_shards" ADD CONSTRAINT "legendary_shards_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
