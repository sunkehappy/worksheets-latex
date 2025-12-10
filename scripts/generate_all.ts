// scripts/generate_all.ts
// 统一的 PDF 生成脚本，从配置文件读取所有要生成的 PDF 参数
import fs from "node:fs";
import path from "node:path";
import { execSync, spawnSync } from "node:child_process";
import minimist from "minimist";

type TextParams = {
  count: number;
  min: number;
  max: number;
  noCarry?: boolean;
  allowZeroSingle?: boolean;
  seed?: number;
  version?: string;
  name?: string;  // worksheet name from config
};

type PicturesParams = {
  count: number;
  min: number;
  max: number;
  allowZeroSingle?: boolean;
  sameIconOnly?: boolean;
  seed?: number;
  perRow?: number;
  version?: string;
  singleLine?: boolean;
  name?: string;  // worksheet name from config
};

type NumberLinesParams = {
  count: number;
  min: number;
  max: number;
  allowZeroSingle?: boolean;
  seed?: number;
  maxValue?: number;
  version?: string;
  name?: string;  // worksheet name from config
  showExample?: boolean;
};

type WorksheetConfig = {
  type: "text" | "pictures" | "number-lines-filled" | "number-lines-empty";
  name: string;
  outputPath?: string;
  params: TextParams | PicturesParams | NumberLinesParams;
};

type ConfigFile = {
  worksheets: WorksheetConfig[];
};

function buildArgs(params: TextParams | PicturesParams | NumberLinesParams): string[] {
  const args: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      if (typeof value === "boolean") {
        if (value) {
          args.push(`--${key}`);
        }
      } else {
        args.push(`--${key}`, String(value));
      }
    }
  }
  return args;
}

function generateText(params: TextParams, name: string, count: number = 1, outputPath?: string): void {
  console.log(`\n📝 Generating: ${name}${count > 1 ? ` (${count} copies with different content)` : ""}`);
  const baseSeed = params.seed || 2025;
  try {
    // 生成多份 PDF，每份使用不同的 seed（原始 seed + 序号）
    for (let i = 1; i <= count; i++) {
      const suffix = i.toString().padStart(2, '0');
      const newSeed = baseSeed * 100 + i;
      console.log(`  Generating copy ${suffix}/${count.toString().padStart(2, '0')} (seed: ${newSeed})...`);
      
      // 为每份生成新的 problems/answers（使用不同的 seed）
      const newParams = { ...params, seed: newSeed, name: name };
      const args = buildArgs(newParams);
      // 使用 spawnSync 数组形式避免 shell 解析带空格参数的问题
      const result = spawnSync("ts-node", ["scripts/generate_problems.ts", "--", ...args], {
        stdio: "inherit",
      });
      if (result.error || result.status !== 0) {
        throw result.error || new Error(`Process exited with code ${result.status}`);
      }
      
      // 立即编译，传递输出路径
      const buildCmdArgs = outputPath 
        ? `-- --suffix ${suffix} --outputPath "${outputPath}"`
        : `-- --suffix ${suffix}`;
      execSync(`ts-node scripts/build.ts ${buildCmdArgs}`, { stdio: "inherit" });
    }
    console.log(`✅ Completed: ${name} (${count} copy/copies)`);
  } catch (error) {
    console.error(`❌ Failed: ${name}`, error);
  }
}

