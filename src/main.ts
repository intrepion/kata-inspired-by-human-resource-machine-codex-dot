import "./style.css";
import {
  OPS,
  memoryOps,
  jumpOps,
  createMachine,
  step,
  certify,
  validateProgram,
  type Instruction,
} from "./vm";
import { puzzles, type Puzzle } from "./puzzles";
import { readSave } from "./storage";
const root = document.querySelector<HTMLDivElement>("#app")!;
let storageWarning = "";
let raw: string | null = null;
try {
  raw = localStorage.getItem("copperline-v1");
} catch {
  storageWarning = "Storage unavailable: routes will last for this session.";
}
const save = readSave(
  raw,
  puzzles.map((p) => p.id),
);
let index = Math.max(
  0,
  puzzles.findIndex((p) => p.id === save.selected),
);
const unlocked = (n: number) =>
  n === 0 || save.completed.includes(puzzles[n - 1]!.id);
if (!unlocked(index)) index = 0;
let batchIndex = 0;
let machine = createMachine(current().floor);
let timer: ReturnType<typeof setInterval> | undefined;
let speed = 3;
let report = "";
let dragId: string | null = null;
let previousPosition = "left:51%;top:34%";
function current(): Puzzle {
  return puzzles[index]!;
}
function program(): Instruction[] {
  return (save.programs[current().id] ??= []);
}
function persist() {
  save.selected = current().id;
  try {
    localStorage.setItem("copperline-v1", JSON.stringify(save));
  } catch {
    storageWarning = "Storage unavailable: routes will last for this session.";
  }
}
function stop() {
  if (timer) clearInterval(timer);
  timer = undefined;
}
function reset() {
  stop();
  machine = createMachine(current().floor);
  report = "";
}
function edit(action: () => void) {
  action();
  reset();
  persist();
  render();
}
const escape = (x: unknown) =>
  String(x).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const box = (v: number | string, cls = "") =>
  `<span class="box ${cls}">${escape(v)}</span>`;
