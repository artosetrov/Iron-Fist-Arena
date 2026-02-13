# Stray City — Hub Map Design Document

## World Context

**Grandria** — a continent stitched from the ruins of five fallen kingdoms. When the Barrier between worlds cracked, the dead walked, demons deserted their posts, and every monster with a grudge found a way through. Armies fell. Kings vanished.

**Stray City** — the last standing settlement. Once an unremarkable trade outpost, now the reluctant capital of the desperate, the ambitious, and the clinically insane. Not because it was strong, but because nobody thought it was worth destroying.

The city is HOME to every race:
- **Humans** — most common, practical, refugees from fallen kingdoms
- **Orcs** — green-skinned, muscular, working as bouncers and blacksmiths
- **Skeletons** — walking dead in armor, going about daily business as if alive
- **Demons** — small horns, some in office-style clothes — bureaucratic deserters from Hell
- **Dogfolk** — anthropomorphic dog warriors — loyal, fierce, fluffy ears

---

## Hub Architecture (3 Layers)

```
Layer 3: Pin markers + tooltips + glow overlays (interactive)
Layer 2: 8 building sprites (transparent PNG, 1024x1024 each)
Layer 1: Background landscape (opaque PNG, 1536x1024)
```

All layers are rendered as absolutely positioned `<Image>` elements inside a scrollable container.

---

## Layer 1: Background Landscape

**File:** `public/images/ui/hub-bg.png` (1536x1024, opaque)

Contains ONLY terrain and environment — NO buildings:
- Lush green hills with wildflowers, mushrooms
- Cobblestone roads from mismatched stones of 5 kingdoms (white marble, grey granite, red sandstone, dark basalt, green-veined obsidian)
- 8 clear sandy/stone ground patches where buildings are placed
- A narrow magical stream/canal with blue-green glow, two stone arch bridges
- A cracked stone fountain in the center with a fish-shaped water spout
- Crumbling wall fragments from old kingdoms at ALL edges (elven arches, dwarven blocks, human brick towers)
- A toppled moss-covered king statue at the upper edge
- Dense cartoon forest at all map edges
- Medieval iron street lamps along paths
- Barrels, crates, sacks, a cart with broken wheel
- Signposts with carved arrows (no text)
- Chickens, a cat, scattered autumn leaves
- **Distant mountains with ominous purple-red Barrier glow on the horizon** — the seasonal threat foreshadowing
- Sky transitions from warm golden (lower) to darker ominous purple-grey (upper horizon)

### Art Prompt (Layer 1)

> Create a 2D hand-painted cartoon fantasy RPG city MAP BACKGROUND in premium casual browser game style, inspired by Shakes and Fidget city map aesthetic.
>
> STYLE: Rich hand-painted digital illustration. NOT pixel art, NOT low-poly, NOT flat vector. Thick clean black outlines. Soft gradient shading, warm directional light from upper-left. Vibrant but slightly desaturated palette with warm amber undertones. Semi-isometric bird's-eye perspective (45-degree). Dense and detailed. No text, no UI.
>
> CONTENT: Landscape of medieval fantasy city "Stray City" built on ruins of five fallen kingdoms. BASE LAYER only — buildings placed separately. Cobblestone roads from mismatched kingdom stones creating patchwork paths. 8 clear open spaces for buildings (one large central, 2 upper, 2 middle, 3 lower). Narrow magical stream with stone bridges. Cracked fountain in center. Crumbling wall ruins at all edges (different architectural styles). Dense forest at edges. Street lamps, barrels, benches, chickens. Mountains with purple-red Barrier glow on horizon. Golden hour lighting.

---

## Layer 2: Buildings (8 Sprites)

Each building is a separate 1024x1024 PNG with transparent background, rendered with absolute positioning over the landscape.

### Layout on Map

```
     [Dungeon]        [Arena]         [Shop]
                      (center)
     [Tavern]        (fountain)      [Training]

     [Leaderboard]  [Blacksmith]    [Warehouse]
```

---

### 1. The Iron Fist Arena

**File:** `public/images/buildings/building-arena.png`
**Route:** `/arena`
**Position:** Center of map (largest building)

**Lore:** A massive colosseum — the beating heart of Stray City and its reason for existence. When it became clear that evil arrives every season, the city found a solution: an Arena. Fight — and if you make the Top 100, you get to save the world.

