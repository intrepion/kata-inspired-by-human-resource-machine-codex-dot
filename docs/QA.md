# Verification record — 2026-10-16

## Automated checks

- 10 deterministic Node tests pass. They exercise all 11 instructions, every authored reference solution across all case banks, both puzzle goals, input exhaustion, empty state failures, immediate output checks, missing/extra output, stable labels, overflow, safety budget and save validation.
- Strict TypeScript (`strict` and `noUncheckedIndexedAccess`) and Vite production build pass.
- Four Playwright headless Chromium tests pass. Coverage: click-to-add, opcode/operand editing, drag and button reorder, stable labels, stepping and visible hands, jumps, empty-hands failure, run/pause/reset, all eight reference solutions through certification, unlocking, save/reload, missing targets, historical completion after edits, readable manual during execution and 390px mobile overflow.
- Desktop (1440×1000) and mobile (390×844) screenshots are produced by the browser suite in ignored `test-results/`. Desktop and mobile layouts were visually inspected through the screenshot viewer. These are headless browser observations.
- Dependencies audited with npm: zero known vulnerabilities at implementation time.

## Independent review

Two independent agents reviewed the implementation against the initial empty commit `eced357`: one against the specification and mechanics, one against reliability and maintainability. Both found the same two P2 issues: stale current-route success wording after editing a historically completed desk; and timer rendering closing the manual. Fixed by explicitly historical completion wording, pausing before opening help, and browser regressions. Expanded hints and tape scroll are preserved across runtime renders. The reviewer noted the broad main UI renderer as a maintainability tradeoff; source is formatted, while the pure VM, puzzles and persistence remain separate modules.

No VM correctness defects or security defects were found by the reviewers. Reviews and tests reduce risk; they do not prove all possible programs correct.

## Native browser acceptance

Completed in dedicated Chrome session “📮 Copperline QA” after the Baba project explicitly released the slot and the parent approved it. Actual Chrome interactions verified: initial lock state; empty-hands OUTBOX failure; click-to-add; target selection; stable-label up/down reordering; INBOX carrying 4; OUTBOX consuming it; jump returning PC to line 1; first desk certification (7 batches, 3 instructions, 25 worst steps); saved tape/unlock after reload; second desk progression; COPYTO/COPYFROM operands edited to floor 2; visible floor 2 holding 4; Run; manual opening and pausing; second certification (7 batches, 6 instructions, 49 worst steps); reset. Courier positions at inbox and floor were observed; smooth interpolation was not timing-benchmarked. Later puzzles and drag reorder were covered by automated headless Chromium, not manually replayed in native Chrome.

The native game tab was marked as a deliverable and its save retained. Chrome’s native Cancel debugging control was clicked; a fresh AX diff confirmed the debugging infobar was removed. Existing tabs were neither used nor closed. Factorio was directly notified of slot release. See [native acceptance screenshot](native-acceptance.png).

## Publication checks

Before the final publication commit, staged text was scanned for credential/private-key patterns and machine-local paths, with zero findings. The full official OS gitignore files and license are retained. Final SHA and its exact GitHub Actions result are reported in the task outcome.
