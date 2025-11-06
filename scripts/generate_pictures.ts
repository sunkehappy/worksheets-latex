// scripts/generate_pictures.ts
import fs from "node:fs";
import minimist from "minimist";

type IconName = "Apple" | "Star" | "Triangle" | "Circle" | "Square" | "Heart" | "Diamond" | "Balloon" | "Sun";
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
  singleLine?: boolean;     // 是否使用一行一个算式的格式（左边图形，右边空白算式）
  name?: string;            // worksheet name from config
};

function rng(seed: number) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
}

const ICONS: IconName[] = ["Apple", "Star", "Triangle", "Circle", "Square", "Heart", "Diamond", "Balloon", "Sun"];

// 打乱数组（使用Fisher-Yates算法，基于随机数生成器）
function shuffleArray<T>(array: T[], r: () => number): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generate(p: Params): Problem[] {
  // 如果没有指定 seed，使用随机 seed（基于时间戳）
  const seed = p.seed !== undefined ? p.seed : Date.now();
  // 确保 seed 是数字类型
  const numericSeed = typeof seed === 'number' ? seed : Number(seed) || Date.now();
  const r = rng(numericSeed);
  
  // 打乱图标列表，确保可重复性
  const shuffledIcons = shuffleArray(ICONS, r);
  let iconIndex = 0;
  
  // 获取下一个图标（按顺序循环）
  const getNextIcon = (): IconName => {
    const icon = shuffledIcons[iconIndex % shuffledIcons.length];
    iconIndex++;
    return icon;
  };
  
  const out: Problem[] = [];
  while (out.length < p.count) {
    const a = Math.floor(r() * (p.max - p.min + 1)) + p.min;
    const b = Math.floor(r() * (p.max - p.min + 1)) + p.min;
    if (!p.allowZeroSingle && (a === 0 || b === 0)) continue;
    let L: IconName = getNextIcon();
    let R: IconName = p.sameIconOnly ? L : getNextIcon();
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

function toSingleLineTex(problems: Problem[], perRow?: number): string {
  // 一行一个算式：左边图形，中间加号，右边空白算式
  return problems.map((q, i) => {
    const macro = perRow && perRow > 0
      ? `\\WSPictureAddEquation{${q.iconLeft}}{${q.left}}{${q.iconRight}}{${q.right}}{${perRow}}`
      : `\\WSPictureAddEquation{${q.iconLeft}}{${q.left}}{${q.iconRight}}{${q.right}}{5}`;
    // 在算式之间添加虚线分隔（最后一个不加）
    // 确保虚线在表格后面，使用空行分隔，增加上下间距让行高更大
    const separator = i < problems.length - 1 ? "\n\n\\vspace{20pt}\n\\dotfill\n\\vspace{20pt}\n\n" : "";
    return macro + separator;
  }).join("");
}

function toAnswersTex(problems: Problem[]): string {
  // 答案页仅显示数字算式，一行一个，不包含图形
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
    sameIconOnly: Boolean(argv.sameIconOnly ?? true),
    seed: argv.seed !== undefined && argv.seed !== null ? Number(argv.seed) : undefined,
    perRow: argv.perRow !== undefined ? Number(argv.perRow) : 5,
    version: String(argv.version ?? "v1"),
    singleLine: Boolean(argv.singleLine ?? true),  // 默认使用一行一个算式的格式
    name: argv.name ? String(argv.name) : undefined,  // 从命令行参数读取 name（由 generate_all.ts 传递）
  };

  const problems = generate(params);
  fs.mkdirSync("generated", { recursive: true });
  
  // 根据格式选择生成函数
  const problemsTex = params.singleLine
    ? toSingleLineTex(problems, params.perRow)
    : toTwoColumnTex(problems, params.perRow);
  
  fs.writeFileSync("generated/problems_pictures.tex", problemsTex);
  fs.writeFileSync("generated/answers_pictures.tex", toAnswersTex(problems));

  // 计算实际使用的 seed（如果未指定则使用随机值）
  const actualSeed = params.seed !== undefined ? params.seed : Date.now();
  const meta = {
    topic: "adding-with-pictures",
    range: `${params.min}-${params.max}`,
    seed: actualSeed,
    perRow: params.perRow,
    sameIconOnly: params.sameIconOnly,
    version: params.version,
    name: params.name // 保存配置中的 name
  };
  fs.writeFileSync("generated/build_meta_pictures.json", JSON.stringify(meta));
  console.log("Generated: problems_pictures.tex, answers_pictures.tex, build_meta_pictures.json");
}

main();
