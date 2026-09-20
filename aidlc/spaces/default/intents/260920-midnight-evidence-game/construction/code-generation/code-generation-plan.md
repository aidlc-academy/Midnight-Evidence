# Code Generation Plan — Midnight Evidence

## Overview

Zero-Unit express scope: one implementation iteration building the complete Midnight Evidence browser game. All code goes to the workspace root; planning artifacts stay in the record directory.

Requirements source: `aidlc/spaces/default/intents/260920-midnight-evidence-game/inception/requirements-analysis/requirements.md`

## Testing Contract

```json
{
  "version": 1,
  "methodology": "test-after",
  "source": "org",
  "ordering": "implement each applicable testable layer, then write and run",
  "scope": "express",
  "test_strategy": "minimal",
  "project_type": "greenfield",
  "applicable_notes": [
    {
      "layer": "org",
      "text": "We treat tests as a first-class deliverable in every Bolt. The specific\nmethodology (TDD, BDD, ATDD, or classic test-after) is affirmed at\npractices-discovery and recorded in `team.md` under this heading with explicit\n`Methodology` and `Ordering` fields; Code Generation resolves those fields\nindependently from coverage, tooling, and scope notes.\n\nWhen no posture has been affirmed, our default per scope is:\n- **Methodology**: test-after\n- **Ordering**: implement each applicable testable layer, then write and run\n  that layer's tests.\n- `mvp`, `enterprise`, `feature`, `infra`, `classic` add an 80% line-coverage\n  floor and CI execution before merge.\n- `bugfix`, `security-patch` add a targeted regression for the specific\n  bug/vulnerability and require the existing suite to remain green.\n- `express` uses the Minimal strategy: requirement-driven unit tests (one per\n  requirement, with a happy-path floor per component); existing tests remain\n  green.\n- `poc`, `refactor`, `workshop` add no extra new-test floor and require the\n  existing suite to remain green.\n\nThe active `Test Strategy` still applies in every scope and determines test\nvolume/types. Scope floors are additive; they never reduce or replace the\nselected strategy.\n\nBuild and Test verifies defined coverage floors and affirmed quality targets;\nthey may not be weakened to make a step pass.\n\nAffirm a stricter posture in `team.md` if the team commits to one."
    }
  ],
  "obligations": {
    "strategy": "minimal",
    "strategy_volume": [
      "One verifiable test per requirement at the narrowest effective level.",
      "At least one happy-path unit test per component.",
      "Unit tests are the default; a bugfix/security scope floor may require an integration or E2E regression when that is the narrowest level that reproduces the defect."
    ],
    "scope_floor": [
      "Keep the existing test suite green.",
      "This scope adds no extra new-test floor beyond the selected test strategy."
    ],
    "combination_rule": "Apply every selected-strategy obligation and every scope-floor obligation; neither replaces the other, and a targeted scope regression may add the narrowest necessary test type beyond the strategy default."
  },
  "plan_profile": {
    "methodology": "test-after",
    "runner_step": "Bootstrap the minimal test runner/configuration and record the exact unit-scoped command.",
    "runner_ready_before_first_test": true,
    "testable_layers": [
      "Data model / database behavior",
      "Repository / data access",
      "Business logic",
      "API / endpoint",
      "Frontend behavior"
    ],
    "steps": [
      "Project structure and production configuration skeleton.",
      "Bootstrap the minimal test runner/configuration and record the exact unit-scoped command.",
      "Data model / database behavior - implement.",
      "Data model / database behavior - write and run its tests after implementation.",
      "Repository / data access - implement.",
      "Repository / data access - write and run its tests after implementation.",
      "Business logic - implement.",
      "Business logic - write and run its tests after implementation.",
      "API / endpoint - implement.",
      "API / endpoint - write and run its tests after implementation.",
      "Frontend behavior - implement.",
      "Frontend behavior - write and run its tests after implementation.",
      "Environment/build configuration.",
      "Documentation and traceability."
    ]
  },
  "input_sha256": "sha256:6cb23162168334768ff8f29699669845616670119c9eb58bf9bb05af6fefd3de",
  "contract_sha256": "sha256:87961b10de39c82b940231619501569dab05fb4d0ab228bedefaade334d20743"
}
```

## Implementation Steps

### Step 1 — Project structure and production configuration skeleton
- [ ] Create `index.html` — single HTML page with a `<canvas id="gameCanvas">` element, centered layout, and dark background
- [ ] Create `game.js` — main game module (all game logic in a single file for zero-dependency simplicity)
- [ ] Create `style.css` — minimal styling: dark page background, canvas centering

Requirement coverage: FR5.1 (Canvas element), FR5.4 (fixed/responsive size), NFR3 (no plugins)

### Step 2 — Bootstrap the minimal test runner and record the exact command
- [ ] Create `package.json` with `vitest` as the sole dev dependency
- [ ] Create `vitest.config.js` configuring jsdom environment and globals
- [ ] Verify the test command `npx vitest run --reporter=verbose game.test.js` is runnable before first test file

### Step 3 — Game state machine (business logic) — implement
- [ ] Define `GameState` enum: `START`, `PLAYING`, `GAME_OVER`
- [ ] Define `GameManager` class: `currentState`, `score`, `highScore`, `reset()`, `startGame()`, `endGame()`
- [ ] `highScore` loaded from `localStorage` on construction; saved on `endGame()`
- [ ] Export `GameManager` for testability

Requirement coverage: FR4.1 (three states), FR4.6 (localStorage high score)

