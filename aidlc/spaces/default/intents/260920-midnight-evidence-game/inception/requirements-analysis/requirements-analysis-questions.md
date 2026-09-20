# Requirements Analysis Questions — Midnight Evidence

## Questions

### Q1: What technology/platform should the game be built for?

The game needs to run somewhere. Which platform is the target?

A. Browser-based (HTML5/Canvas/WebGL) — plays in any browser, no install needed
B. Desktop application (Electron/native) — downloadable desktop app
C. Mobile (iOS/Android) — touchscreen with tap controls
D. It doesn't matter — pick whatever is simplest and fastest to build

[Answer]: A

---

### Q2: What visual style should the game have?

Midnight Evidence has a "dark corridor" atmosphere. What's the visual approach?

A. Minimal/geometric — simple shapes and colors, no detailed art assets
B. Use the existing assets in the repository (sprites/audio found in `assets/`)
C. Pixel art style — small, retro-style sprites
D. Doesn't matter — whatever works with the chosen platform

[Answer]: A

---

### Q3: How should the laser tripwires be distributed?

The description says lasers are placed "randomly" on floor or ceiling. How should difficulty scale?

A. Completely random placement — same distribution throughout
B. Gradual increase — lasers become more frequent as score increases
C. Fixed pattern — a repeating set of laser configurations
D. No preference — keep it simple

[Answer]: B

---

### Q4: Should there be any game states beyond play and game-over?

A start screen and game-over screen are common. What's needed?

A. Minimal: just the game loop — starts immediately, restarts on collision
B. Start screen + game loop + game-over screen with score display
C. Start screen + high score tracking + game-over screen
D. Just the game loop; start/restart on spacebar

[Answer]: C

---

## Consolidated Summary Confirmation

Here is a summary of all answers before requirements generation:

- **Platform**: Browser-based (HTML5/Canvas/WebGL) — runs in any browser, no install required
- **Visual style**: Minimal/geometric — simple shapes and colors, no detailed art assets needed
- **Difficulty scaling**: Gradual increase — lasers become more frequent as the score increases
- **Game states**: Start screen + high score tracking + game-over screen

Does this all look correct before I generate the requirements artifact?

- Looks correct
- Request changes

[Answer]: Looks correct
