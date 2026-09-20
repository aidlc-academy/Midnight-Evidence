/**
 * Midnight Evidence — main game module
 *
 * All game logic lives here so the module stays dependency-free for the browser
 * while individual classes remain importable by the test suite.
 *
 * Canvas dimensions (logical pixels):
 *   width  : 800
 *   height : 400
 *
 * Coordinate system: origin top-left, y increases downward (standard Canvas).
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const CANVAS_WIDTH  = 800;
export const CANVAS_HEIGHT = 400;

const FLOOR_Y    = CANVAS_HEIGHT - 50; // y-coordinate of the floor surface
const CEILING_Y  = 50;                 // y-coordinate of the ceiling surface

const DETECTIVE_WIDTH  = 32;
const DETECTIVE_HEIGHT = 48;

const SCROLL_SPEED = 220;           // px/s — corridor + lasers scroll speed
const GRAVITY      = 1800;          // px/s²

// Laser dimensions
const LASER_WIDTH  = 18;
const LASER_MIN_HEIGHT = 90;        // minimum beam height (px) — always a clear obstacle

// LaserSpawner timing (in seconds)
const BASE_INTERVAL      = 2.8;     // seconds between lasers at score 0
const MIN_INTERVAL       = 1.5;     // floor: ≥ 1.5 s (FR2.4) — never below this
const REDUCTION_FACTOR   = 0.04;    // seconds removed per point earned

// Detective flip animation
const FLIP_DURATION = 0.28;         // seconds (≤ 300 ms, FR1.6)

// Scoring — a laser is "evaded" once detective's left edge has cleared the laser's right edge
const DETECTIVE_START_X = 160;      // fixed screen position of the detective (px)

// ---------------------------------------------------------------------------
// GameState enum
// ---------------------------------------------------------------------------

/**
 * @readonly
 * @enum {string}
 */
export const GameState = Object.freeze({
  START:     'START',
  PLAYING:   'PLAYING',
  GAME_OVER: 'GAME_OVER',
});

// ---------------------------------------------------------------------------
// GameManager — state machine + score + high score persistence
// ---------------------------------------------------------------------------

export class GameManager {
  constructor(storage = globalThis.localStorage) {
    this._storage = storage;
    this.currentState = GameState.START;
    this.score        = 0;
    this.highScore    = this._loadHighScore();
  }

  /** Load persisted high score; returns 0 when absent or unparseable. */
  _loadHighScore() {
    try {
      const raw = this._storage && this._storage.getItem('midnightEvidence_highScore');
      const n   = parseInt(raw, 10);
      return Number.isFinite(n) && n >= 0 ? n : 0;
    } catch {
      return 0;
    }
  }

  /** Save high score to localStorage. */
  _saveHighScore() {
    try {
      this._storage && this._storage.setItem('midnightEvidence_highScore', String(this.highScore));
    } catch {
      // localStorage unavailable (private-browsing quota, etc.) — ignore
    }
  }

  /** Transition START → PLAYING. */
  startGame() {
    if (this.currentState === GameState.START) {
      this.score        = 0;
      this.currentState = GameState.PLAYING;
    }
  }

  /** Transition PLAYING → GAME_OVER; persist high score. */
  endGame() {
    if (this.currentState === GameState.PLAYING) {
      if (this.score > this.highScore) {
        this.highScore = this.score;
        this._saveHighScore();
      }
      this.currentState = GameState.GAME_OVER;
    }
  }

  /** Transition GAME_OVER → START. */
  reset() {
    if (this.currentState === GameState.GAME_OVER) {
      this.score        = 0;
      this.currentState = GameState.START;
    }
  }

  /** Increment score by 1 (called by GameLoop when an evasion is detected). */
  addPoint() {
    this.score += 1;
  }
}

// ---------------------------------------------------------------------------
// LaserSpawner — decides when and where to spawn lasers
// ---------------------------------------------------------------------------

/**
 * Laser descriptor (returned by spawnLaser):
 * @typedef {Object} LaserDescriptor
 * @property {number} x          - world x at spawn (placed just off right edge of canvas)
 * @property {string} surface    - 'floor' | 'ceiling'
 * @property {number} width
 * @property {number} height
 */

