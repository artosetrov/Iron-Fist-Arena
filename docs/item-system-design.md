# Item System Design Document v2.0

## 1. Purpose

Item system creates:

- **Visible power progression** — players feel stronger through gear
- **Long-term seasonal goals** — legendary sets as endgame chase items
- **Controlled PvP balance** — power gap hard cap ≤ 20%

Legendary sets are the ultimate endgame chase items.

---

## 2. Item Sources

В игре существуют **два источника предметов**, которые объединяются в единый пул магазина:

### 2.1 Generic Items (процедурные)

Генерируются автоматически при seed базы данных. Покрывают все уровни и типы:

- **Уровни:** 1–50 (каждый уровень)
- **Типы:** weapon, helmet, chest, gloves, legs, boots, accessory (7 типов)
- **Рарности:** common, uncommon, rare, epic, legendary (5 рарностей)
- **Итого:** 7 × 5 × 50 = **1750 предметов**
- **Название:** автоматическое (`"{rarity} {type} Lv.{level}"`)
- **Статы:** формульные (`base = level × 4 + 10`, armor = 50% от base для неоружия)
- **Цена покупки:** `100 × (1 + level/10)^1.5 × Rarity_Mult`
- **Цена продажи:** 50% от цены покупки

### 2.2 Catalog Items (авторские)

Уникальные предметы с авторскими названиями, статами и описаниями. Хранятся в `lib/game/item-catalog.ts`.

- **Всего:** 232 предмета (116 доспехов + 116 оружия)
- Включают легендарные сеты (4 класса × 8 предметов = 32 legendary)
- Каждый предмет имеет уникальный `catalogId`
- Уровень предмета (`itemLevel`) зависит от рарности:

| Rarity    | itemLevel | Когда виден в магазине (уровень персонажа) |
|-----------|-----------|---------------------------------------------|
| Common    | 5         | Level 4–7                                   |
| Rare      | 15        | Level 14–17                                 |
| Epic      | 25        | Level 24–27                                 |
| Legendary | 35        | Не продаётся (drop-only)                    |

---

## 3. NPC Shop — Скользящее окно

Магазин показывает предметы на основе уровня персонажа:

```
Window = [max(1, CharLevel - 1), CharLevel + 2]
```

- Окно: **4 уровня предметов** (от −1 до +2 относительно уровня)
- **Legendary предметы исключены** из магазина (drop-only)
- Generic + Catalog предметы фильтруются **одним запросом** с общим условием по `itemLevel`
- Ассортимент обновляется автоматически при каждом level-up
- ~30–50 предметов на любом уровне

**API endpoint:** `GET /api/shop/items?characterId={id}`

---

## 4. Rarity System

| Rarity          | Color  | Drop Rate | Stat Multiplier | Sell Value |
| --------------- | ------ | --------- | --------------- | ---------- |
| Common (Gray)   | Gray   | 60%       | x1.00           | 100%       |
| Rare (Green)    | Green  | 30%       | x1.08           | 120%       |
| Epic (Blue)     | Blue   | 9%        | x1.15           | 150%       |
| Legendary (Purple) | Purple | 1%     | x1.22           | 220%       |

Rarity multiplier applies to **base item stats**.

---

## 5. Equipment Slots

Each player has **5 equipment slots**:

| Slot   | Primary Stats     |
| ------ | ----------------- |
| Weapon | ATK, CRIT, SPEED  |
| Helmet | DEF, HP           |
| Gloves | ATK               |
| Chest  | DEF, HP           |
| Boots  | ATK, DEF, SPEED   |

---

## 6. Item Stat Types

Items can provide 1–3 stats from the following pool:

| Stat  | Description                |
| ----- | -------------------------- |
| ATK   | Attack power               |
| DEF   | Defense                    |
| HP    | Max health points          |
| CRIT  | Critical strike chance (%) |
| SPEED | Speed / initiative         |

---

## 7. Base Item Stats (Level 30 Baseline)

### 7.1 Armor Base Stats

| Slot   | DEF | HP  | ATK | SPEED |
| ------ | --- | --- | --- | ----- |
| Helmet | 35  | 120 | —   | —     |
| Gloves | —   | —   | 45  | —     |
| Chest  | 70  | 250 | —   | —     |
| Boots  | 15  | —   | 15  | 5     |

