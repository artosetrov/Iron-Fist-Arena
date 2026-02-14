# Iron Fist Arena — база знаний проекта

Документ описывает реализованную структуру, БД, переменные окружения, логику систем и API. Используется как единый источник истины для разработки и для AI (см. правило в `.cursor/rules/project-knowledge.mdc`).

**Последнее обновление:** 14 февраля 2026

---

## 1. Описание проекта

- **Название:** Iron Fist Arena
- **Жанр:** браузерная PvP RPG, пошаговый бой, асинхронный PvP (игрок против AI-копии билда противника)
- **Стек:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Supabase (Auth + PostgreSQL), Prisma ORM
- **Мониторинг:** Sentry (client + server + edge), Vercel Analytics, Speed Insights
- **Тестирование:** Vitest (25 unit/component test files, 322 теста), Playwright (E2E)
- **Геймдизайн:** полный GDD в `docs/iron_fist_arena_gdd.md`; правило по GDD — `.cursor/rules/iron-fist-arena-gdd.mdc`

---

## 2. Переменные окружения

| Переменная | Назначение |
|------------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL проекта Supabase (публичный) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Публичный anon-ключ Supabase (клиент и middleware) |
| `DATABASE_URL` | Строка подключения PostgreSQL для Prisma (Supabase pooler) |
| `DIRECT_URL` | Прямое подключение к PostgreSQL для Prisma-миграций |
| `SUPABASE_SERVICE_ROLE_KEY` | (Опционально) Сервисный ключ Supabase для админ-операций |
| `NEXT_PUBLIC_SENTRY_DSN` | DSN Sentry для мониторинга ошибок |
| `SENTRY_ORG` | Организация Sentry |
| `SENTRY_PROJECT` | Проект Sentry |

Секреты не хранить в коде и не коммитить в репозиторий. Шаблон — `.env.example`.

---

## 3. База данных: таблицы и поля

Маппинг Prisma → БД: имена в БД в **snake_case** (см. `prisma/schema.prisma`, `@map()`).

### 3.1 Таблицы

**users**
- `id` — UUID, PK (= `auth.uid` из Supabase Auth)
- `email`, `username` — уникальные
- `password_hash`, `auth_provider`, `gems`, `premium_until`, `role` (default: "player")
- `created_at`, `last_login`, `is_banned`, `ban_reason`

**characters**
- `id` — UUID, PK, default gen_random_uuid()
- `user_id` — FK → users(id), ON DELETE CASCADE
- `character_name` — UNIQUE
- `class` — enum CharacterClass: warrior, rogue, mage, tank
- `origin` — enum CharacterOrigin: human, orc, skeleton, demon, dogfolk (default: human)
- `level`, `current_xp`, `prestige_level`, `stat_points_available`
- 8 основных статов: `strength`, `agility`, `vitality`, `endurance`, `intelligence`, `wisdom`, `luck`, `charisma` (default: 10)
- `gold` (default: 500), `arena_tokens`
- `max_hp`, `current_hp`, `armor`, `magic_resist`, `combat_stance` (JSONB)
- `current_stamina`, `max_stamina`, `last_stamina_update`
- `bonus_trainings`, `bonus_trainings_date`, `bonus_trainings_buys` — система бонусных тренировок
- `pvp_rating` (default: 0), `pvp_wins`, `pvp_losses`, `pvp_win_streak`, `pvp_loss_streak`, `highest_pvp_rank`
- `gold_mine_slots` — купленные слоты Gold Mine
- `created_at`, `last_played`
- Индексы: (user_id), (pvp_rating DESC), (level DESC)

**items**
- `id`, `catalog_id` (UNIQUE), `item_name`, `item_type`, `rarity`, `item_level`, `base_stats` (JSONB)
- `special_effect`, `unique_passive`, `class_restriction`, `set_name`
- `buy_price`, `sell_price`, `description`, `image_url`, `created_at`

