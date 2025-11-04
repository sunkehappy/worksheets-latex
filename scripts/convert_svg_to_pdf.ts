// scripts/convert_svg_to_pdf.ts
// Convert SVG icons to PDF format for LaTeX compatibility
import fs from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

const ICONS_DIR = path.join(process.cwd(), "icons");
const SVG_EXT = ".svg";
const PDF_EXT = ".pdf";

// Check if a command exists
function commandExists(command: string): boolean {
  try {
    execSync(`which ${command}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

// Convert SVG to PDF using Inkscape
function convertWithInkscape(svgPath: string, pdfPath: string): void {
  try {
    execSync(`inkscape "${svgPath}" --export-filename="${pdfPath}" --export-type=pdf`, {
      stdio: "inherit"
    });
    console.log(`✓ Converted: ${path.basename(svgPath)} -> ${path.basename(pdfPath)}`);
  } catch (error) {
    console.error(`✗ Failed to convert ${svgPath}:`, error);
    throw error;
  }
}

// Convert SVG to PDF using rsvg-convert (alternative)
function convertWithRsvg(svgPath: string, pdfPath: string): void {
  try {
    execSync(`rsvg-convert -f pdf -o "${pdfPath}" "${svgPath}"`, {
      stdio: "inherit"
    });
    console.log(`✓ Converted: ${path.basename(svgPath)} -> ${path.basename(pdfPath)}`);
  } catch (error) {
    console.error(`✗ Failed to convert ${svgPath}:`, error);
    throw error;
  }
}

function main() {
  console.log("Converting SVG icons to PDF...\n");

  // Check if icons directory exists
  if (!fs.existsSync(ICONS_DIR)) {
    console.error(`Error: Icons directory not found: ${ICONS_DIR}`);
    console.error("Please create the icons directory and add SVG files.");
    process.exit(1);
  }

  // Find all SVG files
  const files = fs.readdirSync(ICONS_DIR);
  const svgFiles = files.filter(f => f.endsWith(SVG_EXT));

  if (svgFiles.length === 0) {
    console.log("No SVG files found in icons directory.");
    console.log("Please add SVG icon files (e.g., Apple.svg, Star.svg, etc.)");
    process.exit(0);
  }

  console.log(`Found ${svgFiles.length} SVG file(s).\n`);

  // Check for conversion tools
  const hasInkscape = commandExists("inkscape");
  const hasRsvg = commandExists("rsvg-convert");

  if (!hasInkscape && !hasRsvg) {
    console.error("Error: No SVG to PDF converter found.");
    console.error("Please install one of the following:");
    console.error("  - Inkscape: brew install inkscape");
    console.error("  - librsvg: brew install librsvg");
    console.error("\nOr manually convert SVG files to PDF and place them in the icons/ directory.");
    process.exit(1);
  }

  // Convert each SVG file
  let successCount = 0;
  let skipCount = 0;

  for (const svgFile of svgFiles) {
    const svgPath = path.join(ICONS_DIR, svgFile);
    const pdfFile = svgFile.replace(SVG_EXT, PDF_EXT);
    const pdfPath = path.join(ICONS_DIR, pdfFile);

    // Skip if PDF already exists and is newer than SVG
    if (fs.existsSync(pdfPath)) {
      const svgStat = fs.statSync(svgPath);
      const pdfStat = fs.statSync(pdfPath);
      if (pdfStat.mtime > svgStat.mtime) {
        console.log(`⊘ Skipped: ${svgFile} (PDF is up to date)`);
        skipCount++;
        continue;
      }
    }

    try {
      if (hasInkscape) {
        convertWithInkscape(svgPath, pdfPath);
      } else if (hasRsvg) {
        convertWithRsvg(svgPath, pdfPath);
      }
      successCount++;
    } catch (error) {
      console.error(`Failed to convert ${svgFile}`);
    }
  }

  console.log(`\nConversion complete: ${successCount} converted, ${skipCount} skipped.`);
}

main();

