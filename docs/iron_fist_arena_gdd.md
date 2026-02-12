# GAME DESIGN DOCUMENT
## Browser-Based PvP RPG: "IRON FIST ARENA"

**Version:** 3.0  
**Document Date:** February 12, 2026  
**Status:** Production-Ready Master Document (Synced with codebase)  
**Platform:** Web (Desktop + Mobile Responsive)  
**Tech Stack:** React/Next.js + Supabase/PostgreSQL

---

# TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Core Mechanics](#core-mechanics)
3. [Player Progression](#player-progression)
4. [Stamina System](#stamina-system)
5. [Dungeon System (PvE)](#dungeon-system)
6. [PvP Arena](#pvp-arena)
7. [Economy Design](#economy-design)
8. [Item System](#item-system)
9. [Monetization Model](#monetization-model)
10. [UX & UI Structure](#ux-ui-structure)
11. [Technical Architecture](#technical-architecture)
12. [Balancing](#balancing-section)
13. [Live Ops Strategy](#live-ops-strategy)

---

# 1. EXECUTIVE SUMMARY

## 1.1 Elevator Pitch

**"Iron Fist Arena"** is a browser-based competitive PvP brawler combining turn-based tactical combat with MMORPG progression depth. Players build fighters, battle in ranked arenas, conquer dungeons, and climb leaderboards—all designed for 5-minute bursts or hour-long sessions. Fair monetization focused on convenience over power ensures competitive integrity while delivering profitability.

## 1.2 Target Audience

### Primary Demographic
- **Age:** 18-35 years old
- **Gender:** 70% male, 30% female
- **Gaming Experience:** Mid-core to hardcore
- **Platform:** Desktop (60%), Mobile (40%)
- **Session Length:** 5-30 minutes, 2-5 sessions daily
- **Spending Behavior:** $5-50/month willingness

### Psychographic Profile
- **Competitive:** Enjoy skill-based PvP, leaderboard climbing
- **Optimizers:** Love min-maxing builds and theorycrafting
- **Achievement-Driven:** Want measurable, visible progress
- **Time-Conscious:** Value meaningful progress in short sessions
- **Social:** Engage with guilds, friends, and community

## 1.3 Core Gameplay Loop

### Micro Loop (5-15 minutes)
```
Login → Claim Daily Rewards → Spend Stamina (PvP/PvE) → 
Upgrade Equipment → Check Leaderboard → Logout
```

### Meso Loop (1-7 days)
```
Daily Quests → Arena Ranking Grind → Equipment Farming → 
Build Optimization → League Progression → Events
```

### Macro Loop (30-90 days)
```
Season Climb → Prestige Reset → Meta Evolution → 
Endgame Content → Seasonal Rewards
```

## 1.4 Unique Selling Points

**1. Zero Download, Maximum Depth**
- Full RPG experience, no installation
- Seamless cross-device (desktop ↔ mobile)
- Instant play in <3 seconds

**2. Fair Monetization**
- No pay-to-win in PvP
- Premium accelerates progression, doesn't guarantee victory
- Free players can reach top rankings

**3. Async PvP Innovation**
- Fight AI-controlled real player builds
- No waiting for opponents
- Every fight impacts both players' stats

**4. Stamina Respects Time**
- Designed for working professionals
- Multiple activity options
- No FOMO mechanics

**5. Build Diversity Through Math**
- 8 core stats with meaningful breakpoints
- Non-linear scaling creates distinct archetypes
- Player-driven meta evolution

## 1.5 Market Positioning

| Competitor | Our Advantage |
|-----------|---------------|
| **RuneScape** | Faster pace, modern UX, mobile-optimized |
| **Idle Champions** | Active combat, competitive PvP focus |
| **Torn City** | Better combat system, modernized graphics |
| **BitHeroes** | Deeper progression, better PvP balance |
| **Melvor Idle** | Direct PvP competition, faster feedback |

**Revenue Target:** $200K+ monthly at scale (0.1% market share of $200M niche)

---

# 2. CORE MECHANICS

## 2.1 Combat System

### Combat Architecture: Asynchronous Turn-Based

**Model:** Hybrid async turn resolution
- Players queue actions against AI-controlled opponent builds
- Each turn resolves in real-time (1-second animations)
- Combat feels active despite discrete turn calculations
- Identical engine for PvP and PvE

### Combat Flow
```
INITIALIZATION
  ↓
[Turn N] Player Action → Enemy Action
  ↓
Damage Resolution → Status Effects → Turn Effects
  ↓
Speed Check (Who Acts First Next Turn?)
  ↓
Repeat Until: HP ≤ 0 OR Turn Limit (15 turns)
  ↓
Victory/Defeat → Rewards
```

### Core Stats System

| Stat | Symbol | Primary Effect | Secondary Effect | Soft Cap | Hard Cap |
|------|--------|----------------|------------------|----------|----------|
| **Strength** | STR | Physical Damage | Critical Damage% | 300 | 999 |
| **Agility** | AGI | Dodge, Speed | Critical Chance% | 250 | 999 |
| **Vitality** | VIT | Max HP | HP Regen | 400 | 999 |
| **Endurance** | END | Physical Defense | Status Resist | 300 | 999 |
| **Intelligence** | INT | Magic Damage | Mana Pool | 300 | 999 |
| **Wisdom** | WIS | Magic Defense | Effect Duration | 250 | 999 |
| **Luck** | LCK | Loot Quality, Crit% | Gold Find% | 200 | 999 |
| **Charisma** | CHA | Shop Prices | NPC Interaction | 150 | 999 |

**Starting Stats (Level 1):** All stats = 10  
**Stats Per Level:** 5 points to distribute freely

### Damage Formulas

#### Physical Damage
```
Base_Damage = (Attacker_STR × Skill_Multiplier) - (Defender_END × 0.5)

Effective_Damage = Base_Damage × (1 - Armor_Reduction) × Critical_Multiplier × Random_Variance

Where:
- Skill_Multiplier = 1.0 (basic) to 3.5 (ultimate)
- Armor_Reduction = MIN(0.75, Armor / (Armor + 100))
- Critical_Multiplier = 1.5 + (STR / 500) if crit, else 1.0
- Random_Variance = Random(0.95, 1.05)
```

**Example:**
```
Level 10 Fighter (STR 85, END 60) attacks Level 10 Tank (END 120, Armor 45)

Base_Damage = (85 × 1.0) - (120 × 0.5) = 25
Armor_Reduction = 45/(45+100) = 0.31
Effective_Damage = 25 × (1 - 0.31) × 1.0 × 1.02 = 18 damage
```

#### Magic Damage
```
Base_Magic_Damage = (Attacker_INT × Spell_Multiplier) - (Defender_WIS × 0.4)

Effective_Magic_Damage = Base_Magic_Damage × (1 - Magic_Resist) × Critical_Multiplier × Element_Modifier

Where:
- Spell_Multiplier = 1.2 to 4.0
- Magic_Resist = MIN(0.70, WIS / (WIS + 150))
- Element_Modifier = 1.3 (advantage), 1.0 (neutral), 0.7 (disadvantage)
```

### Critical Hit System

```
Crit_Chance_% = Base_Crit + (AGI / 10) + (LCK / 15) + Equipment_Bonus
Base_Crit = 5%
Max Crit_Chance = 50%

Crit_Damage_Multiplier = 1.5 + (STR / 500) + (Equipment% / 100)
Max Crit_Damage = 2.8x
```

**Example:**
```
Player: AGI 150, LCK 80, Equipment +8% Crit
Crit_Chance = 5% + 15 + 5.33 + 8% = 33.33%
```

### Dodge Mechanics

```
Dodge_Chance_% = Base_Dodge + (AGI / 8) + Equipment_Bonus
Base_Dodge = 3%
Max Dodge = 40%
```

| Level | AGI | Equipment | Dodge % |
|-------|-----|-----------|---------|
| 1 | 10 | 0% | 4.25% |
| 10 | 60 | 2% | 10.5% |
| 20 | 130 | 5% | 24.25% |
| 50 | 280 | 12% | 40% (cap) |

**Dodge Resolution:**
```
IF Random(1, 100) ≤ Dodge_Chance:
    Damage = 0
    Display: "DODGE!"
    Attacker loses momentum (-10% next attack)
ELSE:
    Apply full damage calculation
```

### Armor Calculation

```
Damage_Reduction_% = Armor / (Armor + 100)

Diminishing returns curve:
- 50 Armor = 33.3% reduction
- 100 Armor = 50% reduction
- 200 Armor = 66.7% reduction
- 400 Armor = 80% reduction (practical cap)
```

### Status Effects

| Effect | Duration | Chance | Effect Details |
|--------|----------|--------|----------------|
| **Bleed** | 3 turns | 15%+(STR/50)% | 5% MAX_HP/turn |
| **Poison** | 4 turns | 20%+(INT/40)% | 3% MAX_HP/turn |
| **Stun** | 1 turn | 10%+(STR/60)% | Skip next turn |
| **Burn** | 3 turns | 18%+(INT/45)% | 4% MAX_HP/turn |
| **Slow** | 2 turns | 25%+(INT/50)% | -30% speed |
| **Weaken** | 3 turns | 20% | -25% damage output |
| **Armor Break** | 2 turns | 15% | -40% armor |
| **Blind** | 2 turns | 12%+(AGI/55)% | -50% accuracy |
| **Regen** | 5 turns | Self-buff | +5% MAX_HP/turn |
| **Berserk** | 3 turns | Self-buff | +40% dmg, -20% def |

**Status Resistance:**
```
Resist_Chance_% = (END / 10) + (WIS / 15) + Equipment
Max Resist = 60%
```

### Class Abilities

#### Warrior
1. **Heavy Strike** (Lv5): 2.0x dmg, 15% Stun
2. **Battle Cry** (Lv10): +30% STR, 3 turns
3. **Whirlwind** (Lv15): 1.5x dmg, hits twice
4. **Titan's Slam** (Lv20): 3.5x dmg, 50% Armor Break

#### Rogue
1. **Quick Strike** (Lv5): 1.6x dmg, +20% Crit
2. **Shadow Step** (Lv10): +50% Dodge, 2 turns
3. **Backstab** (Lv15): 2.5x dmg if first
4. **Assassinate** (Lv20): 4.0x dmg, auto-crit if HP<30%

#### Mage
1. **Fireball** (Lv5): 2.2x INT, 18% Burn
2. **Frost Nova** (Lv10): 1.8x INT, 25% Slow
3. **Lightning Strike** (Lv15): 2.8x INT, 10% Stun
4. **Meteor Storm** (Lv20): 3.8x INT, AoE

#### Tank
1. **Shield Bash** (Lv5): 1.4x dmg, taunt
2. **Iron Wall** (Lv10): +80% armor, 3 turns
3. **Counter Strike** (Lv15): Reflect 40% damage
4. **Immovable Object** (Lv20): Immune to stun/slow, +60% resist, 4 turns

### PvP Balancing

**Rating-Based Stat Scaling:**
```
IF (Rating_Difference > 200):
    Lower_Player_Stats *= 1 + (Rating_Diff / 2000)
Max Boost: +20% at 400+ rating difference
```

**Anti-Steamroll:**
```
IF (HP_Difference > 60%):
    Losing_Player gets:
        +15% damage
        +10% crit chance
        +50% status duration
```

**Turn Limit:** 15 turns max
- If no winner: Higher %HP wins
- If tied: Draw (reduced rewards)

**Class Balance Matrix** (Target Win Rates):

| Attacker → | Warrior | Rogue | Mage | Tank |
|-----------|---------|-------|------|------|
| **Warrior** | 50% | 45% | 55% | 40% |
| **Rogue** | 55% | 50% | 40% | 60% |
| **Mage** | 45% | 60% | 50% | 35% |
| **Tank** | 60% | 40% | 65% | 50% |

### PvE Scaling

```
Monster_HP = Player_Avg_HP × Difficulty_Mult
Monster_Damage = Player_Avg_Damage × (Difficulty_Mult × 0.85)
Monster_Armor = Player_Avg_Armor × 0.7

Difficulty_Multipliers:
- Easy: 0.7
- Normal: 1.0
- Hard: 1.4
- Elite: 2.0
- Boss: 3.5
```

**Dynamic Difficulty:**
```
IF (Win_Rate_Last_10 > 85%):
    Monster_Stats += 5% (max +25%)
    
IF (Win_Rate_Last_10 < 40%):
    Monster_Stats -= 5% (max -20%)
```

**Boss Phases:**
- **Phase 1** (100-60% HP): Normal, 1 ability/3 turns
- **Phase 2** (60-30% HP): +20% dmg, ability/2 turns, summon minion
- **Phase 3** (<30% HP): +40% dmg, enrage, ability/turn, stun immunity

---

# 3. PLAYER PROGRESSION

## 3.1 Experience (XP) System

### XP Sources

| Activity | Base XP | Scaling | Notes |
|----------|---------|---------|-------|
| PvP Win | 100 | ×(1 + Enemy_Level/50) | Bonus for higher levels |
| PvP Loss | 30 | ×(1 + Enemy_Level/50) | Participation reward |
| Easy Dungeon | 80 | ×Floor_Number | Per floor |
| Normal Dungeon | 150 | ×Floor_Number | Per floor |
| Hard Dungeon | 250 | ×Floor_Number | Per floor |
| Boss Kill | 500 | ×Boss_Tier | Major XP spike |
| Daily Quest | 200 | Fixed | Reliable source |
| Weekly Quest | 1,000 | Fixed | Large reward |

### Level Formula

```
XP_Required_For_Level_N = 100 × (N^1.8) + 50 × N

Examples:
- Level 1 → 2: 150 XP
- Level 5 → 6: 1,682 XP
- Level 10 → 11: 6,810 XP
- Level 20 → 21: 32,080 XP
- Level 50 → 51: 318,550 XP
- Level 100 → 101: 2,512,600 XP
```

**Progression Time:**
- Early (1-20): 1-2 hours/level
- Mid (21-50): 3-5 hours/level
- Late (51-100): 8-15 hours/level
- **Total to max:** ~800-1,000 hours

### XP Bonus Multipliers

```
Total_XP = Base_XP × (1 + Premium + Guild + Event + Item_Bonus)

Bonuses:
- Premium (VIP): +50%
- Guild: +10% to +25%
- Event (Double XP): +100%
- Items: +5% to +50%
```

## 3.2 Stat Allocation

### Level-Up Rewards
```
Per Level:
- Stat Points: 5
- Skill Points: 1 (every 5 levels)
- Gold: 100 × Level
- HP: Fully restored
- Stamina: +10 bonus
```

### Build Examples

**Pure Strength Warrior (Level 20):**
```
STR: 105 (95 allocated)
AGI: 20 (10 allocated)
VIT: 40 (30 allocated)
END: 25 (15 allocated)
Others: 10 (base)

Focus: Maximum damage, glass cannon
```

**Balanced Tank (Level 20):**
```
STR: 35 (25 allocated)
AGI: 25 (15 allocated)
VIT: 60 (50 allocated)
END: 55 (45 allocated)
Others: 10-20

Focus: Survivability, moderate damage
```

**Crit Rogue (Level 20):**
```
STR: 50 (40 allocated)
AGI: 75 (65 allocated)
VIT: 30 (20 allocated)
LCK: 40 (30 allocated)
Others: 10

Focus: High crit%, dodge-heavy
```

## 3.3 Prestige System *(PLANNED — Not Yet Implemented)*

**Unlock:** Level 100

### What Resets
- Level → 1
- All stat points
- All skill points
- Equipment must be unequipped (can store in inventory)

### What Persists
- All inventory items
- All gold & gems
- Achievements
- Cosmetics
- Friends & guild
- Titles

### What You Gain
- **Prestige Level +1** (P1, P2, ... P10)
- **+2% to all stats** per prestige (permanent)
- Unique cosmetic border
- Access to prestige-only content
- Prestige currency

**Max Prestige:** 10 (P10)  
**Total Bonus at P10:** +20% all stats

### Time Investment
```
P0 → P1: 800-1,000 hours
P1 → P2: 600-800 hours
P2 → P3: 500-700 hours
...
P9 → P10: 300-400 hours

Total to P10: ~6,000-7,000 hours (hardcore endgame)
```

---

# 4. STAMINA SYSTEM

## 4.1 Core Mechanics

### Base Stamina
```
Max_Stamina = 100 (all players, all levels)
Current_Stamina = 0 to 100
```

**Philosophy:** Fixed pool ensures fairness—no stat advantage.

### Stamina Costs

| Activity | Cost | Duration | Rewards |
|----------|------|----------|---------|
| PvP Match | 10 | 1-2 min | XP, Gold, Rating |
| Easy Dungeon | 15 | 3-5 min | XP, Loot (common) |
| Normal Dungeon | 20 | 5-8 min | XP, Loot (rare) |
| Hard Dungeon | 25 | 8-12 min | XP, Loot (epic) |
| Boss Raid | 40 | 15-20 min | XP, Loot (legendary) |
| Special Event | 30 | 10 min | Event currency |

**Daily Usage:**
- 100 Stamina = 10 PvP OR 5 dungeons OR 2 raids
- Average session: 30-40 minutes

## 4.2 Regeneration

```
Rate: 1 Stamina per 12 minutes
Full Regeneration: 20 hours (0 → 100)

Schedule:
00:00 - 5 Stamina
01:00 - 10 Stamina
...
20:00 - 100 Stamina (full)
```

### Rules
1. **Never Stops:** Even when over cap
2. **No Waste:** Pauses at 100 until spent
3. **Login Bonus:** +20 stamina on first daily login
4. **Overflow Cap:** Max 200 from purchases/rewards

## 4.3 Premium Refills

| Option | Stamina | Cost (Gems) | $ Value | Daily Limit |
|--------|---------|-------------|---------|-------------|
| Small | +25 | 50 | $0.50 | 5 |
| Medium | +50 | 90 | $0.90 | 3 |
| Large | +100 | 150 | $1.50 | 2 |
| Full | To Max | 100 | $1.00 | ∞ |

**Max Daily Spending:**
```
(5 × 50) + (3 × 90) + (2 × 150) = 820 gems = $8.20
```

**Purpose:** Prevents whale dominance, protects players

## 4.4 Anti-Abuse

### Banking Prevention
```
IF Current_Stamina > 100:
    Natural_Regen = OFF
ELSE:
    Natural_Regen = ON
```

### Activity Rate Limiting
```
IF Activities_In_Hour > 40:
    Warning: "Take a break?"
    
IF Activities_In_Hour > 60:
    Soft_Lock: Wait 15 minutes
```

### Suspicious Activity
```
Red Flags:
- Activities <10 sec each
- >95% win rate over 50+ matches
- Bot-like patterns
- Rapid IP changes

Action: Flag for review, -50% stamina earning
```

## 4.5 Progression Comparison

### Free Player
```
Daily Stamina: 120 (100 + 20 bonus)
Usage: 8 PvP + 2 Normal Dungeons
Daily Progression:
- XP: ~1,100
- Gold: ~2,000
- Items: 2-4
- Time: 25-35 minutes
```

### Premium Player
```
Daily Stamina: 220 (120 + 100 refill)
Usage: 16 PvP + 3 Hard Dungeons
Daily Progression:
- XP: ~2,350 (+114%)
- Gold: ~4,500 (+125%)
- Items: 4-8 (higher rarity)
- Time: 50-70 minutes
- Cost: $1.50/day = $45/month
```

### Speed Comparison
```
Time to Level 50:

Free Player:
- XP Needed: ~350,000
- Daily XP: 1,100
- Time: ~7-8 months

Premium Player:
- XP Needed: ~350,000
- Daily XP: 3,525 (with +50% VIP bonus)
- Time: ~3.3 months
- Speed Advantage: 3.2x faster
```

**Conclusion:** Premium significantly faster without breaking balance.

---

# 5. DUNGEON SYSTEM (PvE)

## 5.1 Architecture

### Dungeon Types

**1. Procedural Dungeons** (Daily Randomized)
- Semi-procedural (fixed rooms, randomized enemies/loot)
- 5 floors per run
- Difficulties: Easy, Normal, Hard
- Reset: Daily at 00:00 UTC
- Purpose: Reliable grinding

**2. Static Challenge Dungeons** (Weekly)
- Fixed layout, fixed enemies
- Scales to player level
- Reset: Monday 00:00 UTC
- Purpose: Leaderboard competition

**3. Event Dungeons** (Limited Time)
- Themed, narrative-driven
- Duration: 1-2 weeks
- Special mechanics
- Purpose: Retention, special rewards

### Procedural Generation

```python
def generate_floor(floor_num, difficulty):
    room_count = 5 + (floor_num * 2)  # Floor 1 = 7, Floor 5 = 15
    
    room_types = {
        'combat': 0.60,    # 60% combat
        'treasure': 0.15,  # 15% treasure
        'elite': 0.10,     # 10% elite enemy
        'trap': 0.10,      # 10% trap/puzzle
        'rest': 0.05       # 5% rest (heal 20% HP)
    }
    
    rooms = weighted_random(room_types, room_count - 1)
    rooms.append('boss')  # Boss always final room
    
    return rooms
```

### Enemy Scaling

```
Enemy_Stats_Multiplier = 1.0 + (Floor_Number × 0.15)

Floor 1: 1.0x player stats
Floor 2: 1.15x
Floor 3: 1.30x
Floor 4: 1.45x
Floor 5 (Boss): 2.0x
```

## 5.2 Difficulty Tiers

| Aspect | Easy | Normal | Hard |
|--------|------|--------|------|
| **Stamina** | 15 | 20 | 25 |
| **Enemy HP** | 70% | 100% | 140% |
| **Enemy Damage** | 60% | 100% | 150% |
| **Loot Qty** | 1-2 | 2-3 | 3-5 |
| **Loot Rarity** | C80%, R20% | C50%, R40%, E10% | R50%, E40%, L10% |
| **Gold Mult** | 0.8x | 1.0x | 1.5x |
| **XP Mult** | 0.7x | 1.0x | 1.3x |

### Unlock Conditions
```
Easy: Always available
Normal: Level ≥ 5
Hard: Level ≥ 15 AND Normal completed 10 times
```

## 5.3 Loot System

### Rarity Tiers
```
COMMON (White): 60% base
UNCOMMON (Green): 25%
RARE (Blue): 10%
EPIC (Purple): 4%
LEGENDARY (Orange): 1%
```

### Drop Formula
```
Drop_Roll = Random(1, 1000)
Enhanced_Roll = Drop_Roll + (Player_Luck × 2) + Difficulty_Bonus

Difficulty_Bonus:
- Easy: +0
- Normal: +50
- Hard: +120

IF Enhanced_Roll ≥ 990: LEGENDARY
ELIF Enhanced_Roll ≥ 960: EPIC
ELIF Enhanced_Roll ≥ 900: RARE
ELIF Enhanced_Roll ≥ 750: UNCOMMON
ELSE: COMMON
```

**Example:**
```
Player: Luck 100, Hard Dungeon
Drop_Roll = 850
Enhanced = 850 + 200 + 120 = 1,170
Result: LEGENDARY (≥990)

Note: Max enhanced roll = 1,200
```

### Drop Rates by Tier

**Easy Dungeon:**
```
Per Enemy: 60% for 1 item
Boss: 2-3 items guaranteed
Distribution: 60% C, 30% U, 10% R
```

**Normal Dungeon:**
```
Per Enemy: 50% for 1 item
Boss: 3-4 items guaranteed
Distribution: 30% C, 35% U, 25% R, 8% E, 2% L
```

**Hard Dungeon:**
```
Per Enemy: 70% for 1 item
Boss: 4-5 items guaranteed
Distribution: 10% C, 30% U, 35% R, 20% E, 5% L
```

### Item Stat Ranges

**Common:**
```
Primary Stat: +5 to +15
Secondary: None
Special: None
```

**Uncommon:**
```
Primary: +12 to +25
Secondary: 1 stat, +3 to +10
Special: 10% for +1% bonus
```

**Rare:**
```
Primary: +20 to +45
Secondary: 2 stats, +5 to +15 each
Special: 30% for +2% to +5% bonus
```

**Epic:**
```
Primary: +40 to +80
Secondary: 3 stats, +10 to +25 each
Special: 70% for +5% to +10% bonus
```

**Legendary:**
```
Primary: +75 to +150
Secondary: 4 stats, +20 to +50 each
Special: 100% for +10% to +25% bonus
Unique: Class-specific game-changing passive
```

## 5.4 Boss Mechanics

### Boss Types

**Floors 1-2: Brutes**
- High HP, low complexity
- 1 special ability
- Predictable pattern

**Floors 3-4: Champions**
- Moderate HP, high damage
- 2 special abilities
- Phase transition at 50% HP

**Floor 5: Legends**
- Very high HP, balanced stats
- 3 special abilities
- 2 phase transitions (70%, 30%)
- Summons minions
- Enrage timer (15 turns)

### Example Boss: Ironclad Golem (Floor 5, Normal)

```
Stats:
HP: 5,000 (scales with player level)
STR: 180
END: 220
AGI: 40
Armor: 120

Abilities:
1. Crushing Blow (Every 3 turns): 2.5x dmg, 20% Stun
2. Iron Shield (Turn 5): +100% armor for 2 turns
3. Earthquake (Phase 2, Turn 8+): 1.8x dmg, -20% player dodge

Loot:
- Guaranteed Epic or Legendary
- 500-800 Gold
- 500 XP
```

## 5.5 Level Scaling

```
Enemy_Base_Stats = Player_Level_Avg_Stats × Difficulty_Mult × Floor_Mult

Where:
- Difficulty_Mult: Easy 0.7, Normal 1.0, Hard 1.4
- Floor_Mult: (1.0 + Floor_Num × 0.15)
```

**Example: Level 30 Player, Normal Dungeon, Floor 3**
```
Player Avg: STR 160, VIT 120, AGI 90

Enemy Stats:
STR = 160 × 1.0 × 1.45 = 232
VIT = 120 × 1.0 × 1.45 = 174
AGI = 90 × 1.0 × 1.45 = 130
```

### Loot Level Scaling
```
Item_Level = Player_Level ± Random(-2, +5)

Level 20 player gets items: Level 18-25
Higher floors bias toward +5 rolls
```

---

# 6. PVP ARENA

## 6.1 Arena Modes

**1. Ranked Arena** (Competitive)
- ELO-based matchmaking
- Rating points, seasonal rewards
- Cost: 10 Stamina
- Season: 30 days
- Leaderboard: Global + Guild

**2. Casual Arena** (Unranked)
- Level-based brackets
- XP, Gold (reduced)
- Cost: 5 Stamina
- Purpose: Practice

**3. Tournament Arena** (Weekly)
- Single-elimination bracket
- Entry: 50 Gems OR 1 Ticket (weekly quest reward)
- Rewards: Top finishers get legendary loot, titles
- Schedule: Saturday 18:00 UTC

## 6.2 ELO Rating System

```
Starting_Rating = 0  (players climb from Bronze V)

Rating_Change = K × (Actual - Expected)

Where:
- K = 32 (chess K-factor)
- Actual = 1 (win), 0.5 (draw), 0 (loss)
- Expected = 1 / (1 + 10^((Opp_Rating - Your_Rating)/400))
```

**Example:**
```
Player A: 1200 rating
Player B: 1000 rating

Expected_A = 1 / (1 + 10^(-200/400)) = 0.76

If A wins:
Change_A = 32 × (1 - 0.76) = +8
Change_B = -8

If B wins (upset):
Change_B = 32 × (1 - 0.24) = +24
Change_A = -24
```

### Matchmaking

```
Start: ±50 rating range

After 10 sec: Expand +50
After 30 sec: Expand +100
After 60 sec: Match anyone
```

### Level Brackets (Casual)

```
Bronze: Level 1-10
Silver: Level 11-25
Gold: Level 26-50
Platinum: Level 51-100

Can fight within bracket or one above
```

## 6.3 Rank Tiers

| Rank | Rating | % Players | Season Rewards |
|------|--------|-----------|----------------|
| **Bronze V-I** | 0-1099 | 30% | 100 Gems, 1 Rare |
| **Silver V-I** | 1100-1299 | 25% | 200 Gems, 2 Rare |
| **Gold V-I** | 1300-1499 | 20% | 400 Gems, 1 Epic |
| **Platinum V-I** | 1500-1699 | 15% | 800 Gems, 2 Epic |
| **Diamond V-I** | 1700-1899 | 7% | 1500 Gems, 1 Legendary |
| **Master** | 1900-2099 | 2% | 3000 Gems, 2 Legendary, Title |
| **Grandmaster** | 2100+ | 0.5% | 5000 Gems, 3 Legendary, Cosmetic |

### Divisions
Each rank has 5 divisions (V → I):
```
Bronze V: 0-999
Bronze IV: 1000-1019
Bronze III: 1020-1039
...
```

### Promotion/Demotion
```
Promotion: Reach threshold AND win next match
Demotion Protection: 3 losses at 0 LP before dropping

LP (League Points) = Rating - Division_Floor
```

## 6.4 Rewards

### Per-Match

**Victory:**
```
Gold = 100 + (Opp_Rating / 10) + Win_Streak_Bonus
XP = 100 + (Opp_Rating / 20)
Rating = +8 to +32 (ELO difference)

Win_Streak_Bonus:
- 2 wins: +50 Gold
- 3 wins: +100 Gold
- 4 wins: +200 Gold
- 5 wins: +400 Gold, +1 Arena Token
- 10 wins: +1000 Gold, +3 Tokens, +1 Epic Loot Box
```

**Defeat:**
```
Gold = 30
XP = 30
Rating = -8 to -32

Loss Protection:
- Rating at 0: Cannot lose rating (absolute floor)
- Loss streak (3+): -50% rating loss
```

### Season End

```
Distribution: Monday 00:00 UTC
Rewards: Based on HIGHEST rank achieved (not current)
Calculated: Monday 00:00-02:00 UTC
Distributed: Monday 02:00 UTC
New Season: Monday 02:00 UTC
```

**Rating Soft Reset:**
```
New_Season = (Current × 0.75) + (1000 × 0.25)

Examples:
- 2000 → 1750
- 1500 → 1375
- 1000 → 1000 (floor)
```

## 6.5 Anti-Cheat

### Automated Detection

**1. Win Rate Anomaly**
```python
def detect_anomaly(player_id):
    recent = get_last_50_matches(player_id)
    win_rate = calculate_win_rate(recent)
    
    if win_rate > 95% and matches > 30:
        flag("SUSPICIOUS_WIN_RATE")
    
    if win_rate > 85% and avg_rating_gain > 25:
        flag("RATING_CLIMBING_TOO_FAST")
```

**2. Combat Duration**
```python
def detect_combat_anomaly(match_id):
    duration = get_duration(match_id)
    
    if duration < 5:
        flag("INSTANT_WIN_SUSPECTED")
    
    if duration > 300:
        flag("TIMEOUT_ABUSE")
```

**3. Input Patterns**
```
Track:
- Actions per minute (APM)
- Click timing consistency
- Decision speed

IF pattern matches bot signature:
    Require CAPTCHA
    Shadowban from leaderboards
```

**4. Collusion Detection**
```
Red Flags:
- Same 2 players fighting 10+ times/day
- Win-trading pattern (A beats B, B beats A, repeat)
- Synchronized rating swings

Action: Freeze rating, manual review
```

### Manual Review Triggers
```
Auto-flag if:
- Rating gain >500 in 24 hours
- Win streak >20 matches
- 5+ community reports
- Combat logs show impossible stats
```

### Penalties
```
1st Offense: 7-day suspension, rating reset to 1000
2nd Offense: 30-day suspension, all seasonal rewards forfeited
3rd Offense: Permanent ban, all progress wiped
```

## 6.6 Season System

### Structure
```
Standard Season: 30 days
Off-Season: 2 days
Grand Seasons: 60 days (June, December)

Annual: 12 standard + 2 grand seasons
```

### Season Themes

**Examples:**
- Season 1: "The Proving Grounds" (Launch)
- Season 2: "Shadow Realm" (Dark fantasy)
- Season 3: "Gladiator's Glory" (Roman)
- Season 4: "Frozen Tundra" (Winter)

### Season-Exclusive Rewards

```
Cosmetics by Milestone:
- Gold+: Seasonal weapon skin
- Platinum+: Seasonal armor set
- Diamond+: Seasonal title + border
- Master+: Seasonal mount/pet cosmetic
- Grandmaster: Animated profile effect

Cosmetics NEVER return (exclusivity, FOMO retention)
```

### Leaderboards

**Global:**
```
Top 100 displayed publicly
Updates: Every 5 minutes

Format:
Rank | Player | Rating | W/L | Class | Prestige
1 | xXDragonXx | 2247 | 342/98 | Warrior | P3
```

**Guild:**
```
Top 50 guilds ranked by:
- Avg rating of top 10 members
- Total activity points
- Guild vs Guild results

Rewards: Guild cosmetics, hall upgrades
```

---

I'll continue with the remaining sections. This is getting quite comprehensive! Let me write part 2 to a new file to continue.
# 7. ECONOMY DESIGN

## 7.1 Currency Systems

### Dual Currency Model

**1. Gold (Soft Currency)**
- Earned: PvP, dungeons, quests, item sales
- Spent: Equipment, repairs, NPC shops, respec
- Tradeable: No (bind on account)
- Inflation Control: Gold sinks

**2. Gems (Premium Currency)**
- Earned: Real money, achievements, daily login (small)
- Spent: Stamina refills, cosmetics, premium items, convenience
- Tradeable: No
- Conversion: Cannot convert Gems → Gold (prevents P2W economy)

## 7.2 Gold Income Sources

### PvP Rewards
```
Base_Gold_Per_Win = 100
Scaled_Gold = Base + (Opp_Rating / 10) + Bonuses

Average by Rating:
- 1000 rating opponent: 200 Gold
- 1500 rating opponent: 250 Gold
- 2000 rating opponent: 300 Gold

PvP Loss: 30 Gold (consolation)
```

### PvE Rewards
```
Dungeon Clear:
- Easy: 200-400 Gold
- Normal: 400-800 Gold
- Hard: 800-1,500 Gold

Per-Enemy:
- Easy: 10-20 Gold
- Normal: 30-50 Gold
- Hard: 60-100 Gold

Boss Kill:
- Easy: 150 Gold
- Normal: 400 Gold
- Hard: 800 Gold
```

### Item Selling
```
Sell_Price = (Item_Level × Rarity_Mult × 10) + Stat_Bonus_Value

Rarity_Multipliers:
- Common: 1.0x
- Uncommon: 2.0x
- Rare: 4.0x
- Epic: 10.0x
- Legendary: 25.0x

Example:
Level 20 Epic Sword (+60 primary stat)
Price = (20 × 10 × 10) + (60 × 5) = 2,000 + 300 = 2,300 Gold
```

## 7.3 Gem Income (Free Path)

```
Daily Login Streak:
- Day 1: 10 Gems
- Day 2: 10 Gems
- Day 3: 15 Gems
- Day 4: 15 Gems
- Day 5: 20 Gems
- Day 6: 20 Gems
- Day 7: 50 Gems
Total: 140 Gems/week

Weekly Quest: 100 Gems
Achievements: 50-500 Gems (one-time)
Season Rewards: 100-5,000 Gems
Events: 50-200 Gems

F2P Monthly Income: ~700-900 Gems
```

### Paid Gem Packages
```
- Starter: 200 Gems = $1.99
- Small: 500 Gems = $4.99
- Medium: 1,200 Gems = $9.99 (20% bonus)
- Large: 2,600 Gems = $19.99 (30% bonus)
- Mega: 5,500 Gems = $39.99 (38% bonus)
- Whale: 14,000 Gems = $99.99 (40% bonus)
```

## 7.4 Equipment Economy

### NPC Shop Pricing
```
Equipment_Price = Base_Cost × (1 + Item_Level/10)^1.5 × Rarity_Mult

Base_Cost = 100 Gold
Rarity Purchase Multipliers:
- Common: 1.0x
- Uncommon: 2.5x
- Rare: 6.0x
- Epic: 15.0x
- Legendary: 50.0x
```

**Pricing Table:**

| Level | Common | Uncommon | Rare | Epic | Legendary |
|-------|--------|----------|------|------|-----------|
| 5 | 173 G | 433 G | 1,038 G | 2,595 G | 8,650 G |
| 10 | 250 G | 625 G | 1,500 G | 3,750 G | 12,500 G |
| 20 | 400 G | 1,000 G | 2,400 G | 6,000 G | 20,000 G |
| 30 | 550 G | 1,375 G | 3,300 G | 8,250 G | 27,500 G |
| 50 | 850 G | 2,125 G | 5,100 G | 12,750 G | 42,500 G |

### Repair System

```
Durability: 100/100 (all equipment)

Loss:
- PvP Match: -2 durability
- PvE Dungeon: -5 durability
- Boss Raid: -8 durability

At 0 durability:
- Item stats reduced by 50%
- Warning message

Repair_Cost = (Item_Purchase_Price × 0.10) × (Durability_Lost / 100)

Full Repair = 10% of item purchase price

Example:
Level 20 Epic Sword (6,000 Gold)
Full repair: 600 Gold
50% repair: 300 Gold
```

**Economic Impact:**
```
Active player repairs ~3 times/week
Average equipment value: 8,000 Gold
Weekly repair cost: ~800 Gold/player

100,000 players = 80M Gold removed/week
```

### Upgrade System

```
Success Chance = Base_Chance - (Upgrade_Level × 5%)
Base_Chance = 75%

+0 → +1: 75%
+1 → +2: 70%
+2 → +3: 65%
...
+9 → +10: 25%

On Failure:
- 50% chance: Item stays same (safe fail)
- 30% chance: Downgrade -1 level
- 20% chance: Item destroyed (creates item sink)
```

### Upgrade Costs
```
Cost_Gold = Item_Base_Price × (0.2 × Upgrade_Level)^1.5
Cost_Materials = Upgrade_Level × 10 stones

Example: +5 → +6 on Level 20 Epic (6,000 Gold base)
Gold: 6,000 × 1.0 = 6,000 Gold
Materials: 50 Upgrade Stones
```

**Stat Bonus:**
```
Each +1 adds +5% to all item stats

+10 = +50% total stat bonus

Example:
Base Epic Sword: +60 STR
+10 Epic Sword: +60 × 1.5 = +90 STR
```

## 7.5 Crafting System

### Materials
```
Common (30% drop):
- Iron Ore
- Leather Scraps
- Cloth Fragments

Rare (10% drop):
- Steel Ingots
- Enchanted Leather
- Mystic Cloth

Epic (3% drop):
- Mithril Ore
- Dragon Scale
- Phoenix Feather

Legendary (0.5% drop):
- Adamantite
- Celestial Essence
```

### Recipes
```
Recipe: Rare Sword
Materials:
- 20 Iron Ore
- 5 Steel Ingots
- 100 Gold

Result: Rare Sword (Level = Crafter_Level ± 2)

Base Success Rate: 80%
Modified = Base + (Crafting_Skill × 1%)

Max Crafting Skill: 20 → 100% success
```

## 7.6 Inflation Control

### Gold Sinks

**1. Repair Costs**
```
Impact: 800 Gold/player/week
100,000 players: 80M Gold removed/week
```

**2. Upgrade Destruction**
```
Failed upgrades destroy items worth 6,000-20,000 Gold
Estimated removal: ~500M Gold/week across all players
```

**3. Respec Costs**
```
Stat Respec: 1,000 Gems OR 50,000 Gold
Usage: 10% players/month
Removal: ~50M Gold/month
```

**4. Consumables**
```
HP Potion: 100 Gold (restores 50% HP)
Damage Boost: 300 Gold (+20% dmg, 3 turns)

Consumption: 2,000 Gold/player/week
100,000 players: 200M Gold/week
```

**5. Vanity (Gold)**
```
Guild Hall Decorations: 5,000-50,000 Gold
Name Change: 10,000 Gold
Guild Creation: 50,000 Gold

Removal: ~30M Gold/month
```

### Item Sinks

**1. Upgrade Destruction:** 20% destroy chance on fail, 10% of Epic+ items lost/month

**2. Salvage System:**
- Destroy item → receive 30-50% crafting materials back
- Prevents item hoarding

**3. Limited Inventory:** 50 base slots, forces selling/salvaging

**4. Durability Decay:**
```
Each repair reduces Max_Durability by 1%
At 50% Max: -10% item stats
At 0% Max: Item becomes "Shattered" (unsalvageable)

Timeline: ~100 repairs = 1-2 months active use
```

**5. Legendary Binding:**
- Legendaries become "Soulbound" when equipped
- Cannot trade (if trading added)
- Can only salvage or destroy
- Prevents market saturation

### Dynamic Balancing
```python
def monitor_inflation(month):
    avg_gold = get_average_gold_balance()
    inflation_rate = calculate_inflation()
    
    if inflation_rate > 15%:  # Economy heating
        adjust_repair_costs(1.10)
        adjust_npc_prices(1.10)
        
    if inflation_rate < -5%:  # Deflation
        adjust_quest_rewards(1.10)
        adjust_pvp_rewards(1.10)
```

---

# 8. MONETIZATION MODEL

## 8.1 Philosophy

**Core Principle:** Convenience over power

Players can pay to:
1. **Save time** (stamina refills, XP boosts)
2. **Look cool** (cosmetics)
3. **Access convenience** (respec, inventory)

**NOT pay to:**
1. Buy better gear directly
2. Gain permanent stat advantages
3. Bypass skill requirements

## 8.2 Premium Shop

### 1. Stamina & Progression
```
Stamina Refills:
- Small (+25): 50 Gems ($0.50)
- Medium (+50): 90 Gems ($0.90)
- Large (+100): 150 Gems ($1.50)

XP Boosters:
- 1-Hour +50%: 100 Gems ($1.00)
- 24-Hour +50%: 500 Gems ($5.00)
- 7-Day +50%: 2,000 Gems ($20.00)

Gold Boosters:
- 1-Hour +50%: 80 Gems ($0.80)
- 24-Hour +50%: 400 Gems ($4.00)
```

### 2. Cosmetics (Pure Vanity)
```
Weapon Skins: 300-800 Gems ($3-$8)
Armor Sets: 800-1,500 Gems ($8-$15)
Animations: 200-400 Gems ($2-$4)
Profile Borders: 150-300 Gems ($1.50-$3)
Name Colors: 100 Gems ($1)
Pets: 500-1,000 Gems ($5-$10)

Seasonal Limited: 1,500-3,000 Gems ($15-$30)
```

### 3. Convenience
```
Stat Respec: 1,000 Gems ($10) - one-time
Inventory +20: 500 Gems ($5) - permanent
Extra Character: 1,000 Gems ($10) - permanent
Auto-Loot: 300 Gems ($3) - permanent
Quick Travel: 50 Gems/use ($0.50)
```

### 4. VIP Subscription
```
Cost: $9.99/month

Benefits:
- +50% XP gain (permanent while active)
- +50% Gold gain (permanent while active)
- +20 Max Stamina (120 base)
- 1 Free Large Refill/day ($1.50 value)
- 10% discount on all gem purchases
- Exclusive VIP cosmetic border
- VIP-only chat channel
- Priority matchmaking

Effective Value: $50+/month if purchased separately
```

## 8.3 Battle Pass

```
Cost: 1,000 Gems ($10)
Levels: 50
XP/Level: 10,000 BP_XP
Total: 500,000 BP_XP

Duration: 30 days (season length)
Completion: ~1.67 hours/day average
```

### Free Track
```
Every 5 Levels:
Level 5: 100 Gold, 1 Rare
Level 10: 200 Gold, 1 Epic
Level 15: 300 Gold, 50 Gems
Level 20: 500 Gold, 1 Epic
Level 25: 1,000 Gold, 1 Legendary
Level 30: 300 Gold
Level 35: 400 Gold, 1 Epic
Level 40: 500 Gold, 100 Gems
Level 45: 600 Gold, 1 Epic
Level 50: 2,000 Gold, 1 Legendary, 200 Gems

Total Value: ~$15
```

### Premium Track
```
Every Level: Gold, boosters, cosmetics

Milestone Rewards:
Level 10: Exclusive Weapon Skin
Level 20: Exclusive Character Skin
Level 30: Exclusive Mount/Pet
Level 40: Exclusive Armor Set
Level 50: Animated Profile Effect + Title

Total Value: ~$60

Skip Levels: 150 Gems/level ($1.50)
Max Skip: 20 levels (3,000 Gems = $30)
```

## 8.4 Loot Boxes (Cosmetic Only)

```
Price: 200 Gems ($2) per box

Contents: 1 cosmetic item guaranteed

Rarity Rates:
- Common: 60%
- Uncommon: 25%
- Rare: 10%
- Epic: 4%
- Legendary: 1%

Duplicate Protection:
- 1st duplicate: 50% gem refund
- 2nd duplicate: 75% gem refund
- 3rd+ duplicate: 100% gem refund (full)

Alternative: Direct purchase cosmetics at 3x box cost
```

**Ethical:**
- Cosmetics only (no gameplay advantage)
- Clear odds displayed (legal requirement)
- Duplicate protection (player-friendly)

## 8.5 Revenue Projections

### ARPU (Average Revenue Per User)
```
Estimated Monthly ARPU: $3-$5

Breakdown:
- 60% F2P: $0
- 25% Minnows: $2-$5/month (occasional refill)
- 10% Dolphins: $10-$30/month (VIP + cosmetics)
- 4% Whales: $50-$200/month (VIP + cosmetics + refills)
- 1% Super Whales: $200+/month (completionists)

Weighted: (0.6×0) + (0.25×3.5) + (0.10×20) + (0.04×100) + (0.01×300)
       = 0 + 0.875 + 2 + 4 + 3 = $9.875/player

Conservative ARPU: $5/month (accounting for churn)
```

### ARPPU (Average Revenue Per Paying User)
```
Paying User Rate: 40% (high due to VIP value)

ARPPU = Total Rev / Paying Users
      = ($5 × All) / (0.40 × All)
      = $12.50/month per paying player
```

### Growth Projections (Conservative)

**Year 1:**
```
Month 1 (Launch):
- Players: 10,000
- Active: 8,000 (80% retention)
- Paying: 3,200
- Revenue: $40,000

Month 3:
- Players: 35,000
- Active: 24,500 (70% retention)
- Paying: 9,800
- Revenue: $122,500

Month 6:
- Players: 80,000
- Active: 48,000 (60% retention)
- Paying: 19,200
- Revenue: $240,000

Month 12:
- Players: 150,000
- Active: 75,000 (50% retention, stabilized)
- Paying: 30,000
- Revenue: $375,000

Year 1 Total: ~$2.5M
```

**Year 2-3:**
```
Year 2:
- Avg Active: 120,000
- Monthly Rev: $600,000
- Annual: $7.2M

Year 3:
- Avg Active: 200,000
- Monthly Rev: $1,000,000
- Annual: $12M
```

### Retention Impact

```
Day 1: 60% (10,000 installs → 6,000 return)
Day 7: 35% (10,000 installs → 3,500 active)
Day 30: 15-20% (10,000 installs → 1,500-2,000 active)

Target: 20% D30 (very good for F2P)
```

**Retention Strategies:**
1. Daily login rewards (habit)
2. Weekly events (re-engagement)
3. Social features (guilds, friends)
4. Battle Pass (sunk cost)
5. Seasonal resets (fresh starts)

---

# 9. TECHNICAL ARCHITECTURE

## 9.1 Tech Stack

### Frontend
```
Framework: Next.js 14 (App Router)
- SSR for SEO, fast load
- Alternative: Remix, SvelteKit

UI Library: React 18+
State: Zustand (lightweight) or Redux Toolkit

Styling: Tailwind CSS + Framer Motion
- Rapid development
- Consistent design system
- Smooth animations

API Client: tRPC or React Query
- Type-safe API calls
- Automatic caching
```

### Backend
```
Runtime: Node.js 20+
Framework: Next.js API Routes OR Express.js

Database: PostgreSQL 15+ (via Supabase)
- Relational data
- ACID compliance
- Scales well

ORM: Prisma or Drizzle

Caching: Redis (Upstash or self-hosted)
- Fast leaderboards
- Session management
- Matchmaking queue

Storage: Supabase Storage OR Cloudflare R2
- Images, avatars, cosmetics
```

### Real-Time (Optional)
```
WebSockets: Supabase Realtime OR Socket.io
Use Cases:
- Live leaderboard updates
- Guild chat
- Combat animations
```

### Authentication
```
Provider: Supabase Auth OR NextAuth.js
Methods:
- Email/password
- Google OAuth
- Apple Sign-In

Why: Secure, battle-tested, easy integration
```

### Deployment
```
Frontend: Vercel (Next.js optimized) OR Netlify
- Automatic deployments
- CDN
- Edge functions

Backend: Vercel Serverless OR Railway
- Auto-scaling
- Pay-per-use

Database: Supabase (managed Postgres) OR Railway
- Backups, scaling, monitoring
```

### DevOps
```
Error Tracking: Sentry
Analytics: PostHog (self-hosted alternative)
Logging: Axiom or Datadog
CI/CD: GitHub Actions
```

## 9.2 Database Schema

### Core Tables

**users**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    auth_provider VARCHAR(50) DEFAULT 'email',
    gems INTEGER DEFAULT 0,
    premium_until TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP DEFAULT NOW(),
    is_banned BOOLEAN DEFAULT FALSE,
    ban_reason TEXT NULL
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

**characters**
```sql
CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    character_name VARCHAR(50) UNIQUE NOT NULL,
    class VARCHAR(20) NOT NULL,  -- 'warrior', 'rogue', 'mage', 'tank'
    level INTEGER DEFAULT 1,
    current_xp INTEGER DEFAULT 0,
    prestige_level INTEGER DEFAULT 0,
    
    -- Stats
    stat_points_available INTEGER DEFAULT 0,
    strength INTEGER DEFAULT 10,
    agility INTEGER DEFAULT 10,
    vitality INTEGER DEFAULT 10,
    endurance INTEGER DEFAULT 10,
    intelligence INTEGER DEFAULT 10,
    wisdom INTEGER DEFAULT 10,
    luck INTEGER DEFAULT 10,
    charisma INTEGER DEFAULT 10,
    
    -- Currencies
    gold INTEGER DEFAULT 500,
    arena_tokens INTEGER DEFAULT 0,
    
    -- Combat (calculated)
    max_hp INTEGER DEFAULT 100,
    current_hp INTEGER DEFAULT 100,
    armor INTEGER DEFAULT 0,
    magic_resist INTEGER DEFAULT 0,
    
    -- Stamina
    current_stamina INTEGER DEFAULT 100,
    max_stamina INTEGER DEFAULT 100,
    last_stamina_update TIMESTAMP DEFAULT NOW(),
    
    -- PvP
    pvp_rating INTEGER DEFAULT 1000,
    pvp_wins INTEGER DEFAULT 0,
    pvp_losses INTEGER DEFAULT 0,
    pvp_win_streak INTEGER DEFAULT 0,
    highest_pvp_rank VARCHAR(50) DEFAULT 'Bronze V',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    last_played TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT valid_class CHECK (class IN ('warrior', 'rogue', 'mage', 'tank'))
);

CREATE INDEX idx_characters_user ON characters(user_id);
CREATE INDEX idx_characters_rating ON characters(pvp_rating DESC);
CREATE INDEX idx_characters_level ON characters(level DESC);
```

**items** (Master Database)
```sql
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_name VARCHAR(100) NOT NULL,
    item_type VARCHAR(50) NOT NULL,  -- 'weapon', 'helmet', etc.
    rarity VARCHAR(20) NOT NULL,  -- 'common', 'rare', etc.
    item_level INTEGER NOT NULL,
    
    base_stats JSONB,  -- {"strength": 45, "crit_chance": 8}
    special_effect TEXT NULL,
    unique_passive TEXT NULL,
    
    buy_price INTEGER,
    sell_price INTEGER,
    
    description TEXT,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT valid_item_type CHECK (item_type IN 
        ('weapon', 'helmet', 'chest', 'gloves', 'legs', 'boots', 'accessory',
         'amulet', 'belt', 'relic', 'necklace', 'ring')),
    CONSTRAINT valid_rarity CHECK (rarity IN 
        ('common', 'uncommon', 'rare', 'epic', 'legendary'))
);

CREATE INDEX idx_items_rarity ON items(rarity);
CREATE INDEX idx_items_level ON items(item_level);
```

**equipment_inventory**
```sql
CREATE TABLE equipment_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id),
    
    upgrade_level INTEGER DEFAULT 0,  -- +0 to +10
    enhancement_level INTEGER DEFAULT 0,  -- 0 to 20
    durability INTEGER DEFAULT 100,
    max_durability INTEGER DEFAULT 100,
    is_equipped BOOLEAN DEFAULT FALSE,
    equipped_slot VARCHAR(20) NULL,
    
    rolled_stats JSONB,  -- Instance-specific rolls
    socket_count INTEGER DEFAULT 0,
    socketed_gems JSONB NULL,
    
    acquired_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT valid_slot CHECK (equipped_slot IN 
        ('weapon', 'weapon_offhand', 'helmet', 'chest', 'gloves', 'legs', 'boots',
         'accessory', 'amulet', 'belt', 'relic', 'necklace', 'ring'))
);

CREATE INDEX idx_inv_character ON equipment_inventory(character_id);
CREATE INDEX idx_inv_equipped ON equipment_inventory(character_id, is_equipped);
```

**pvp_matches**
```sql
CREATE TABLE pvp_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    player1_id UUID NOT NULL REFERENCES characters(id),
    player2_id UUID NOT NULL REFERENCES characters(id),
    
    player1_rating_before INTEGER NOT NULL,
    player2_rating_before INTEGER NOT NULL,
    player1_rating_after INTEGER NOT NULL,
    player2_rating_after INTEGER NOT NULL,
    
    winner_id UUID NOT NULL REFERENCES characters(id),
    loser_id UUID NOT NULL REFERENCES characters(id),
    
    combat_log JSONB,  -- Full turn-by-turn
    match_duration INTEGER,  -- Seconds
    turns_taken INTEGER,
    
    player1_gold_reward INTEGER,
    player2_gold_reward INTEGER,
    player1_xp_reward INTEGER,
    player2_xp_reward INTEGER,
    
    match_type VARCHAR(20) DEFAULT 'ranked',  -- 'ranked', 'casual', 'tournament'
    season_number INTEGER NOT NULL,
    played_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pvp_players ON pvp_matches(player1_id, player2_id);
CREATE INDEX idx_pvp_season ON pvp_matches(season_number, played_at DESC);
```

## 9.3 Core API Endpoints

### Authentication
```
POST /api/auth/register
Body: {email, password, username}
Response: {success, user, token}

POST /api/auth/login
Body: {email, password}
Response: {success, user, token}
```

### Characters
```
GET /api/characters
Headers: Authorization: Bearer <token>
Response: {characters[]}

POST /api/characters/create
Body: {character_name, class, appearance}
Response: {success, character}

POST /api/characters/:id/level-up
Body: {stat_allocations}
Response: {success, character}
```

### PvP
```
POST /api/pvp/find-match
Body: {character_id, match_type}
Response: {match_id, opponent, your_turn_first}

POST /api/pvp/match/:id/action
Body: {action_type, ability_id?}
Response: {combat_log, is_match_over, winner?, rewards?}
```

### Dungeons
```
GET /api/dungeons
Response: {dungeons[]}

POST /api/dungeons/:id/start
Body: {character_id, difficulty}
Response: {run_id, dungeon, current_floor}

POST /api/dungeons/run/:id/fight
Body: {action_type, ability_id?}
Response: {combat_log, is_fight_over, is_dungeon_complete, next_floor?, rewards?}
```

### Economy
```
POST /api/shop/purchase-gems
Body: {package_id, payment_method, payment_token}
Response: {success, gems_purchased, new_balance, transaction_id}

POST /api/shop/purchase-item
Body: {item_id, quantity, currency_type}
Response: {success, new_balance, items_acquired}
```

### Leaderboards
```
GET /api/leaderboard/pvp
Query: ?page=1&limit=100&season=current
Response: {leaderboard[], your_rank?, total_players}
```

## 9.4 Anti-Cheat Validation

### Combat Validation
```typescript
function validateCombat(action: Action, character: Character): boolean {
    // 1. Verify ability cooldowns
    if (action.ability_id) {
        const ability = getAbility(action.ability_id);
        if (ability.cooldown_remaining > 0) {
            throw Error("Ability on cooldown");
        }
    }
    
    // 2. Verify stat ranges
    if (character.strength > 999 || character.strength < 10) {
        flagForReview(character.id, "IMPOSSIBLE_STATS");
        return false;
    }
    
    // 3. Verify action timing
    const timeSince = now() - character.last_action_timestamp;
    if (timeSince < 500) {  // <0.5s apart
        flagForReview(character.id, "ACTION_TOO_FAST");
    }
    
    // 4. Verify equipment stats match DB
    const calculated = calculateStatsFromEquipment(character.equipment);
    if (calculated.strength !== character.strength - character.base_strength) {
        flagForReview(character.id, "EQUIPMENT_MISMATCH");
        return false;
    }
    
    return true;
}
```

### Rate Limiting
```typescript
const rateLimits = {
    'api/pvp/match': {requests: 10, window: 60},
    'api/dungeons/start': {requests: 5, window: 60},
    'api/shop/purchase': {requests: 20, window: 60}
};

async function checkRateLimit(endpoint: string, user_id: string): Promise<boolean> {
    const key = `ratelimit:${endpoint}:${user_id}`;
    const limit = rateLimits[endpoint];
    
    const current = await redis.incr(key);
    if (current === 1) {
        await redis.expire(key, limit.window);
    }
    
    return current <= limit.requests;
}
```

---

# 10. BALANCING EXAMPLES

## 10.1 Sample Characters

### Level 1 Warrior (New Player)
```
STATS: All 10 (base)

EQUIPMENT:
- Starter Sword: +8 STR
- Starter Armor Set: +40 Armor total
- Starter Accessories: +10 AGI total

TOTALS:
Effective STR: 18
Effective AGI: 20
Effective Armor: 40
Max HP: 100

DAMAGE OUTPUT:
Basic Attack vs Level 1 Enemy (END 10, Armor 10):
  Base: 18 - 5 = 13
  After Armor: 13 × 0.91 = 12 damage
```

### Level 20 Warrior (Mid-Game)
```
STATS:
STR: 85 (75 allocated)
AGI: 20 (10 allocated)
VIT: 40 (30 allocated)
END: 25 (15 allocated)
Others: 10

EQUIPMENT:
- Rare Greatsword +3: +58 STR, +8% Crit
- Rare Armor Set: +192 Armor, +55 VIT, +15 END
- Rare Accessory: +15 all stats

TOTALS:
Effective STR: 158
Effective AGI: 65
Effective VIT: 110
Effective END: 55
Armor: 192.5
Max HP: 1,100

DAMAGE OUTPUT:
Basic vs Level 20 Enemy (END 60, Armor 50):
  Base: 158 - 30 = 128
  After Armor: 128 × 0.667 = 85 damage
  
Heavy Strike (2.0x):
  Base: 286
  After Armor: 191 damage
```

### Level 50 Rogue (Endgame)
```
STATS:
STR: 110 (100 allocated)
AGI: 190 (180 allocated)
VIT: 65 (55 allocated)
END: 30 (20 allocated)
LCK: 100 (90 allocated)
Others: 10

EQUIPMENT:
- Legendary Dagger +8: +128 STR, +12% Crit, +40% Crit Dmg
- Epic Armor Set: +270 Armor, +200 AGI
- Legendary Accessory: +40 all stats, +5% Crit

TOTALS:
Effective STR: 278
Effective AGI: 430
Armor: 270
Max HP: 1,050
Crit Chance: 50% (capped)
Crit Damage: 2.8x (capped)
Dodge: 40% (capped)

DAMAGE OUTPUT:
Basic vs Level 50 Boss (END 200, Armor 180):
  Non-Crit: 63 damage
  Crit (50% chance): 177 damage
  Average: 120 damage/hit
  
Backstab (2.5x, first strike):
  Non-Crit: 248 damage
  Crit: 694 damage
```

## 10.2 Combat Simulations

### Level 20 PvP: Warrior vs Rogue

**Fighter 1:** IronFist (Warrior)
- STR 158, VIT 110, Armor 192, HP 1,100

**Fighter 2:** ShadowBlade (Rogue)
- STR 120, AGI 175, Armor 80, HP 800, Dodge 24%, Crit 33%

```
TURN 1:
ShadowBlade acts first (AGI 175 > 65)
- Basic Attack: 22 damage
- IronFist: 1,078 HP

IronFist:
- Heavy Strike: 154 damage
- ShadowBlade: 646 HP

TURN 2:
ShadowBlade:
- Quick Strike (Crit): 117 damage
- IronFist: 961 HP

IronFist:
- Basic: 36 damage
- ShadowBlade: 610 HP

TURN 3:
ShadowBlade:
- Backstab: 102 damage
- IronFist: 859 HP

IronFist:
- Battle Cry (+30% STR, 3 turns)
- Effective STR: 158 → 205

TURN 4-12: [Combat continues...]

FINAL RESULT (Turn 12):
Winner: IronFist
HP Remaining: 512
Reason: Higher HP pool, consistent damage

Rating Change:
- IronFist: +18 (1,200 → 1,218)
- ShadowBlade: -18 (1,150 → 1,132)
```

**Analysis:** Both builds viable, close outcome

### Level 50 Dungeon Boss

**Player:** Archmage (Mage)
- INT 320, WIS 180, VIT 100, HP 1,000

**Boss:** Inferno Drake (Hard Floor 5)
- HP 7,000, STR 250, WIS 150, Magic Resist 40%

```
TURN 1:
Archmage:
- Fireball: 386 damage
- Burn Applied
- Drake: 6,614 HP

Drake:
- Flame Breath: 460 damage
- Archmage: 540 HP

TURN 2:
Burn Tick: 280 damage
Archmage:
- Frost Nova: 310 damage + Slow
- Drake: 6,024 HP

Drake (Slowed):
- Claw Swipe: 375 damage
- Archmage: 165 HP

TURN 3:
Burn Tick: 280
Archmage:
- Health Potion (+50% HP)
- HP: 165 → 665

Drake:
- Basic: 250 damage
- Archmage: 415 HP

TURN 4:
Burn Tick: 280
Archmage:
- Lightning Strike (CRIT): 968 damage
- Drake: 4,496 HP → Phase 2 (60%)

Drake (Enraged):
- Flame Breath (+20%): 552 damage
- Archmage: -137 HP (DEAD)

RESULT: Defeat
```

**Retry with Better Strategy:**
- Use Damage Boost Potion on Turn 1
- Final result: Victory, 189 HP remaining

**Lessons:** Consumables essential, phase management critical

## 10.3 Economy Simulation (30 Days)

### Three Player Profiles

**Player A: F2P**
- 30 min daily
- 100 stamina/day
- $0 spending

**Player B: Dolphin**
- 45 min daily
- 150 stamina/day (1 refill)
- VIP ($9.99/month)
- $10-15/month total

**Player C: Whale**
- 90 min daily
- 250 stamina/day (3 refills)
- VIP + cosmetics
- $50-80/month total

### Day 30 Results

```
PLAYER A (F2P):
────────────────────
Level: 18
XP: 42,000 total
Gold Earned: 65,000
Gold Spent: 50,000
Current Gold: 15,000
Equipment: 3 Epic, 4 Rare
PvP Rating: 1,250 (Silver III)
Playtime: 15 hours
Spending: $0

PLAYER B (Dolphin):
────────────────────
Level: 28
XP: 95,000 total
Gold Earned: 140,000
Gold Spent: 110,000
Current Gold: 30,000
Equipment: 5 Epic, 2 Legendary
PvP Rating: 1,520 (Platinum II)
Playtime: 22.5 hours
Spending: $14.99

PLAYER C (Whale):
────────────────────
Level: 42
XP: 220,000 total
Gold Earned: 320,000
Gold Spent: 280,000
Current Gold: 40,000
Equipment: Full Legendary (+5 to +8)
PvP Rating: 1,780 (Diamond I)
Playtime: 45 hours
Spending: $74.97
```

### Economic Metrics

```
GOLD CIRCULATION (30 Days, 3 Players):
Total Generated: 525,000 Gold
Total Removed: 440,000 Gold
Net Inflation: +85,000 (16% - healthy)

SINK BREAKDOWN:
- Repairs: 180,000 G (41%)
- NPC Purchases: 120,000 G (27%)
- Upgrade Failures: 80,000 G (18%)
- Consumables: 60,000 G (14%)

ITEM ECONOMY:
Dropped: 450 Common, 180 Uncommon, 75 Rare, 22 Epic, 3 Legendary
Destroyed: 28 items (upgrade fails)
Salvaged: 320 items

Item Sink Rate: 35% (healthy)

PROGRESSION SPEED:
F2P → Level 18 (baseline)
Dolphin → Level 28 (1.55x faster)
Whale → Level 42 (2.33x faster)

COMPETITIVE POSITION:
F2P: Silver III (Top 50%)
Dolphin: Platinum II (Top 15%)
Whale: Diamond I (Top 7%)

MONETIZATION:
ARPU: $29.99 / 3 = $10.00/player
ARPPU: $44.98/paying player
Conversion: 66.7% (2 of 3 paid)
```

**Conclusions:**
- F2P competitive at slower pace ✓
- Paying = time advantage without P2W ✓
- Economy stable, healthy inflation ✓
- Monetization effective, not predatory ✓

---

# 11. LIVE OPS STRATEGY

## 11.1 Daily Engagement

### Daily Quests (3 Random)
```
Quest Pool:
1. "Win 3 PvP": 200 G, 200 XP, 20 Gems
2. "Complete 2 Dungeons": 300 G, 300 XP, 25 Gems
3. "Deal 5,000 Damage": 150 G, 150 XP
4. "Win 5 PvP Without Loss": 500 G, 400 XP, 50 Gems
5. "Clear 1 Hard Dungeon": 600 G, 500 XP, 40 Gems
6. "Upgrade Item to +5": 200 G, 30 Gems
7. "Salvage 10 Items": 100 G, 15 Gems
8. "Win PvP at 80%+ HP": 250 G, 35 Gems

Reset: 00:00 UTC daily
```

### Daily Login Streak
```
Day 1: 50 G, 10 Gems
Day 2: 100 G, 10 Gems
Day 3: 150 G, 15 Gems, 1 Rare Item
Day 4: 200 G, 15 Gems
Day 5: 300 G, 20 Gems, 1 Epic Item
Day 6: 400 G, 20 Gems
Day 7: 1,000 G, 50 Gems, 1 Legendary, Cosmetic

Resets if day missed
```

### Daily Flash Sale
```
Rotation (24-hour cycles):
Monday: Stamina Bundle (-10% off)
Tuesday: XP Booster Sale (-20%)
Wednesday: Rare Equipment Pack
Thursday: Gold Bundle (special)
Friday: Cosmetic Spotlight (-25%)
Saturday: Upgrade Bundle
Sunday: Gem Bonus (+20% all packs)

Limited Quantity: 100 per sale
```

## 11.2 Weekly Events

### 4-Week Rotating Cycle

**Week 1: Double Rewards**
```
Duration: Monday-Sunday
Bonuses:
- 2x XP from all sources
- 2x Gold from PvP
- 2x Loot drop rate

Leaderboard: Top 100 by XP get exclusive title

Impact:
- Increased engagement
- Higher stamina refill purchases
- Good catch-up opportunity
```

**Week 2: Guild Wars**
```
Duration: Friday-Sunday
Mechanics:
- Guilds compete for PvP rating gains
- Each member's gains contribute to guild score
- Top 10 guilds get rewards

Rewards:
- 1st: 5,000 Gems (split), Legendary Guild Banner
- 2nd: 3,000 Gems, Epic Banner
- 3rd: 2,000 Gems, Rare Banner
- 4th-10th: 1,000 Gems

Impact:
- Encourages guild membership
- Competitive PvP engagement
- Social bonding
```

**Week 3: Limited Dungeon**
```
Duration: Wednesday-Tuesday (7 days)
Special: "The Abyssal Rift"
- 10 floors (double length)
- Unique bosses, special mechanics
- Exclusive loot

Entry: 40 Stamina OR 1 Event Token (free daily)

Rewards:
- Floor 5: Rare Cosmetic Weapon
- Floor 10: Epic Cosmetic Armor
- Leaderboard: Fastest clears get Legendary title

Impact:
- FOMO (cosmetics never return)
- Stamina refill purchases
- Fresh content
```

**Week 4: Ranked Climb Bonus**
```
Duration: Monday-Sunday
Bonuses:
- Rating gains +25%
- Rating losses -25%
- Extra Arena Tokens for wins

Rewards:
- Climb 200+: 500 Gems
- Climb 400+: 1,000 Gems + Rare Cosmetic
- Climb 600+: 2,000 Gems + Epic Cosmetic

Impact:
- Competitive play spike
- Lower risk (less intimidating)
- Rank milestone pushes
```

### Weekly Tournament
```
Time: Saturday 18:00 UTC
Format: Single-Elimination
Entry: 50 Gems OR 1 Ticket
Participants: 128 max

Bracket:
Round 1: 128 → 64
Round 2: 64 → 32
Quarterfinals: 32 → 16
Semifinals: 16 → 8
Finals: 8 → 4 → 2 → 1

Rules:
- Best of 1
- Level-balanced (all scaled to 50)
- Standardized "tournament gear" (no item advantages)
- Pure skill-based

Rewards:
1st: 5,000 Gems, 3 Legendary, "Champion" Title, Badge
2nd: 3,000 Gems, 2 Legendary, "Finalist" Title
3rd-4th: 1,500 Gems, 1 Legendary
5th-8th: 800 Gems, 1 Epic
9th-16th: 400 Gems
17th-32nd: 200 Gems
All: 50 Gems (entry refund)

Impact:
- Weekly highlight
- Skill showcase
- Community building (spectator mode)
```

## 11.3 Seasonal Systems

```
Season Length: 30 days
Off-Season: 2 days
Grand Seasons: 60 days (June, December)
Annual: 12 regular + 2 grand

Components:
1. PvP rating soft reset
2. New seasonal cosmetics (exclusive)
3. Season-specific leaderboards
4. Battle Pass (50 levels)
5. Minor balance changes
```

### Season Themes (Examples)
```
S1: "Proving Grounds" (Launch, gladiator theme)
S2: "Shadow Realm" (Dark fantasy, gothic)
S3: "Gladiator's Glory" (Roman colosseum)
S4: "Frozen Tundra" (Winter, ice theme)
S5: "Dragon's Awakening" (High fantasy, dragons)
```

### Seasonal Rewards
```
Cosmetics by Rank:
- Gold+: Seasonal weapon skin
- Platinum+: Seasonal armor set
- Diamond+: Seasonal title + border
- Master+: Seasonal mount/pet
- Grandmaster: Animated profile effect

NEVER RETURN (exclusivity drives engagement)
```

## 11.4 Retention Hooks

### Sunk Cost (Ethical)
```
1. Daily Login Streaks
   - Missing day resets
   - Players return to maintain
   - Ethical: Generous rewards

2. Battle Pass Progress
   - Paid $10, want value
   - Encourages daily play
   - Ethical: Completable in 30 days @ 1.67 hrs/day

3. Guild Commitments
   - Social pressure (Guild Wars)
   - Don't disappoint teammates
   - Ethical: Purely social

4. Seasonal Exclusivity
   - Cosmetics never return
   - FOMO drives engagement
   - Ethical: Cosmetics only, no gameplay advantage
```

### Progression Gating (Healthy)
```
1. Stamina System
   - Hard daily cap (prevents burnout)
   - Natural regen (no punishment for missing days)
   - Refills capped (prevents whale dominance)

2. Weekly Events
   - Always something new
   - Prevents content exhaustion
   - Weekly check-ins

3. Level Milestones
   - Content unlocks: 15, 30, 50, 100
   - Long-term goals
   - Prestige extends endgame

4. Seasonal Ladder
   - Fresh start every 30 days
   - Everyone can compete
   - Prevents meta stagnation
```

### Social Retention
```
1. Guild System
   - Stay for friends, not just gameplay
   - Guild chat = community
   - Guild benefits (XP bonus)

2. Friend Referrals
   - Refer friend → both get rewards when friend hits Level 10
   - Referrer: 500 Gems
   - New Player: 300 Gems + 1 Epic

3. Leaderboards
   - Public competition drives engagement
   - "I'm rank 523, can I hit 500?"
   - Bragging rights in guild

4. Spectator Mode (Future)
   - Watch top players
   - Learn strategies
   - Community streaming
```

### Re-Engagement Campaigns
```
7 Days Inactive:
- Email: "We miss you! Here's 200 Gems"
- In-game: 200 Gems, 5,000 Gold, 1 Epic Item
- 24-Hour XP Booster (on login)

30 Days Inactive:
- Email: "Big changes since you left!"
- In-game: 500 Gems, 10,000 Gold, 1 Legendary
- 7-Day VIP Trial

90 Days Inactive:
- Email: "Season reset! Fresh start!"
- In-game: 1,000 Gems, 1 Legendary Pack, Free Battle Pass
- Goal: Make them feel they can catch up
```

---

# 12. DEVELOPMENT ROADMAP

## Phase 1: Core Systems (Weeks 1-4)

**Weeks 1-2: Foundation**
- Project setup (Next.js, Supabase, Prisma)
- Database schema
- Auth system (email + OAuth)
- Basic character creation
- Main hub UI (skeleton)

**Weeks 3-4: Combat Engine**
- Combat calculation system
- Damage formulas
- Status effects
- Basic AI opponent
- Combat UI
- Turn resolution

## Phase 2: Core Gameplay (Weeks 5-8)

**Weeks 5-6: PvP Arena**
- Matchmaking system
- ELO rating calculation
- Match history
- Leaderboards (basic)
- Reward distribution

**Weeks 7-8: PvE Dungeons**
- Dungeon generation
- Enemy AI
- Loot system
- Drop calculations
- Boss fights
- Difficulty scaling

## Phase 3: Progression (Weeks 9-12)

**Weeks 9-10: Economy**
- Gold system
- Gem system
- Shop UI
- Payment integration (Stripe)
- Item buying/selling
- Repair system

**Weeks 11-12: Character Progression**
- XP system
- Level-up mechanics
- Stat allocation
- Skill trees
- Equipment system
- Inventory management

## Phase 4: Monetization (Weeks 13-16)

**Weeks 13-14: Premium Features**
- VIP subscription
- Stamina refills
- Premium shop
- Battle Pass system
- Cosmetics system

**Weeks 15-16: Polish**
- Mobile responsive design
- Performance optimization
- Bug fixes
- Anti-cheat systems
- Analytics integration

## Phase 5: Launch Prep (Weeks 17-20)

**Weeks 17-18: Testing**
- Closed beta
- Balance testing
- Load testing
- Security audit
- Bug hunting

**Weeks 19-20: Launch**
- Marketing push
- Soft launch (limited regions)
- Monitor metrics
- Hot fixes
- Full launch

**Total: 20 weeks (5 months) to MVP Launch**

---

# APPENDIX

## A. Quick Reference Tables

### Stat Caps Summary
```
Soft Cap | Hard Cap | Stat
300 | 999 | STR, END, INT
250 | 999 | AGI, WIS
400 | 999 | VIT
200 | 999 | LCK
150 | 999 | CHA
```

### Rarity Drop Rates (Normal Dungeon)
```
Common: 50%
Uncommon: 40%
Rare: 25%
Epic: 8%
Legendary: 2%
```

### PvP Rank Distribution
```
Bronze: 30% of players
Silver: 25%
Gold: 20%
Platinum: 15%
Diamond: 7%
Master: 2%
Grandmaster: 0.5%
```

## B. Glossary

- **ARPU:** Average Revenue Per User
- **ARPPU:** Average Revenue Per Paying User
- **ELO:** Rating system for competitive games
- **FOMO:** Fear Of Missing Out
- **F2P:** Free-to-Play
- **P2W:** Pay-to-Win
- **PvE:** Player vs Environment
- **PvP:** Player vs Player
- **VIP:** Very Important Player (premium subscription)

## C. Version History

```
Version 1.0 - February 11, 2026
- Initial comprehensive GDD
- All core systems documented
- Economic models defined
- Technical architecture specified
- Balance examples provided
- Live ops strategy outlined
```

---

---

# APPENDIX A — Single Source of Truth: Formula Reference Table

> **All formulas below are authoritative.** Code in `lib/game/balance.ts` must match exactly.

| System | Formula | Constants |
|--------|---------|-----------|
| Physical Damage | `(STR × skillMult) - (END × 0.5)` then armor reduction & crit | `END_DEFENSE_FACTOR = 0.5` |
| Magic Damage | `(INT × spellMult) - (WIS × 0.4)` then resist & crit | `WIS_DEFENSE_FACTOR = 0.4`, `BASE_SPELL_MULT = 1.2` |
| Crit Chance | `5% + AGI/10 + LCK/15 + equipment` | cap: 50% |
| Crit Damage | `1.5 + STR/500` | cap: 2.8x |
| Dodge | `3% + AGI/8 + equipment` | cap: 40% |
| Armor Reduction | `Armor / (Armor + 100)` | cap: 75% |
| Magic Resist | `WIS / (WIS + 150)` | cap: 70% |
| Resist Chance | `(END/10) + (WIS/15)` | cap: 60% |
| Max HP | `VIT × 10` | `HP_PER_VIT = 10` |
| XP for Level N | `100 × N^1.8 + 50 × N` | |
| Stat Points | `+5 per level, +1 skill point every 5 levels` | |
| Gold per Level | `100 × newLevel` | |
| Stamina Regen | `1 per 12 minutes` | max: 100 base, +20 VIP, overflow cap: 200 |
| ELO Rating | `K × (actual - expected)`, K=32 | Start: 0, Floor: 0 |
| Loss Streak | `>= 3 losses: -50% rating loss` | |
| Sell Price | `itemLevel × rarityMult × 10 + statSum × 5` | |
| Repair Cost | `basePrice × 0.1 × (lostDur / maxDur)` | |
| Upgrade Chance | `75% - 5% × level` | max level: +10 |
| Stat Training | `floor(50 × 1.05^statValue)` | exponential gold cost |

# APPENDIX B — Equipment Slot Reference

| Slot | Item Types | Notes |
|------|-----------|-------|
| weapon | weapon | Main hand |
| weapon_offhand | weapon | Off-hand (blocked by two-handed) |
| helmet | helmet | |
| chest | chest | |
| gloves | gloves | |
| legs | legs | |
| boots | boots | |
| accessory | accessory | |
| amulet | amulet | May have unique passive |
| belt | belt | |
| relic | relic | May have unique passive |
| necklace | necklace | |
| ring | ring | |

# APPENDIX C — Minigames *(Added v3.0)*

## Gold Mine (Idle)
- Unlock slots with gold; each slot produces gold over 30 min cycles
- Reward: `100 + (level × 3)` per cycle
- Boost with gems for 2x rewards

## Shell Game (Gambling)
- Bet gold, pick the correct shell (1 in 3 chance)
- Win: 2.5x bet, Lose: lose bet
- Server-side secret prevents manipulation

## Dungeon Rush (Wave Mode)
- 5 waves of increasingly difficult mobs
- Stamina cost: 3
- Rewards per wave + full clear bonus

# APPENDIX D — Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Feb 11, 2026 | Initial GDD |
| 3.0 | Feb 12, 2026 | Synced with codebase: PvP rating starts at 0 (was 1000), floor at 0 (was 1000), 13 equipment slots (was 7), added minigame docs, marked prestige as planned, added formula reference table |

## DOCUMENT END

**Total Pages:** ~55+ pages of content  
**Sections Covered:** 12 major sections + 4 appendices  
**Production Readiness:** ✓ In production  

**Last Updated:** February 12, 2026

---