### Step 4 — Game state machine — write and run tests
- [ ] Create `game.test.js`
- [ ] Test: `GameManager` initialises in `START` state (FR4.1)
- [ ] Test: `startGame()` transitions to `PLAYING` (FR4.3)
- [ ] Test: `endGame()` transitions to `GAME_OVER` and persists high score (FR4.2/FR4.6)
- [ ] Test: `reset()` returns to `START` state (FR4.5)
- [ ] Run `npx vitest run --reporter=verbose game.test.js` — all pass

### Step 5 — Laser spawner (business logic) — implement
- [ ] Define `LaserSpawner` class: `baseInterval`, `minInterval`, `lastSpawnX`, `spawnLaser(scrollX, score)`
- [ ] Spawn interval decreases linearly with score: `interval = max(minInterval, baseInterval - score * reductionFactor)`
- [ ] Each laser randomly assigned to `'floor'` or `'ceiling'` (50/50)
- [ ] Returns `{ x, surface, width, height }` descriptor; does not depend on Canvas

Requirement coverage: FR2.1 (floor/ceiling random), FR2.2 (scroll toward player), FR2.3 (gradual increase), FR2.4 (minimum interval ≥ 1.5 s equivalent distance)

### Step 6 — Laser spawner — write and run tests
- [ ] Test: new lasers alternate or randomise between floor and ceiling (FR2.1)
- [ ] Test: spawn interval decreases as score increases (FR2.3)
- [ ] Test: minimum interval is never below `minInterval` (FR2.4)
- [ ] Run `npx vitest run --reporter=verbose game.test.js` — all pass

### Step 7 — Collision detection (business logic) — implement
- [ ] Define `detectCollision(detectiveBounds, laserBounds)` pure function: AABB overlap check
- [ ] `detectiveBounds` and `laserBounds` are `{ x, y, width, height }` plain objects

Requirement coverage: FR3.1 (bounding-box collision)

### Step 8 — Collision detection — write and run tests
- [ ] Test: overlapping rectangles → `true` (FR3.1 happy path)
- [ ] Test: non-overlapping rectangles → `false`
- [ ] Test: edge-touching rectangles → `false` (boundary condition)
- [ ] Run `npx vitest run --reporter=verbose game.test.js` — all pass

### Step 9 — Scoring logic (business logic) — implement
- [ ] Add `checkEvasion(detective, laser)` to `GameManager`: awards a point when detective's left edge has passed laser's right edge and the laser has not yet been counted
- [ ] `score` counter incremented; displayed via callback/event

Requirement coverage: FR3.3 (one point per evasion)

### Step 10 — Scoring logic — write and run tests
- [ ] Test: evasion increments score by exactly one (FR3.3)
- [ ] Test: same laser does not double-count on the next frame
- [ ] Run `npx vitest run --reporter=verbose game.test.js` — all pass

### Step 11 — Frontend rendering and game loop — implement
- [ ] Implement `Renderer` class wrapping the Canvas 2D context
- [ ] `drawBackground()` — dark scrolling corridor (two horizontal rectangles for floor and ceiling, plus a darker band for the walkable area)
- [ ] `drawDetective(x, y, width, height, onCeiling)` — contrasting colored rectangle; flip vertically when on ceiling
- [ ] `drawLaser(laser)` — bright red/orange rectangle spanning from mount surface
- [ ] `drawHUD(score, highScore)` — score displayed top-left; high score top-right (FR3.4, FR4.2)
- [ ] `drawStartScreen(highScore)` — title, high score, spacebar instruction (FR4.2)
- [ ] `drawGameOverScreen(score, highScore)` — session score, all-time high score, restart instruction (FR4.4)
- [ ] Implement `Detective` class: `x`, `y`, `onCeiling`, `velocityY`, `flip()`, `update(dt)`; smooth gravity-flip transition over ≤ 300 ms (FR1.6)
- [ ] Implement main `GameLoop`: `requestAnimationFrame` at 60 fps (NFR1); `spacebar` handler (FR1.5, NFR2); laser array management; scroll offset; call `LaserSpawner` and `detectCollision` each frame
- [ ] Wire `GameState` transitions into the render path: show correct screen per state

Requirement coverage: FR1.1–FR1.6, FR2.2, FR2.5, FR3.4, FR4.1–FR4.5, FR5.1–FR5.4, NFR1, NFR2, NFR3

### Step 12 — Frontend behavior — write and run tests
- [ ] Test: `Detective.flip()` toggles `onCeiling` (FR1.5)
- [ ] Test: `Detective` reaches opposite surface within ≤ 300 ms simulated time (FR1.6)
- [ ] Test: `Renderer.drawHUD` calls ctx methods without throwing (FR3.4 smoke test)
- [ ] Run `npx vitest run --reporter=verbose game.test.js` — all pass

### Step 13 — Environment and build configuration
- [ ] Confirm `index.html` opens in browser with no console errors
- [ ] Confirm `npx vitest run --reporter=verbose game.test.js` exits 0 with all tests passing
- [ ] No external network requests, no build step required (NFR3, NFR4)

### Step 14 — Documentation and traceability
- [ ] Create `aidlc/spaces/default/intents/260920-midnight-evidence-game/construction/code-generation/code-summary.md`
- [ ] Create `aidlc/spaces/default/intents/260920-midnight-evidence-game/construction/code-generation/traceability.json`
- [ ] Create `aidlc/spaces/default/intents/260920-midnight-evidence-game/construction/code-generation/source-manifest.json`

## Plan Approval

See `code-generation-questions.md` for the plan approval question and fingerprint tags.
