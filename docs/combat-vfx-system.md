# Combat VFX System — Documentation

## 1. Overview

The Combat VFX System adds Hearthstone-style visual effects to battles: flying projectiles, impact explosions, comic pop-up text sprites, and status tick overlays. All effects are PNG sprites animated with CSS-only keyframes for maximum performance on both desktop and mobile.

### Architecture

```
processEntry() → resolveVfx() → VfxCommand → CombatVfxLayer
                                                  ↓
                                    ┌─ Projectile (0ms)
                                    ├─ Impact (300ms)
                                    ├─ Popup sprite (400ms)
                                    └─ FloatingNumber (500ms, existing)
```

### Key files

| File | Purpose |
|------|---------|
| `lib/game/combat-vfx-map.ts` | Maps `action + class` to VFX config (projectile, impact, popup paths) |
| `lib/game/preload-combat-assets.ts` | Collects and preloads all PNGs before battle starts |
| `app/components/CombatVfxLayer.tsx` | Renders VFX sprites on top of fighter cards |
| `app/components/CombatLoadingScreen.tsx` | Pre-battle loading screen (API + asset preload) |
| `app/components/CombatBattleScreen.tsx` | Main battle component (dispatches VfxCommands) |
| `app/globals.css` | CSS @keyframes for all VFX animations |
| `public/images/combat/` | All PNG sprite assets |

---

## 2. Asset Catalog

### Projectiles (`public/images/combat/projectiles/`)

Fly from attacker to target. Size: 1024x1024, transparent background.

| Filename | Class/Weapon | Description |
|----------|-------------|-------------|
| `proj-sword.png` | Warrior / Sword | Flying sword with energy trail |
| `proj-dagger.png` | Rogue / Dagger | Flying dagger with poison trail |
| `proj-fireball.png` | Mage / Fire | Fireball with flames |
| `proj-ice-shard.png` | Mage / Ice | Ice crystal projectile |
| `proj-lightning.png` | Mage / Lightning | Lightning bolt |
| `proj-mace.png` | Tank / Mace | Flying war hammer |
| `proj-fist.png` | Unarmed | Cartoon fist punch |
| `proj-shield.png` | Tank / Shield | Spinning shield |

### Impacts (`public/images/combat/impacts/`)

Appear over target card on hit. Size: 1024x1024, transparent background.

| Filename | Type | Description |
|----------|------|-------------|
| `impact-slash.png` | Physical hit | Diagonal slash effect |
| `impact-blood.png` | Critical hit | Blood splatter |
| `impact-fire.png` | Burn / Fireball | Fire explosion |
| `impact-ice.png` | Frost Nova | Ice crystal burst |
| `impact-lightning.png` | Lightning | Electric shock arcs |
| `impact-poison.png` | Poison / Rogue | Toxic green splash |
| `impact-stun.png` | Stun | Stars and swirls |
| `impact-shield.png` | Block / Parry | Shield sparks |
| `impact-heal.png` | Healing | Green sparkle aura |
| `impact-buff.png` | Buff applied | Golden glow |

### Status Ticks (`public/images/combat/status/`)

Shown during status effect damage ticks. Size: 1024x1024, transparent background.

| Filename | Type | Description |
|----------|------|-------------|
| `status-bleed.png` | Bleed tick | Blood drops |
| `status-poison.png` | Poison tick | Toxic bubbles |
| `status-burn.png` | Burn tick | Small flames |

### Pop-up Sprites (`public/images/combat/popups/`)

Comic-style text sprites that appear above the target. Size: 1024x1024, transparent background.

**Basic attack** (yellow/orange):
`pop-boom.png`, `pop-slash.png`, `pop-take-that.png`, `pop-oof.png`, `pop-ouch.png`

**Crit** (red/crimson):
`pop-crit.png`, `pop-brutal.png`, `pop-ouch-crit.png`, `pop-wrecked.png`, `pop-mommy.png`

