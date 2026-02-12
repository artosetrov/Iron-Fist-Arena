-- Add ARMOR stat to all catalog armor items (helmet, chest, gloves, boots)
-- Values match lib/game/item-catalog.ts per GDD balance

-- =============================================
-- COMMON HELMETS (target ~25, ±10-15%)
-- =============================================
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 22}'::jsonb WHERE "catalog_id" = 'c-helm-01';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 24}'::jsonb WHERE "catalog_id" = 'c-helm-02';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 23}'::jsonb WHERE "catalog_id" = 'c-helm-03';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 21}'::jsonb WHERE "catalog_id" = 'c-helm-04';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 27}'::jsonb WHERE "catalog_id" = 'c-helm-05';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 28}'::jsonb WHERE "catalog_id" = 'c-helm-06';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 25}'::jsonb WHERE "catalog_id" = 'c-helm-07';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 22}'::jsonb WHERE "catalog_id" = 'c-helm-08';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 24}'::jsonb WHERE "catalog_id" = 'c-helm-09';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 27}'::jsonb WHERE "catalog_id" = 'c-helm-10';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 26}'::jsonb WHERE "catalog_id" = 'c-helm-11';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 23}'::jsonb WHERE "catalog_id" = 'c-helm-12';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 25}'::jsonb WHERE "catalog_id" = 'c-helm-13';

-- =============================================
-- COMMON GLOVES (target ~15, ±10-15%)
-- =============================================
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 13}'::jsonb WHERE "catalog_id" = 'c-glv-01';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 14}'::jsonb WHERE "catalog_id" = 'c-glv-02';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 16}'::jsonb WHERE "catalog_id" = 'c-glv-03';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 15}'::jsonb WHERE "catalog_id" = 'c-glv-04';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 15}'::jsonb WHERE "catalog_id" = 'c-glv-05';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 17}'::jsonb WHERE "catalog_id" = 'c-glv-06';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 13}'::jsonb WHERE "catalog_id" = 'c-glv-07';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 14}'::jsonb WHERE "catalog_id" = 'c-glv-08';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 15}'::jsonb WHERE "catalog_id" = 'c-glv-09';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 16}'::jsonb WHERE "catalog_id" = 'c-glv-10';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 14}'::jsonb WHERE "catalog_id" = 'c-glv-11';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 17}'::jsonb WHERE "catalog_id" = 'c-glv-12';

-- =============================================
-- COMMON CHESTS (target ~45, ±10-15%)
-- =============================================
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 39}'::jsonb WHERE "catalog_id" = 'c-cst-01';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 40}'::jsonb WHERE "catalog_id" = 'c-cst-02';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 47}'::jsonb WHERE "catalog_id" = 'c-cst-03';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 45}'::jsonb WHERE "catalog_id" = 'c-cst-04';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 43}'::jsonb WHERE "catalog_id" = 'c-cst-05';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 46}'::jsonb WHERE "catalog_id" = 'c-cst-06';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 48}'::jsonb WHERE "catalog_id" = 'c-cst-07';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 44}'::jsonb WHERE "catalog_id" = 'c-cst-08';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 41}'::jsonb WHERE "catalog_id" = 'c-cst-09';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 45}'::jsonb WHERE "catalog_id" = 'c-cst-10';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 49}'::jsonb WHERE "catalog_id" = 'c-cst-11';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 38}'::jsonb WHERE "catalog_id" = 'c-cst-12';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 52}'::jsonb WHERE "catalog_id" = 'c-cst-13';

