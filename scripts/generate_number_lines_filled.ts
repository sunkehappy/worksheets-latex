// scripts/generate_number_lines_filled.ts
import fs from "node:fs";
import minimist from "minimist";

type Problem = { left: number; right: number };

type Params = {
  count: number;
  min: number;
  max: number;
  allowZeroSingle?: boolean;
  seed?: number;
  maxValue?: number;  // 数字线的最大值（默认10）
  version?: string;
  name?: string;      // worksheet name from config
  showExample?: boolean;  // 是否显示示例（第一个问题带弧线）
};

function rng(seed: number) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
}

function generate(p: Params): Problem[] {
  // 如果没有指定 seed，使用随机 seed（基于时间戳）
  const seed = p.seed !== undefined ? p.seed : Date.now();
  // 确保 seed 是数字类型
  const numericSeed = typeof seed === 'number' ? seed : Number(seed) || Date.now();
  const r = rng(numericSeed);
  
  const out: Problem[] = [];
  while (out.length < p.count) {
    const a = Math.floor(r() * (p.max - p.min + 1)) + p.min;
    const b = Math.floor(r() * (p.max - p.min + 1)) + p.min;
    if (!p.allowZeroSingle && (a === 0 || b === 0)) continue;
    // 确保结果不超过最大数字线范围
    if (a + b > (p.maxValue || 10)) continue;
    out.push({ left: a, right: b });
  }
  return out;
}

function toTex(problems: Problem[], maxValue: number, showExample?: boolean): string {
  // 一行一个算式：左边数字线，右边空白算式
  return problems.map((q, i) => {
    const isExample = showExample && i === 0;
    const macro = isExample
      ? `\\WSNumberLineAddExample{${q.left}}{${q.right}}{${q.left + q.right}}{${maxValue}}`
      : `\\WSNumberLineAddEquation{${q.left}}{${q.right}}{${maxValue}}`;
    // 在算式之间添加虚线分隔（最后一个不加）
    const separator = i < problems.length - 1 ? "\n\n\\vspace{20pt}\n\\dotfill\n\\vspace{20pt}\n\n" : "";
    return macro + separator;
  }).join("");
}

function toAnswersTex(problems: Problem[]): string {
  // 答案页仅显示数字算式，一行一个
  return problems
    .map(q => `\\item {\\Large ${q.left} + ${q.right} = ${q.left + q.right}}`)
    .join("\n");
}

function main() {
  // 处理 pnpm 传递的 -- 分隔符：如果第一个参数是 --，跳过它
  let args = process.argv.slice(2);
  if (args[0] === '--') {
    args = args.slice(1);
  }
  const argv = minimist(args);
  
  const params: Params = {
    count: Number(argv.count ?? 12),
    min: Number(argv.min ?? 1),
    max: Number(argv.max ?? 5),
    allowZeroSingle: Boolean(argv.allowZeroSingle ?? false),
    seed: argv.seed !== undefined && argv.seed !== null ? Number(argv.seed) : undefined,
    maxValue: argv.maxValue !== undefined ? Number(argv.maxValue) : 10,
    version: String(argv.version ?? "v1"),
    name: argv.name ? String(argv.name) : undefined,
    showExample: Boolean(argv.showExample ?? true),  // 默认显示示例
  };

  const problems = generate(params);
  fs.mkdirSync("generated", { recursive: true });
  
  const problemsTex = toTex(problems, params.maxValue || 10, params.showExample);
  
  fs.writeFileSync("generated/problems_number_lines_filled.tex", problemsTex);
  fs.writeFileSync("generated/answers_number_lines_filled.tex", toAnswersTex(problems));

  // 计算实际使用的 seed（如果未指定则使用随机值）
  const actualSeed = params.seed !== undefined ? params.seed : Date.now();
  const meta = {
    topic: "adding-with-number-lines-filled",
    range: `${params.min}-${params.max}`,
    seed: actualSeed,
    maxValue: params.maxValue || 10,
    version: params.version,
    name: params.name // 保存配置中的 name
  };
  fs.writeFileSync("generated/build_meta_number_lines_filled.json", JSON.stringify(meta));
  console.log("Generated: problems_number_lines_filled.tex, answers_number_lines_filled.tex, build_meta_number_lines_filled.json");
}

main();