function tick() {
  const invalid = validateProgram(
    program(),
    current().allowed,
    current().floor.length,
  );
  if (invalid) {
    stop();
    report = invalid;
    render();
    return;
  }
  machine = step(machine, program(), current().cases[batchIndex]!);
  if (machine.status === "error" || machine.status === "halted") stop();
  render();
}
function run() {
  if (timer) {
    stop();
    render();
    return;
  }
  if (machine.status === "error" || machine.status === "halted") reset();
  timer = setInterval(tick, 1000 / speed);
  render();
}
function certifyRoute() {
  stop();
  const result = certify(program(), current());
  report = result.message;
  if (result.ok) {
    if (!save.completed.includes(current().id))
      save.completed.push(current().id);
    report += ` Route: ${program().length}/${current().size} instructions ${program().length <= current().size ? "★" : "○"} · Worst batch: ${result.worstSteps}/${current().steps} steps ${result.worstSteps <= current().steps ? "★" : "○"}.`;
    persist();
  } else {
    batchIndex = result.caseIndex;
    machine = createMachine(current().floor);
  }
  render();
}
function move(id: string, delta: number) {
  edit(() => {
    const p = program(),
      n = p.findIndex((i) => i.id === id),
      to = n + delta;
    if (to >= 0 && to < p.length) [p[n], p[to]] = [p[to]!, p[n]!];
  });
}
function render() {
  const hintOpen =
    root.querySelector<HTMLDetailsElement>(".hint")?.open ?? false;
  const tapeScroll = root.querySelector(".tape")?.scrollTop ?? 0;
  const p = current(),
    rows = program(),
    batch = p.cases[batchIndex]!;
  const position =
    machine.location === "inbox"
      ? "left:16%;top:38%"
      : machine.location === "outbox"
        ? "left:81%;top:38%"
        : typeof machine.location === "number"
          ? `left:${36 + (machine.location % 3) * 14}%;top:${52 + Math.floor(machine.location / 3) * 18}%`
          : "left:51%;top:34%";
  root.innerHTML = `<header><a class="wordmark" href="/" aria-label="Copperline Dispatch home"><span class="seal">↗</span><span>COPPERLINE <b>DISPATCH</b></span></a><span class="edition">THE ALGORITHM POSTAL SERVICE <i>EST. 1926</i></span><button id="manual">Field guide ?</button></header>
 <main><nav class="assignments" aria-label="Assignments"><div class="eyebrow">YOUR ROUTE UPSTAIRS</div><h2>Dispatch desk</h2>${puzzles.map((v, n) => `<button class="assignment ${n === index ? "selected" : ""}" data-level="${n}" ${unlocked(n) ? "" : "disabled"}><span class="level-no">${String(n + 1).padStart(2, "0")}</span><span>${v.title}<small>${v.subtitle}</small></span><b>${save.completed.includes(v.id) ? "✓" : unlocked(n) ? "↗" : "⌑"}</b></button>`).join("")}<div class="sidebar-note">Small instructions.<br>Remarkable journeys.<span>${save.completed.length} / ${puzzles.length} desks certified</span></div></nav>
 <section class="workspace"><div class="brief"><div><div class="eyebrow">ASSIGNMENT ${String(index + 1).padStart(2, "0")} / ${puzzles.length}</div><h1>${p.title}</h1><p>${p.brief}</p></div><div class="goals"><span>OPTIONAL STAMPS</span><b>≤ ${p.size} instructions</b><b>≤ ${p.steps} steps / batch</b></div></div>
 <div class="workshop" aria-label="Workshop"><div class="room-sign">COPPERLINE SORTING ROOM <span>DESK ${index + 1}</span></div><div class="window"><i></i><i></i><i></i></div><div class="belt incoming"><strong>INBOX ↓</strong><div>${
   batch.input
     .slice(machine.cursor)
     .map((v) => box(v))
     .join("") || '<span class="empty">empty</span>'
 }</div></div><div class="belt outgoing"><strong>OUTBOX ↑</strong><div>${machine.output.map((v) => box(v, "delivered")).join("") || '<span class="empty">awaiting post</span>'}</div></div><div class="floor">${machine.floor.map((v, n) => `<div class="tile ${machine.location === n ? "visited" : ""}" aria-label="Floor ${n}: ${v ?? "empty"}"><small>${n}</small>${v === null ? "" : box(v)}</div>`).join("")}</div><div class="courier" style="${previousPosition}" aria-label="Courier carrying ${machine.hands ?? "nothing"}"><div class="cap"></div><div class="face">••</div><div class="coat">C</div><div class="legs">▌▐</div><div class="carried">${machine.hands === null ? "<span>empty hands</span>" : box(machine.hands)}</div></div><div class="room-footer"><span>FIXED OVERHEAD VIEW</span><strong>HANDS <b>${machine.hands ?? "—"}</b></strong><span>PC ${machine.pc < rows.length ? machine.pc + 1 : "END"} · ${machine.steps} STEPS</span></div></div>
 <div class="transport"><button class="primary" id="run">${timer ? "Ⅱ Pause" : "▶ Run"}</button><button id="step">Step →</button><button id="reset">↺ Reset</button><label class="speed">Speed <input id="speed" aria-label="Execution speed" type="range" min="1" max="12" value="${speed}"><span>${speed}×</span></label><button class="certify" id="certify">Certify route ↗</button></div>
 <div class="status ${machine.status === "error" ? "error" : ""}" role="status" aria-live="polite">${escape(report || machine.message)}</div>
 <div class="batch-panel"><label>Test batch <select id="batch" aria-label="Test batch">${p.cases.map((_, n) => `<option value="${n}" ${n === batchIndex ? "selected" : ""}>${n + 1} / ${p.cases.length}</option>`).join("")}</select></label><div><small>EXPECTED OUTBOX</small><span>${batch.output.map((v) => box(v)).join("") || "No boxes"}</span></div></div><details class="hint" ${hintOpen ? "open" : ""}><summary>Postmaster’s hint</summary><p>${p.hint}</p></details>${save.completed.includes(p.id) ? `<div class="success"><b>✓ Desk unlocked.</b> A route for this desk was certified. Certify again after edits. ${index < puzzles.length - 1 ? '<button id="next">Next assignment →</button>' : "All desks complete. Revisit a route to earn both stamps."}</div>` : ""}${storageWarning ? `<p>${storageWarning}</p>` : ""}</section>
 <aside class="editor"><div class="editor-heading"><div class="eyebrow">BUILD A REPEATABLE ROUTE</div><h2>Instruction tape <span>${rows.length}</span></h2><p>Click a command to append. Drag rows or use arrows to reorder. Labels travel with their instructions.</p></div><div class="palette">${p.allowed.map((op) => `<button data-add="${op}" title="Add ${op}">+ ${op}</button>`).join("")}</div><div class="tape" aria-label="Instruction list">${rows.length ? "" : '<div class="empty-tape"><span>01</span>Your route starts here.<small>Add INBOX, then OUTBOX.<br>Use JUMP to repeat.</small></div>'}${rows.map((r, n) => `<div class="instruction ${machine.pc === n ? "active" : ""}" draggable="true" data-id="${r.id}"><span class="pc" title="Next instruction">${machine.pc === n ? "▶" : n + 1}</span><b class="label">${r.id}</b><select aria-label="Operation ${n + 1}" data-op="${r.id}">${p.allowed.map((op) => `<option ${op === r.op ? "selected" : ""}>${op}</option>`).join("")}</select>${memoryOps.includes(r.op) ? `<select aria-label="Floor for ${r.id}" data-arg="${r.id}">${p.floor.map((_, t) => `<option value="${t}" ${r.arg === t ? "selected" : ""}>floor ${t}</option>`).join("")}</select>` : jumpOps.includes(r.op) ? `<select aria-label="Target for ${r.id}" data-arg="${r.id}"><option value="" ${!rows.some((x) => x.id === r.arg) ? "selected" : ""}>target?</option>${rows.map((t) => `<option value="${t.id}" ${r.arg === t.id ? "selected" : ""}>↳ ${t.id}</option>`).join("")}</select>` : '<span class="no-arg"></span>'}<div class="row-actions"><button data-up="${r.id}" aria-label="Move ${r.id} up" ${n === 0 ? "disabled" : ""}>↑</button><button data-down="${r.id}" aria-label="Move ${r.id} down" ${n === rows.length - 1 ? "disabled" : ""}>↓</button><button data-remove="${r.id}" aria-label="Remove ${r.id}">×</button></div></div>`).join("")}</div><div class="editor-foot"><button id="clear" ${rows.length ? "" : "disabled"}>Clear tape</button><small>Auto-saved locally · max 128 rows</small></div></aside></main>
 <dialog id="guide"><button id="close-guide" class="close" aria-label="Close field guide">×</button><div class="eyebrow">COURIER TRAINING MANUAL</div><h2>One box. Endless possibilities.</h2><p>Arrange instructions to automate each assignment. The courier executes the highlighted row, then moves to the next. Use labels to loop or branch.</p><dl><dt>INBOX / OUTBOX</dt><dd>Fetch the next box (replacing hands); deliver and empty hands. Empty INBOX ends a batch.</dd><dt>COPYTO / COPYFROM</dt><dd>Copy hands onto a numbered tile / copy a tile into hands. The original stays put.</dd><dt>ADD / SUB</dt><dd>Add a tile to hands / subtract a tile from hands.</dd><dt>JUMP / JUMPZ / JUMPN</dt><dd>Go to a label always / when hands are zero / when hands are negative. Hands stay intact.</dd><dt>BUMPUP / BUMPDN</dt><dd>Increase / decrease a tile by one; copy the new value into hands.</dd></dl><p>Reading empty hands or empty tiles fails. Values stay in −999…999. Loops stop at 10,000 steps. Certification checks every batch, then unlocks the next desk. Optional stamps reward small routes and fast execution.</p><p><kbd>Space</kbd> run / pause · <kbd>S</kbd> step · <kbd>R</kbd> reset. Buttons work on touch. Changes reset execution. Use the Test batch menu to inspect edge cases.</p><p>Inspired by Human Resource Machine; all artwork, assignments and story are original. No affiliation with Tomorrow Corporation.</p></dialog>`;
  const courier = root.querySelector<HTMLElement>(".courier")!;
  requestAnimationFrame(() => {
    courier.style.cssText = position;
  });
  previousPosition = position;
  root.querySelector(".tape")!.scrollTop = tapeScroll;
  bind();
}
function bind() {
  const on = (selector: string, event: string, fn: (e: Event) => void) =>
    root
      .querySelectorAll(selector)
      .forEach((el) => el.addEventListener(event, fn));
  on("[data-add]", "click", (e) => {
    const op = (e.currentTarget as HTMLElement).dataset
      .add as (typeof OPS)[number];
    if (program().length >= 128) return;
    edit(() => {
      const id = `L${Math.max(0, ...program().map((i) => Number(i.id.slice(1)))) + 1}`;
      program().push({
        id,
        op,
        arg: jumpOps.includes(op) ? (program()[0]?.id ?? id) : 0,
      });
    });
  });
  on("[data-level]", "click", (e) => {
    index = Number((e.currentTarget as HTMLElement).dataset.level);
    batchIndex = 0;
    reset();
    persist();
    render();
  });
  on("[data-op]", "change", (e) => {
    const el = e.currentTarget as HTMLSelectElement;
    edit(() => {
      const r = program().find((i) => i.id === el.dataset.op)!;
      r.op = el.value as Instruction["op"];
      r.arg = jumpOps.includes(r.op) ? program()[0]!.id : 0;
    });
  });
  on("[data-arg]", "change", (e) => {
    const el = e.currentTarget as HTMLSelectElement;
    edit(() => {
      const r = program().find((i) => i.id === el.dataset.arg)!;
      r.arg = memoryOps.includes(r.op) ? Number(el.value) : el.value;
    });
  });
  on("[data-up]", "click", (e) =>
    move((e.currentTarget as HTMLElement).dataset.up!, -1),
  );
  on("[data-down]", "click", (e) =>
    move((e.currentTarget as HTMLElement).dataset.down!, 1),
  );
  on("[data-remove]", "click", (e) =>
    edit(() => {
      save.programs[current().id] = program().filter(
        (i) => i.id !== (e.currentTarget as HTMLElement).dataset.remove,
      );
    }),
  );
  on("[draggable]", "dragstart", (e) => {
    dragId = (e.currentTarget as HTMLElement).dataset.id!;
    (e as DragEvent).dataTransfer?.setData("text/plain", dragId);
  });
  on("[draggable]", "dragover", (e) => e.preventDefault());
  on("[draggable]", "drop", (e) => {
    e.preventDefault();
    const target = (e.currentTarget as HTMLElement).dataset.id;
    if (!dragId || target === dragId) return;
    edit(() => {
      const p = program(),
        from = p.findIndex((i) => i.id === dragId),
        to = p.findIndex((i) => i.id === target);
      if (from >= 0 && to >= 0) p.splice(to, 0, p.splice(from, 1)[0]!);
    });
    dragId = null;
  });
  on("#run", "click", run);
  on("#step", "click", () => {
    stop();
    tick();
  });
  on("#reset", "click", () => {
    reset();
    render();
  });
  on("#certify", "click", certifyRoute);
  on("#clear", "click", () =>
    edit(() => {
      save.programs[current().id] = [];
    }),
  );
  on("#speed", "change", (e) => {
    const wasRunning = Boolean(timer);
    stop();
    speed = Number((e.currentTarget as HTMLInputElement).value);
    if (wasRunning) timer = setInterval(tick, 1000 / speed);
    render();
  });
  on("#batch", "change", (e) => {
    batchIndex = Number((e.currentTarget as HTMLSelectElement).value);
    reset();
    render();
  });
  on("#next", "click", () => {
    index++;
    batchIndex = 0;
    reset();
    persist();
    render();
  });
  on("#manual", "click", () => {
    stop();
    render();
    root.querySelector<HTMLDialogElement>("#guide")!.showModal();
  });
  on("#close-guide", "click", () =>
    root.querySelector<HTMLDialogElement>("#guide")!.close(),
  );
}
document.addEventListener("keydown", (e) => {
  if (
    e.target instanceof HTMLElement &&
    (e.target.matches("input,select,textarea,button") ||
      root.querySelector("dialog[open]"))
  )
    return;
  if (e.code === "Space") {
    e.preventDefault();
    run();
  }
  if (e.key.toLowerCase() === "s") {
    stop();
    tick();
  }
  if (e.key.toLowerCase() === "r") {
    reset();
    render();
  }
});
render();
