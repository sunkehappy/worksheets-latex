// scripts/generate_previews.ts
// 遍历 dist 目录下所有 PDF，生成预览 PNG 并压缩
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

function findPdfFiles(dir: string): string[] {
  const pdfFiles: string[] = [];
  
  function traverse(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        traverse(fullPath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.pdf')) {
        pdfFiles.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return pdfFiles;
}

function generatePreview(pdfPath: string): void {
  // 生成预览 PNG 的路径（去掉 .pdf，加上 .preview）
  const previewPath = pdfPath.replace(/\.pdf$/i, '.preview');
  const previewPngPath = `${previewPath}.png`;
  
  // 检查是否已存在预览图
  if (fs.existsSync(previewPngPath)) {
    console.log(`⏭️  Skip (already exists): ${path.basename(pdfPath)}`);
    return;
  }
  
  try {
    console.log(`📄 Generating preview: ${path.basename(pdfPath)}`);
    // pdftocairo -singlefile -png -r 200 -f 1 -l 1 <pdf> <output_base>
    execSync(
      `pdftocairo -singlefile -png -r 200 -f 1 -l 1 "${pdfPath}" "${previewPath}"`,
      { stdio: "inherit" }
    );
    console.log(`✅ Generated: ${path.basename(previewPngPath)}`);
  } catch (error) {
    console.error(`❌ Failed to generate preview for ${pdfPath}:`, error);
  }
}

function compressPng(pngPath: string): void {
  try {
    console.log(`🗜️  Compressing: ${path.basename(pngPath)}`);
    // pngquant --quality=65-85 --ext .png --force <path>
    execSync(
      `pngquant --quality=65-85 --ext .png --force "${pngPath}"`,
      { stdio: "inherit" }
    );
    console.log(`✅ Compressed: ${path.basename(pngPath)}`);
  } catch (error) {
    console.error(`❌ Failed to compress ${pngPath}:`, error);
  }
}

function main() {
  const distDir = path.resolve("dist");
  
  if (!fs.existsSync(distDir)) {
    console.error(`Error: dist directory not found: ${distDir}`);
    process.exit(1);
  }
  
  console.log(`🔍 Scanning for PDF files in: ${distDir}\n`);
  const pdfFiles = findPdfFiles(distDir);
  
  if (pdfFiles.length === 0) {
    console.log("No PDF files found in dist directory.");
    return;
  }
  
  console.log(`Found ${pdfFiles.length} PDF file(s)\n`);
  
  // 第一步：生成所有缺失的预览图
  const newPreviews: string[] = [];
  
  for (const pdfPath of pdfFiles) {
    const previewPath = pdfPath.replace(/\.pdf$/i, '.preview.png');
    const existed = fs.existsSync(previewPath);
    
    if (!existed) {
      generatePreview(pdfPath);
      // 只记录新生成的预览图，用于后续压缩
      if (fs.existsSync(previewPath)) {
        newPreviews.push(previewPath);
      }
    } else {
      console.log(`⏭️  Skip (already exists): ${path.basename(pdfPath)}`);
    }
  }
  
  // 第二步：只压缩新生成的预览图
  if (newPreviews.length > 0) {
    console.log(`\n🗜️  Compressing ${newPreviews.length} new preview image(s)...\n`);
    for (const pngPath of newPreviews) {
      compressPng(pngPath);
    }
    console.log("\n✨ All previews generated and compressed!");
  } else {
    console.log("\n✨ All previews are up to date!");
  }
}

main();