**Helmet by rarity:**
- Common (x1.00): DEF 35, HP 120
- Rare (x1.08): DEF 38, HP 130
- Epic (x1.15): DEF 40, HP 138
- Legendary (x1.22): DEF 43, HP 146

**Gloves by rarity:**
- Common (x1.00): ATK 45
- Rare (x1.08): ATK 49
- Epic (x1.15): ATK 52
- Legendary (x1.22): ATK 55

**Chest by rarity:**
- Common (x1.00): DEF 70, HP 250
- Rare (x1.08): DEF 76, HP 270
- Epic (x1.15): DEF 81, HP 288
- Legendary (x1.22): DEF 85, HP 305

**Boots by rarity:**
- Common (x1.00): ATK 15, DEF 15, SPEED 5
- Rare (x1.08): ATK 16, DEF 16, SPEED 5
- Epic (x1.15): ATK 17, DEF 17, SPEED 6
- Legendary (x1.22): ATK 18, DEF 18, SPEED 6

### 7.2 Weapon Base Stats

4 weapon subtypes with different stat profiles:

| Subtype       | ATK | Sub-stats       | Fantasy                            |
| ------------- | --- | --------------- | ---------------------------------- |
| Swords        | 55  | CRIT 3          | Versatile, light crit              |
| Daggers       | 42  | CRIT 8, SPEED 3 | Fast, crit-focused — rogue fantasy |
| Maces/Hammers | 62  | DEF 8           | Heavy, defensive — tank/warrior    |
| Staffs        | 48  | CRIT 5          | Magical, medium crit — mage        |

**Swords by rarity:**
- Common (x1.00): ATK 55, CRIT 3
- Rare (x1.08): ATK 59, CRIT 4
- Epic (x1.15): ATK 63, CRIT 5
- Legendary (x1.22): ATK 67–72, CRIT 4–7

**Daggers by rarity:**
- Common (x1.00): ATK 42, CRIT 8, SPEED 3
- Rare (x1.08): ATK 45, CRIT 9, SPEED 4
- Epic (x1.15): ATK 48, CRIT 11, SPEED 4–5
- Legendary (x1.22): ATK 51–55, CRIT 10–12, SPEED 4–5

**Maces/Hammers by rarity:**
- Common (x1.00): ATK 62, DEF 8
- Rare (x1.08): ATK 67, DEF 9
- Epic (x1.15): ATK 71, DEF 11
- Legendary (x1.22): ATK 55–60, DEF 12–15, HP 30–50

**Staffs by rarity:**
- Common (x1.00): ATK 48, CRIT 5
- Rare (x1.08): ATK 52, CRIT 6
- Epic (x1.15): ATK 55, CRIT 7
- Legendary (x1.22): ATK 58–62, CRIT 6–8

Items within the same rarity vary by ±10–15% for diversity.

---

## 8. Legendary Class Sets

Each class has a unique **4-piece legendary set**. Wearing pieces of the same set grants bonus effects.

### Warrior — "Crimson Conqueror" (8 pieces: 4 armor + 4 swords)

| Slot    | Stats                  |
| ------- | ---------------------- |
| Helmet  | ATK 25, DEF 30        |
| Gloves  | ATK 55                 |
| Chest   | HP 305, DEF 85         |
| Boots   | SPEED 8                |
| Weapon 1 | ATK 72, CRIT 5        |
| Weapon 2 | ATK 70, CRIT 6        |
| Weapon 3 | ATK 68, CRIT 4        |
| Weapon 4 | ATK 67, CRIT 7        |

- **2-piece bonus:** +5% ATK
- **4-piece bonus:** +10% total damage

### Rogue — "Shadow Reaper" (8 pieces: 4 armor + 4 daggers)

| Slot    | Stats                       |
| ------- | --------------------------- |
| Helmet  | CRIT 12                     |
| Gloves  | ATK 55                      |
| Chest   | DEF 50                      |
| Boots   | SPEED 12                    |
| Weapon 1 | ATK 55, CRIT 12, SPEED 5   |
| Weapon 2 | ATK 53, CRIT 11, SPEED 5   |
| Weapon 3 | ATK 51, CRIT 12, SPEED 4   |
| Weapon 4 | ATK 54, CRIT 10, SPEED 5   |

