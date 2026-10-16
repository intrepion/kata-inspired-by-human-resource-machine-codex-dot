import { OPS, type Instruction } from "./vm";
export type Save = {
  programs: Record<string, Instruction[]>;
  completed: string[];
  selected: string;
};
export function readSave(raw: string | null, ids: string[]): Save {
  const clean: Save = { programs: {}, completed: [], selected: ids[0]! };
  try {
    const data: unknown = JSON.parse(raw ?? "null");
    if (!data || typeof data !== "object") return clean;
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.completed))
      clean.completed = d.completed.filter(
        (id): id is string => typeof id === "string" && ids.includes(id),
      );
    if (typeof d.selected === "string" && ids.includes(d.selected))
      clean.selected = d.selected;
    if (d.programs && typeof d.programs === "object")
      for (const [id, rows] of Object.entries(d.programs)) {
        if (
          ids.includes(id) &&
          Array.isArray(rows) &&
          rows.length <= 128 &&
          rows.every((r: unknown) => {
            if (!r || typeof r !== "object") return false;
            const x = r as Instruction;
            return (
              typeof x.id === "string" &&
              /^L\d+$/.test(x.id) &&
              OPS.includes(x.op) &&
              (typeof x.arg === "string" ||
                (typeof x.arg === "number" && Number.isInteger(x.arg)))
            );
          }) &&
          new Set(rows.map((r: Instruction) => r.id)).size === rows.length
        )
          clean.programs[id] = rows;
      }
  } catch {
    /* A malformed or old save starts safely. */
  }
  return clean;
}