**Dodge** (cyan/blue):
`pop-missed.png`, `pop-too-slow.png`, `pop-hahaha.png`, `pop-nope.png`, `pop-dodged.png`

**Fire magic** (orange/flame):
`pop-burn.png`, `pop-incinerate.png`, `pop-fireball.png`

**Ice magic** (ice blue):
`pop-freeze.png`, `pop-brrr.png`, `pop-ice-cold.png`

**Lightning magic** (electric yellow):
`pop-bzzzzt.png`, `pop-shocking.png`, `pop-thunder.png`

**Poison** (toxic green):
`pop-poisoned.png`, `pop-toxic.png`, `pop-venomous.png`

**Stun** (purple):
`pop-stunned.png`, `pop-seeing-stars.png`, `pop-where-am-i.png`

**Heal** (bright green):
`pop-healed.png`, `pop-plus-hp.png`, `pop-refreshed.png`

**Buff** (gold):
`pop-power-up.png`, `pop-boosted.png`, `pop-fortified.png`

**Ultimate/Special** (multicolor glow):
`pop-obliterated.png`, `pop-annihilated.png`, `pop-destroyed.png`

---

## 3. VFX Map Reference

The VFX map (`lib/game/combat-vfx-map.ts`) maps combat actions to visual effects.

### Key format: `"action:class"`

Examples:
- `"basic:warrior"` — warrior's basic attack
- `"fireball:mage"` — mage's fireball ability
- `"dodge"` — any dodge (no class suffix)
- `"crit"` — crit overlay (added on top of action VFX)

### VfxConfig type

```typescript
type VfxConfig = {
  projectile?: string;   // Path to projectile PNG (optional for buffs)
  impact: string;        // Path to impact PNG
  popups: string[];      // Pool of popup sprite paths (random pick)
  screenShake?: boolean; // Shake battle area (ultimates, crits)
};
```

### Lookup priority (in `resolveVfx()`)

1. `"action:class"` — exact match (e.g. `"fireball:mage"`)
2. `"action"` — action-only match (e.g. `"dodge"`, `"crit"`)
3. `"basic:class"` — class basic fallback (e.g. `"basic:warrior"`)
4. `"basic:unarmed"` — universal fallback

### Full mapping

| Key | Projectile | Impact | Popup pool | Screen shake |
|-----|-----------|--------|------------|--------------|
| `basic:warrior` | proj-sword | impact-slash | boom, slash, take-that | No |
| `heavy_strike:warrior` | proj-sword | impact-blood | wrecked, boom | Yes |
| `battle_cry:warrior` | — | impact-buff | boom | No |
| `whirlwind:warrior` | proj-sword | impact-slash | slash, wrecked | Yes |
| `titan_slam:warrior` | proj-sword | impact-blood | wrecked, boom | Yes |
| `basic:rogue` | proj-dagger | impact-slash | slash, ouch | No |
| `quick_strike:rogue` | proj-dagger | impact-slash | slash, too-slow | No |
| `shadow_step:rogue` | — | impact-buff | boom | No |
| `backstab:rogue` | proj-dagger | impact-poison | hahaha, ouch | No |
| `assassinate:rogue` | proj-dagger | impact-blood | wrecked, boom | Yes |
| `basic:mage` | proj-fireball | impact-fire | boom, burn | No |
| `fireball:mage` | proj-fireball | impact-fire | burn, fireball, incinerate | No |
| `frost_nova:mage` | proj-ice-shard | impact-ice | freeze, brrr, ice-cold | No |
| `lightning_strike:mage` | proj-lightning | impact-lightning | bzzzzt, shocking, thunder | Yes |
| `meteor_storm:mage` | proj-fireball | impact-fire | boom, burn | Yes |
| `basic:tank` | proj-mace | impact-slash | boom, ouch | No |
| `shield_bash:tank` | proj-shield | impact-shield | boom, ouch | No |
| `iron_wall:tank` | — | impact-buff | boom | No |
| `counter_strike:tank` | proj-mace | impact-slash | boom, ouch | No |
| `immovable_object:tank` | — | impact-buff | boom | No |
| `dodge` | — | impact-shield | missed, dodged, too-slow, hahaha, nope | No |
| `crit` | — | impact-blood | crit, brutal, ouch-crit, mommy | No |
| `stun` | — | impact-stun | stunned | No |
| `heal` | — | impact-heal | boom | No |
| `basic:unarmed` | proj-fist | impact-slash | boom, ouch, oof | No |

