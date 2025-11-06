# K12 Worksheets (LaTeX, English, Text-Only Addition)

- **English only**, **text-only** (no graphics), printable-friendly.

- Local pre-generation via Node/TypeScript → LaTeX (`tectonic`) → PDF.

- Outputs to `dist/` with parameter-based filename.

## Prerequisites

- Install [Tectonic](https://tectonic-typesetting.github.io/):  

  macOS: `brew install tectonic`

- Node.js 18+

## Install

```bash
pnpm i
```

## Generate & Build

Example (24 problems, 0–10, no-carry, seed=2025):

```bash
# Step 1: Generate problems
pnpm gen -- --count 24 --min 0 --max 10 --noCarry --seed 2025

# Step 2: Build PDF
pnpm build

# Or one-liner:
pnpm gen -- --count 24 --min 0 --max 10 --noCarry --seed 2025 && pnpm build

# Or use the combined command (with default args):
pnpm build:all
```

**Output:**

```
dist/addition_no-carry_0-10_seed2025_v1.pdf
```

## CLI Options

- `--count <n>`: number of problems (default 24)
- `--min <n> --max <n>`: operand range (default 0–10)
- `--noCarry`: forbid carry in ones place (optional)
- `--allowZeroSingle`: allow an operand to be zero (optional)
- `--seed <n>`: deterministic random seed (default 2025)
- `--version <str>`: filename suffix (default v1)

## Project Layout

- `templates/worksheet.tex`: LaTeX template (two columns + answer key page)
- `scripts/generate_problems.ts`: builds `generated/problems.tex` and `generated/answers.tex`
- `scripts/build_name.ts`: derives final PDF filename from `generated/build_meta.json`
- `dist/`: compiled PDFs
- `generated/`: auto-generated TeX chunks (ignored by git)

## Notes

- Keep PDFs small & printer-friendly (black & white).
- Later you can add more templates (subtraction, mixed, etc.).
- For distribution: upload `dist/*.pdf` to R2/OSS with long cache.

---

### 使用说明（你这边本地）
根据worksheet-config.json来生成pdf，index代表第几个配置，count代表生成的份数。
比如生成图片加法10以内
```
pnpm generate:all --index 2 --count 5
```
