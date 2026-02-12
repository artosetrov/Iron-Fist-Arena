-- Add necklace and ring to ItemType enum
ALTER TYPE "ItemType" ADD VALUE IF NOT EXISTS 'necklace';
ALTER TYPE "ItemType" ADD VALUE IF NOT EXISTS 'ring';

-- Add necklace and ring to EquippedSlot enum
ALTER TYPE "EquippedSlot" ADD VALUE IF NOT EXISTS 'necklace';
ALTER TYPE "EquippedSlot" ADD VALUE IF NOT EXISTS 'ring';