---

## 4. How to Add a New Ability VFX

### Step 1: Generate PNG assets

Generate the needed sprites following the art style guide (`.cursor/rules/art-style-guide.mdc`):

- **Projectile** (if the ability throws something): 1024x1024, transparent bg
- **Impact** (if unique, otherwise reuse existing): 1024x1024, transparent bg
- **Pop-up sprite** (new text): 1024x1024, transparent bg, comic book style

Save to appropriate subfolder in `public/images/combat/`.

### Step 2: Add VFX_MAP entry

In `lib/game/combat-vfx-map.ts`, add a new entry:

```typescript
"new_ability:class": {
  projectile: proj("proj-new.png"),  // or omit for buffs
  impact: imp("impact-fire.png"),     // reuse or new
  popups: [pop("pop-new-text.png")],
  screenShake: true,                  // optional, for powerful abilities
},
```

### Step 3: Done!

No changes needed in `CombatVfxLayer`, `CombatBattleScreen`, or CSS. The `resolveVfx()` function will automatically find the new entry when the combat log contains this action.

---

## 5. How to Add a New Pop-up Text

1. Generate a PNG sprite in comic book style:
   - Text in bold, tilted at slight angle
   - Thick black outline with colored fill (match the action type color)
   - Transparent background, 1024x1024
   - Save to `public/images/combat/popups/pop-your-text.png`

2. Add the path to the relevant `popups[]` array in `VFX_MAP`:

```typescript
"fireball:mage": {
  // ...existing config...
  popups: [...existing, pop("pop-your-text.png")],
},
```

---

## 6. Animation Specs

All animations are CSS-only keyframes in `app/globals.css`.

| Animation | Class | Duration | Easing | Purpose |
|-----------|-------|----------|--------|---------|
| `projectile-fly-right` | `.animate-projectile-right` | 0.45s | cubic-bezier(0.25, 0.46, 0.45, 0.94) | Projectile flies left → right |
| `projectile-fly-left` | `.animate-projectile-left` | 0.45s | cubic-bezier(0.25, 0.46, 0.45, 0.94) | Projectile flies right → left |
| `impact-burst` | `.animate-impact-burst` | 0.5s | ease-out | Impact scales up then fades |
| `pop-text` | `.animate-pop-text` | 0.9s | ease-out | Popup bounces in, wobbles, fades |
| `status-tick-pulse` | `.animate-status-tick` | 0.7s | ease-out | Status effect pulse + fade |
| `screen-shake` | `.animate-screen-shake` | 0.4s | ease-in-out | Entire battle area shakes |
| `combat-shake` | `.animate-combat-shake` | 0.4s | ease-in-out | Single card shakes (existing) |
| `dodge-slide` | `.animate-dodge-slide` | 0.5s | ease-in-out | Card slides aside (existing) |
| `float-damage` | `.animate-float-damage` | 1.2s | ease-out | Damage number floats up (existing) |
| `float-damage-crit` | `.animate-float-damage-crit` | 1.4s | ease-out | Crit damage number, bigger (existing) |
| `loading-slide` | inline in loading screen | 1.2s | ease-in-out infinite | Loading bar slide animation |

### Performance notes

- All animations use `transform` and `opacity` only → GPU-composited
- `will-change: transform, opacity` on projectiles, impacts, popups
- Crit impacts get `filter: hue-rotate(-20deg) saturate(1.5)` via `.combat-impact-crit`

---

## 7. Timeline of a Single Turn (1200ms)

