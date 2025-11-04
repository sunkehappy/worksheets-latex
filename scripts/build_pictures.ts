import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// Load PDF name from build_meta_pictures.json
function getPdfName(): string {
  try {
    const raw = fs.readFileSync("generated/build_meta_pictures.json", "utf8");
    const meta = JSON.parse(raw);
    const iconType = meta.sameIconOnly ? "same-icon" : "mixed-icon";
    const perRow = meta.perRow ? `perRow${meta.perRow}` : "";
    const suffix = perRow ? `_${iconType}_${perRow}` : `_${iconType}`;
    return `${meta.topic}_${meta.range}_seed${meta.seed}${suffix}_${meta.version}`;
  } catch {
    return "worksheet_pictures";
  }
}

// Main build function
function main() {
  // Step 1: Check if generated files exist
  const problemsPath = path.join("generated", "problems_pictures.tex");
  const answersPath = path.join("generated", "answers_pictures.tex");
  
  if (!fs.existsSync(problemsPath) || !fs.existsSync(answersPath)) {
    console.error("Error: Generated files not found. Please run 'pnpm gen:pictures' first.");
    console.error(`  Missing: ${!fs.existsSync(problemsPath) ? problemsPath : ""}`);
    console.error(`  Missing: ${!fs.existsSync(answersPath) ? answersPath : ""}`);
    process.exit(1);
  }
  
  // Step 2: Ensure dist directory exists
  fs.mkdirSync("dist", { recursive: true });
  
  // Step 3: Run tectonic
  console.log("Compiling LaTeX with Tectonic...");
  const distPath = path.resolve("dist");
  execSync(`tectonic templates/worksheet_pictures.tex --outdir=${distPath}`, { 
    stdio: "inherit"
  });

  // Step 4: Rename output file
  const pdfName = getPdfName();
  const sourcePath = path.join("dist", "worksheet_pictures.pdf");
  const targetPath = path.join("dist", `${pdfName}.pdf`);

  if (fs.existsSync(sourcePath)) {
    fs.renameSync(sourcePath, targetPath);
    console.log(`OK -> ${targetPath}`);
  } else {
    console.error(`Error: ${sourcePath} not found`);
    process.exit(1);
  }
}

main();

