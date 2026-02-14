# Iron Fist Arena

Browser-based PvP RPG with turn-based combat, asynchronous PvP, and dungeon crawling.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** Supabase (PostgreSQL + Auth)
- **Monitoring:** Sentry, Vercel Analytics
- **Testing:** Vitest (322 unit tests), Playwright (E2E)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase project (for database and auth)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Fill in your Supabase credentials in .env.local

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed database with initial items
npm run db:seed

# Start development server
npm run dev
```

### Environment Variables

See `.env.example` for required variables:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `DATABASE_URL` — PostgreSQL connection string (pooler)
- `DIRECT_URL` — PostgreSQL direct connection (for migrations)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript type check |
| `npm run test` | Run unit tests |
| `npm run test:watch` | Tests in watch mode |
| `npm run test:coverage` | Tests with coverage |
| `npm run test:e2e` | E2E tests (Playwright) |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to DB |
| `npm run db:migrate` | Run migrations |
| `npm run db:seed` | Seed database |

## Game Features

- **4 Character Classes:** Warrior, Rogue, Mage, Tank
- **5 Races:** Human, Orc, Skeleton, Demon, Dogfolk
- **Turn-based Combat:** Body zones, stances, abilities, status effects, VFX
- **PvP Arena:** ELO rating, ranks (Bronze to Grandmaster), seasonal rewards
- **Dungeons:** Procedural generation, bosses, loot system
- **Minigames:** Shell Game, Gold Mine, Dungeon Rush
- **Equipment:** 12 slots, upgrade system, set bonuses, weapon affinity
- **Consumables:** Stamina potions, crafting materials
- **Stat Training:** Exponential cost progression, daily limits
- **Daily Quests:** Auto-tracking, gold/XP/gem rewards
- **Admin Panel:** Player management, economy dashboard, balance editor

## Documentation

- **Game Design Document:** `docs/iron_fist_arena_gdd.md`
- **Project Knowledge Base:** `PROJECT_KNOWLEDGE.md`
- **Item System Design:** `docs/item-system-design.md`
- **Combat VFX System:** `docs/combat-vfx-system.md`
- **Hub Design:** `docs/stray-city-hub.md`

## Project Structure

```
app/           — Pages, components, API routes (Next.js App Router)
lib/           — Game logic, database, Supabase clients, utilities
prisma/        — Schema, migrations, seed
__tests__/     — Unit and component tests
docs/          — Design documents
public/        — Static assets
```

## License

Private — All rights reserved.