```
 0ms   ─ Projectile starts flying from attacker
 0ms   ─ Status tick VFX on actor (if statusTicks present)
300ms  ─ Impact appears on target + card shake + screen shake (if ult/crit)
400ms  ─ Pop-up sprite appears on target ("BOOM!", "CRIT!", etc.)
500ms  ─ Floating damage number appears (existing system)
~1000ms ─ All effects fade out
1200ms ─ Next turn begins
```

For dodge events:
```
 0ms   ─ Impact (shield) on target + dodge slide animation
200ms  ─ Pop-up sprite ("MISSED!", "NOPE!")
500ms  ─ "MISS" floating text (existing)
1200ms ─ Next turn
```

For buffs/heals (self-targeting):
```
 0ms   ─ Impact (buff/heal glow) on actor
200ms  ─ Pop-up sprite on actor
500ms  ─ Floating heal number "+HP" (existing)
1200ms ─ Next turn
```

---

## 8. Loading Screen

Before a battle begins, a loading screen (`CombatLoadingScreen`) is shown.

### Flow

1. User clicks "Train" → screen changes to `{ kind: "loading", preset }`
2. `CombatLoadingScreen` renders with animated VS silhouettes and rotating tips
3. In parallel:
   - API call to `/api/combat/simulate` fetches battle result
   - `collectBattleAssets()` scans the log and collects all unique PNG paths
   - `preloadImages()` loads all PNGs into browser cache via `new Image()`
4. When both complete → screen changes to `{ kind: "battle", result }`
5. Battle plays with zero lag — all images already cached

### Preloader API

```typescript
// Collect assets for specific battle
collectBattleAssets(log, playerSnapshot, enemySnapshot) → string[]

// Preload with optional progress callback
preloadImages(urls, onProgress?) → Promise<void>

// Preload everything (eager)
preloadAllCombatAssets(onProgress?) → Promise<void>
```

---

## 9. Performance Notes

- **CSS-only animations**: No JS `requestAnimationFrame`. All via `@keyframes` + `animation`.
- **GPU compositing**: Only `transform` and `opacity` are animated. No layout thrashing.
- **`will-change`**: Applied to projectiles, impacts, popups for GPU layer promotion.
- **Max concurrent VFX**: 8 elements per side. Oldest removed if exceeded.
- **Auto-cleanup**: Each VFX element removed from DOM via `setTimeout` after TTL.
- **Preloading**: All assets loaded before battle starts. No network during playback.
- **Missing assets**: Handled gracefully via `onerror → resolve()` in preloader.

---

## 10. File Structure

```
public/images/combat/
  projectiles/              ← 8 flying weapon PNGs
    proj-sword.png
    proj-dagger.png
    proj-fireball.png
    proj-ice-shard.png
    proj-lightning.png
    proj-mace.png
    proj-fist.png
    proj-shield.png
  impacts/                  ← 10 hit effect PNGs
    impact-slash.png
    impact-blood.png
    impact-fire.png
    impact-ice.png
    impact-lightning.png
    impact-poison.png
    impact-stun.png
    impact-shield.png
    impact-heal.png
    impact-buff.png
  status/                   ← 3 status tick PNGs
    status-bleed.png
    status-poison.png
    status-burn.png
  popups/                   ← 28+ comic text sprite PNGs
    pop-boom.png
    pop-slash.png
    pop-take-that.png
    ...

lib/game/
  combat-vfx-map.ts         ← VFX mapping + helpers
  preload-combat-assets.ts   ← Asset preloader

app/components/
  CombatVfxLayer.tsx         ← VFX render layer
  CombatLoadingScreen.tsx    ← Pre-battle loading screen
  CombatBattleScreen.tsx     ← Main battle (integrates VFX)

app/globals.css              ← All @keyframes animations

docs/
  combat-vfx-system.md      ← This file
```

---

*Last verified: 2026-02-13. All mappings and assets confirmed accurate against `lib/game/combat-vfx-map.ts`.*