export class LaserSpawner {
  /**
   * @param {object} [opts]
   * @param {number} [opts.baseInterval]     seconds between lasers at score 0
   * @param {number} [opts.minInterval]      minimum interval floor (seconds)
   * @param {number} [opts.reductionFactor]  seconds removed per point
   */
  constructor(opts = {}) {
    this.baseInterval     = opts.baseInterval     ?? BASE_INTERVAL;
    this.minInterval      = opts.minInterval      ?? MIN_INTERVAL;
    this.reductionFactor  = opts.reductionFactor  ?? REDUCTION_FACTOR;
    this._timer = 0;           // seconds elapsed since last spawn
    this._rng   = Math.random; // injectable for deterministic tests
  }

  /**
   * Compute the current interval (in seconds) for the given score.
   * Interval decreases linearly with score but never below minInterval.
   * @param {number} score
   * @returns {number}
   */
  currentInterval(score) {
    return Math.max(
      this.minInterval,
      this.baseInterval - score * this.reductionFactor,
    );
  }

  /**
   * Advance the spawner timer by dt seconds.
   * Returns a LaserDescriptor when it's time to spawn, otherwise null.
   * @param {number} dt      delta time in seconds
   * @param {number} score   current player score (controls interval)
   * @returns {LaserDescriptor|null}
   */
  update(dt, score) {
    this._timer += dt;
    const interval = this.currentInterval(score);
    if (this._timer >= interval) {
      this._timer -= interval;
      return this._buildDescriptor();
    }
    return null;
  }

  /** Build a randomised laser descriptor placed just past the right canvas edge. */
  _buildDescriptor() {
    const surface = this._rng() < 0.5 ? 'floor' : 'ceiling';
    return {
      x:       CANVAS_WIDTH + LASER_WIDTH,
      surface,
      width:   LASER_WIDTH,
      height:  LASER_MIN_HEIGHT + Math.floor(this._rng() * 60), // 90–149 px tall
    };
  }

  /** Reset spawner state (call on game restart). */
  reset() {
    this._timer = 0;
  }
}

// ---------------------------------------------------------------------------
// detectCollision — pure AABB overlap check
// ---------------------------------------------------------------------------

/**
 * Returns true when two axis-aligned bounding boxes overlap.
 * Touching edges (shared boundary) do NOT count as a collision.
 * @param {{ x: number, y: number, width: number, height: number }} a
 * @param {{ x: number, y: number, width: number, height: number }} b
 * @returns {boolean}
 */
export function detectCollision(a, b) {
  return (
    a.x              < b.x + b.width  &&
    a.x + a.width    > b.x            &&
    a.y              < b.y + b.height &&
    a.y + a.height   > b.y
  );
}

// ---------------------------------------------------------------------------
// Detective — player character physics
// ---------------------------------------------------------------------------

export class Detective {
  /**
   * @param {number} [x]  fixed screen x position (default: DETECTIVE_START_X)
   */
  constructor(x = DETECTIVE_START_X) {
    this.x         = x;
    this.width     = DETECTIVE_WIDTH;
    this.height    = DETECTIVE_HEIGHT;
    this.onCeiling = false;

    // Physics state
    this._flipping   = false;   // true while the flip animation is running
    this._flipTimer  = 0;       // seconds elapsed in current flip
    this._startY     = 0;       // y at flip start
    this._targetY    = 0;       // y at flip end

    // Place detective on the floor initially (FR1.3)
    this.y = FLOOR_Y - DETECTIVE_HEIGHT;
    this.velocityY = 0;
  }

  /**
   * Current bounding box for collision detection.
   * @returns {{ x: number, y: number, width: number, height: number }}
   */
  get bounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  /**
   * Flip gravity: toggle which surface the detective rides.
   * A flip in progress is interrupted and a new one starts immediately.
   * (FR1.5 — one spacebar press = one flip)
   */
  flip() {
    this.onCeiling = !this.onCeiling;
    this._flipping  = true;
    this._flipTimer = 0;
    this._startY    = this.y;
    // Target: resting position on the opposite surface
    this._targetY   = this.onCeiling
      ? CEILING_Y                               // detective top touches ceiling
      : FLOOR_Y - DETECTIVE_HEIGHT;             // detective bottom touches floor
    this.velocityY  = 0;
  }

