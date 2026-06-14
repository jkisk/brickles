# Handoff: Worlds, Level Select, and HUD Theming (Brickles)

## Overview

This package specs three additions to the existing **Brickles** brick-breaker game:

1. **Two "worlds"** spanning the 10 existing levels (a daytime World 1 and a candy-night World 2), formalized as data + theming.
2. A **Level Select screen** with a real **unlock + save system** (none exists today beyond a high score).
3. Two polish fixes from a design review: **per-world HUD theming** (so the level title stays legible on the dark world) and a **unified control-button family** (pause + mute currently look like two different systems).

All of it stays inside the game's existing **soft-pastel + dark-ink-outline** look. No new art is required — every value here is a hex color or a CSS/canvas primitive.

---

## About the design files

The `references/` folder contains **two HTML design references** created as part of this spec:

- `references/Worlds & Level Select Spec.html` — the full written spec + a pixel-accurate (1080×1320) mockup of the Level Select screen.
- `references/HUD & Buttons Mockup.html` — before/after mockups of the per-world HUD and the unified buttons, with drop-in CSS.

**These HTML files are design references, not code to ship.** They demonstrate the intended look and behavior. The task is to implement the designs **in the existing Brickles TypeScript codebase** (`game.ts` / `levels.ts` / `audio.ts` / `render.ts` + `index.html`), using its established patterns — not to embed the HTML.

> ⚠️ **Important layer distinction.** The mockups render the HUD in HTML/CSS for convenience, but in the real game **the HUD is drawn on `<canvas>`** by `drawHUD(...)` in `render.ts`. So:
> - **HUD theming** → change canvas text rendering inside `drawHUD` (fillStyle / strokeStyle / shadow), *not* CSS.
> - **Pause / mute buttons + all overlays** → these *are* real DOM elements (`.overlay` divs, `#btn-pause`, `#btn-mute`) in `index.html`, styled with CSS. The Level Select screen should be built the same way (a new `.overlay` div).

## Fidelity

**High-fidelity.** Colors, gradients, type, and layout are final and exact. Recreate them faithfully using the codebase's existing primitives (the `RB` palette, `INK`, Fredoka, the canvas draw helpers, and the existing `.overlay` CSS pattern).

---

## Orientation: the codebase as it stands

Read these before implementing — the change set hooks into them directly.

**Files**
- `levels.ts` — `ColorName`, `RB` palette, `INK = '#34215a'`, `brickFromChar()`, and `LEVELS: Level[]` (10 entries). `Level` is currently `{ name, grid }`.
- `game.ts` — state machine, level builder, transitions, input, overlay helpers.
- `render.ts` — **not in this bundle**; owns `drawBackground()`, `drawHUD()`, and all canvas draw helpers. Several changes below land here.
- `audio.ts` — `Sound` (sfx). No changes needed.
- `index.html` — **not in this bundle**; holds the `<canvas id="game">`, the `#stage`, the `.overlay` divs (`overlay-title`, `overlay-levelclear`, `overlay-gameover`, `overlay-win`, `overlay-pause`) and the control buttons (`#btn-pause`, `#btn-mute`, plus overlay buttons `#btn-start`, `#btn-next`, `#btn-retry`, `#btn-again`, `#btn-resume`).

**State machine** (`game.ts`)
```ts
type GameState = 'title' | 'serve' | 'play' | 'paused' | 'levelclear' | 'gameover' | 'win';
```
Overlays are shown/hidden via `show(id)` / `hideAll()` (toggling a `.show` class on `.overlay` divs).

**Persistence today:** only `localStorage['brickles_hi']` (high score), read into `highScore`, written by `saveHi()`.

**Key functions to hook:** `buildLevel(i)`, `levelClear()`, `nextLevel()`, `startGame()`, `endGame(won)`, `show()/hideAll()`.

---

## Change set

### A. Data model — worlds (`levels.ts`)

Add an explicit `world` field to `Level`, a `World` interface, and a `WORLDS` array that owns each world's theme (the single source of truth for sky + HUD mood).

```ts
export interface Level {
  name: string;
  grid: string[];
  world: number;              // NEW · 1-based world id
}

export interface World {
  id: number;
  name: string;               // "Meadow & Sky"
  mood: 'daytime' | 'candy-night';
  sky: [string, string, string];   // gradient stops, top → bottom
  twinkles: number;           // decor density (current global is 26)
}

export const WORLDS: World[] = [
  { id: 1, name: 'Meadow & Sky',     mood: 'daytime',
    sky: ['#9ed8ff', '#c5ecff', '#eafff4'], twinkles: 18 },
  { id: 2, name: 'Starlight & Sugar', mood: 'candy-night',
    sky: ['#4a3b8f', '#8a5fc0', '#d98fd0'], twinkles: 40 },
];

// Helper — survives reordering; falls back to 5-per-world if `world` ever missing.
export function worldOf(levelIdx: number): World {
  const id = LEVELS[levelIdx]?.world ?? Math.floor(levelIdx / 5) + 1;
  return WORLDS.find(w => w.id === id) ?? WORLDS[0];
}
```

