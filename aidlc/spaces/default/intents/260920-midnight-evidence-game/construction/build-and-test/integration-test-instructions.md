# Integration Test Instructions — Midnight Evidence

**Note:** Minimal strategy does not require additional integration tests beyond unit tests.

The express scope uses the Minimal test strategy (requirement-driven unit tests only).
Integration tests are generated for Standard and Comprehensive strategies only.

To run unit tests:
```bash
npx vitest run --reporter=verbose game.test.js
```
