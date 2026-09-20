# Requirements — Midnight Evidence

## Intent Analysis

The user wants to build a browser-based, gravity-flipping arcade game called **Midnight Evidence**. The player controls a detective running automatically through a dark corridor, evading laser tripwires mounted on the floor or ceiling by flipping gravity with the spacebar. The game rewards evasion with points and ends on collision. The goal is a complete, playable arcade experience with a start screen, in-session score display, high score persistence, and a game-over screen.

**Platform**: Browser (HTML5/Canvas)
**Visual style**: Minimal/geometric — shapes and colors, no external art assets required
**Difficulty**: Progressive — laser frequency increases as score grows
**Depth**: Minimal (express scope)

---

## Functional Requirements

### FR1 — Game Loop

**FR1.1** The game shall render a continuously scrolling dark corridor at a fixed scroll speed on an HTML5 Canvas element.

**FR1.2** The detective character shall move persistently to the right at a constant horizontal speed; the player cannot control horizontal movement.

**FR1.3** The detective shall start on the floor surface of the corridor.

**FR1.4** The detective shall automatically run on whichever surface (floor or ceiling) they currently occupy, maintaining contact with it unless gravity is flipped.

**FR1.5** When the player presses the spacebar, the detective's gravity shall flip: a detective on the floor transitions to the ceiling, and a detective on the ceiling transitions to the floor. A single spacebar press triggers exactly one flip.

**FR1.6** The gravity flip shall be animated — the detective smoothly moves to the opposite surface over a short, fixed transition duration (≤ 300 ms).

### FR2 — Laser Tripwires

**FR2.1** Laser tripwires shall appear at random intervals along the corridor, each mounted on either the floor or the ceiling (50/50 random assignment per laser).

**FR2.2** Lasers shall scroll toward the detective at the same speed as the corridor background.

**FR2.3** The interval between consecutive lasers shall decrease as the player's score increases, making the game progressively harder.

**FR2.4** At game start the minimum interval between lasers shall be large enough that the player can comfortably react (≥ 1.5 s at initial scroll speed).

**FR2.5** A laser shall be rendered as a visible beam spanning from its mount surface toward the opposite surface, with a minimum height that makes it a clear obstacle.

### FR3 — Collision and Scoring

**FR3.1** The game shall detect when the detective's bounding box overlaps a laser beam's bounding box.

**FR3.2** On collision with a laser, the game shall immediately end the current game session (transition to game-over state).

**FR3.3** The game shall award exactly one point for each laser the detective fully passes without collision.

**FR3.4** The current score shall be displayed on screen during gameplay at all times.

### FR4 — Game States

**FR4.1** The game shall have three distinct states: **Start Screen**, **Gameplay**, and **Game Over**.

**FR4.2** The Start Screen shall display the game title ("Midnight Evidence"), the high score, and instructions to press spacebar to begin.

**FR4.3** Pressing spacebar on the Start Screen shall transition to the Gameplay state and begin spawning lasers.

**FR4.4** The Game Over screen shall display the player's score for the session just ended and the all-time high score.

**FR4.5** The Game Over screen shall offer a prompt to press spacebar to return to the Start Screen.

**FR4.6** The high score shall persist across sessions using browser `localStorage`.

### FR5 — Visual Presentation

**FR5.1** The game shall render entirely within an HTML5 Canvas element using the 2D rendering context; no external image assets are required.

**FR5.2** The corridor, detective, and lasers shall be drawn using geometric shapes (rectangles, lines) with a dark color palette consistent with a "dark corridor" atmosphere.

**FR5.3** The detective shall be visually distinguishable from the background (e.g., a contrasting colored rectangle or simple silhouette shape).

**FR5.4** The game canvas shall be a fixed size (e.g., 800 × 400 px) centered on the page, or responsively scaled to fit the browser window while maintaining aspect ratio.

---

## Non-Functional Requirements

**NFR1 — Performance**: The game loop shall target 60 frames per second using `requestAnimationFrame`. Frame drops that cause visible stutter on a modern browser (Chrome/Firefox/Safari within 2 years) are not acceptable.

**NFR2 — Input latency**: Spacebar input shall be processed within the same animation frame it is detected; gravity flip must feel immediate to the player.

**NFR3 — Compatibility**: The game shall run without plugins or transpilation in current-stable versions of Chrome, Firefox, and Safari using only standard HTML5 Canvas and Web APIs.

**NFR4 — File size**: The entire game (HTML + JS + CSS) shall be self-contained in a small number of files (≤ 3) with no external runtime dependencies, keeping load time negligible on a standard broadband connection.

---

## Constraints

- No external game frameworks (Phaser, Three.js, etc.) — pure HTML5/Canvas/JS only, keeping the build simple and dependency-free.
- No backend required — all state (including high scores) lives in the browser via `localStorage`.
- No external art or audio assets required for core gameplay; minimal/geometric visuals only.
- The game must be launchable by opening a single HTML file in a browser (no build step required for basic operation).

---

## Assumptions

- The spacebar is the sole input; no mobile touch or gamepad support is required.
- "Collision" means axis-aligned bounding-box overlap between the detective and a laser beam.
- "Evasion" of a laser is defined as the detective's bounding box fully passing the right edge of the laser without overlap.
- The corridor is conceptually infinite — no level end, only death-by-laser.
- High score tracking is per-browser (localStorage), not server-side or cross-device.

---

## Out of Scope

- Audio/sound effects
- Mobile or touch controls
- Multiplayer
- Power-ups or collectibles
- Animated sprite assets
- Server-side leaderboards
- Pause functionality

---

## Open Questions

None — all decisions confirmed by the user.

---

## Sources

- Initial description: `project-description.json` — authoritative project description
- Q1 answer (platform): Browser-based HTML5/Canvas [Answer]: A
- Q2 answer (visual style): Minimal/geometric [Answer]: A
- Q3 answer (difficulty): Gradual increase [Answer]: B
- Q4 answer (game states): Start screen + high score + game-over [Answer]: C
