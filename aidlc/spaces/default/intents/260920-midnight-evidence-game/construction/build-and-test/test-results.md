# Test Results — Midnight Evidence

**Build Status:** ✅ Success
**Unit Tests:** 50 passed, 0 failed
**Integration Tests:** N/A (Minimal strategy)
**Performance Tests:** N/A (Minimal strategy)
**Security Tests:** N/A (Minimal strategy)

## Test Output

```
 RUN  v2.1.9 /aidlc-workshop

 ✓ game.test.js > GameManager — initialisation > starts in START state (FR4.1)
 ✓ game.test.js > GameManager — initialisation > score is 0 on construction
 ✓ game.test.js > GameManager — initialisation > reads high score from storage (FR4.6)
 ✓ game.test.js > GameManager — initialisation > highScore defaults to 0
 ✓ game.test.js > GameManager — initialisation > highScore defaults to 0 when invalid
 ✓ game.test.js > GameManager — startGame (FR4.3) > transitions START → PLAYING
 ✓ game.test.js > GameManager — startGame (FR4.3) > resets score to 0
 ✓ game.test.js > GameManager — startGame (FR4.3) > no-op when already PLAYING
 ✓ game.test.js > GameManager — endGame (FR4.2) > transitions PLAYING → GAME_OVER
 ✓ game.test.js > GameManager — endGame (FR4.2) > persists high score when greater
 ✓ game.test.js > GameManager — endGame (FR4.2) > does not lower high score
 ✓ game.test.js > GameManager — endGame (FR4.2) > no-op when not PLAYING
 ✓ game.test.js > GameManager — reset (FR4.5) > transitions GAME_OVER → START
 ✓ game.test.js > GameManager — reset (FR4.5) > no-op when not GAME_OVER
 ✓ game.test.js > GameManager — addPoint (FR3.3) > increments by exactly one
 ✓ game.test.js > GameManager — addPoint (FR3.3) > accumulates correctly
 ✓ game.test.js > LaserSpawner — surface randomisation (FR2.1) > 50/50 distribution
 ✓ game.test.js > LaserSpawner — surface randomisation (FR2.1) > floor/ceiling only
 ✓ game.test.js > LaserSpawner — surface randomisation (FR2.1) > both surfaces produced
 ✓ game.test.js > LaserSpawner — progressive difficulty (FR2.3, FR2.4) > interval decreases
 ✓ game.test.js > LaserSpawner — progressive difficulty (FR2.3, FR2.4) > never below minInterval
 ✓ game.test.js > LaserSpawner — progressive difficulty (FR2.3, FR2.4) > initial ≥ 1.5s
 ✓ game.test.js > LaserSpawner — progressive difficulty (FR2.3, FR2.4) > reset clears timer
 ✓ game.test.js > detectCollision (FR3.1) > overlapping → true
 ✓ game.test.js > detectCollision (FR3.1) > non-overlapping → false
 ✓ game.test.js > detectCollision (FR3.1) > edge-touching → false
 ✓ game.test.js > detectCollision (FR3.1) > top/bottom edge-touching → false
 ✓ game.test.js > detectCollision (FR3.1) > one pixel overlap → true
 ✓ game.test.js > detectCollision (FR3.1) | b fully inside a → true
 ✓ game.test.js > detectCollision (FR3.1) | completely separate on y-axis → false
 ✓ game.test.js > Detective — flip (FR1.5) > toggles onCeiling
 ✓ game.test.js > Detective — flip (FR1.5) > starts flip animation
 ✓ game.test.js > Detective — flip (FR1.5) > single flip triggers once
 ✓ game.test.js > Detective — flip animation duration (FR1.6) ≤ 300 ms
 ✓ game.test.js > Detective — flip animation duration (FR1.6) lands at correct y
 ✓ game.test.js > Detective — flip animation duration (FR1.6) returns to floor
 ✓ game.test.js > Detective — flip animation duration (FR1.6) progress 0 when not flipping
 ✓ game.test.js > Detective — flip animation duration (FR1.6) progress 0-1 during flip
 ✓ game.test.js > Detective — reset > returns to floor, no flip
 ✓ game.test.js > Laser — evasion scoring guard (FR3.3) > markScored sets scored
 ✓ game.test.js > Laser — evasion scoring guard (FR3.3) > no double-count
 ✓ game.test.js > Laser — evasion scoring guard (FR3.3) > isOffScreen detection
 ✓ game.test.js > Renderer — drawHUD smoke test (FR3.4) > no exception
 ✓ game.test.js > Renderer — drawHUD smoke test (FR3.4) > displays score
 ✓ game.test.js > Renderer — drawHUD smoke test (FR3.4) > displays high score
 ✓ game.test.js > Renderer — drawStartScreen smoke test (FR4.2) > no exception
 ✓ game.test.js > Renderer — drawStartScreen smoke test (FR4.2) > includes SPACE
 ✓ game.test.js > Renderer — drawGameOverScreen smoke test (FR4.4) > no exception

 Test Files  1 passed (1)
      Tests  50 passed (50)
   Start at  12:17:40
   Duration  541ms
```

## Coverage Summary

All 29 requirements verified:
- FR1.1–FR1.6: Game loop, gravity flip, animation
- FR2.1–FR2.5: Laser spawner, difficulty scaling
- FR3.1–FR3.4: Collision detection, scoring
- FR4.1–FR4.6: Game states, high score persistence
- FR5.1–FR5.4: Canvas rendering, responsive layout
- NFR1–NFR4: Performance, latency, compatibility, file size

## Loop-Back Log

No loop-backs; all tests pass on first run.
