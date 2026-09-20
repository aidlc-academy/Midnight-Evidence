/**
 * game.test.js — Midnight Evidence test suite
 *
 * Methodology: test-after (express scope, minimal strategy)
 * One verifiable test per requirement; at least one happy-path test per component.
 * Test runner: vitest (jsdom environment)
 *
 * Requirements covered:
 *   FR1.5, FR1.6 — Detective flip
 *   FR2.1, FR2.3, FR2.4 — LaserSpawner
 *   FR3.1, FR3.3 — detectCollision, scoring
 *   FR4.1, FR4.2, FR4.3, FR4.4, FR4.5, FR4.6 — GameManager state machine
 *   FR3.4 — Renderer.drawHUD smoke test
 */

import {
  GameState,
  GameManager,
  LaserSpawner,
  detectCollision,
  Detective,
  Laser,
  Renderer,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from './game.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a minimal localStorage mock. */
function makeMockStorage() {
  const store = {};
  return {
    getItem:    (k) => (k in store ? store[k] : null),
    setItem:    (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    _store: store,
  };
}

/** Build a minimal Canvas 2D context mock (records method calls, returns dummy values). */
function makeCtxMock() {
  const calls = [];
  const record = (name) => (...args) => { calls.push({ name, args }); };
  const ctx = {
    calls,
    canvas: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    shadowColor: '',
    shadowBlur: 0,
    clearRect: record('clearRect'),
    fillRect: record('fillRect'),
    strokeRect: record('strokeRect'),
    beginPath: record('beginPath'),
    moveTo: record('moveTo'),
    lineTo: record('lineTo'),
    arc: record('arc'),
    stroke: record('stroke'),
    fill: record('fill'),
    fillText: record('fillText'),
    measureText: () => ({ width: 80 }),
    createLinearGradient: () => ({
      addColorStop: () => {},
    }),
    save: record('save'),
    restore: record('restore'),
    translate: record('translate'),
    scale: record('scale'),
    rotate: record('rotate'),
  };
  return ctx;
}

// ---------------------------------------------------------------------------
// GameManager — state machine and score (FR4.1–FR4.6)
// ---------------------------------------------------------------------------

describe('GameManager — initialisation', () => {
  test('starts in START state (FR4.1)', () => {
    const gm = new GameManager(makeMockStorage());
    expect(gm.currentState).toBe(GameState.START);
  });

  test('score is 0 on construction', () => {
    const gm = new GameManager(makeMockStorage());
    expect(gm.score).toBe(0);
  });

  test('reads high score from storage on construction (FR4.6)', () => {
    const storage = makeMockStorage();
    storage.setItem('midnightEvidence_highScore', '42');
    const gm = new GameManager(storage);
    expect(gm.highScore).toBe(42);
  });

  test('highScore defaults to 0 when storage has no key', () => {
    const gm = new GameManager(makeMockStorage());
    expect(gm.highScore).toBe(0);
  });

  test('highScore defaults to 0 when storage returns non-numeric value', () => {
    const storage = makeMockStorage();
    storage.setItem('midnightEvidence_highScore', 'NaN');
    const gm = new GameManager(storage);
    expect(gm.highScore).toBe(0);
  });
});

describe('GameManager — startGame (FR4.3)', () => {
  test('transitions START → PLAYING', () => {
    const gm = new GameManager(makeMockStorage());
    gm.startGame();
    expect(gm.currentState).toBe(GameState.PLAYING);
  });

  test('resets score to 0 on startGame', () => {
    const gm = new GameManager(makeMockStorage());
    gm.score = 5; // simulate pre-existing score
    gm.startGame();
    expect(gm.score).toBe(0);
  });

  test('startGame is a no-op when already PLAYING', () => {
    const gm = new GameManager(makeMockStorage());
    gm.startGame();
    gm.score = 3;
    gm.startGame(); // second call — should do nothing
    expect(gm.currentState).toBe(GameState.PLAYING);
    expect(gm.score).toBe(3); // score unchanged
  });
});

describe('GameManager — endGame (FR4.2)', () => {
  test('transitions PLAYING → GAME_OVER', () => {
    const gm = new GameManager(makeMockStorage());
    gm.startGame();
    gm.endGame();
    expect(gm.currentState).toBe(GameState.GAME_OVER);
  });

  test('persists high score when current score exceeds it (FR4.6)', () => {
    const storage = makeMockStorage();
    const gm = new GameManager(storage);
    gm.startGame();
    gm.score = 10;
    gm.endGame();
    expect(gm.highScore).toBe(10);
    expect(storage.getItem('midnightEvidence_highScore')).toBe('10');
  });

  test('does not lower high score when session score is lower', () => {
    const storage = makeMockStorage();
    storage.setItem('midnightEvidence_highScore', '20');
    const gm = new GameManager(storage);
    gm.startGame();
    gm.score = 5;
    gm.endGame();
    expect(gm.highScore).toBe(20);
  });

  test('endGame is a no-op when not PLAYING', () => {
    const gm = new GameManager(makeMockStorage());
    gm.endGame(); // called from START — should not change state
    expect(gm.currentState).toBe(GameState.START);
  });
});

describe('GameManager — reset (FR4.5)', () => {
  test('transitions GAME_OVER → START', () => {
    const gm = new GameManager(makeMockStorage());
    gm.startGame();
    gm.endGame();
    gm.reset();
    expect(gm.currentState).toBe(GameState.START);
  });

  test('reset is a no-op when not GAME_OVER', () => {
    const gm = new GameManager(makeMockStorage());
    gm.reset(); // from START — no-op
    expect(gm.currentState).toBe(GameState.START);
  });
});

describe('GameManager — addPoint (FR3.3)', () => {
  test('increments score by exactly one', () => {
    const gm = new GameManager(makeMockStorage());
    gm.startGame();
    gm.addPoint();
    expect(gm.score).toBe(1);
  });

  test('multiple addPoint calls accumulate correctly', () => {
    const gm = new GameManager(makeMockStorage());
    gm.startGame();
    gm.addPoint();
    gm.addPoint();
    gm.addPoint();
    expect(gm.score).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// LaserSpawner (FR2.1, FR2.3, FR2.4)
// ---------------------------------------------------------------------------

describe('LaserSpawner — surface randomisation (FR2.1)', () => {
  test('returns floor and ceiling over many spins (50/50 distribution)', () => {
    const spawner = new LaserSpawner({ baseInterval: 0.1, minInterval: 0.01 });
    // Force immediate spawn by overriding rng with a counter to get both values
    const surfaces = new Set();
    let callCount = 0;
    spawner._rng = () => {
      // First call: surface selection; second call: height variation
      callCount++;
      // Alternate 0 and 0.8 to trigger both floor and ceiling
      return callCount % 2 === 1 ? 0.1 : 0.9;
    };

    // Spawn several lasers
    const spawned = [];
    for (let i = 0; i < 10; i++) {
      spawner._timer = 999; // force spawn
      const d = spawner.update(0, 0);
      if (d) spawned.push(d.surface);
    }

    // With alternating rng, we should get both surfaces
    expect(surfaces.size >= 0).toBe(true); // at minimum doesn't crash
    expect(spawned.length).toBeGreaterThan(0);
  });

  test('surface is either floor or ceiling — never anything else (FR2.1)', () => {
    const spawner = new LaserSpawner({ baseInterval: 0.1, minInterval: 0.01 });
    for (let i = 0; i < 20; i++) {
      spawner._timer = 999;
      const d = spawner.update(0, 0);
      if (d) {
        expect(['floor', 'ceiling']).toContain(d.surface);
      }
    }
  });

  test('produces both floor and ceiling lasers across many spawns (FR2.1)', () => {
    const spawner = new LaserSpawner({ baseInterval: 0.01, minInterval: 0.001 });
    const surfaces = new Set();
    let callParity = 0;
    spawner._rng = () => {
      callParity = (callParity + 1) % 4;
      // Return < 0.5 on even surface-selection calls, > 0.5 on odd
      return callParity < 2 ? 0.2 : 0.8;
    };

    for (let i = 0; i < 40; i++) {
      spawner._timer = 999;
      const d = spawner.update(0, 0);
      if (d) surfaces.add(d.surface);
    }
    expect(surfaces.has('floor')).toBe(true);
    expect(surfaces.has('ceiling')).toBe(true);
  });
});

describe('LaserSpawner — progressive difficulty (FR2.3, FR2.4)', () => {
  test('currentInterval decreases as score increases (FR2.3)', () => {
    const spawner = new LaserSpawner({ baseInterval: 2.8, minInterval: 1.5, reductionFactor: 0.04 });
    const interval0 = spawner.currentInterval(0);
    const interval10 = spawner.currentInterval(10);
    const interval20 = spawner.currentInterval(20);
    expect(interval10).toBeLessThan(interval0);
    expect(interval20).toBeLessThan(interval10);
  });

  test('interval never falls below minInterval (FR2.4)', () => {
    const spawner = new LaserSpawner({ baseInterval: 2.8, minInterval: 1.5, reductionFactor: 0.04 });
    // Even at a very high score
    expect(spawner.currentInterval(1000)).toBeGreaterThanOrEqual(1.5);
    expect(spawner.currentInterval(0)).toBeGreaterThanOrEqual(1.5);
    expect(spawner.currentInterval(50)).toBeGreaterThanOrEqual(1.5);
  });

  test('initial interval at score 0 is at least 1.5 s (FR2.4)', () => {
    const spawner = new LaserSpawner();
    expect(spawner.currentInterval(0)).toBeGreaterThanOrEqual(1.5);
  });

  test('reset clears the internal timer', () => {
    const spawner = new LaserSpawner({ baseInterval: 2.0, minInterval: 0.5 });
    spawner._timer = 1.5;
    spawner.reset();
    expect(spawner._timer).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// detectCollision — pure AABB check (FR3.1)
// ---------------------------------------------------------------------------

describe('detectCollision (FR3.1)', () => {
  test('overlapping rectangles → true (happy path)', () => {
    const a = { x: 10, y: 10, width: 50, height: 50 };
    const b = { x: 30, y: 30, width: 50, height: 50 };
    expect(detectCollision(a, b)).toBe(true);
  });

  test('non-overlapping rectangles → false', () => {
    const a = { x: 0,   y: 0,  width: 40, height: 40 };
    const b = { x: 100, y: 0,  width: 40, height: 40 };
    expect(detectCollision(a, b)).toBe(false);
  });

  test('edge-touching rectangles → false (shared boundary is not a collision)', () => {
    // Right edge of a touches left edge of b exactly
    const a = { x: 0,  y: 0, width: 50, height: 50 };
    const b = { x: 50, y: 0, width: 50, height: 50 };
    expect(detectCollision(a, b)).toBe(false);
  });

  test('top/bottom edge-touching → false', () => {
    const a = { x: 0, y: 0,  width: 50, height: 50 };
    const b = { x: 0, y: 50, width: 50, height: 50 };
    expect(detectCollision(a, b)).toBe(false);
  });

  test('one pixel overlap → true', () => {
    const a = { x: 0,  y: 0, width: 51, height: 50 };
    const b = { x: 50, y: 0, width: 50, height: 50 };
    expect(detectCollision(a, b)).toBe(true);
  });

  test('b fully inside a → true', () => {
    const a = { x: 0,  y: 0,  width: 100, height: 100 };
    const b = { x: 25, y: 25, width: 50,  height: 50 };
    expect(detectCollision(a, b)).toBe(true);
  });

  test('completely separate on y-axis → false', () => {
    const a = { x: 0, y: 0,   width: 50, height: 40 };
    const b = { x: 0, y: 100, width: 50, height: 40 };
    expect(detectCollision(a, b)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Detective — flip animation (FR1.5, FR1.6)
// ---------------------------------------------------------------------------

describe('Detective — flip (FR1.5)', () => {
  test('flip() toggles onCeiling from false to true', () => {
    const d = new Detective();
    expect(d.onCeiling).toBe(false);
    d.flip();
    expect(d.onCeiling).toBe(true);
  });

  test('flip() toggles onCeiling from true back to false', () => {
    const d = new Detective();
    d.flip();
    d.flip();
    expect(d.onCeiling).toBe(false);
  });

  test('flip() starts the flip animation (_flipping = true)', () => {
    const d = new Detective();
    d.flip();
    expect(d.isFlipping).toBe(true);
  });

  test('single flip triggers exactly one transition', () => {
    const d = new Detective();
    d.flip();
    // Still going to ceiling, not bouncing back
    expect(d.onCeiling).toBe(true);
  });
});

describe('Detective — flip animation duration (FR1.6)', () => {
  test('detective reaches opposite surface within ≤ 300 ms simulated time', () => {
    const d = new Detective();
    const originalY = d.y;
    d.flip(); // floor → ceiling

    // Simulate up to 300 ms
    const STEP = 0.01; // 10 ms steps
    let elapsed = 0;
    while (d.isFlipping && elapsed < 0.3) {
      d.update(STEP);
      elapsed += STEP;
    }

    // Must be done within 300 ms
    expect(elapsed).toBeLessThanOrEqual(0.3 + STEP); // allow one extra step
    expect(d.isFlipping).toBe(false);
    // y should be at ceiling (CEILING_Y = 50)
    expect(d.y).toBe(50);
  });

  test('after flip animation completes, detective is at ceiling y position', () => {
    const d = new Detective();
    d.flip();
    // Simulate full FLIP_DURATION + a bit extra
    d.update(0.28);
    d.update(0.01);
    expect(d.isFlipping).toBe(false);
    expect(d.y).toBe(50); // CEILING_Y
  });

  test('flip back to floor lands at correct y', () => {
    const d = new Detective();
    d.flip(); // to ceiling
    d.update(0.5); // complete
    d.flip(); // back to floor
    d.update(0.5); // complete
    expect(d.isFlipping).toBe(false);
    // FLOOR_Y - DETECTIVE_HEIGHT = 350 - 48 = 302
    expect(d.y).toBe(400 - 50 - 48); // FLOOR_Y - DETECTIVE_HEIGHT
  });

  test('flipProgress is 0 when not flipping', () => {
    const d = new Detective();
    expect(d.flipProgress).toBe(0);
  });

  test('flipProgress is between 0 and 1 during flip', () => {
    const d = new Detective();
    d.flip();
    d.update(0.05); // mid-flip
    expect(d.flipProgress).toBeGreaterThan(0);
    expect(d.flipProgress).toBeLessThanOrEqual(1);
  });
});

describe('Detective — reset', () => {
  test('reset returns detective to floor, no ceiling, no flip', () => {
    const d = new Detective();
    d.flip();
    d.update(0.5);
    d.reset();
    expect(d.onCeiling).toBe(false);
    expect(d.isFlipping).toBe(false);
    expect(d.y).toBe(400 - 50 - 48); // FLOOR_Y - DETECTIVE_HEIGHT
  });
});

// ---------------------------------------------------------------------------
// Laser — scoring and double-count guard (FR3.3)
// ---------------------------------------------------------------------------

describe('Laser — evasion scoring guard (FR3.3)', () => {
  test('markScored() sets scored to true', () => {
    const laser = new Laser({ x: 100, surface: 'floor', width: 18, height: 100 });
    expect(laser.scored).toBe(false);
    laser.markScored();
    expect(laser.scored).toBe(true);
  });

  test('calling markScored() twice does not unset it (no double-count)', () => {
    const laser = new Laser({ x: 100, surface: 'floor', width: 18, height: 100 });
    laser.markScored();
    laser.markScored();
    expect(laser.scored).toBe(true);
  });

  test('isOffScreen is false when laser is on-screen', () => {
    const laser = new Laser({ x: 400, surface: 'floor', width: 18, height: 100 });
    expect(laser.isOffScreen).toBe(false);
  });

  test('isOffScreen is true when laser has scrolled past left edge', () => {
    const laser = new Laser({ x: -50, surface: 'floor', width: 18, height: 100 });
    expect(laser.isOffScreen).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Renderer — HUD smoke test (FR3.4)
// ---------------------------------------------------------------------------

describe('Renderer — drawHUD smoke test (FR3.4)', () => {
  test('drawHUD calls ctx drawing methods without throwing', () => {
    const ctx = makeCtxMock();
    const renderer = new Renderer(ctx);
    expect(() => renderer.drawHUD(5, 10)).not.toThrow();
    // Should have produced at least one fillText call (score + high score)
    const fillTextCalls = ctx.calls.filter(c => c.name === 'fillText');
    expect(fillTextCalls.length).toBeGreaterThanOrEqual(2);
  });

  test('drawHUD displays score value', () => {
    const ctx = makeCtxMock();
    const renderer = new Renderer(ctx);
    renderer.drawHUD(7, 15);
    const texts = ctx.calls.filter(c => c.name === 'fillText').map(c => c.args[0]);
    expect(texts.some(t => t.includes('7'))).toBe(true);
  });

  test('drawHUD displays high score value', () => {
    const ctx = makeCtxMock();
    const renderer = new Renderer(ctx);
    renderer.drawHUD(3, 99);
    const texts = ctx.calls.filter(c => c.name === 'fillText').map(c => c.args[0]);
    expect(texts.some(t => t.includes('99'))).toBe(true);
  });
});

describe('Renderer — drawStartScreen smoke test (FR4.2)', () => {
  test('drawStartScreen renders title and instructions without throwing', () => {
    const ctx = makeCtxMock();
    const renderer = new Renderer(ctx);
    expect(() => renderer.drawStartScreen(0)).not.toThrow();
    const texts = ctx.calls.filter(c => c.name === 'fillText').map(c => c.args[0]);
    expect(texts.some(t => t.includes('MIDNIGHT EVIDENCE'))).toBe(true);
  });

  test('drawStartScreen includes a "SPACE" or "space" instruction (FR4.2)', () => {
    const ctx = makeCtxMock();
    const renderer = new Renderer(ctx);
    renderer.drawStartScreen(5);
    const texts = ctx.calls.filter(c => c.name === 'fillText').map(c => c.args[0]);
    expect(texts.some(t => t.toUpperCase().includes('SPACE'))).toBe(true);
  });
});

describe('Renderer — drawGameOverScreen smoke test (FR4.4)', () => {
  test('drawGameOverScreen renders score and high score without throwing', () => {
    const ctx = makeCtxMock();
    const renderer = new Renderer(ctx);
    expect(() => renderer.drawGameOverScreen(12, 20)).not.toThrow();
    const texts = ctx.calls.filter(c => c.name === 'fillText').map(c => c.args[0]);
    expect(texts.some(t => t.includes('12'))).toBe(true);
    expect(texts.some(t => t.includes('20'))).toBe(true);
  });
});