**equipment_inventory**
- `id`, `character_id` (FK → characters), `item_id` (FK → items)
- `upgrade_level`, `durability`, `max_durability`, `is_equipped`, `equipped_slot` (enum)
- `rolled_stats` (JSONB), `acquired_at`
- Индексы: (character_id), (character_id, is_equipped), (item_id)

**consumable_inventory**
- `id`, `character_id` (FK → characters), `consumable_type` (enum), `quantity`, `acquired_at`
- UNIQUE(character_id, consumable_type)

**pvp_matches**
- `id`, `player1_id`, `player2_id` (FK → characters)
- `player1_rating_before/after`, `player2_rating_before/after`
- `winner_id`, `loser_id`, `combat_log` (JSONB), `match_duration`, `turns_taken`
- `player1_gold_reward`, `player2_gold_reward`, `player1_xp_reward`, `player2_xp_reward`
- `match_type`, `season_number`, `played_at`
- Индексы: (player1_id, played_at DESC), (player2_id, played_at DESC), (season_number, played_at DESC), (match_type, played_at DESC), (winner_id)

**dungeon_progress**
- `id`, `character_id`, `dungeon_id`, `boss_index`, `completed`
- UNIQUE(character_id, dungeon_id)

**dungeon_runs**
- `id`, `character_id`, `difficulty`, `current_floor`, `state` (JSONB), `seed`, `created_at`
- Индексы: (character_id), (character_id, difficulty)

**legendary_shards**
- `id`, `character_id` (UNIQUE FK → characters), `shard_count`, `updated_at`

**training_sessions**
- `id`, `character_id`, `xp_awarded`, `won`, `turns`, `opponent_type`, `played_at`
- Индекс: (character_id, played_at)

**gold_mine_sessions**
- `id`, `character_id`, `slot_index`, `started_at`, `ends_at`, `collected`, `reward`, `boosted`, `created_at`
- Индексы: (character_id), (character_id, collected)

**minigame_sessions**
- `id`, `character_id`, `game_type`, `bet_amount`, `secret_data`, `status`, `result`, `created_at`
- Индексы: (character_id), (character_id, status)

**seasons**
- `id`, `number` (UNIQUE), `theme`, `start_at`, `end_at`, `created_at`

**daily_quests**
- `id`, `character_id`, `quest_type`, `progress`, `target`, `reward_gold`, `reward_xp`, `reward_gems`, `completed`, `day`, `created_at`
- UNIQUE(character_id, quest_type, day)

**battle_pass** (схема готова, API пока не реализован)
- `id`, `character_id`, `season_id` (FK → seasons), `premium`, `bp_xp`, `created_at`, `updated_at`

**cosmetics** (схема готова, API пока не реализован)
- `id`, `user_id` (FK → users), `type`, `ref_id`, `created_at`

**design_tokens**
- `id` (default: "global"), `tokens` (JSONB), `updated_at`, `updated_by`

### 3.2 Enum-типы (PostgreSQL)

- `CharacterClass`: warrior, rogue, mage, tank
- `CharacterOrigin`: human, orc, skeleton, demon, dogfolk
- `ItemType`: weapon, helmet, chest, gloves, legs, boots, accessory, amulet, belt, relic, necklace, ring
- `Rarity`: common, uncommon, rare, epic, legendary
- `EquippedSlot`: weapon, weapon_offhand, helmet, chest, gloves, legs, boots, accessory, amulet, belt, relic, necklace, ring
- `ConsumableType`: stamina_potion_small, stamina_potion_medium, stamina_potion_large

---

## 4. Структура проекта