**Visual Details:**
- Circular stone colosseum built from stones of 5 different fallen kingdoms (white marble, dark basalt, red sandstone, grey granite, green-veined demon obsidian) — patchwork masonry
- Burning torches on iron brackets with skull decorations
- Tattered red and gold war banners
- Sandy fighting pit visible from above with dust cloud
- Iron portcullis entrance with crossed-sword reliefs
- Two stone lion statues flanking the gate
- Tiny spectators visible in the stands (mixed races)
- Small registration booth near entrance
- Battle scars on walls (sword marks, scorch marks)

### Art Prompt

> Semi-isometric cartoon fantasy RPG building sprite, transparent background, thick black outlines, casual MMO style.
> MASSIVE circular stone COLOSSEUM from salvaged stones of 5 kingdoms — white marble, dark basalt, red sandstone, grey granite, green obsidian sections creating patchwork walls. Burning torches on iron brackets. Skull decorations. Red and gold war banners. Sandy fighting pit visible from top with dust cloud. Iron portcullis gate with crossed swords. Two stone lion statues at entrance. Tiny spectators in stands. Registration booth. Battle-scarred walls.

---

### 2. The Catacombs (Dungeon)

**File:** `public/images/buildings/building-dungeon.png`
**Route:** `/dungeon`
**Position:** Upper-left

**Lore:** Dark tunnels beneath the city, crawling with monsters and treasure. The deeper you go, the richer — or deader — you get.

**Visual Details:**
- Dark cave mouth in black craggy rock
- Ancient stone archway with glowing purple-red runes (Barrier energy)
- Heavy rusted iron gates with chains, partially open
- Skull-shaped torches with green flames
- Cracked stone steps descending into darkness
- Green-purple mist seeping from depths
- Bones, broken weapons, discarded shield scattered near entrance
- Glowing bioluminescent mushrooms and plants
- Deep claw marks on stone archway
- A giant rat nearby
- Cobwebs, dripping stalactites inside

### Art Prompt

> Semi-isometric cartoon fantasy RPG dungeon entrance sprite, transparent background, thick black outlines.
> Dark cave mouth in BLACK ROCK. Ancient stone archway with GLOWING PURPLE-RED RUNES. Rusted iron gates with chains. Skull torches with GREEN FLAMES. Stone steps into darkness. Green-purple mist. Bones, broken weapons. Glowing mushrooms. Claw marks. Giant rat. Cobwebs.

---

### 3. Market Square (Shop)

**File:** `public/images/buildings/building-shop.png`
**Route:** `/shop`
**Position:** Upper-right

**Lore:** Weapons, armor, potions — if it exists, someone here is selling it. Prices are fair. Refunds are not.

**Visual Details:**
- Multiple merchant stalls with colorful striped canvas awnings (red, blue, yellow, green)
- Weapons hanging from hooks (swords, axes, oversized war hammer)
- Armor on display stands
- Potion stall with glowing bottles in every color (red, blue, green, purple, gold)
- Fat goblin merchant behind main counter
- Crates of exotic goods: crystals, mysterious jars, maps, enchanted jewelry
- Colorful paper lanterns strung between stalls
- Barrels of produce, hanging dried meats and herbs
- Gold scale on counter, scattered coins on ground

### Art Prompt

> Semi-isometric cartoon fantasy RPG marketplace sprite, transparent background, thick black outlines.
> Multiple merchant STALLS with colorful striped AWNINGS. Weapons on hooks. Armor on stands. POTION STALL with glowing bottles. Fat GOBLIN MERCHANT. Crates of crystals, jars, maps. Colorful LANTERNS strung between stalls. Barrels, hanging meats, herbs. Gold scale, scattered coins.

---

### 4. Mama Grog's Tavern

**File:** `public/images/buildings/building-tavern.png`
**Route:** `/minigames`
**Position:** Left-center

**Lore:** Sit down, drink up, lose your gold in the shell game. That's what the tavern's for. Therapy is extra.

**NPC:** Mama Grog — Tavern Owner

**Visual Details:**
- Leaning two-story wooden building (charming, not dilapidated)
- Dwarven stone foundation (salvaged ruins, grey with carved patterns)
- Mixed timber and cream plaster walls with patches and repairs
- Warm golden light from every window
- Brick chimney with thick white smoke
- Beer barrels and wine casks stacked outside in pyramid
- Wooden porch with hanging lanterns
- Sign with beer mug and dice (no text)
- **Drunk green orc** passed out face-down on porch steps
- Flower boxes in every window
- **Skeleton** looking out upstairs window holding a drink
- Beer mug-shaped weathervane on roof
- Vines growing up one wall
- Patched multi-color roof shingles

