-- Add amulet, belt, relic to ItemType enum
ALTER TYPE "ItemType" ADD VALUE IF NOT EXISTS 'amulet';
ALTER TYPE "ItemType" ADD VALUE IF NOT EXISTS 'belt';
ALTER TYPE "ItemType" ADD VALUE IF NOT EXISTS 'relic';

-- Add amulet, belt, relic to EquippedSlot enum
ALTER TYPE "EquippedSlot" ADD VALUE IF NOT EXISTS 'amulet';
ALTER TYPE "EquippedSlot" ADD VALUE IF NOT EXISTS 'belt';
ALTER TYPE "EquippedSlot" ADD VALUE IF NOT EXISTS 'relic';