function generatePictures(params: PicturesParams, name: string, count: number = 1, outputPath?: string): void {
  console.log(`\n🖼️  Generating: ${name}${count > 1 ? ` (${count} copies with different content)` : ""}`);
  const baseSeed = params.seed || 2025;
  try {
    // 生成多份 PDF，每份使用不同的 seed（原始 seed + 序号）
    for (let i = 1; i <= count; i++) {
      const suffix = i.toString().padStart(2, '0');
      const newSeed = baseSeed * 100 + i;
      console.log(`  Generating copy ${suffix}/${count.toString().padStart(2, '0')} (seed: ${newSeed})...`);
      
      // 为每份生成新的 problems/answers（使用不同的 seed）
      const newParams = { ...params, seed: newSeed, name: name };
      const args = buildArgs(newParams);
      // 使用 spawnSync 数组形式避免 shell 解析带空格参数的问题
      const result = spawnSync("ts-node", ["scripts/generate_pictures.ts", "--", ...args], {
        stdio: "inherit",
      });
      if (result.error || result.status !== 0) {
        throw result.error || new Error(`Process exited with code ${result.status}`);
      }
      
      // 立即编译，传递输出路径
      const buildCmdArgs = outputPath 
        ? `-- --suffix ${suffix} --outputPath "${outputPath}"`
        : `-- --suffix ${suffix}`;
      execSync(`ts-node scripts/build_pictures.ts ${buildCmdArgs}`, { stdio: "inherit" });
    }
    console.log(`✅ Completed: ${name} (${count} copy/copies)`);
  } catch (error) {
    console.error(`❌ Failed: ${name}`, error);
  }
}

function generateNumberLinesFilled(params: NumberLinesParams, name: string, count: number = 1, outputPath?: string): void {
  console.log(`\n📊 Generating: ${name}${count > 1 ? ` (${count} copies with different content)` : ""}`);
  const baseSeed = params.seed || 2025;
  try {
    // 生成多份 PDF，每份使用不同的 seed（原始 seed + 序号）
    for (let i = 1; i <= count; i++) {
      const suffix = i.toString().padStart(2, '0');
      const newSeed = baseSeed * 100 + i;
      console.log(`  Generating copy ${suffix}/${count.toString().padStart(2, '0')} (seed: ${newSeed})...`);
      
      // 为每份生成新的 problems/answers（使用不同的 seed）
      const newParams = { ...params, seed: newSeed, name: name };
      const args = buildArgs(newParams);
      // 使用 spawnSync 数组形式避免 shell 解析带空格参数的问题
      const result = spawnSync("ts-node", ["scripts/generate_number_lines_filled.ts", "--", ...args], {
        stdio: "inherit",
      });
      if (result.error || result.status !== 0) {
        throw result.error || new Error(`Process exited with code ${result.status}`);
      }
      
      // 立即编译，传递输出路径
      const buildCmdArgs = outputPath 
        ? `-- --suffix ${suffix} --outputPath "${outputPath}"`
        : `-- --suffix ${suffix}`;
      execSync(`ts-node scripts/build_number_lines_filled.ts ${buildCmdArgs}`, { stdio: "inherit" });
    }
    console.log(`✅ Completed: ${name} (${count} copy/copies)`);
  } catch (error) {
    console.error(`❌ Failed: ${name}`, error);
  }
}

function generateNumberLinesEmpty(params: NumberLinesParams, name: string, count: number = 1, outputPath?: string): void {
  console.log(`\n📊 Generating: ${name}${count > 1 ? ` (${count} copies with different content)` : ""}`);
  const baseSeed = params.seed || 2025;
  try {
    // 生成多份 PDF，每份使用不同的 seed（原始 seed + 序号）
    for (let i = 1; i <= count; i++) {
      const suffix = i.toString().padStart(2, '0');
      const newSeed = baseSeed * 100 + i;
      console.log(`  Generating copy ${suffix}/${count.toString().padStart(2, '0')} (seed: ${newSeed})...`);
      
      // 为每份生成新的 problems/answers（使用不同的 seed）
      const newParams = { ...params, seed: newSeed, name: name };
      const args = buildArgs(newParams);
      // 使用 spawnSync 数组形式避免 shell 解析带空格参数的问题
      const result = spawnSync("ts-node", ["scripts/generate_number_lines_empty.ts", "--", ...args], {
        stdio: "inherit",
      });
      if (result.error || result.status !== 0) {
        throw result.error || new Error(`Process exited with code ${result.status}`);
      }
      
      // 立即编译，传递输出路径
      const buildCmdArgs = outputPath 
        ? `-- --suffix ${suffix} --outputPath "${outputPath}"`
        : `-- --suffix ${suffix}`;
      execSync(`ts-node scripts/build_number_lines_empty.ts ${buildCmdArgs}`, { stdio: "inherit" });
    }
    console.log(`✅ Completed: ${name} (${count} copy/copies)`);
  } catch (error) {
    console.error(`❌ Failed: ${name}`, error);
  }
}

