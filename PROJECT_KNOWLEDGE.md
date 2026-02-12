# Iron Fist Arena — база знаний проекта

Документ описывает реализованную структуру, БД, переменные окружения, логику систем и API. Используется как единый источник истины для разработки и для AI (см. правило в `.cursor/rules/project-knowledge.mdc`).

---

## 1. Описание проекта

- **Название:** Iron Fist Arena
- **Жанр:** браузерная PvP RPG, пошаговый бой, асинхронный PvP (игрок против AI-копии билда противника)
- **Стек:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Supabase (Auth + PostgreSQL), Prisma (ORM)
- **Геймдизайн:** полный GDD в `docs/iron_fist_arena_gdd.md`; правило по GDD — `.cursor/rules/iron-fist-arena-gdd.mdc`

---

## 2. Переменные окружения

| Переменная | Назначение |
|------------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL проекта Supabase (публичный) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Публичный anon-ключ Supabase (клиент и middleware) |
| `DATABASE_URL` | Строка подключения PostgreSQL для Prisma (Supabase). При ошибках TLS добавить `?sslmode=require` |
| `SUPABASE_SERVICE_ROLE_KEY` | (Опционально) Сервисный ключ Supabase для админ-операций |

Секреты не хранить в коде и не коммитить в репозиторий.

---

## 3. База данных: таблицы и поля

Маппинг Prisma → БД: имена в БД в **snake_case** (см. `prisma/schema.prisma`, `@map()`).

### 3.1 Таблицы

**users**
- `id` — UUID, PK, без default (подставляется `auth.uid` из Supabase Auth)
- `email`, `username` — уникальные
- `password_hash`, `auth_provider`, `gems`, `premium_until`, `created_at`, `last_login`, `is_banned`, `ban_reason`

**characters**
- `id` — UUID, PK, default gen_random_uuid()
- `user_id` — FK → users(id), ON DELETE CASCADE
- `character_name` — UNIQUE
- `class` — enum: warrior, rogue, mage, tank
- `level`, `current_xp`, `prestige_level`, `stat_points_available`
- `strength`, `agility`, `vitality`, `endurance`, `intelligence`, `wisdom`, `luck`, `charisma`
- `gold`, `arena_tokens`
- `max_hp`, `current_hp`, `armor`, `magic_resist`
- `current_stamina`, `max_stamina`, `last_stamina_update`
- `pvp_rating`, `pvp_wins`, `pvp_losses`, `pvp_win_streak`, `highest_pvp_rank`
- `created_at`, `last_played`

**items**
- `id`, `item_name`, `item_type`, `rarity`, `item_level`, `base_stats` (JSONB)
- `special_effect`, `unique_passive`, `buy_price`, `sell_price`, `description`, `image_url`, `created_at`
- `item_type` — enum: weapon, helmet, chest, gloves, legs, boots, accessory
- `rarity` — enum: common, uncommon, rare, epic, legendary

**equipment_inventory**
- `id`, `character_id` (FK → characters), `item_id` (FK → items)
- `upgrade_level`, `durability`, `max_durability`, `is_equipped`, `equipped_slot` (enum)
- `rolled_stats` (JSONB), `acquired_at`
- `equipped_slot` — enum: weapon, helmet, chest, gloves, legs, boots, accessory
- Индексы: (character_id), (character_id, is_equipped)

**pvp_matches**
- `id`, `player1_id`, `player2_id` (FK → characters)
- `player1_rating_before`, `player2_rating_before`, `player1_rating_after`, `player2_rating_after`
- `winner_id`, `loser_id` (FK → characters)
- `combat_log` (JSONB), `match_duration`, `turns_taken`
- `player1_gold_reward`, `player2_gold_reward`, `player1_xp_reward`, `player2_xp_reward`
- `match_type`, `season_number`, `played_at`
- Индекс: (season_number, played_at DESC)

**dungeon_runs**
- `id`, `character_id` (FK → characters), `difficulty`, `current_floor`, `state` (JSONB), `seed`, `created_at`
- Индекс: (character_id)

**seasons**
- `id`, `number` (UNIQUE), `theme`, `start_at`, `end_at`, `created_at`

**daily_quests**
- `id`, `character_id`, `quest_type`, `progress`, `target`, `reward_gold`, `reward_xp`, `reward_gems`, `completed`, `day`, `created_at`
- UNIQUE(character_id, quest_type, day)
- Индекс: (character_id)