```
BumWars/
├── app/
│   ├── (auth)/                        — auth роуты (login, register, forgot-password, reset-password, onboarding)
│   ├── (game)/                        — игровые роуты (hub, arena, combat, dungeon, inventory, shop, settings, leaderboard, minigames, admin)
│   ├── api/                           — 50+ Route Handlers (см. раздел 6)
│   ├── auth/callback/route.ts         — OAuth callback
│   ├── character/page.tsx             — страница персонажа
│   ├── components/                    — UI и игровые компоненты (~25 шт)
│   │   ├── ui/                        — GameButton, GameCard, GameBadge, GameIcon, GameModal, GameSection, PageContainer, ProgressBar, CardCarousel
│   │   ├── CombatBattleScreen.tsx     — экран боя с VFX
│   │   ├── CombatResultModal.tsx      — результат боя
│   │   ├── CombatLootScreen.tsx       — экран лута
│   │   ├── BodyZoneDiagram.tsx        — диаграмма зон тела
│   │   ├── StanceSelector.tsx         — выбор боевой стойки
│   │   ├── HeroCard.tsx               — карточка героя
│   │   ├── GameSidebar.tsx            — боковая панель навигации
│   │   └── ...                        — NavigationLoader, HubWeatherFx, FormInput и др.
│   ├── hooks/useCharacterAvatar.ts
│   ├── layout.tsx, page.tsx, globals.css, loading.tsx, error.tsx, not-found.tsx
├── lib/
│   ├── db/db.ts                       — синглтон Prisma Client
│   ├── db/season.ts                   — getOrCreateCurrentSeason()
│   ├── game/
│   │   ├── abilities.ts               — способности классов (Warrior, Rogue, Mage, Tank)
│   │   ├── balance.ts                 — все балансовые константы
│   │   ├── body-zones.ts             — система зон тела (head, chest, legs)
│   │   ├── boss-abilities.ts         — способности боссов подземелий
│   │   ├── boss-catalog.ts           — каталог боссов
│   │   ├── combat.ts                 — runCombat(), buildCombatantState()
│   │   ├── combat-vfx-map.ts         — VFX маппинг для анимаций боя
│   │   ├── consumable-catalog.ts     — каталог расходников
│   │   ├── damage.ts                 — физ/маг урон, крит, додж, зоны тела
│   │   ├── date-utils.ts             — утилиты дат (startOfTodayUTC)
│   │   ├── dungeon.ts                — генерация этажей, комнат, врагов
│   │   ├── dungeon-data.ts           — данные подземелий (id, названия, боссы)
│   │   ├── dungeon-rush.ts           — Dungeon Rush мини-игра
│   │   ├── elo.ts                    — ELO рейтинг (K=32, старт 0)
│   │   ├── equipment-stats.ts        — агрегация статов экипировки
│   │   ├── item-catalog.ts           — каталог предметов
│   │   ├── levelUp.ts                — checkLevelUp(), applyLevelUp()
│   │   ├── loot.ts                   — rollRarity(), rollDropChance()
│   │   ├── lore.ts                   — лор мира
│   │   ├── origins.ts                — расы и их бонусы
│   │   ├── potion-catalog.ts         — каталог зелий
│   │   ├── preload-combat-assets.ts  — предзагрузка ассетов боя
│   │   ├── progression.ts            — xpForLevel(), XP/gold rewards
│   │   ├── quests.ts                 — updateDailyQuestProgress()
│   │   ├── set-bonuses.ts            — сетовые бонусы экипировки
│   │   ├── stamina.ts                — реген, затраты, spendStamina(), applyRegen()
│   │   ├── stats.ts                  — производные статы (HP, крит, додж, броня)
│   │   ├── stat-training.ts          — стоимость тренировки статов
│   │   ├── types.ts                  — BaseStats, DerivedStats, CombatantState, etc.
│   │   ├── weapon-affinity.ts        — совместимость оружия и классов
│   │   └── minigames/                — Shell Game, Gold Mine
│   ├── hooks/useAdminGuard.ts        — защита админ-роутов
│   ├── supabase/client.ts, server.ts, middleware.ts
│   ├── design-tokens.ts              — дизайн-токены
│   ├── rate-limit.ts                 — in-memory rate limiter
│   └── settings.ts                   — настройки приложения
├── __tests__/                         — 25 тест-файлов (322 теста)
├── prisma/schema.prisma, seed.ts, migrations/ (17 миграций)
├── middleware.ts                      — проверка auth, редиректы
├── docs/
│   ├── iron_fist_arena_gdd.md         — GDD (3000+ строк)
│   ├── stray-city-hub.md             — описание хаба
│   ├── item-system-design.md         — дизайн системы предметов
│   └── combat-vfx-system.md          — система VFX боя
├── next.config.js                     — Sentry, security headers, bundle analyzer
├── tailwind.config.ts                — кастомные шрифты, дизайн-токены
├── vitest.config.ts, playwright.config.ts
├── sentry.client.config.ts, sentry.server.config.ts, sentry.edge.config.ts
├── .env.example
└── PROJECT_KNOWLEDGE.md              — этот файл
```

