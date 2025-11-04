// scripts/generate_pictures.ts
import fs from "node:fs";
import minimist from "minimist";

type IconName = "Apple" | "Star" | "Triangle";
type Problem = { left: number; right: number; iconLeft: IconName; iconRight: IconName };

type Params = {
  count: number;
  min: number;
  max: number;
  allowZeroSingle?: boolean;
  sameIconOnly?: boolean;   // 是否左右两边必须同一种图标（常见需求）
  seed?: number;
  perRow?: number;          // 每行最多多少图标，超出自动换行
  version?: string;
};

function rng(seed: number) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
}

const ICONS: IconName[] = ["Apple", "Star", "Triangle"];
function pickIcon(r: () => number): IconName {
  return ICONS[Math.floor(r() * ICONS.length)];
}

function generate(p: Params): Problem[] {
  const r = rng(p.seed ?? 42);
  const out: Problem[] = [];
  while (out.length < p.count) {
    const a = Math.floor(r() * (p.max - p.min + 1)) + p.min;
    const b = Math.floor(r() * (p.max - p.min + 1)) + p.min;
    if (!p.allowZeroSingle && (a === 0 || b === 0)) continue;
    let L: IconName = pickIcon(r);
    let R: IconName = p.sameIconOnly ? L : pickIcon(r);
    out.push({ left: a, right: b, iconLeft: L, iconRight: R });
  }
  return out;
}

function toTwoColumnTex(problems: Problem[], perRow?: number): string {
  const lines: string[] = [];
  problems.forEach((q, i) => {
    const macro = perRow && perRow > 0
      ? `\\WSPictureAddIcons2L{${q.iconLeft}}{${q.left}}{${q.iconRight}}{${q.right}}{${perRow}}`
      : `\\WSPictureAddIcons{${q.iconLeft}}{${q.left}}{${q.iconRight}}{${q.right}}`;

    if (i % 2 === 0) lines.push(macro + " & ");
    else lines[lines.length - 1] += macro + " \\\\";
  });
  if (problems.length % 2 === 1) {
    lines[lines.length - 1] += " \\phantom{X} \\\\";
  }
  return lines.join("\n");
}

function toAnswersTex(problems: Problem[]): string {
  return problems.map(q => `\\item ${q.left} + ${q.right} = ${q.left + q.right}`).join("\n");
}

function main() {
  const argv = minimist(process.argv.slice(2));
  const params: Params = {
    count: Number(argv.count ?? 12),
    min: Number(argv.min ?? 1),
    max: Number(argv.max ?? 5),
    allowZeroSingle: Boolean(argv.allowZeroSingle ?? false),
    sameIconOnly: Boolean(argv.sameIconOnly ?? true),
    seed: argv.seed !== undefined ? Number(argv.seed) : 2025,
    perRow: argv.perRow !== undefined ? Number(argv.perRow) : 5,
    version: String(argv.version ?? "v1"),
  };

  const problems = generate(params);
  fs.mkdirSync("generated", { recursive: true });
  fs.writeFileSync("generated/problems_pictures.tex", toTwoColumnTex(problems, params.perRow));
  fs.writeFileSync("generated/answers_pictures.tex", toAnswersTex(problems));

  const meta = {
    topic: "adding-with-pictures",
    range: `${params.min}-${params.max}`,
    seed: params.seed,
    perRow: params.perRow,
    sameIconOnly: params.sameIconOnly,
    version: params.version
  };
  fs.writeFileSync("generated/build_meta_pictures.json", JSON.stringify(meta));
  console.log("Generated: problems_pictures.tex, answers_pictures.tex, build_meta_pictures.json");
}

main();