**battle_pass**
- `id`, `character_id`, `season_id` (FK → seasons), `premium`, `bp_xp`, `created_at`, `updated_at`
- UNIQUE(character_id, season_id)

**cosmetics**
- `id`, `user_id` (FK → users), `type`, `ref_id`, `created_at`
- Индекс: (user_id)

### 3.2 Enum-типы (PostgreSQL)

- `character_class`: warrior, rogue, mage, tank
- `item_type`: weapon, helmet, chest, gloves, legs, boots, accessory
- `rarity`: common, uncommon, rare, epic, legendary
- `equipped_slot`: weapon, helmet, chest, gloves, legs, boots, accessory

---

## 4. Структура проекта

```
BumWars/
├── app/
│   ├── (auth)/login/page.tsx, register/page.tsx   — вход и регистрация
│   ├── api/                                       — Route Handlers
│   │   ├── auth/sync-user/route.ts                — синхронизация users с auth.uid
│   │   ├── characters/route.ts, [id]/route.ts     — CRUD персонажей
│   │   ├── combat/simulate/route.ts               — симуляция тестового боя
│   │   ├── dungeons/start/route.ts                — старт подземелья
│   │   ├── dungeons/run/[id]/fight/route.ts       — бой в подземелье, лут, прогресс
│   │   ├── inventory/route.ts, equip/route.ts, unequip/route.ts
│   │   ├── leaderboard/route.ts                   — топ по pvp_rating
│   │   ├── pvp/find-match/route.ts                 — поиск боя, симуляция, ELO, награды
│   │   ├── quests/daily/route.ts                   — список ежедневных квестов
│   │   ├── shop/items/route.ts, buy/route.ts, repair/route.ts, upgrade/route.ts
│   │   └── stamina/refill/route.ts                — рефилл стамины за гемы
│   ├── arena/page.tsx, character/page.tsx, combat/page.tsx, dungeon/page.tsx
│   ├── hub/page.tsx, inventory/page.tsx, shop/page.tsx, leaderboard/page.tsx
│   ├── layout.tsx, page.tsx, globals.css
├── lib/
│   ├── db.ts                                      — синглтон Prisma Client
│   ├── db/season.ts                               — getOrCreateCurrentSeason()
│   ├── game/
│   │   ├── abilities.ts   — способности классов (Warrior, Rogue, Mage, Tank)
│   │   ├── combat.ts      — runCombat(), buildCombatantState()
│   │   ├── constants.ts   — лимиты крита, доджа, ходов и т.д.
│   │   ├── damage.ts      — физический/магический урон, крит, додж
│   │   ├── dungeon.ts     — генерация этажей, комнат, статы врагов
│   │   ├── elo.ts         — рейтинг ELO, expectedScore, ratingChange, getRankFromRating
│   │   ├── levelUp.ts     — checkLevelUp(), applyLevelUp()
│   │   ├── loot.ts        — rollRarity(), rollDropChance()
│   │   ├── progression.ts — xpForLevel(), XP_REWARD, goldForPvP*
│   │   ├── quests.ts      — updateDailyQuestProgress()
│   │   ├── stamina.ts     — реген, затраты, spendStamina(), applyRegen()
│   │   ├── stats.ts       — производные статы (HP, крит, додж, броня)
│   │   └── types.ts      — BaseStats, DerivedStats, CombatantState, CombatLogEntry и т.д.
│   └── supabase/client.ts, server.ts, middleware.ts — клиент и сервер Supabase Auth
├── middleware.ts                                  — защита маршрутов, редиректы login/hub
├── prisma/schema.prisma, seed.ts
├── supabase/migrations/001_initial_schema.sql
└── PROJECT_KNOWLEDGE.md                           — этот файл
```

---

## 5. Логика основных систем

### Авторизация
- Supabase Auth (email/password). После логина или регистрации вызывается `POST /api/auth/sync-user`: создаётся или обновляется запись в `users` с `id = auth.uid`, полями email, username, lastLogin.

### Персонаж
- CRUD через `/api/characters` (GET список, POST создание, GET by id). При создании: имя, класс; стартовые статы 10, золото 500, стамина 100. При GET character пересчитывается стамина по времени (реген 1 стамина / 12 мин), при изменении — обновление в БД.

### Стамина
- Константы и расчёт в `lib/game/stamina.ts`. Затраты: PvP 10, подземелье Easy 15 / Normal 20 / Hard 25, босс 40. Рефилл за гемы — `POST /api/stamina/refill` (size: small/medium/large).

