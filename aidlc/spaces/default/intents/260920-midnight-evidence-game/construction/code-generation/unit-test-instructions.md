# Unit Test Instructions — Midnight Evidence

## Test Framework

**Framework**: Vitest (lightweight, zero-config, browser-environment-compatible via jsdom)

**Install**:
```bash
npm install
```

## Exact Test Command (unit-scoped)

```bash
npx vitest run --reporter=verbose game.test.js
```

This command runs ONLY Midnight Evidence's test file. Do not use a bare `npm test` or `npx vitest` without the file argument — those would match any test files in the workspace.

## Test File Location

All tests live in a single file: `game.test.js` (workspace root, alongside `game.js`)

## Expected Coverage

**Strategy**: Minimal — one verifiable test per requirement, happy-path floor per component.

**Approximate test count**: 12–15 tests covering:
- `GameManager` state machine (4 tests)
- `LaserSpawner` spawn logic (3 tests)
- `detectCollision` AABB function (3 tests)
- Scoring / evasion counting (2 tests)
- `Detective` gravity flip (2 tests)

## Mocking and Stubbing

- `localStorage` is mocked via jsdom's built-in implementation; no manual stub required
- Canvas 2D context (`HTMLCanvasElement.getContext('2d')`) is mocked via jsdom; Renderer smoke tests call its methods without throwing but do not verify pixel output
- `requestAnimationFrame` is NOT tested directly; game loop logic is tested by calling the update functions with a synthetic `dt` value

## Test Data Management

All test data is inline in `game.test.js`. No fixtures or external data files are used.

## Running Tests

```bash
# Run all tests once (CI mode):
npx vitest run --reporter=verbose game.test.js

# Watch mode during development:
npx vitest --reporter=verbose game.test.js
```

Expected exit code: `0` when all tests pass.