### Art Prompt

> Semi-isometric cartoon fantasy RPG tavern sprite, transparent background, thick black outlines, warm cozy atmosphere.
> LEANING two-story wooden tavern. Dwarven stone foundation. Mixed timber walls with patches. WARM GOLDEN LIGHT from windows. Brick chimney with smoke. BEER BARRELS stacked outside. Porch with lanterns. Beer mug sign. DRUNK ORC face-down on steps. Flower boxes. SKELETON in upstairs window with drink. Beer mug WEATHERVANE. Vines, patched roof.

---

### 5. Training Grounds

**File:** `public/images/buildings/building-training.png`
**Route:** `/combat`
**Position:** Right-center

**Lore:** If you can't beat wood — the darkness will swallow you whole. Practice here before the Arena eats you alive.

**NPC:** Old Instructor Fang — Training Master

**Visual Details:**
- Open-air sandy practice yard with wooden fences
- Multiple training dummies (pristine, arrows sticking out, missing head, split in half)
- Weapon racks with practice swords, shields, axes
- Hay-bale archery targets (one bullseye, many misses)
- Grizzled old instructor with eye patch, arms crossed
- Sand bags on A-frames, climbing ropes
- Obstacle course with walls and balance poles
- Well-worn sand with footprints
- Water barrel and towels
- Pile of broken practice swords
- Tiny mage practicing fireballs — scorch marks everywhere (terrible aim)

### Art Prompt

> Semi-isometric cartoon fantasy RPG training grounds sprite, transparent background, thick black outlines.
> Open sandy PRACTICE YARD with wooden fences. Training DUMMIES in various destruction states. WEAPON RACKS. HAY-BALE archery targets. Old INSTRUCTOR with eye patch. Sand bags, ropes. Obstacle course. Worn sand. Water barrel. Broken sword pile. Tiny MAGE with SCORCH MARKS everywhere.

---

### 6. Hall of Fame (Leaderboard)

**File:** `public/images/buildings/building-leaderboard.png`
**Route:** `/leaderboard`
**Position:** Lower-left

**Lore:** The eternal records of the greatest fighters. Golden plaques, dusty trophies, and a very long list of names — most of them crossed out.

**Visual Details:**
- Grand weathered stone hall from white elven marble
- Tall Corinthian columns with ornate capitals (some chipped, gold leaf worn)
- Classical pediment with carved battle scenes
- Open bronze doors showing trophy displays inside
- Central golden champion statue on pedestal (heroic pose, sword raised)
- Laurel wreaths carved in stone
- Eternal flame braziers with blue-white magical fire
- Faded banners of past champions (red, blue, green, purple, gold)
- Overgrown with ivy and climbing roses
- Cracked marble steps
- Memorial flower garden

### Art Prompt

> Semi-isometric cartoon fantasy RPG hall of fame sprite, transparent background, thick black outlines.
> Grand WEATHERED WHITE MARBLE hall. Tall CORINTHIAN COLUMNS. Classical PEDIMENT with battle carvings. Open BRONZE DOORS with trophy displays. GOLDEN CHAMPION STATUE on pedestal. Laurel wreaths. BLUE-WHITE eternal flame braziers. Faded champion BANNERS. IVY and roses overgrown. Cracked steps. Memorial garden.

---

### 7. The Rusty Nail (Blacksmith)

**File:** `public/images/buildings/building-blacksmith.png`
**Route:** `/inventory` (upgrade tab)
**Position:** Lower-center

**Lore:** Every blade is a work of art. Every art has a price. Bring your gear for repairs, upgrades, and unsolicited opinions.

**NPCs:**
- Bram One-Eye — Blacksmith (main, human, one-eyed)
- Orc apprentice working bellows
- The Blue Anvil Masters — Master Smiths Guild

**Visual Details:**
- Open-air forge around massive ancient dwarven furnace (centuries old, magical fire)
- Huge furnace glowing intense orange-red with magical flames
- Billowing dark smoke with orange sparks
- Huge iron anvil, glowing from use
- Bram One-Eye hammering a glowing white-hot sword, sparks flying
- Orc apprentice working leather bellows
- Hanging weapons and armor on display (swords, axes, shields, helmets, chainmail)
- Grinding wheel, buckets of water with steam
- Metal ingots — iron, steel, rare glowing blue magical metal
- Armor stand with blue-glowing rare armor (work in progress)
- Heat shimmer in the air
- Chains and metal scraps on ground