### Бой
- `lib/game/combat.ts`: `runCombat(playerState, enemyState, playerChoices)`. Порядок хода по AGI; формулы урона, крита, доджа в `lib/game/damage.ts` и `lib/game/stats.ts`; способности классов в `lib/game/abilities.ts`; статусы (stun, bleed, burn и т.д.) и лимит 15 ходов. Тестовый бой без сохранения — `POST /api/combat/simulate`.

### PvP
- `POST /api/pvp/find-match`: выбор противника по ELO (±100), снимок статов противника, полная симуляция боя, запись в `pvp_matches`, пересчёт ELO (`lib/game/elo.ts`), начисление золота/XP обоим, применение level-up (`lib/game/levelUp.ts`), обновление прогресса ежедневных квестов (`lib/game/quests.ts`).

### Подземелья
- Генерация комнат и статов врагов — `lib/game/dungeon.ts`. Старт — `POST /api/dungeons/start`: списание стамины, создание `dungeon_runs` с state (этаж, комнаты, враг). Бой по этажам — `POST /api/dungeons/run/[id]/fight`; лут по `lib/game/loot.ts`; при полном прохождении — награды, level-up, прогресс квестов; при поражении — удаление run.

### Прогресс
- XP по таблицам в `lib/game/progression.ts`; формула уровня из GDD в `lib/game/levelUp.ts` (xpForLevel). При уровне: +5 статов, раз в 5 уровней +1 скиллпоинт, золото 100*level, полное восстановление HP.

### Инвентарь и экипировка
- `GET /api/inventory` — список предметов персонажа. Экипировка/снятие — `POST /api/inventory/equip`, `POST /api/inventory/unequip`; при смене пересчитывается `armor` персонажа (сумма из экипировки).

### Магазин
- Список предметов по уровню персонажа — `GET /api/shop/items`. Покупка за золото — `POST /api/shop/buy`. Ремонт — `POST /api/shop/repair` (стоимость 10% от цены за восстановление durability). Апгрейд — `POST /api/shop/upgrade` (шанс успеха 75% − 5%*уровень; при провале — остаётся, −1 уровень или уничтожение).

### Ежедневные квесты
- Типы: pvp_wins, dungeons_complete. Прогресс обновляется в `lib/game/quests.ts` при PvP (победа) и при завершении подземелья. При progress ≥ target — начисление наград (золото, XP, гемы на user), completed = true. Список квестов на день — `GET /api/quests/daily`.

### Сезоны и лидерборд
- Текущий сезон — `lib/db/season.ts`: getOrCreateCurrentSeason(). Лидерборд — `GET /api/leaderboard` (топ по `pvp_rating`, опционально season).

---

## 6. API Endpoints (справочник)

| Метод | Путь | Назначение |
|-------|------|------------|
| POST | /api/auth/sync-user | Создать/обновить запись в users по auth.uid (email, username) |
| GET | /api/characters | Список персонажей текущего пользователя |
| POST | /api/characters | Создать персонажа (characterName, class) |
| GET | /api/characters/[id] | Персонаж по id (с регеном стамины, экипировкой) |
| POST | /api/combat/simulate | Симуляция боя (player, opponentPreset или статы; без сохранения) |
| POST | /api/dungeons/start | Старт подземелья (characterId, difficulty); списание стамины, создание run |
| POST | /api/dungeons/run/[id]/fight | Один бой в run; награды, лут, переход этажа или завершение |
| GET | /api/inventory | Инвентарь персонажа (characterId) |
| POST | /api/inventory/equip | Надеть предмет (characterId, inventoryId, slot) |
| POST | /api/inventory/unequip | Снять предмет (characterId, inventoryId) |
| GET | /api/leaderboard | Топ по pvp_rating (query: limit, season) |
| POST | /api/pvp/find-match | Найти бой (characterId); симуляция, ELO, награды, квесты |
| GET | /api/quests/daily | Ежедневные квесты персонажа (characterId); создание на день при отсутствии |
| GET | /api/shop/items | Список товаров по уровню (characterId, level) |
| POST | /api/shop/buy | Купить предмет за золото (characterId, itemId) |
| POST | /api/shop/repair | Починить предмет (characterId, inventoryId) |
| POST | /api/shop/upgrade | Улучшить предмет (characterId, inventoryId) |
| POST | /api/stamina/refill | Рефилл стамины за гемы (characterId, size: small/medium/large) |

---

*Документ актуален к состоянию кодовой базы на момент создания. При изменении схемы или API обновляй этот файл.*