---

## 5. Логика основных систем

### Авторизация
- Supabase Auth (email/password + OAuth). После логина вызывается `POST /api/auth/sync-user`: создаётся или обновляется запись в `users` с `id = auth.uid`.
- Middleware защищает игровые роуты (`/hub`, `/arena` и т.д.) — редирект на `/login` без сессии.
- Все API роуты проверяют auth через `supabase.auth.getUser()`.

### Персонаж
- CRUD через `/api/characters`. При создании: имя, класс, раса; стартовые статы 10, золото 500, стамина 100.
- Система рас (origins): human, orc, skeleton, demon, dogfolk — каждая раса даёт уникальные бонусы к статам. Смена расы за золото.

### Боевые стойки и зоны тела
- Игрок выбирает боевую стойку (атака/защита по зонам: head, chest, legs).
- Зоны тела влияют на распределение урона и множители крита/доджа.
- Броня экипировки распределяется по зонам.

### Стамина
- Константы в `lib/game/balance.ts`, расчёт в `lib/game/stamina.ts`.
- Макс 100, реген 1/12 мин. Затраты: PvP 10, подземелье Easy 15 / Normal 20 / Hard 25, босс 40.
- Рефилл за гемы: small/medium/large. Расходники: stamina_potion_small/medium/large.

### Бой
- `lib/game/combat.ts`: `runCombat(playerState, enemyState, playerChoices)`.
- Порядок хода по AGI; формулы урона в `damage.ts`; способности классов в `abilities.ts`.
- Статусы: stun, bleed, burn и др. Лимит 15 ходов.
- VFX система (`combat-vfx-map.ts`) для анимаций ударов, способностей, критов.
- Совместимость оружия и классов (`weapon-affinity.ts`).
- Сетовые бонусы экипировки (`set-bonuses.ts`).

### Тренировка
- `POST /api/combat/simulate` — бой с тренировочным манекеном (XP, без лута).
- Дневной лимит тренировок + покупка бонусных за гемы (`POST /api/combat/buy-extra`).
- Тренировка статов за золото: экспоненциальная стоимость `floor(50 × 1.03^stat)`.

### PvP
- `POST /api/pvp/find-match`: выбор противника по ELO (±100), снимок статов, симуляция боя.
- Запись в `pvp_matches`, пересчёт ELO (K=32), начисление золота/XP, level-up, прогресс квестов.
- Anti-loss-streak: отслеживание серий поражений.
- Ранги: Bronze–Grandmaster.

### Подземелья
- 3 типа: основные подземелья, Dungeon Rush (мини-игра), боссы.
- Генерация комнат и врагов — `lib/game/dungeon.ts`. Боссы — `boss-catalog.ts`, `boss-abilities.ts`.
- Прогресс подземелий сохраняется в `dungeon_progress` (per dungeon per character).
- Лут по `lib/game/loot.ts` с учётом Luck.

### Мини-игры
- **Shell Game** (`/minigames/shell-game`) — угадай стакан, ставка золотом.
- **Gold Mine** (`/minigames/gold-mine`) — пассивная добыча золота по слотам с таймером, буст за гемы.
- **Dungeon Rush** (`/minigames/dungeon-rush`) — быстрые последовательные бои в подземелье.