**Mapping (5 + 5):** levels 0–4 → `world: 1`, levels 5–9 → `world: 2`. Add `world: 1` to each of the first five `LEVELS` entries and `world: 2` to the last five. The split matches the existing difficulty/mood break — *Star Burst* (index 5) is the turn into night.

| idx | name | world |
|----|------|-------|
| 0 | Rainbow Land | 1 |
| 1 | Sprite Meadow | 1 |
| 2 | Twin Hearts | 1 |
| 3 | Color Castle | 1 |
| 4 | Sky Sprinkle | 1 |
| 5 | Star Burst | 2 |
| 6 | Candy Stripe | 2 |
| 7 | Diamond Drop | 2 |
| 8 | Checkerboard | 2 |
| 9 | Final Flash | 2 |

> **Reconcile with `render.ts`:** the screenshots already show a day sky for *Sprite Meadow* and a night sky for *Final Flash*, so `drawBackground()` may already theme per level by some means. Make `WORLDS` the canonical source: have `drawBackground()` receive the active `World` (or its `sky`/`twinkles`) and read from it, replacing any hard-coded constants. Today it's called as `drawBackground(ctx, W, H, t, clouds, twinkles)` with a module-level `twinkles` array of length 26 — drive that length/array and the gradient stops from `worldOf(levelIdx)`.

### B. Progress persistence (`game.ts`)

One new `localStorage` key beside `brickles_hi`.

```ts
interface Progress {
  maxUnlocked: number;            // 0-based index of furthest playable level
  best: Record<number, number>;   // levelIdx → best score achieved on that level
}

const PROGRESS_KEY = 'brickles_progress';

function loadProgress(): Progress {
  try {
    const p = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '');
    if (p && typeof p.maxUnlocked === 'number') return { maxUnlocked: p.maxUnlocked, best: p.best ?? {} };
  } catch {}
  return { maxUnlocked: 0, best: {} };   // only level 1 open by default
}

function saveProgress(p: Progress): void {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
}

let progress = loadProgress();
```

### C. Unlock rule

- Level 0 is always unlocked.
- Beating level **N** unlocks **N+1** (`maxUnlocked = max(maxUnlocked, N+1)`, capped at `LEVELS.length - 1`).
- Cleared levels stay cleared and are replayable; replay can only raise `best[idx]`.
- Worlds gate implicitly: World 2 "opens" simply because clearing level 4 unlocks level 5.

Tile state is **derived**, not stored:

| State | Condition |
|-------|-----------|
| Completed | `best[idx] !== undefined` |
| Unlocked (current) | `idx === maxUnlocked` (furthest, not-yet-cleared) |
| Unlocked (replayable) | `idx < maxUnlocked` *and* completed |
| Locked | `idx > maxUnlocked` |

Record progress inside the existing `levelClear()`, right after `score += 500`:

```ts
function levelClear(): void {
  score += 500;
  Sound.levelClear();

  // NEW — record unlock + best for this level
  progress.maxUnlocked = Math.min(LEVELS.length - 1, Math.max(progress.maxUnlocked, levelIdx + 1));
  const levelScore = score - scoreAtLevelStart;            // see note ↓
  progress.best[levelIdx] = Math.max(progress.best[levelIdx] ?? 0, levelScore);
  saveProgress(progress);

  if (levelIdx >= LEVELS.length - 1) { endGame(true); return; }
  state = 'levelclear';
  saveHi();
  // …existing overlay population…
  show('overlay-levelclear');
}
```

> ⚠️ **Score is cumulative across a run.** `score` is only reset in `startGame()`; each level adds to it, so there is no per-level score today. Two options for the "best score" shown on a completed tile:
> 1. **Per-level delta (recommended):** snapshot `let scoreAtLevelStart = score;` at the end of `buildLevel(i)`, then `levelScore = score - scoreAtLevelStart` as above. Gives a meaningful per-level number.
> 2. **Simplest:** drop the number entirely and show only the ★ "cleared" badge. The Level Select layout works fine without per-tile scores.
> Pick one; the mockup shows option 1.

### D. Level Select screen (new `.overlay` in `index.html` + `game.ts`)

