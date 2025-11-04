import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// Load PDF name from build_meta.json
function getPdfName(): string {
  try {
    const raw = fs.readFileSync("generated/build_meta.json", "utf8");
    const meta = JSON.parse(raw);
    const rule = meta.noCarry ? "no-carry" : "carry";
    return `${meta.topic}_${rule}_${meta.range}_seed${meta.seed}_${meta.version}`;
  } catch {
    return "worksheet";
  }
}

// Main build function
function main() {
  // Step 1: Check if generated files exist
  const problemsPath = path.join("generated", "problems.tex");
  const answersPath = path.join("generated", "answers.tex");
  
  if (!fs.existsSync(problemsPath) || !fs.existsSync(answersPath)) {
    console.error("Error: Generated files not found. Please run 'pnpm gen' first.");
    console.error(`  Missing: ${!fs.existsSync(problemsPath) ? problemsPath : ""}`);
    console.error(`  Missing: ${!fs.existsSync(answersPath) ? answersPath : ""}`);
    process.exit(1);
  }
  
  // Step 2: Ensure dist directory exists
  fs.mkdirSync("dist", { recursive: true });
  
  // Step 3: Run tectonic
  // Tectonic uses the template's directory as working directory, so ../generated/ should work
  console.log("Compiling LaTeX with Tectonic...");
  // Use absolute path for output directory to ensure it's created correctly
  const distPath = path.resolve("dist");
  execSync(`tectonic templates/worksheet.tex --outdir=${distPath}`, { 
    stdio: "inherit"
  });

  // Step 4: Rename output file
  const pdfName = getPdfName();
  const sourcePath = path.join("dist", "worksheet.pdf");
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

