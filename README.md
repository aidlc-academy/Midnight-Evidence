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

## How to Run the Project

To run Midnight Evidence locally on your machine, follow these steps:

1. **Install dependencies:**
   Make sure you have Node.js installed, then run the following command in your project folder to install all required packages:
   ```bash
   npm install

2. **Start the development server**
   Launch the local Vite server by running:
   ```bash
   npm run dev
   

## Resources
1. src/ - Core TypeScript logic, entities, game states, and systems.
2. assets/ - Game audio and geometric sprites.
3. img/ - Gameplay screenshots and UI mockups.



## Author
Ayush Padaliya