### Инвентарь и экипировка
- 12 слотов: weapon, weapon_offhand, helmet, chest, gloves, legs, boots, accessory, amulet, belt, relic, necklace, ring.
- Экипировка/снятие пересчитывает armor, magic_resist и производные статы.
- Продажа предметов за gold.
- Расходники (ConsumableInventory): зелья стамины 3 размеров.

### Магазин
- Предметы по уровню, покупка за золото, ремонт (10% цены), апгрейд (+0…+10 с шансами).
- Покупка зелий, расходников, золота за гемы.

### Ежедневные квесты
- Типы: pvp_wins, dungeons_complete. Автопрогресс при PvP/подземельях.
- Награды: золото, XP, гемы.

### Сезоны и лидерборд
- Текущий сезон — `lib/db/season.ts`. Лидерборд по pvp_rating.

### Админка
- `/admin` — панель управления с табами: Players, Matches, Economy, Characters, Balance Editor, Design System, Dev Dashboard.
- API: `/api/admin/users`, `/api/admin/matches`, `/api/admin/economy`, `/api/admin/characters`.
- Dev: `/api/dev/balance`, `/api/dev/tests`, `/api/dev/stats`, `/api/dev/health`.

### Дизайн-система
- Динамические дизайн-токены в БД (`design_tokens`). Редактор в админке.
- DesignTokenProvider для применения в runtime.

---

## 6. API Endpoints (справочник)

### Auth
| Метод | Путь | Назначение | Rate Limit |
|-------|------|------------|------------|
| POST | /api/auth/sync-user | Синхронизация users с auth.uid | 10/мин |

### User
| Метод | Путь | Назначение | Rate Limit |
|-------|------|------------|------------|
| GET | /api/me | Текущий пользователь | — |
| POST | /api/user/password | Изменение пароля | 5/мин |
| POST | /api/user/email | Изменение email | 3/мин |

### Characters
| Метод | Путь | Назначение | Rate Limit |
|-------|------|------------|------------|
| GET | /api/characters | Список персонажей | — |
| POST | /api/characters | Создать персонажа | 3/мин |
| GET | /api/characters/[id] | Персонаж по id | — |
| POST | /api/characters/[id]/allocate-stats | Распределить статы | + |
| POST | /api/characters/[id]/stance | Установить стойку | — |
| PATCH | /api/characters/[id]/origin | Сменить расу | 3/мин |

### Combat
| Метод | Путь | Назначение | Rate Limit |
|-------|------|------------|------------|
| POST | /api/combat/simulate | Тренировочный бой | 5/10с |
| GET | /api/combat/status | Статус тренировок на сегодня | — |
| POST | /api/combat/buy-extra | Купить бонусные тренировки | + |

### PvP
| Метод | Путь | Назначение | Rate Limit |
|-------|------|------------|------------|
| POST | /api/pvp/find-match | Найти и провести PvP бой | 3/10с |
| GET | /api/pvp/opponents | Список оппонентов | — |

### Dungeons
| Метод | Путь | Назначение | Rate Limit |
|-------|------|------------|------------|
| GET | /api/dungeons | Список подземелий | — |
| POST | /api/dungeons/start | Начать подземелье | 3/10с |
| POST | /api/dungeons/run/[id]/fight | Бой в подземелье | + |

### Dungeon Rush
| Метод | Путь | Назначение | Rate Limit |
|-------|------|------------|------------|
| POST | /api/dungeon-rush/start | Начать Dungeon Rush | 3/10с |
| POST | /api/dungeon-rush/fight | Бой в Rush | + |
| GET | /api/dungeon-rush/status | Статус сессии | — |
| POST | /api/dungeon-rush/abandon | Отменить сессию | + |

### Inventory
| Метод | Путь | Назначение | Rate Limit |
|-------|------|------------|------------|
| GET | /api/inventory | Инвентарь персонажа | — |
| POST | /api/inventory/equip | Надеть предмет | 10/5с |
| POST | /api/inventory/unequip | Снять предмет | 10/5с |
| POST | /api/inventory/sell | Продать предмет | 10/5с |