-- =============================================
-- COMMON BOOTS (target ~15, ±10-15%)
-- =============================================
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 13}'::jsonb WHERE "catalog_id" = 'c-bts-01';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 15}'::jsonb WHERE "catalog_id" = 'c-bts-02';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 15}'::jsonb WHERE "catalog_id" = 'c-bts-03';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 13}'::jsonb WHERE "catalog_id" = 'c-bts-04';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 16}'::jsonb WHERE "catalog_id" = 'c-bts-05';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 14}'::jsonb WHERE "catalog_id" = 'c-bts-06';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 13}'::jsonb WHERE "catalog_id" = 'c-bts-07';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 17}'::jsonb WHERE "catalog_id" = 'c-bts-08';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 15}'::jsonb WHERE "catalog_id" = 'c-bts-09';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 14}'::jsonb WHERE "catalog_id" = 'c-bts-10';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 16}'::jsonb WHERE "catalog_id" = 'c-bts-11';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 14}'::jsonb WHERE "catalog_id" = 'c-bts-12';

-- =============================================
-- RARE HELMETS (target ~48, ±10-15%)
-- =============================================
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 50}'::jsonb WHERE "catalog_id" = 'r-helm-01';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 44}'::jsonb WHERE "catalog_id" = 'r-helm-02';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 52}'::jsonb WHERE "catalog_id" = 'r-helm-03';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 48}'::jsonb WHERE "catalog_id" = 'r-helm-04';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 46}'::jsonb WHERE "catalog_id" = 'r-helm-05';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 42}'::jsonb WHERE "catalog_id" = 'r-helm-06';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 45}'::jsonb WHERE "catalog_id" = 'r-helm-07';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 51}'::jsonb WHERE "catalog_id" = 'r-helm-08';

-- =============================================
-- RARE GLOVES (target ~28, ±10-15%)
-- =============================================
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 30}'::jsonb WHERE "catalog_id" = 'r-glv-01';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 26}'::jsonb WHERE "catalog_id" = 'r-glv-02';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 25}'::jsonb WHERE "catalog_id" = 'r-glv-03';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 27}'::jsonb WHERE "catalog_id" = 'r-glv-04';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 29}'::jsonb WHERE "catalog_id" = 'r-glv-05';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 28}'::jsonb WHERE "catalog_id" = 'r-glv-06';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 30}'::jsonb WHERE "catalog_id" = 'r-glv-07';

-- =============================================
-- RARE CHESTS (target ~87, ±10-15%)
-- =============================================
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 92}'::jsonb WHERE "catalog_id" = 'r-cst-01';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 80}'::jsonb WHERE "catalog_id" = 'r-cst-02';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 78}'::jsonb WHERE "catalog_id" = 'r-cst-03';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 94}'::jsonb WHERE "catalog_id" = 'r-cst-04';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 96}'::jsonb WHERE "catalog_id" = 'r-cst-05';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 87}'::jsonb WHERE "catalog_id" = 'r-cst-06';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 88}'::jsonb WHERE "catalog_id" = 'r-cst-07';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 82}'::jsonb WHERE "catalog_id" = 'r-cst-08';

-- =============================================
-- RARE BOOTS (target ~29, ±10-15%)
-- =============================================
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 27}'::jsonb WHERE "catalog_id" = 'r-bts-01';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 28}'::jsonb WHERE "catalog_id" = 'r-bts-02';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 31}'::jsonb WHERE "catalog_id" = 'r-bts-03';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 29}'::jsonb WHERE "catalog_id" = 'r-bts-04';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 25}'::jsonb WHERE "catalog_id" = 'r-bts-05';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 32}'::jsonb WHERE "catalog_id" = 'r-bts-06';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 31}'::jsonb WHERE "catalog_id" = 'r-bts-07';

-- =============================================
-- EPIC HELMETS (target ~68, ±10-15%)
-- =============================================
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 72}'::jsonb WHERE "catalog_id" = 'e-helm-01';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 64}'::jsonb WHERE "catalog_id" = 'e-helm-02';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 62}'::jsonb WHERE "catalog_id" = 'e-helm-03';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 75}'::jsonb WHERE "catalog_id" = 'e-helm-04';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 68}'::jsonb WHERE "catalog_id" = 'e-helm-05';

