import fs from "node:fs";
import minimist from "minimist";

type Problem = { left: number; right: number };

type Params = {
  count: number;        // number of problems
  min: number;          // min operand (inclusive)
  max: number;          // max operand (inclusive)
  noCarry?: boolean;    // if true, forbid carry (units place sum < 10)
  allowZeroSingle?: boolean; // allow 0 in either operand
  seed?: number;
  version?: string;     // for output name tagging, default "v1"
};

function rng(seed: number) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
}

function generate(p: Params): Problem[] {
  const r = rng(p.seed ?? 42);
  const out: Problem[] = [];

  while (out.length < p.count) {
    const a = Math.floor(r() * (p.max - p.min + 1)) + p.min;
    const b = Math.floor(r() * (p.max - p.min + 1)) + p.min;

    if (!p.allowZeroSingle && (a === 0 || b === 0)) continue;
    if (p.noCarry && (a % 10) + (b % 10) >= 10) continue;

    out.push({ left: a, right: b });
  }

  return out;
}

function toTwoColumnTex(problems: Problem[]): string {
  const lines: string[] = [];

  problems.forEach((q, i) => {
    const cell = `\\TextAdd{${q.left}}{${q.right}}`;
    if (i % 2 === 0) lines.push(cell + " & ");
    else lines[lines.length - 1] += cell + " \\\\";
  });

  if (problems.length % 2 === 1) {
    lines[lines.length - 1] += " \\phantom{X} \\\\";
  }

  return lines.join("\n");
}

function toAnswersTex(problems: Problem[]): string {
  return problems
    .map((q) => `\\item ${q.left} + ${q.right} = ${q.left + q.right}`)
    .join("\n");
}

function main() {
  const argv = minimist(process.argv.slice(2));

  const p: Params = {
    count: Number(argv.count ?? 24),
    min: Number(argv.min ?? 0),
    max: Number(argv.max ?? 10),
    noCarry: Boolean(argv.noCarry ?? false),
    allowZeroSingle: Boolean(argv.allowZeroSingle ?? false),
    seed: argv.seed !== undefined ? Number(argv.seed) : 2025,
    version: String(argv.version ?? "v1")
  };

  if (Number.isNaN(p.count) || Number.isNaN(p.min) || Number.isNaN(p.max)) {
    console.error("Invalid numeric args. Example: --count 24 --min 0 --max 10 --noCarry --seed 2025");
    process.exit(1);
  }

  if (p.min > p.max) {
    console.error("--min cannot be greater than --max.");
    process.exit(1);
  }

  const problems = generate(p);

  fs.mkdirSync("generated", { recursive: true });
  fs.writeFileSync("generated/problems.tex", toTwoColumnTex(problems));
  fs.writeFileSync("generated/answers.tex", toAnswersTex(problems));

  // 同时写出 meta，便于命名
  const meta = {
    topic: "addition",
    range: `${p.min}-${p.max}`,
    seed: p.seed ?? 2025,
    noCarry: !!p.noCarry,
    version: p.version
  };

  fs.writeFileSync("generated/build_meta.json", JSON.stringify(meta, null, 2));

  console.log("Generated: generated/problems.tex, generated/answers.tex, generated/build_meta.json");
}

main();

