# Copperline Dispatch

An original, playable browser programming puzzle inspired by Human Resource Machine. Write a repeatable instruction route for a courier in a warm, mechanical postal workshop. Eight assignments teach loops, storage, arithmetic, filtering, signed branches, subtraction, countdowns and counters. All artwork is original CSS; no commercial game assets are included. Unaffiliated with Tomorrow Corporation.

## Play locally

Requires Node.js 24 and npm.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5229. The fixed overhead workshop shows the inbox, validated outbox, courier's one carried value, numbered floor memory and program counter. No account, backend or runtime network dependency is required.

## Controls

- Click a command to append it. Edit the opcode and floor/target selectors in each row.
- Drag rows, or use ↑ / ↓ buttons, to reorder. Stable `L` labels move with rows. × removes a row. A deleted target is reported until repaired.
- Run / Pause, Step and Reset control execution. Speed selects 1–12 instructions per second.
- Space runs/pauses, S steps, R resets when focus is outside controls. All actions also have touch-friendly buttons.
- Select a test batch to inspect its inbox and expected output. Certify route checks every deterministic case, unlocks the next assignment and reports optional size/speed stamps.
- Routes and completed desks save to this browser's localStorage. Edits reset the running machine. Clear tape affects the current route only. The field guide documents every instruction.

## Machine contract

`INBOX`, `OUTBOX`, `COPYFROM`, `COPYTO`, `ADD`, `SUB`, `JUMP`, `JUMPZ`, `JUMPN`, `BUMPUP`, `BUMPDN` are supported. Empty hands/memory errors are explicit. INBOX replaces hands; exhaustion halts. OUTBOX validates immediately and consumes hands. Copies preserve the source. Bumps mutate memory and replace hands. Conditional jumps preserve hands. Labels add no instruction or execution cost. Every executed instruction, including a terminating INBOX attempt, counts as one step. Falling off the tape also halts. Halting checks missing output. Memory resets for each case. Boxes are integers from −999 to 999; loops have a 10,000-step budget.

Certification uses seven varied batches for most desks and six for pair/countdown desks, including empty inputs, zero, negatives where allowed, repeated values, and different lengths. It rejects solutions that only work on the visible example. Finite testing is not a proof for every possible input. Stamps are optional; execution score is the worst batch in the fixed bank. Solutions live in `src/puzzles.ts` for deterministic regression testing (spoilers).

## Verification

```sh
npm test                  # deterministic VM, puzzle and persistence tests
npm run build             # strict TypeScript and production build
npx playwright install chromium
npm run test:browser      # headless Chromium editor and acceptance tests
```

GitHub Actions runs all checks, including browser tests. Automated browser tests cover editing, operand changes, stable labels, reordering by drag and buttons, carried values, step/jump, runtime errors, run/pause/reset, certification, unlocks, all puzzle solutions, reload and mobile overflow. See [QA](docs/QA.md) for actual native browser status; headless tests are not native acceptance.

## Scope and research

The authoritative [Tomorrow Corporation game page](https://tomorrowcorporation.com/humanresourcemachine) describes the one-box accumulator, inbox/outbox, floor memory, visual commands, gradual progression and optional size/speed challenges. Accessed 2026-10-16. [Design contract](docs/SPEC.md) records this implementation's precise rules and differences. Original names, story, art, levels and code. Numeric values only; no letters, indirect memory addressing, comments, undo, sound, original campaign or skeletal animation. The workshop uses a fixed overhead camera with schematic animated movement; the courier is controlled solely by the instruction route.

`.gitignore` combines the complete official github/gitignore Global Linux, Windows and macOS templates, downloaded without modification, plus Node/Vite/Playwright ignores. Sources and MIT notices are retained under `docs/gitignore/`.

MIT licensed; see [LICENSE](LICENSE).
