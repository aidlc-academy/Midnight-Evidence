# Code Summary — Midnight Evidence

## Stage
`code-generation`

## Scope
`express` — zero-Unit, single implementation iteration

## Overview

Implemented a complete browser-based gravity-flipping arcade game called **Midnight Evidence**. The player controls a detective automatically running through a dark scrolling corridor and must flip gravity (spacebar) to dodge laser tripwires mounted on the floor or ceiling. All code is pure vanilla JavaScript (ES6+ modules), HTML5 Canvas, and CSS — no external frameworks, no build step required.

---

## Files Produced

| File | Type | Purpose |
|------|------|---------|
| `index.html` | Entry point | Single-page shell: canvas element, stylesheet link, game module load |
| `game.js` | Main module (835 lines) | All game logic — classes and pure functions exported for testability |
| `style.css` | Stylesheet | Dark background, canvas centering |
| `package.json` | Dev config | vitest + jsdom dev dependencies; `npm test` command |
| `vitest.config.js` | Test config | jsdom environment, globals, include filter |
| `game.test.js` | Test suite | 50 tests across all testable layers |

---

## Architecture

All logic lives in `game.js` as named ES module exports. The browser entry point (module guard at the bottom) is the only side-effectful code; everything else is pure and testable.

### Classes

| Class | Responsibility |
|-------|---------------|
| `GameManager` | State machine (`START → PLAYING → GAME_OVER`), score, localStorage high score |
| `LaserSpawner` | Timer-based laser spawning; interval decreases linearly with score |
| `Detective` | Physics/animation: floor/ceiling surface, smooth gravity-flip over ≤ 300 ms (smoothstep) |
| `Laser` | Single active laser beam instance; scrolls left; tracks evasion state |
| `Renderer` | All Canvas 2D drawing: background, detective, lasers, HUD, start/game-over overlays |
| `GameLoop` | RAF loop orchestration; wires input → physics → spawning → collision → scoring → render |

### Pure Functions

| Function | Purpose |
|----------|---------|
| `detectCollision(a, b)` | AABB overlap check — shared edges return `false` |

### Constants (exported)

`CANVAS_WIDTH`, `CANVAS_HEIGHT`, `GameState` enum (`START`, `PLAYING`, `GAME_OVER`)

---

## Testing

- **Methodology**: test-after (express scope, minimal strategy)
- **Runner**: `npx vitest run --reporter=verbose game.test.js`
- **Result**: **50 / 50 passed**, 0 failed, 0 skipped
- **Duration**: ~545 ms

### Coverage by layer

| Layer | Tests | Requirements |
|-------|-------|-------------|
| Game state machine | 16 | FR4.1–FR4.6 |
| Laser spawner | 7 | FR2.1, FR2.3, FR2.4 |
| Collision detection | 7 | FR3.1 |
| Detective flip | 10 | FR1.5, FR1.6 |
| Laser evasion guard | 4 | FR3.3 |
| Renderer HUD/screens | 6 | FR3.4, FR4.2, FR4.4 |

---

## Design Decisions

- **Single-file game module**: All logic in `game.js` avoids any module bundling; the browser loads it directly as `type="module"`. The test runner imports named exports via vitest/jsdom.
- **Smoothstep easing for flip**: Uses `t² × (3 − 2t)` for the gravity-flip transition — visually smooth, computationally trivial, finishes at exactly FLIP_DURATION (0.28 s, ≤ 300 ms FR1.6).
- **Detective fixed horizontal position**: The detective stays at `x = 160`; the world scrolls left. This means all collision geometry is stable in screen space and requires no world→screen transform.
- **AABB edge-exclusive**: Touching edges don't collide — prevents false positives when the detective is resting on the surface exactly adjacent to a laser mount point.
- **LaserSpawner injectable RNG**: `_rng` defaults to `Math.random` but is overridable in tests for deterministic surface assertions.
- **No external assets required**: Pure geometric rendering; `assets/ghosty.png` and sound files are present in the repo but unused by this game.

---

## Known Limitations / Out of Scope

- Audio: jump.wav and game_over.wav are present in `assets/` but audio playback is out of scope per requirements
- Mobile/touch controls: out of scope
- Pause functionality: out of scope
