import fs from "node:fs";
import minimist from "minimist";

type Problem = { left: number; right: number };

type Params = {
  count: number;        // number of problems
  min2Digit: number;    // min 2-digit number (e.g., 10)
  max2Digit: number;    // max 2-digit number (e.g., 99)
  min1Digit: number;    // min 1-digit number (e.g., 1)
  max1Digit: number;    // max 1-digit number (e.g., 9)
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
    const twoDigit = Math.floor(r() * (p.max2Digit - p.min2Digit + 1)) + p.min2Digit;
    const oneDigit = Math.floor(r() * (p.max1Digit - p.min1Digit + 1)) + p.min1Digit;

    out.push({ left: twoDigit, right: oneDigit });
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
  const lines: string[] = [];

  problems.forEach((q, i) => {
    const problemNumber = i + 1;
    const answer = q.left + q.right;
    const cell = `\\Large ${problemNumber}) ${q.left} + ${q.right} = ${answer}`;
    if (i % 2 === 0) lines.push(cell + " & ");
    else lines[lines.length - 1] += cell + " \\\\";
  });

  if (problems.length % 2 === 1) {
    lines[lines.length - 1] += " \\phantom{X} \\\\";
  }

  return lines.join("\n");
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
    min2Digit: Number(argv.min2Digit ?? 10),
    max2Digit: Number(argv.max2Digit ?? 99),
    min1Digit: Number(argv.min1Digit ?? 1),
    max1Digit: Number(argv.max1Digit ?? 9),
    seed: argv.seed !== undefined ? Number(argv.seed) : undefined,
    version: String(argv.version ?? "v1"),
    name: argv.name ? String(argv.name) : undefined,
  };

  if (Number.isNaN(p.count) || Number.isNaN(p.min2Digit) || Number.isNaN(p.max2Digit) || 
      Number.isNaN(p.min1Digit) || Number.isNaN(p.max1Digit)) {
    console.error("Invalid numeric args. Example: --count 24 --min2Digit 10 --max2Digit 99 --min1Digit 1 --max1Digit 9 --seed 2025");
    process.exit(1);
  }

  if (p.min2Digit > p.max2Digit || p.min1Digit > p.max1Digit) {
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
    topic: "add-2digit-1digit",
    range: `${p.min2Digit}-${p.max2Digit}+${p.min1Digit}-${p.max1Digit}`,
    seed: actualSeed,
    version: p.version,
    name: p.name // 保存配置中的 name
  };

  fs.writeFileSync("generated/build_meta.json", JSON.stringify(meta, null, 2));

  console.log("Generated: generated/problems.tex, generated/answers.tex, generated/build_meta.json");
}

main();
