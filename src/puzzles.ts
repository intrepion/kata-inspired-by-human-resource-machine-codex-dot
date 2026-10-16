import { OPS, type Instruction, type Batch } from "./vm";
export type Puzzle = {
  id: string;
  title: string;
  subtitle: string;
  brief: string;
  hint: string;
  floor: (number | null)[];
  allowed: readonly string[];
  cases: Batch[];
  size: number;
  steps: number;
  solution: Instruction[];
};
export function route(text: string): Instruction[] {
  return text.split(";").map((line, n) => {
    const [op, arg] = line.trim().split(" ");
    return {
      id: `L${n + 1}`,
      op: op as Instruction["op"],
      arg: arg?.startsWith("L") ? arg : Number(arg ?? 0),
    };
  });
}
const inputs: number[][] = [
  [4, -2, 0, 7],
  [],
  [9],
  [0, 0],
  [-9, -1, 3, 8, 2],
  [5, -5, 5, -5],
  [1, 2, 3, 4, 5, 6, 7, 8],
];
function batches(f: (a: number[]) => number[], bank = inputs): Batch[] {
  return bank.map((input) => ({ input, output: f([...input]) }));
}
export const puzzles: Puzzle[] = [
  {
    id: "relay",
    title: "First post",
    subtitle: "The art of a loop",
    brief:
      "Send every incoming box to the outbox, in the same order. Keep going until the inbox is empty.",
    hint: "Fetch, deliver, then jump back to the fetch label. An empty INBOX finishes the batch.",
    floor: [],
    allowed: ["INBOX", "OUTBOX", "JUMP"],
    cases: batches((a) => a),
    size: 3,
    steps: 30,
    solution: route("INBOX;OUTBOX;JUMP L1"),
  },
  {
    id: "echo",
    title: "Carbon copies",
    subtitle: "A place to remember",
    brief:
      "Deliver each incoming number twice before moving to the next. Floor tiles keep copies after delivery.",
    hint: "Store a copy on floor 0 before OUTBOX empties your hands. COPYFROM retrieves that copy.",
    floor: [null, null, null],
    allowed: ["INBOX", "OUTBOX", "JUMP", "COPYTO", "COPYFROM"],
    cases: batches((a) => a.flatMap((x) => [x, x])),
    size: 6,
    steps: 55,
    solution: route("INBOX;COPYTO 0;OUTBOX;COPYFROM 0;OUTBOX;JUMP L1"),
  },
  {
    id: "double",
    title: "Double postage",
    subtitle: "Arithmetic at work",
    brief:
      "Deliver twice the value of every incoming number. Negative numbers and zero are ordinary parcels too.",
    hint: "Store the incoming value, then ADD that tile to your hands.",
    floor: [null, null, null],
    allowed: ["INBOX", "OUTBOX", "JUMP", "COPYTO", "COPYFROM", "ADD"],
    cases: batches((a) => a.map((x) => x * 2)),
    size: 5,
    steps: 45,
    solution: route("INBOX;COPYTO 0;ADD 0;OUTBOX;JUMP L1"),
  },
  {
    id: "filter",
    title: "Blank envelopes",
    subtitle: "A conditional detour",
    brief:
      "Discard every zero. Deliver all other numbers in their original order.",
    hint: "JUMPZ returns to INBOX when hands hold zero. Fetching another box replaces what you carry.",
    floor: [null, null, null],
    allowed: ["INBOX", "OUTBOX", "JUMP", "JUMPZ"],
    cases: batches((a) => a.filter((x) => x !== 0)),
    size: 4,
    steps: 40,
    solution: route("INBOX;JUMPZ L1;OUTBOX;JUMP L1"),
  },
  {
    id: "positive",
    title: "Sunny side",
    subtitle: "Read the sign",
    brief:
      "Deliver only strictly positive numbers. Discard zero and all negative numbers.",
    hint: "Two conditional jumps can reject zero and negatives before delivery.",
    floor: [null, null, null],
    allowed: ["INBOX", "OUTBOX", "JUMP", "JUMPZ", "JUMPN"],
    cases: batches((a) => a.filter((x) => x > 0)),
    size: 5,
    steps: 45,
    solution: route("INBOX;JUMPZ L1;JUMPN L1;OUTBOX;JUMP L1"),
  },
  {
    id: "difference",
    title: "Balance the books",
    subtitle: "Order matters",
    brief:
      "Read boxes in pairs. For each pair (a, b), deliver a − b. Every batch has an even number of boxes.",
    hint: "Store a, store b, reload a, then SUB the tile holding b.",
    floor: [null, null, null],
    allowed: OPS.slice(0, 9),
    cases: batches(
      (a) => a.filter((_, i) => i % 2 === 0).map((x, i) => x - a[i * 2 + 1]!),
      [[], [5, 2], [2, 5], [0, 0], [-4, -7, 8, -2], [9, 1, 1, 9, 3, 3]],
    ),
    size: 8,
    steps: 30,
    solution: route(
      "INBOX;COPYTO 0;INBOX;COPYTO 1;COPYFROM 0;SUB 1;OUTBOX;JUMP L1",
    ),
  },
  {
    id: "countdown",
    title: "Last collection",
    subtitle: "Loops inside loops",
    brief:
      "For each nonnegative input n, deliver n, n−1, …, 1. Zero produces no output. BUMPDN changes a floor value and puts the result in your hands.",
    hint: "Reject zero, store n, deliver it, then bump the stored count down. Continue while nonzero.",
    floor: [null, null, null],
    allowed: OPS,
    cases: batches(
      (a) => a.flatMap((n) => Array.from({ length: n }, (_, i) => n - i)),
      [[], [0], [1], [3, 0, 2], [5], [0, 0, 1, 4]],
    ),
    size: 8,
    steps: 120,
    solution: route("INBOX;JUMPZ L1;COPYTO 0;OUTBOX;BUMPDN 0;JUMPZ L1;JUMP L4"),
  },
  {
    id: "ordinal",
    title: "Dispatch ledger",
    subtitle: "Make your own counter",
    brief:
      "Ignore each incoming value. For the first box deliver 1, for the second 2, and so on. Floor 0 begins at zero.",
    hint: "INBOX is the loop gate; BUMPUP on floor 0 keeps the count, replacing the incoming value in your hands.",
    floor: [0, null, null, null, null, null],
    allowed: OPS,
    cases: batches((a) => a.map((_, i) => i + 1)),
    size: 4,
    steps: 35,
    solution: route("INBOX;BUMPUP 0;OUTBOX;JUMP L1"),
  },
];