  /**
   * Update detective position.
   * While flipping, lerp toward the target surface over FLIP_DURATION.
   * When resting, clamp to the surface (no physics gravity between flips —
   * the detective "runs" on the surface it occupies, FR1.4).
   *
   * @param {number} dt  delta time in seconds
   */
  update(dt) {
    if (this._flipping) {
      this._flipTimer += dt;
      const t = Math.min(this._flipTimer / FLIP_DURATION, 1);
      // Smooth ease-in-out (smoothstep)
      const ease = t * t * (3 - 2 * t);
      this.y = this._startY + (this._targetY - this._startY) * ease;
      if (t >= 1) {
        this.y         = this._targetY;
        this._flipping = false;
        this.velocityY = 0;
      }
    } else {
      // Snap to resting surface (handles any tiny drift)
      this.y = this.onCeiling
        ? CEILING_Y
        : FLOOR_Y - DETECTIVE_HEIGHT;
    }
  }

  /** Reset to initial state (floor, no flip). */
  reset() {
    this.onCeiling  = false;
    this._flipping  = false;
    this._flipTimer = 0;
    this.y          = FLOOR_Y - DETECTIVE_HEIGHT;
    this.velocityY  = 0;
  }

  /** True while the flip transition is running. */
  get isFlipping() {
    return this._flipping;
  }

  /** Progress [0,1] of the current flip animation (0 when not flipping). */
  get flipProgress() {
    if (!this._flipping) return 0;
    return Math.min(this._flipTimer / FLIP_DURATION, 1);
  }
}

// ---------------------------------------------------------------------------
// Laser — active laser beam instance (screen-space, scrolls left)
// ---------------------------------------------------------------------------

export class Laser {
  /**
   * @param {LaserDescriptor} descriptor
   */
  constructor(descriptor) {
    this.surface = descriptor.surface;
    this.width   = descriptor.width;
    this.height  = descriptor.height;
    this.x       = descriptor.x;

    // Compute y so the beam mounts from the correct surface
    if (this.surface === 'floor') {
      // Beam rises from the floor upward
      this.y = FLOOR_Y - this.height;
    } else {
      // Beam hangs from the ceiling downward
      this.y = CEILING_Y;
    }

    this._scored = false; // true once the detective has evaded this laser
  }

  /** Scroll the laser toward the detective. */
  update(dt) {
    this.x -= SCROLL_SPEED * dt;
  }

  /** Bounding box for collision / evasion checks. */
  get bounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  /** True when this laser is off the left edge of the canvas. */
  get isOffScreen() {
    return this.x + this.width < 0;
  }

  /** Mark this laser as scored so it doesn't double-count. */
  markScored() {
    this._scored = true;
  }

  get scored() {
    return this._scored;
  }
}

// ---------------------------------------------------------------------------
// Renderer — all Canvas drawing
// ---------------------------------------------------------------------------

export class Renderer {
  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  constructor(ctx) {
    this.ctx = ctx;
    this.W = ctx.canvas.width;
    this.H = ctx.canvas.height;
  }

  /** Clear canvas. */
  clear() {
    this.ctx.clearRect(0, 0, this.W, this.H);
  }

  /**
   * Draw the scrolling dark corridor.
   * @param {number} scrollOffset  current horizontal scroll offset (px, for parallax floor/ceiling lines)
   */
  drawBackground(scrollOffset) {
    const ctx = this.ctx;

    // Void/sky — deep dark blue-grey
    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, this.W, this.H);

    // Walkable corridor band (between ceiling and floor)
    ctx.fillStyle = '#12121f';
    ctx.fillRect(0, CEILING_Y, this.W, FLOOR_Y - CEILING_Y);

