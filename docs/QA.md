# Verification record — 2026-10-16

## Automated checks

- 10 deterministic Node tests pass. They exercise all 11 instructions, every authored reference solution across all case banks, both puzzle goals, input exhaustion, empty state failures, immediate output checks, missing/extra output, stable labels, overflow, safety budget and save validation.
- Strict TypeScript (`strict` and `noUncheckedIndexedAccess`) and Vite production build pass.
- Four Playwright headless Chromium tests pass. Coverage: click-to-add, opcode/operand editing, drag and button reorder, stable labels, stepping and visible hands, jumps, empty-hands failure, run/pause/reset, all eight reference solutions through certification, unlocking, save/reload, missing targets, historical completion after edits, readable manual during execution and 390px mobile overflow.
- Desktop (1440×1000) and mobile (390×844) screenshots are produced by the browser suite in ignored `test-results/`. Desktop layout was visually inspected through the screenshot viewer. These are headless browser observations.
- Dependencies audited with npm: zero known vulnerabilities at implementation time.

## Independent review

Two independent agents reviewed the implementation against the initial empty commit `eced357`: one against the specification and mechanics, one against reliability and maintainability. Both found the same two P2 issues: stale current-route success wording after editing a historically completed desk; and timer rendering closing the manual. Fixed by explicitly historical completion wording, pausing before opening help, and browser regressions. Expanded hints and tape scroll are preserved across runtime renders. The reviewer noted the broad main UI renderer as a maintainability tradeoff; source is formatted, while the pure VM, puzzles and persistence remain separate modules.

No VM correctness defects or security defects were found by the reviewers. Reviews and tests reduce risk; they do not prove all possible programs correct.

## Native browser acceptance

Pending coordinated access to shared native Chrome. Parent message delivery was unavailable; a slot request was relayed to the parallel Baba project. No shared native browser, existing tabs, screen, mouse or keyboard has been used by this task. Automated headless browser acceptance is complete and must not be represented as actual native Chrome acceptance.

## Publication checks

Before the final publication commit, staged text is scanned for credential/private-key patterns and machine-local paths. The full official OS gitignore files and license are retained. Final SHA and its exact GitHub Actions result are reported in the task outcome.