**Build it as an HTML overlay, not a canvas state** — it's fundamentally a set of stateful buttons, and reusing the existing `.overlay` + `show()/hideAll()` machinery gets focus, tap targets, and scrolling for free with zero changes to the render loop.

**State:** add `'levelselect'` to `GameState`. It is a paused-render state (no ball physics) — `update()` already early-returns for non-`play`/`serve` states, so no loop change needed.

**Markup:** add `<div id="overlay-levelselect" class="overlay">…</div>` to `index.html`, matching the structure/》styling of the existing overlays. Inside: a top bar (back chevron → title, "Choose a Level" heading, "N / 10 ★" progress), then **one band per world**, each with a chunky header pill (world-number disc in the world's signature hue + name + "x / 5 cleared") and a row of **5 level tiles** joined by a dashed ink "trail."

**Populate dynamically** from `LEVELS` + `WORLDS` + `progress` when the screen opens:

```ts
function openLevelSelect(): void {
  state = 'levelselect';
  renderLevelTiles();           // builds tile DOM from LEVELS + progress
  show('overlay-levelselect');
}

function playLevel(i: number): void {
  if (i > progress.maxUnlocked) return;   // locked — ignore
  // mirror startGame() but at a chosen index, preserving a fresh run:
  levelIdx = i; score = 0; lives = 5; bestCombo = 0; combo = 0;
  buildLevel(i);
  state = 'serve';
  hideAll();
  Sound.init();
}
```

> Decide with the team whether selecting a mid-run level resets `score`/`lives` (treats each pick as a fresh attempt — simplest and matches `startGame`) or resumes a cumulative run. The snippet above resets, which is the recommended default.

**Tile states** (see mockup for exact look):
- **Completed** — full-color fill with a mint tint `linear-gradient(180deg,#fff,#eafff0)`, gold ★ badge, best score in JetBrains Mono (if using option 1 above). Tappable → replays.
- **Current** — the single `idx === maxUnlocked` tile. Honey fill `linear-gradient(180deg,#fff7c2,#ffe06b)`, an **orange glow ring** (`box-shadow: 0 9px 0 #34215a, 0 0 0 7px rgba(255,217,59,.45), 0 0 44px rgba(255,159,67,.6)`), ▶ badge, "PLAY" pill. The obvious next tap.
- **Locked** — desaturated lilac hatch `repeating-linear-gradient(135deg,#e7e0f0,#e7e0f0 14px,#ded5ec 14px,#ded5ec 28px)`, grey ink `#9a8cb5`, padlock badge, no score, not focusable, ignores taps. Still shows its number; hide the *name* (show "???") for not-yet-reached levels to keep mystery.

**Entry points & wiring:**
- Add a **"Choose Level"** button to `overlay-title` → `openLevelSelect()`. (Existing `#btn-start` can stay as "continue at furthest unlocked": `levelIdx = progress.maxUnlocked` then build, instead of always 0.)
- Add a **"Level Map"** button to `overlay-levelclear` and `overlay-gameover` → `openLevelSelect()`.
- Back chevron on the level-select overlay → `show('overlay-title'); state = 'title';`.
- Wire all new buttons in the existing button-binding block at the bottom of `game.ts`.

### E. HUD per-world theming (`render.ts` — canvas)

`drawHUD` currently renders the score / level-name / lives in ink-purple. On the dark World 2 sky the title sinks into the background. Pass the active world's `mood` (or the `World`) into `drawHUD` and branch the text treatment:

- **Daytime:** ink text `#34215a` on the existing light bar (no change to text color).
- **Candy-night:** **white** text `#ffffff` with an **ink drop shadow / stroke** — render the title with `ctx.strokeStyle = '#1d1336'; ctx.lineWidth ≈ 5; ctx.strokeText(...)` then `ctx.fillStyle = '#fff'; ctx.fillText(...)`, and lift the bar's translucent fill toward `rgba(52,33,90,.42)`. (This mirrors how floaters are already stroked in `render()`.)

Update the call site in `render()`:
```ts
const w = worldOf(levelIdx);
drawHUD(ctx, W, HUD_H, score, lives, LEVELS[levelIdx].name, effects, combo, w.mood);
```
The mockup's CSS (`.hud.night .title { color:#fff; text-shadow:0 2px 0 #1d1336 }`) is the **visual target**; the implementation is canvas text, not CSS.

### F. Unified control buttons (`index.html` + CSS)

Today `#btn-pause` is a white circle and `#btn-mute` is a dark circle with an emoji (`toggleMute()` swaps `textContent` between 🔇/🔊). Unify them:

- Both **48px**, `4px` solid `#34215a` border, hard shadow `0 5px 0 #34215a`, white fill, ink-colored **SVG glyph** (replace the emoji — see mockup for the speaker / speaker-✕ / pause paths).
- **Default = white fill / ink glyph** (pause, sound-on).
- **Muted state = invert** to ink fill `#34215a` / white glyph, with an ✕ over the speaker. Now "dark" *means* "off" (meaningful state) rather than being an arbitrary style difference. Toggle a class in `toggleMute()` instead of swapping emoji text.

---

## Design tokens

**Ink (single outline color, everywhere):** `#34215a`. Darker shadow ink: `#1d1336`.

**Pastel palette** (verbatim from `RB` in `levels.ts` — fill / shade / light):
| name | fill | shade | light |
|------|------|-------|-------|
| red | `#ff5d6c` | `#c2364a` | `#ffb3bb` |
| orange | `#ff9f43` | `#cf6f1e` | `#ffd39e` |
| yellow | `#ffd93b` | `#d4a700` | `#fff0a3` |
| green | `#5fd97a` | `#2f9e4c` | `#bdf3c8` |
| teal | `#3fd0d6` | `#1c9aa0` | `#a9eef0` |
| blue | `#4db5ff` | `#1d7fcc` | `#b3dcff` |
| purple | `#a87cff` | `#7148cc` | `#dcc9ff` |
| pink | `#ff7fc4` | `#cc4d93` | `#ffc4e4` |

**World skies (gradient stops, top → bottom):**
- World 1 · Meadow & Sky — `#9ed8ff → #c5ecff → #eafff4`, twinkles 18
- World 2 · Starlight & Sugar — `#4a3b8f → #8a5fc0 → #d98fd0`, twinkles 40
- Level-select screen sky (neutral, holds both worlds): `#bfe6ff → #dff1ff → #fdeffa → #ffe7f4`

**HUD bar fill:** day `rgba(255,255,255,.78)`; night `rgba(52,33,90,.42)`.

**Outline / depth spec:** outline weight — bricks/ball/paddle 5px, UI tiles 6–7px, buttons 4px. Drop shadow — hard offset, no blur: `0 Npx 0 #34215a` (N ≈ 5–9 by element). Corner radius — bricks 13px, tiles 28–30px, pills/buttons 999px. Sheen — top inset bar `rgba(255,255,255,.55)`.

**Type:** **Fredoka** (display + UI, all weights), already in-engine. No new families.

**Level-select tile fills:** completed `linear-gradient(180deg,#fff,#eafff0)`; current `linear-gradient(180deg,#fff7c2,#ffe06b)`; locked `repeating-linear-gradient(135deg,#e7e0f0,#e7e0f0 14px,#ded5ec 14px,#ded5ec 28px)` with grey ink `#9a8cb5`.

---

## Assets

No image assets. Everything is canvas primitives, CSS, the `RB`/`INK` tokens, and inline SVG glyphs for the two buttons (paths in `references/HUD & Buttons Mockup.html`). Fredoka is already loaded by the game.

---

## Files

**In this bundle:**
- `README.md` — this document (self-sufficient).
- `references/Worlds & Level Select Spec.html` — full spec + Level Select mockup (1080×1320).
- `references/HUD & Buttons Mockup.html` — HUD + button before/after with CSS.

**Source files to touch (in the Brickles repo):**
- `levels.ts` — add `world` to `Level`; add `World` + `WORLDS` + `worldOf()`; tag the 10 levels.
- `game.ts` — `Progress` type + load/save; record in `levelClear()`; add `'levelselect'` state, `openLevelSelect()`, `renderLevelTiles()`, `playLevel()`; new entry-point buttons; pass `mood` into the `drawHUD` call; optional `scoreAtLevelStart` snapshot in `buildLevel()`.
- `render.ts` — `drawHUD()` gains a `mood` arg (white+ink-stroke text on night); `drawBackground()` reads `WORLDS` for sky stops + twinkle count.
- `index.html` — new `#overlay-levelselect` div + its CSS; "Choose Level" / "Level Map" buttons on existing overlays; rework `#btn-pause` / `#btn-mute` to the unified SVG-glyph style.

## Open decisions (flag to the team)
1. **Per-tile score** — per-level delta (snapshot `scoreAtLevelStart`) vs. ★-only. Recommended: delta.
2. **Mid-run level pick** — reset score/lives per attempt (recommended, matches `startGame`) vs. resume cumulative.
3. **`#btn-start` semantics** — keep as "new game from level 1," or change to "continue at furthest unlocked." Recommended: continue, with "Choose Level" for explicit picks.
4. **Background theming** — confirm whether `drawBackground()` already themes per level and reconcile it to read from `WORLDS`.
