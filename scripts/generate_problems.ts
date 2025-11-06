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
  name?: string;        // worksheet name from config
};

function rng(seed: number) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
}

function generate(p: Params): Problem[] {
  // 如果没有指定 seed，使用随机 seed（基于时间戳）
  const seed = p.seed !== undefined ? p.seed : Date.now();
  const r = rng(seed);
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
    .map((q) => `\\item {\\Large ${q.left} + ${q.right} = ${q.left + q.right}}`)
    .join("\n");
}

function main() {
  // 处理 pnpm 传递的 -- 分隔符：如果第一个参数是 --，跳过它
  let args = process.argv.slice(2);
  if (args[0] === '--') {
    args = args.slice(1);
  }
  const argv = minimist(args);

  const p: Params = {
    count: Number(argv.count ?? 24),
    min: Number(argv.min ?? 0),
    max: Number(argv.max ?? 10),
    noCarry: Boolean(argv.noCarry ?? false),
    allowZeroSingle: Boolean(argv.allowZeroSingle ?? false),
    seed: argv.seed !== undefined ? Number(argv.seed) : undefined,
    version: String(argv.version ?? "v1"),
    name: argv.name ? String(argv.name) : undefined,  // 从命令行参数读取 name（由 generate_all.ts 传递）
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

  // 计算实际使用的 seed（如果未指定则使用随机值）
  const actualSeed = p.seed !== undefined ? p.seed : Date.now();
  // 同时写出 meta，便于命名
  const meta = {
    topic: "addition",
    range: `${p.min}-${p.max}`,
    seed: actualSeed,
    noCarry: !!p.noCarry,
    version: p.version,
    name: p.name // 保存配置中的 name
  };

  fs.writeFileSync("generated/build_meta.json", JSON.stringify(meta, null, 2));

  console.log("Generated: generated/problems.tex, generated/answers.tex, generated/build_meta.json");
}

main();