function main() {
  // 处理命令行参数
  let args = process.argv.slice(2);
  if (args[0] === '--') {
    args = args.slice(1);
  }
  const argv = minimist(args);

  const configPath = path.join(process.cwd(), "worksheet-config.json");

  if (!fs.existsSync(configPath)) {
    console.error(`Error: Configuration file not found: ${configPath}`);
    console.error("Please create worksheet-config.json with your worksheet definitions.");
    process.exit(1);
  }

  const config: ConfigFile = JSON.parse(
    fs.readFileSync(configPath, "utf-8")
  );

  // 如果指定了 --list，显示所有可用的配置
  if (argv.list) {
    console.log("Available worksheets:\n");
    config.worksheets.forEach((ws, index) => {
      console.log(`  [${index}] ${ws.name} (${ws.type})`);
    });
    console.log("\nUsage:");
    console.log("  pnpm generate:all                    # Generate all");
    console.log("  pnpm generate:all --name <name>      # Generate by name");
    console.log("  pnpm generate:all --type <type>      # Generate by type (text/pictures/number-lines-filled/number-lines-empty)");
    console.log("  pnpm generate:all --index <n>        # Generate by index");
    console.log("  pnpm generate:all --count <n>        # Generate n copies (same content)");
    console.log("  pnpm generate:all --name <name> --count 3  # Generate 3 copies of matching worksheets");
    return;
  }

  // 过滤要生成的配置
  let worksheetsToGenerate = config.worksheets;

  // 按名称过滤
  if (argv.name) {
    const nameFilter = String(argv.name).toLowerCase();
    worksheetsToGenerate = worksheetsToGenerate.filter((ws) =>
      ws.name.toLowerCase().includes(nameFilter)
    );
    if (worksheetsToGenerate.length === 0) {
      console.error(`No worksheet found with name containing: ${argv.name}`);
      process.exit(1);
    }
  }

  // 按类型过滤
  if (argv.type) {
    const typeFilter = String(argv.type).toLowerCase();
    worksheetsToGenerate = worksheetsToGenerate.filter(
      (ws) => ws.type.toLowerCase() === typeFilter
    );
    if (worksheetsToGenerate.length === 0) {
      console.error(`No worksheet found with type: ${argv.type}`);
      process.exit(1);
    }
  }

  // 按索引过滤
  if (argv.index !== undefined) {
    const index = Number(argv.index);
    if (isNaN(index) || index < 0 || index >= config.worksheets.length) {
      console.error(`Invalid index: ${argv.index}. Use --list to see available worksheets.`);
      process.exit(1);
    }
    worksheetsToGenerate = [config.worksheets[index]];
  }

  // 获取生成份数
  const count = argv.count ? Number(argv.count) : 1;
  if (isNaN(count) || count < 1) {
    console.error(`Invalid count: ${argv.count}. Count must be a positive integer.`);
    process.exit(1);
  }

  console.log(`Found ${worksheetsToGenerate.length} worksheet(s) to generate${count > 1 ? ` (${count} copies each)` : ""}\n`);

  for (const worksheet of worksheetsToGenerate) {
    if (worksheet.type === "text") {
      generateText(worksheet.params as TextParams, worksheet.name, count, worksheet.outputPath);
    } else if (worksheet.type === "pictures") {
      generatePictures(worksheet.params as PicturesParams, worksheet.name, count, worksheet.outputPath);
    } else if (worksheet.type === "number-lines-filled") {
      generateNumberLinesFilled(worksheet.params as NumberLinesParams, worksheet.name, count, worksheet.outputPath);
    } else if (worksheet.type === "number-lines-empty") {
      generateNumberLinesEmpty(worksheet.params as NumberLinesParams, worksheet.name, count, worksheet.outputPath);
    } else {
      console.warn(`⚠️  Unknown worksheet type: ${worksheet.type}`);
    }
  }

  console.log("\n✨ All worksheets generated!");
}

main();