### Art Prompt

> Semi-isometric cartoon fantasy RPG blacksmith forge sprite, transparent background, thick black outlines, dramatic fire lighting.
> Open-air FORGE with massive ancient DWARVEN FURNACE glowing orange-red. Billowing smoke with ORANGE SPARKS. Huge ANVIL. ONE-EYED BLACKSMITH hammering glowing sword. ORC APPRENTICE at bellows. Hanging weapons and armor. Grinding wheel. Water buckets with STEAM. Metal ingots including GLOWING BLUE magical metal. BLUE-GLOWING rare armor on stand. Heat shimmer.

---

### 8. Warehouse

**File:** `public/images/buildings/building-warehouse.png`
**Route:** `/inventory`
**Position:** Lower-right

**Lore:** Store your loot, sort your gear, and pretend you have a system. The warehouse doesn't judge. Much.

**Visual Details:**
- Large reinforced wooden warehouse-barn
- Thick timber beams with iron bands, padlocks, security chains
- Patched roof (clay tiles, thatch, a flattened old shield as repair)
- Open main doors showing towering stacks of crates, barrels, treasure chests
- Crates with burned symbols (sword, potion, armor outlines)
- Wooden crane/pulley system with rope
- Loading dock with cart
- Bored guard sitting on crate, feet up, napping
- 3-4 cats sleeping on various crates
- Dogfolk with clipboard checking inventory
- Crates stacked outside (overflowing)
- Cobwebs in upper corners

### Art Prompt

> Semi-isometric cartoon fantasy RPG warehouse sprite, transparent background, thick black outlines.
> Large reinforced WOODEN WAREHOUSE with iron bands, padlocks, chains. PATCHED ROOF (tiles, thatch, old shield). Open doors showing stacked CRATES, BARRELS, TREASURE CHESTS. Crates with BURNED SYMBOLS. CRANE/PULLEY system. NAPPING GUARD on crate. CATS sleeping everywhere. DOGFOLK with clipboard. Overflowing crates outside. Cobwebs.

---

## Layer 3: Pin Markers

**Directory:** `public/images/buildings/pins/`

8 circular blue-gold medieval shield-shaped map pin markers (1024x1024, transparent).
Each has a circular medallion with an icon on a short pointed stake:

| Pin | Icon |
|-----|------|
| `pin-arena.png` | Gladiator helmet + crossed swords |
| `pin-dungeon.png` | Skull + torch |
| `pin-shop.png` | Gold coin + money bag |
| `pin-tavern.png` | Frothy beer mug |
| `pin-training.png` | Wooden training dummy |
| `pin-leaderboard.png` | Golden trophy cup |
| `pin-blacksmith.png` | Anvil + hammer with sparks |
| `pin-warehouse.png` | Treasure chest |

---

## Interactions

### Hover Behavior
1. **Pin** — lifts up (`-translate-y-1.5`), scales (`scale-110`), golden drop-shadow
2. **Building sprite** — `brightness-110` filter
3. **Hitbox zone** — radial amber glow overlay
4. **Tooltip** — fades in above pin with building name + lore description + arrow

### Idle Animation
- All pins gently float (CSS `@keyframes hub-pin-float`, 3s infinite)

### Click
- Navigate to building's route with `characterId` preserved

### Drag
- Horizontal + vertical drag-to-scroll
- Click suppressed after drag (threshold 5px)

---

## File Structure

```
public/images/
  ui/
    hub-bg.png                    # Layer 1: landscape background
  buildings/
    building-arena.png            # Layer 2: building sprites
    building-dungeon.png
    building-shop.png
    building-tavern.png
    building-training.png
    building-leaderboard.png
    building-blacksmith.png
    building-warehouse.png
    pins/
      pin-arena.png               # Layer 3: pin markers
      pin-dungeon.png
      pin-shop.png
      pin-tavern.png
      pin-training.png
      pin-leaderboard.png
      pin-blacksmith.png
      pin-warehouse.png

app/(game)/hub/page.tsx           # Hub component
lib/game/lore.ts                  # HUB_BUILDING_LORE data
app/globals.css                   # hub-pin-float animation
```

---

*Last verified: 2026-02-13. All 8 buildings, pins, routes and lore confirmed accurate against hub/page.tsx and lore.ts.*
