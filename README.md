# Midnight Evidence

A browser-based gravity-flipping arcade game where players control a detective navigating a dark corridor. Instead of jumping, players must rapidly invert gravity to run on the ceiling or the floor to dodge incoming laser tripwires. 

## Gameplay Mechanics
* **Gravity Inversion:** The detective runs persistently to the right. Tapping the action button instantly flips gravity, pulling the character to the opposite surface.
* **Progressive Difficulty:** The game speed and obstacle spawn rate gradually increase as the player survives longer.
* **Scoring System:** +1 point awarded for every laser tripwire successfully evaded. High scores are automatically tracked and saved locally.
* **Cross-Platform:** Features a minimal geometric visual style optimized for smooth performance on both desktop and mobile browsers.

## Controls
* **Desktop:** Press the `Spacebar` or `Left Click` the game canvas to flip gravity.
* **Mobile:** `Tap` anywhere on the screen to flip gravity.

## Tech Stack
* **Core:** HTML5 Canvas, TypeScript
* **Build Tool:** Vite
* **Testing:** Vitest

## Local Development

To run this project locally on your machine:

1. Clone the repository and navigate into the project directory.
2. Install the required dependencies:
   ```bash
   npm install

Resources
src/ - Core TypeScript logic, entities, game states, and systems.
assets/ - Game audio and geometric sprites.
img/ - Gameplay screenshots and UI mockups.

Author
Ayush Padaliya
