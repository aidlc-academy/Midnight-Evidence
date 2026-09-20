# Build Instructions — Midnight Evidence

## Prerequisites

- **Node.js**: v18+ (for Vitest and modern JavaScript features)
- **npm**: v9+ (comes with Node.js)

## Installation

```bash
npm install
```

This installs:
- `vitest` v2.1.9 — test runner
- `jsdom` v25.0.1 — browser environment simulation for tests

## Build Commands

No build step is required. The game is a single-page application distributed as:
- `index.html` — entry point
- `game.js` — game logic
- `style.css` — styling
- `package.json` — dependencies

## Build Verification

The game runs directly in any modern browser:
1. Open `index.html` in Chrome, Firefox, or Safari
2. The canvas renders at 800×400 pixels
3. Press **SPACE** to start

## Test Commands

```bash
# Run all tests (unit tests)
npx vitest run --reporter=verbose game.test.js

# Watch mode for development
npx vitest --reporter=verbose game.test.js
```

## Troubleshooting

| Issue | Resolution |
|-------|------------|
| `npm install` fails | Ensure Node.js v18+ is installed |
| Tests fail with "ReferenceError: document is not defined" | Run tests with `--environment jsdom` flag |
| `npx vitest` not found | Run `npm install` first |