-- =============================================
-- EPIC GLOVES (target ~40, ±10-15%)
-- =============================================
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 42}'::jsonb WHERE "catalog_id" = 'e-glv-01';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 38}'::jsonb WHERE "catalog_id" = 'e-glv-02';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 36}'::jsonb WHERE "catalog_id" = 'e-glv-03';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 44}'::jsonb WHERE "catalog_id" = 'e-glv-04';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 40}'::jsonb WHERE "catalog_id" = 'e-glv-05';

-- =============================================
-- EPIC CHESTS (target ~122, ±10-15%)
-- =============================================
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 128}'::jsonb WHERE "catalog_id" = 'e-cst-01';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 115}'::jsonb WHERE "catalog_id" = 'e-cst-02';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 110}'::jsonb WHERE "catalog_id" = 'e-cst-03';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 135}'::jsonb WHERE "catalog_id" = 'e-cst-04';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 122}'::jsonb WHERE "catalog_id" = 'e-cst-05';

-- =============================================
-- EPIC BOOTS (target ~40, ±10-15%)
-- =============================================
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 42}'::jsonb WHERE "catalog_id" = 'e-bts-01';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 36}'::jsonb WHERE "catalog_id" = 'e-bts-02';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 38}'::jsonb WHERE "catalog_id" = 'e-bts-03';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 44}'::jsonb WHERE "catalog_id" = 'e-bts-04';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 40}'::jsonb WHERE "catalog_id" = 'e-bts-05';

-- =============================================
-- LEGENDARY WARRIOR — Crimson Conqueror (~335 total)
-- =============================================
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 85}'::jsonb WHERE "catalog_id" = 'l-war-helm';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 50}'::jsonb WHERE "catalog_id" = 'l-war-glv';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 148}'::jsonb WHERE "catalog_id" = 'l-war-cst';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 52}'::jsonb WHERE "catalog_id" = 'l-war-bts';

-- =============================================
-- LEGENDARY ROGUE — Shadow Reaper (~245 total, light armor)
-- =============================================
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 60}'::jsonb WHERE "catalog_id" = 'l-rog-helm';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 35}'::jsonb WHERE "catalog_id" = 'l-rog-glv';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 110}'::jsonb WHERE "catalog_id" = 'l-rog-cst';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 40}'::jsonb WHERE "catalog_id" = 'l-rog-bts';

-- =============================================
-- LEGENDARY MAGE — Arcane Dominion (~220 total, lightest)
-- =============================================
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 55}'::jsonb WHERE "catalog_id" = 'l-mag-helm';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 30}'::jsonb WHERE "catalog_id" = 'l-mag-glv';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 100}'::jsonb WHERE "catalog_id" = 'l-mag-cst';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 35}'::jsonb WHERE "catalog_id" = 'l-mag-bts';

-- =============================================
-- LEGENDARY TANK — Iron Bastion (~380 total, heaviest)
-- =============================================
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 95}'::jsonb WHERE "catalog_id" = 'l-tnk-helm';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 60}'::jsonb WHERE "catalog_id" = 'l-tnk-glv';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 165}'::jsonb WHERE "catalog_id" = 'l-tnk-cst';
UPDATE "Item" SET "base_stats" = "base_stats" || '{"ARMOR": 60}'::jsonb WHERE "catalog_id" = 'l-tnk-bts';

-- =============================================
-- Recalculate armor for all characters with equipped items
-- =============================================
UPDATE "Character" c
SET armor = COALESCE((
  SELECT SUM(COALESCE(
    (ei_item."base_stats"->>'ARMOR')::int,
    (ei_item."base_stats"->>'armor')::int,
    0
  ))
  FROM "EquipmentInventory" ei
  JOIN "Item" ei_item ON ei."item_id" = ei_item."id"
  WHERE ei."character_id" = c."id"
    AND ei."is_equipped" = true
), 0);