- **2-piece bonus:** +8% Crit Chance
- **4-piece bonus:** 15% chance for extra turn

### Mage — "Arcane Dominion" (8 pieces: 4 armor + 4 staffs)

| Slot    | Stats                |
| ------- | -------------------- |
| Helmet  | CRIT 10              |
| Gloves  | ATK 50               |
| Chest   | HP 305               |
| Boots   | SPEED 8              |
| Weapon 1 | ATK 62, CRIT 8      |
| Weapon 2 | ATK 60, CRIT 7      |
| Weapon 3 | ATK 58, CRIT 8      |
| Weapon 4 | ATK 61, CRIT 6      |

- **2-piece bonus:** +10% Crit Damage
- **4-piece bonus:** +12% total damage

### Tank — "Iron Bastion" (8 pieces: 4 armor + 4 maces)

| Slot    | Stats                    |
| ------- | ------------------------ |
| Helmet  | DEF 55                   |
| Gloves  | DEF 45                   |
| Chest   | HP 380                   |
| Boots   | DEF 25, HP 100           |
| Weapon 1 | ATK 60, DEF 15, HP 50   |
| Weapon 2 | ATK 58, DEF 14, HP 40   |
| Weapon 3 | ATK 55, DEF 13, HP 45   |
| Weapon 4 | ATK 57, DEF 12, HP 30   |

- **2-piece bonus:** −5% damage taken
- **4-piece bonus:** −10% damage taken

---

## 9. Balance Rules

- Full legendary set provides **~15–18% power advantage**
- **No direct pay-to-win items**
- Legendary items drop only via **loot or crafting**
- Power gap **hard cap: 20%**
- Set bonuses stack (2-piece + 4-piece both active when 4 pieces equipped)

---

## 10. Crafting System

| Action                      | Result                        |
| --------------------------- | ----------------------------- |
| Salvage duplicate Legendary | → 10 Legendary Shards         |
| 100 Legendary Shards        | → Craft 1 selected Legendary  |

Designed for **full-season progression** (approximately 10 legendary salvages to craft one targeted piece).

---

## 11. Item Catalog Summary

### Armor (116 items)

| Rarity    | Count | Breakdown                                  |
| --------- | ----- | ------------------------------------------ |
| Common    | 50    | 13 Helmets, 12 Gloves, 13 Chest, 12 Boots |
| Rare      | 30    | 8 Helmets, 7 Gloves, 8 Chest, 7 Boots     |
| Epic      | 20    | 5 Helmets, 5 Gloves, 5 Chest, 5 Boots     |
| Legendary | 16    | 4 sets x 4 armor pieces                    |

### Weapons (116 items)

| Rarity    | Count | Breakdown                                      |
| --------- | ----- | ---------------------------------------------- |
| Common    | 50    | 13 Swords, 12 Daggers, 13 Maces, 12 Staffs    |
| Rare      | 30    | 8 Swords, 7 Daggers, 8 Maces, 7 Staffs        |
| Epic      | 20    | 5 Swords, 5 Daggers, 5 Maces, 5 Staffs        |
| Legendary | 16    | 4 sets x 4 weapons                             |

### Total: **232 items**

Full item catalog with stats: `lib/game/item-catalog.ts`

---

## 12. Technical Notes

- Stats stored in `baseStats` JSON field in the `items` table
- Legendary items have `classRestriction` and `setName` fields
- Set bonuses computed at runtime in `lib/game/set-bonuses.ts`
- Crafting shards tracked in `legendary_shards` table per character
- Existing 7 equipment slots (weapon, helmet, chest, gloves, legs, boots, accessory) remain; catalog items use weapon + 4 armor slots
- Existing uncommon rarity preserved for backward compatibility
- Weapon subtypes (Sword, Dagger, Mace, Staff) stored in `description` field for UI display
- Generic items: `catalogId = null`, catalog items: `catalogId = "warrior-helmet-crimson-conqueror"` (unique)
- Shop API endpoint: `GET /api/shop/items?characterId={id}` — единый запрос с фильтром по `itemLevel` и исключением legendary
- Seed: generic items перегенерируются при каждом запуске (старые без владельца удаляются), catalog items обновляются (upsert по `catalogId`)
- Catalog item levels: common=5, rare=15, epic=25, legendary=35 (определяются в seed через `CATALOG_LEVEL`)
