-- CreateEnum
CREATE TYPE "ConsumableType" AS ENUM ('stamina_potion_small', 'stamina_potion_medium', 'stamina_potion_large');

-- CreateTable
CREATE TABLE "consumable_inventory" (
    "id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "consumable_type" "ConsumableType" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "acquired_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consumable_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "consumable_inventory_character_id_idx" ON "consumable_inventory"("character_id");

-- CreateIndex
CREATE UNIQUE INDEX "consumable_inventory_character_id_consumable_type_key" ON "consumable_inventory"("character_id", "consumable_type");

-- AddForeignKey
ALTER TABLE "consumable_inventory" ADD CONSTRAINT "consumable_inventory_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