### Consumables
| Метод | Путь | Назначение | Rate Limit |
|-------|------|------------|------------|
| GET | /api/consumables | Список расходников | — |
| POST | /api/consumables/use | Использовать расходник | + |

### Shop
| Метод | Путь | Назначение | Rate Limit |
|-------|------|------------|------------|
| GET | /api/shop/items | Список товаров по уровню | — |
| POST | /api/shop/buy | Купить предмет | 10/5с |
| POST | /api/shop/buy-potion | Купить зелье | + |
| POST | /api/shop/buy-consumable | Купить расходник | + |
| POST | /api/shop/buy-gold | Купить золото за гемы | + |
| POST | /api/shop/repair | Починить предмет | 10/10с |
| POST | /api/shop/upgrade | Улучшить предмет | 5/5с |

### Stamina
| Метод | Путь | Назначение | Rate Limit |
|-------|------|------------|------------|
| POST | /api/stamina/refill | Рефилл стамины за гемы | 5/10с |

### Minigames
| Метод | Путь | Назначение | Rate Limit |
|-------|------|------------|------------|
| POST | /api/minigames/shell-game | Shell Game (ставка/угадывание) | + |
| GET | /api/minigames/gold-mine | Статус Gold Mine | + |
| POST | /api/minigames/gold-mine/buy-slot | Купить слот | + |
| POST | /api/minigames/gold-mine/collect | Собрать награду | + |
| POST | /api/minigames/gold-mine/boost | Буст добычи | + |

### Quests
| Метод | Путь | Назначение | Rate Limit |
|-------|------|------------|------------|
| GET | /api/quests/daily | Ежедневные квесты | — |

### Leaderboard
| Метод | Путь | Назначение | Rate Limit |
|-------|------|------------|------------|
| GET | /api/leaderboard | Топ по pvp_rating | — |

### Admin
| Метод | Путь | Назначение | Rate Limit |
|-------|------|------------|------------|
| GET/POST | /api/admin/users | Управление пользователями | + |
| GET | /api/admin/matches | Матчи | + |
| GET | /api/admin/economy | Экономика | + |
| GET | /api/admin/characters | Персонажи | + |

### Dev
| Метод | Путь | Назначение | Rate Limit |
|-------|------|------------|------------|
| GET/POST | /api/dev/balance | Баланс тестирование | + |
| GET | /api/dev/tests | Тесты | + |
| GET | /api/dev/stats | Статистика | + |
| GET | /api/dev/health | Health check | + |

### Design Tokens
| Метод | Путь | Назначение | Rate Limit |
|-------|------|------------|------------|
| GET/POST | /api/design-tokens | Дизайн-токены | — |

---

## 7. Безопасность

- Все API роуты проверяют auth через `supabase.auth.getUser()`
- In-memory rate limiting на критичных роутах (`lib/rate-limit.ts`)
- Security headers в `next.config.js`: X-Frame-Options, X-Content-Type-Options, CSP, Permissions-Policy
- Prisma ORM — параметризованные запросы, нет SQL injection
- `.gitignore` защищает `.env`, `.env.local`
- `SUPABASE_SERVICE_ROLE_KEY` не используется в клиентском коде

---

## 8. Тестирование

- **Unit тесты** (Vitest): combat, damage, abilities, body-zones, elo, dungeon, loot, progression, stamina, stats, equipment, origins, weapon-affinity, stat-training, dungeon-rush, levelUp
- **Component тесты**: GameButton, GameCard, GameBadge, ProgressBar
- **API тесты**: api-combat-simulate
- **E2E** (Playwright): настроен, конфиг в `playwright.config.ts`
- Все 322 теста проходят ✓

---

*Документ актуален к состоянию кодовой базы на 14 февраля 2026. При изменении схемы или API обновляй этот файл.*
