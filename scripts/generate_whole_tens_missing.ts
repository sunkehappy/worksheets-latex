import fs from "node:fs";
import minimist from "minimist";

type Problem = { left: number; right: number; sum: number; missingPosition: "left" | "right" };

type Params = {
  count: number;        // number of problems
  minTens: number;      // min tens (e.g., 1 means 10, 9 means 90)
  maxTens: number;      // max tens (e.g., 1 means 10, 9 means 90)
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
    const tensA = Math.floor(r() * (p.maxTens - p.minTens + 1)) + p.minTens;
    const tensB = Math.floor(r() * (p.maxTens - p.minTens + 1)) + p.minTens;
    const a = tensA * 10;
    const b = tensB * 10;
    const sum = a + b;
    
    // Randomly choose which operand is missing
    const missingPosition = r() < 0.5 ? "left" : "right";

    out.push({ left: a, right: b, sum: sum, missingPosition });
  }

  return out;
}

function toTwoColumnTex(problems: Problem[]): string {
  const lines: string[] = [];

  problems.forEach((q, i) => {
    let cell: string;
    if (q.missingPosition === "left") {
      cell = `\\Large \\rule{40pt}{0.6pt} + ${q.right} = ${q.sum}`;
    } else {
      cell = `\\Large ${q.left} + \\rule{40pt}{0.6pt} = ${q.sum}`;
    }
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
    const missing = q.missingPosition === "left" ? q.left : q.right;
    
    let problemStr: string;
    let answerStr: string;
    
    if (q.missingPosition === "left") {
      problemStr = `\\rule{40pt}{0.6pt} + ${q.right} = ${q.sum}`;
      answerStr = `${q.left}`;
    } else {
      problemStr = `${q.left} + \\rule{40pt}{0.6pt} = ${q.sum}`;
      answerStr = `${q.right}`;
    }
    
    const cell = `\\Large ${problemNumber}) ${problemStr} \\quad (${answerStr})`;
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
    minTens: Number(argv.minTens ?? 1),
    maxTens: Number(argv.maxTens ?? 9),
    seed: argv.seed !== undefined ? Number(argv.seed) : undefined,
    version: String(argv.version ?? "v1"),
    name: argv.name ? String(argv.name) : undefined,
  };

  if (Number.isNaN(p.count) || Number.isNaN(p.minTens) || Number.isNaN(p.maxTens)) {
    console.error("Invalid numeric args. Example: --count 24 --minTens 1 --maxTens 9 --seed 2025");
    process.exit(1);
  }

  if (p.minTens > p.maxTens) {
    console.error("--minTens cannot be greater than --maxTens.");
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
    topic: "adding-whole-tens-missing",
    range: `${p.minTens * 10}-${p.maxTens * 10}`,
    seed: actualSeed,
    version: p.version,
    name: p.name // 保存配置中的 name
  };

  fs.writeFileSync("generated/build_meta.json", JSON.stringify(meta, null, 2));

  console.log("Generated: generated/problems.tex, generated/answers.tex, generated/build_meta.json");
}

main();
