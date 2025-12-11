import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import minimist from "minimist";

// 将名称转换为文件名（替换空格和特殊字符）
function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')  // 空格替换为连字符
    .replace(/[^a-z0-9-]/g, '')  // 移除特殊字符
    .replace(/-+/g, '-')  // 多个连字符合并为一个
    .replace(/^-|-$/g, '');  // 移除首尾连字符
}

// Load PDF name from build_meta.json
function getPdfName(suffix?: string, outputPath?: string): string {
  try {
    const raw = fs.readFileSync("generated/build_meta.json", "utf8");
    const meta = JSON.parse(raw);
    
    // 优先使用配置中的 name，如果没有则使用旧的命名方式
    let baseName: string;
    if (meta.name) {
      baseName = sanitizeFileName(meta.name);
    } else {
      // 回退到旧的命名方式
      baseName = `${meta.topic}_${meta.range}`;
    }
    
    const nameWithSuffix = suffix ? `${baseName}_${suffix}` : baseName;
    
    // 如果有输出路径，返回完整路径
    if (outputPath) {
      return path.join(outputPath, nameWithSuffix);
    }
    return nameWithSuffix;
  } catch {
    const baseName = suffix ? `worksheet_${suffix}` : "worksheet";
    return outputPath ? path.join(outputPath, baseName) : baseName;
  }
}

// Main build function
function main() {
  // 处理命令行参数
  let args = process.argv.slice(2);
  if (args[0] === '--') {
    args = args.slice(1);
  }
  const argv = minimist(args);
  const suffix = argv.suffix ? String(argv.suffix).padStart(2, '0') : undefined;
  const outputPath = argv.outputPath ? String(argv.outputPath) : undefined;

  // Step 1: Check if generated files exist
  const problemsPath = path.join("generated", "problems.tex");
  const answersPath = path.join("generated", "answers.tex");
  
  if (!fs.existsSync(problemsPath) || !fs.existsSync(answersPath)) {
    console.error("Error: Generated files not found. Please run 'pnpm generate:all' first.");
    console.error(`  Missing: ${!fs.existsSync(problemsPath) ? problemsPath : ""}`);
    console.error(`  Missing: ${!fs.existsSync(answersPath) ? answersPath : ""}`);
    process.exit(1);
  }
  
  // Step 2: 先计算目标文件名
  const pdfName = getPdfName(suffix, outputPath);
  const sourcePath = path.join("dist", "worksheet_add_2digit_1digit.pdf");
  const targetPath = path.join("dist", `${pdfName}.pdf`);

  // 确保输出目录存在
  if (outputPath) {
    const outputDir = path.join("dist", outputPath);
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Step 3: Run tectonic
  // Tectonic uses the template's directory as working directory, so ../generated/ should work
  console.log(`Compiling LaTeX with Tectonic... (output: ${targetPath})`);
  // Use absolute path for output directory to ensure it's created correctly
  const distPath = path.resolve("dist");
  execSync(`tectonic templates/worksheet_add_2digit_1digit.tex --outdir=${distPath}`, { 
    stdio: "inherit"
  });

  // Step 4: Rename output file
  if (fs.existsSync(sourcePath)) {
    fs.renameSync(sourcePath, targetPath);
    console.log(`✅ Generated: ${targetPath}`);
  } else {
    console.error(`Error: ${sourcePath} not found`);
    process.exit(1);
  }
}

main();
