export const OPS = [
  "INBOX",
  "OUTBOX",
  "COPYFROM",
  "COPYTO",
  "ADD",
  "SUB",
  "JUMP",
  "JUMPZ",
  "JUMPN",
  "BUMPUP",
  "BUMPDN",
] as const;
export type Op = (typeof OPS)[number];
export type Instruction = { id: string; op: Op; arg: number | string };
export type Batch = { input: number[]; output: number[] };
export type Machine = {
  pc: number;
  hands: number | null;
  floor: (number | null)[];
  cursor: number;
  output: number[];
  steps: number;
  status: "ready" | "running" | "halted" | "error";
  message: string;
  location: "inbox" | "outbox" | number | "center";
};
export const memoryOps: readonly string[] = [
  "COPYFROM",
  "COPYTO",
  "ADD",
  "SUB",
  "BUMPUP",
  "BUMPDN",
];
export const jumpOps: readonly string[] = ["JUMP", "JUMPZ", "JUMPN"];
export function createMachine(floor: (number | null)[]): Machine {
  return {
    pc: 0,
    hands: null,
    floor: [...floor],
    cursor: 0,
    output: [],
    steps: 0,
    status: "ready",
    message: "Ready for dispatch.",
    location: "center",
  };
}
export function validateProgram(
  program: Instruction[],
  allowed: readonly string[],
  tiles: number,
): string | null {
  if (program.length > 128) return "Route exceeds 128 instructions.";
  const ids = new Set(program.map((i) => i.id));
  if (ids.size !== program.length || program.some((i) => !/^L\d+$/.test(i.id)))
    return "Route labels must be unique L-number labels.";
  for (const [n, i] of program.entries()) {
    if (!allowed.includes(i.op))
      return `Line ${n + 1}: ${i.op} is unavailable.`;
    if (
      memoryOps.includes(i.op) &&
      (!Number.isInteger(i.arg) || Number(i.arg) < 0 || Number(i.arg) >= tiles)
    )
      return `Line ${n + 1}: choose an existing floor tile.`;
    if (jumpOps.includes(i.op) && !ids.has(String(i.arg)))
      return `Line ${n + 1}: choose an existing jump label.`;
  }
  return null;
}
export function step(
  before: Machine,
  program: Instruction[],
  batch: Batch,
): Machine {
  const s = { ...before, floor: [...before.floor], output: [...before.output] };
  if (s.status === "halted" || s.status === "error") return s;
  const fail = (message: string) => {
    s.status = "error";
    s.message = message;
    return s;
  };
  const halt = () => {
    s.status = s.output.length === batch.output.length ? "halted" : "error";
    s.message =
      s.status === "halted"
        ? "Batch delivered correctly."
        : `Missing output: expected ${batch.output.length} boxes, delivered ${s.output.length}.`;
    return s;
  };
  const i = program[s.pc];
  if (!i) return halt();
  if (s.steps >= 10000)
    return fail("10,000-step limit reached. Check your loop and jump targets.");
  s.steps++;
  s.status = "running";
  const hasHands = () => s.hands !== null;
  const tile = Number(i.arg);
  const needsMemory = memoryOps.includes(i.op);
  if (
    needsMemory &&
    (!Number.isInteger(tile) || tile < 0 || tile >= s.floor.length)
  )
    return fail(`Line ${s.pc + 1}: invalid floor tile.`);
  if (
    ["OUTBOX", "COPYTO", "ADD", "SUB", "JUMPZ", "JUMPN"].includes(i.op) &&
    !hasHands()
  )
    return fail(`Line ${s.pc + 1}: empty hands. Fetch a box first.`);
  if (
    ["COPYFROM", "ADD", "SUB", "BUMPUP", "BUMPDN"].includes(i.op) &&
    s.floor[tile] == null
  )
    return fail(
      `Line ${s.pc + 1}: floor ${tile} is empty. Store a box there first.`,
    );
  let next = s.pc + 1;
  switch (i.op) {
    case "INBOX":
      if (s.cursor >= batch.input.length) return halt();
      s.hands = batch.input[s.cursor++]!;
      s.location = "inbox";
      break;
    case "OUTBOX": {
      const expected = batch.output[s.output.length];
      if (s.hands !== expected)
        return fail(
          `Outbox ${s.output.length + 1}: expected ${expected ?? "no more boxes"}, received ${s.hands}.`,
        );
      s.output.push(s.hands!);
      s.hands = null;
      s.location = "outbox";
      break;
    }
    case "COPYFROM":
      s.hands = s.floor[tile]!;
      s.location = tile;
      break;
    case "COPYTO":
      s.floor[tile] = s.hands;
      s.location = tile;
      break;
    case "ADD":
      s.hands = s.hands! + s.floor[tile]!;
      s.location = tile;
      break;
    case "SUB":
      s.hands = s.hands! - s.floor[tile]!;
      s.location = tile;
      break;
    case "BUMPUP":
      s.hands = s.floor[tile]! + 1;
      s.floor[tile] = s.hands;
      s.location = tile;
      break;
    case "BUMPDN":
      s.hands = s.floor[tile]! - 1;
      s.floor[tile] = s.hands;
      s.location = tile;
      break;
    case "JUMP":
    case "JUMPZ":
    case "JUMPN": {
      const target = program.findIndex((r) => r.id === i.arg);
      if (target < 0) return fail(`Line ${s.pc + 1}: missing jump target.`);
      if (
        i.op === "JUMP" ||
        (i.op === "JUMPZ" && s.hands === 0) ||
        (i.op === "JUMPN" && s.hands! < 0)
      )
        next = target;
      break;
    }
    default:
      return fail("Unknown instruction.");
  }
  if (
    s.hands !== null &&
    (!Number.isInteger(s.hands) || Math.abs(s.hands) > 999)
  )
    return fail("Numeric overflow: boxes must stay between -999 and 999.");
  s.pc = next;
  s.message = `Executed ${i.op}.`;
  return s;
}
export function execute(
  program: Instruction[],
  batch: Batch,
  floor: (number | null)[],
): Machine {
  let s = createMachine(floor);
  while (s.status !== "halted" && s.status !== "error")
    s = step(s, program, batch);
  return s;
}
export function certify(
  program: Instruction[],
  puzzle: {
    allowed: readonly string[];
    floor: (number | null)[];
    cases: Batch[];
  },
) {
  const invalid = validateProgram(program, puzzle.allowed, puzzle.floor.length);
  if (invalid)
    return { ok: false, message: invalid, worstSteps: 0, caseIndex: 0 };
  let worstSteps = 0;
  for (const [caseIndex, batch] of puzzle.cases.entries()) {
    const s = execute(program, batch, puzzle.floor);
    worstSteps = Math.max(worstSteps, s.steps);
    if (s.status !== "halted")
      return {
        ok: false,
        message: `Batch ${caseIndex + 1}: ${s.message}`,
        worstSteps,
        caseIndex,
      };
  }
  return {
    ok: true,
    message: `All ${puzzle.cases.length} batches certified.`,
    worstSteps,
    caseIndex: 0,
  };
}