    // Subtle horizontal scan-lines / corridor depth effect
    ctx.strokeStyle = 'rgba(0,180,255,0.04)';
    ctx.lineWidth = 1;
    for (let y = CEILING_Y + 10; y < FLOOR_Y; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.W, y);
      ctx.stroke();
    }

    // Scrolling floor tile-lines
    const tileW = 80;
    const offset = scrollOffset % tileW;
    ctx.strokeStyle = 'rgba(0,180,255,0.12)';
    ctx.lineWidth = 1;
    for (let x = -offset; x < this.W + tileW; x += tileW) {
      ctx.beginPath();
      ctx.moveTo(x, FLOOR_Y);
      ctx.lineTo(x, this.H);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CEILING_Y);
      ctx.stroke();
    }

    // Floor slab
    ctx.fillStyle = '#1a1a30';
    ctx.fillRect(0, FLOOR_Y, this.W, this.H - FLOOR_Y);

    // Ceiling slab
    ctx.fillStyle = '#1a1a30';
    ctx.fillRect(0, 0, this.W, CEILING_Y);

    // Floor edge glow
    ctx.fillStyle = 'rgba(0,180,255,0.25)';
    ctx.fillRect(0, FLOOR_Y, this.W, 2);

    // Ceiling edge glow
    ctx.fillStyle = 'rgba(0,180,255,0.25)';
    ctx.fillRect(0, CEILING_Y - 2, this.W, 2);
  }

  /**
   * Draw the detective character.
   * @param {Detective} detective
   */
  drawDetective(detective) {
    const ctx = this.ctx;
    const { x, y, width, height, onCeiling, isFlipping, flipProgress } = detective;

    ctx.save();
    ctx.translate(x + width / 2, y + height / 2);

    // Flip the sprite when on ceiling (mirror vertically)
    if (onCeiling && !isFlipping) {
      ctx.scale(1, -1);
    } else if (isFlipping) {
      // Interpolate rotation during flip — spins 180° across the flip
      const angle = onCeiling
        ? flipProgress * Math.PI       // floor→ceiling: 0 → π
        : (1 - flipProgress) * Math.PI; // ceiling→floor: π → 0
      ctx.rotate(angle);
    }

    // Body — contrasting amber/gold rectangle (FR5.3)
    ctx.fillStyle = '#f0c040';
    ctx.fillRect(-width / 2, -height / 2, width, height);

    // Coat collar detail
    ctx.fillStyle = '#c89a20';
    ctx.fillRect(-width / 2, -height / 2, width, height * 0.25);

    // Eye(s) — tiny white dots
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(width * 0.15, -height * 0.1, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-width * 0.15, -height * 0.1, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Draw a laser beam.
   * @param {Laser} laser
   */
  drawLaser(laser) {
    const ctx = this.ctx;
    const { x, y, width, height } = laser;

    // Mount bracket
    ctx.fillStyle = '#cc2222';
    if (laser.surface === 'floor') {
      ctx.fillRect(x - 4, y - 8, width + 8, 12);
    } else {
      ctx.fillRect(x - 4, y + height - 4, width + 8, 12);
    }

    // Main beam body — bright red with glow
    const gradient = ctx.createLinearGradient(x, y, x + width, y);
    gradient.addColorStop(0, '#ff1a1a');
    gradient.addColorStop(0.5, '#ff6060');
    gradient.addColorStop(1, '#ff1a1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);

    // Glow overlay
    ctx.fillStyle = 'rgba(255, 80, 80, 0.18)';
    ctx.fillRect(x - 6, y, width + 12, height);

    // Bright core line
    ctx.strokeStyle = '#ffaaaa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + width / 2, y);
    ctx.lineTo(x + width / 2, y + height);
    ctx.stroke();
  }

  /**
   * Draw score HUD during gameplay.
   * @param {number} score
   * @param {number} highScore
   */
  drawHUD(score, highScore) {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.textBaseline = 'top';

    // Score — top left
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(8, 8, 140, 34);
    ctx.fillStyle = '#e0e0ff';
    ctx.fillText(`SCORE: ${score}`, 16, 14);

    // High score — top right
    const hsText = `BEST: ${highScore}`;
    const hsWidth = ctx.measureText(hsText).width;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(this.W - hsWidth - 28, 8, hsWidth + 20, 34);
    ctx.fillStyle = '#ffd700';
    ctx.fillText(hsText, this.W - hsWidth - 18, 14);

    ctx.restore();
  }

  /**
   * Draw the Start Screen (FR4.2).
   * @param {number} highScore
   */
  drawStartScreen(highScore) {
    const ctx = this.ctx;
    const cx  = this.W / 2;
    const cy  = this.H / 2;

    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(5, 5, 20, 0.82)';
    ctx.fillRect(0, 0, this.W, this.H);

    // Title
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = 'bold 52px "Courier New", monospace';
    ctx.fillStyle = '#00c8ff';
    ctx.shadowColor = '#00c8ff';
    ctx.shadowBlur = 18;
    ctx.fillText('MIDNIGHT EVIDENCE', cx, cy - 70);

    // Subtitle
    ctx.font = '18px "Courier New", monospace';
    ctx.fillStyle = '#aaaacc';
    ctx.shadowBlur = 0;
    ctx.fillText('— A detective trapped in infinite corridors —', cx, cy - 32);

    // High score
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`Best: ${highScore}`, cx, cy + 14);

    // Instruction
    ctx.font = '18px "Courier New", monospace';
    ctx.fillStyle = '#e0e0ff';
    // Blinking effect handled by caller — just draw static here
    ctx.fillText('Press SPACE to begin', cx, cy + 56);

    // Controls hint
    ctx.font = '14px "Courier New", monospace';
    ctx.fillStyle = '#666688';
    ctx.fillText('SPACE — flip gravity and dodge the laser tripwires', cx, cy + 88);

    ctx.restore();
  }

  /**
   * Draw the Game Over screen (FR4.4).
   * @param {number} score
   * @param {number} highScore
   */
  drawGameOverScreen(score, highScore) {
    const ctx = this.ctx;
    const cx  = this.W / 2;
    const cy  = this.H / 2;

    ctx.fillStyle = 'rgba(5, 5, 20, 0.88)';
    ctx.fillRect(0, 0, this.W, this.H);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // "Game Over"
    ctx.font = 'bold 52px "Courier New", monospace';
    ctx.fillStyle = '#ff4444';
    ctx.shadowColor = '#ff2222';
    ctx.shadowBlur = 20;
    ctx.fillText('CAUGHT', cx, cy - 70);

    ctx.shadowBlur = 0;

    // Session score
    ctx.font = 'bold 28px "Courier New", monospace';
    ctx.fillStyle = '#e0e0ff';
    ctx.fillText(`Score: ${score}`, cx, cy - 14);

    // All-time high score
    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`All-time Best: ${highScore}`, cx, cy + 26);

    // New high score indicator
    if (score > 0 && score >= highScore) {
      ctx.font = 'bold 18px "Courier New", monospace';
      ctx.fillStyle = '#00ff99';
      ctx.fillText('✦ New Record! ✦', cx, cy + 58);
    }

    // Restart prompt
    ctx.font = '18px "Courier New", monospace';
    ctx.fillStyle = '#e0e0ff';
    ctx.fillText('Press SPACE to return to Start', cx, cy + 90);

    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// GameLoop — wires everything together, runs in the browser
// ---------------------------------------------------------------------------

/**
 * The GameLoop orchestrates input, physics, spawning, collision, scoring,
 * and rendering. It is only instantiated when running in a real browser
 * (the module guard at the bottom checks for `document`).
 */
export class GameLoop {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas   = canvas;
    this.ctx      = canvas.getContext('2d');
    this.renderer = new Renderer(this.ctx);
    this.manager  = new GameManager();
    this.detective = new Detective();
    this.spawner   = new LaserSpawner();
    this.lasers    = [];

    this._scrollOffset = 0;
    this._lastTime     = null;
    this._rafId        = null;
    this._spaceDown    = false;  // track key state to prevent key-repeat triggering multiple flips
    this._blinkTimer   = 0;     // for blinking "press SPACE" text

    this._onKeyDown = this._handleKeyDown.bind(this);
    window.addEventListener('keydown', this._onKeyDown);

    this._loop = this._loop.bind(this);
  }

  /** Start the animation loop. */
  start() {
    this._rafId = requestAnimationFrame(this._loop);
  }

  /** Stop the animation loop and remove event listeners. */
  stop() {
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    window.removeEventListener('keydown', this._onKeyDown);
  }

  /** Handle keydown events — process SPACE within the same frame (NFR2). */
  _handleKeyDown(e) {
    if (e.code !== 'Space') return;
    e.preventDefault(); // prevent page scroll

    const state = this.manager.currentState;

    if (state === GameState.START) {
      this._beginPlay();
    } else if (state === GameState.PLAYING) {
      this.detective.flip();
    } else if (state === GameState.GAME_OVER) {
      this._returnToStart();
    }
  }

  /** Start a new game session. */
  _beginPlay() {
    this.manager.startGame();
    this.detective.reset();
    this.spawner.reset();
    this.lasers = [];
    this._scrollOffset = 0;
  }

  /** Return to start screen after game over. */
  _returnToStart() {
    this.manager.reset();
  }

  /** Main animation loop. */
  _loop(timestamp) {
    if (this._lastTime === null) {
      this._lastTime = timestamp;
    }
    const dt = Math.min((timestamp - this._lastTime) / 1000, 0.05); // cap at 50 ms
    this._lastTime = timestamp;

    this._update(dt);
    this._render();

    this._rafId = requestAnimationFrame(this._loop);
  }

  /** Update all game state for one frame. */
  _update(dt) {
    const state = this.manager.currentState;

    this._blinkTimer += dt;

    if (state !== GameState.PLAYING) return;

    // Scroll offset (for parallax floor/ceiling lines)
    this._scrollOffset += SCROLL_SPEED * dt;

    // Update detective
    this.detective.update(dt);

    // Spawn new lasers
    const descriptor = this.spawner.update(dt, this.manager.score);
    if (descriptor) {
      this.lasers.push(new Laser(descriptor));
    }

    // Update lasers, check collision and evasion
    for (const laser of this.lasers) {
      laser.update(dt);

      if (!laser.scored && !laser.isOffScreen) {
        const db = this.detective.bounds;
        const lb = laser.bounds;

        // Collision check (FR3.1, FR3.2)
        if (detectCollision(db, lb)) {
          this.manager.endGame();
          return; // stop processing this frame
        }

        // Evasion: detective's left edge has cleared the laser's right edge (FR3.3)
        if (db.x > lb.x + lb.width) {
          laser.markScored();
          this.manager.addPoint();
        }
      }
    }

    // Cull off-screen lasers
    this.lasers = this.lasers.filter(l => !l.isOffScreen);
  }

  /** Render the current game state. */
  _render() {
    const state  = this.manager.currentState;
    const { score, highScore } = this.manager;

    // Always draw background
    this.renderer.drawBackground(this._scrollOffset);

    if (state === GameState.PLAYING) {
      // Draw lasers
      for (const laser of this.lasers) {
        this.renderer.drawLaser(laser);
      }
      // Draw detective
      this.renderer.drawDetective(this.detective);
      // Draw HUD
      this.renderer.drawHUD(score, highScore);

    } else if (state === GameState.START) {
      // Static decorative lasers on start screen
      this.renderer.drawStartScreen(highScore);

    } else if (state === GameState.GAME_OVER) {
      // Show last frame of gameplay underneath (lasers + detective already visible from last update)
      for (const laser of this.lasers) {
        this.renderer.drawLaser(laser);
      }
      this.renderer.drawDetective(this.detective);
      this.renderer.drawGameOverScreen(score, highScore);
    }
  }
}

// ---------------------------------------------------------------------------
// Browser entry point — only runs when the module is loaded in a real browser
// ---------------------------------------------------------------------------

if (typeof document !== 'undefined') {
  const canvas = document.getElementById('gameCanvas');
  if (canvas) {
    const loop = new GameLoop(canvas);
    loop.start();
  }
}
