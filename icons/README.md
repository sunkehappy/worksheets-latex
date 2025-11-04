# Icons Directory

This directory contains SVG icon files used in the picture-based worksheets.

## Quick Start

1. **Add SVG files** to this directory (e.g., `Apple.svg`, `Star.svg`, etc.)
2. **Convert to PDF**: Run `pnpm convert:icons` to convert SVG files to PDF
3. **Generate worksheets**: Use `pnpm gen:pictures` and `pnpm build:pictures` as usual

## Icon Files

Each icon should be named after the icon type (e.g., `Apple.svg`, `Star.svg`, `Circle.svg`).

The supported icon types are:
- `Apple.svg`
- `Star.svg`
- `Triangle.svg`
- `Circle.svg`
- `Square.svg`
- `Heart.svg`
- `Diamond.svg`
- `Flower.svg`
- `Balloon.svg`
- `Sun.svg`

## Requirements

1. **Uniform Size**: All SVG icons should have the same viewBox dimensions (recommended: `viewBox="0 0 100 100"` or `viewBox="0 0 1 1"`) to ensure consistent sizing.

2. **Black & White**: Icons should be designed for black and white printing (no colors, just strokes/fills).

3. **Centered**: Icons should be centered within their viewBox.

## Converting SVG to PDF

The LaTeX template requires PDF files for compatibility with Tectonic. You can convert SVG files automatically:

```bash
pnpm convert:icons
```

This script requires one of the following tools:
- **Inkscape** (recommended): `brew install inkscape`
- **librsvg**: `brew install librsvg`

The script will:
- Convert all `.svg` files in this directory to `.pdf`
- Skip files that are already up to date
- Place PDF files alongside SVG files

## Manual Conversion

If you prefer to convert manually or the script doesn't work:

1. **Using Inkscape** (command line):
   ```bash
   inkscape Apple.svg --export-filename=Apple.pdf --export-type=pdf
   ```

2. **Using Inkscape** (GUI):
   - Open SVG file
   - File → Save As → PDF

3. **Using online tools**: Upload SVG and download PDF

## Creating Icons

You can create SVG icons using:
- Inkscape (free, open-source)
- Adobe Illustrator
- Figma
- Online SVG editors (e.g., SVG-Edit, Boxy SVG)

Make sure all icons have the same dimensions and are centered for consistent display.

## Notes

- PDF files are automatically generated and should not be committed to git (they're in `.gitignore`)
- SVG files should be committed to git
- If a PDF file exists, it will be used instead of SVG (even if SVG is newer)

