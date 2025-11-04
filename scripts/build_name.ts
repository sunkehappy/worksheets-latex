import minimist from "minimist";
import fs from "node:fs";

type BuildMeta = {
  topic: string;        // "addition"
  range: string;        // "0-10"
  seed: number;
  noCarry: boolean;
  version: string;      // "v1"
};

function loadMeta(): BuildMeta | null {
  try {
    const raw = fs.readFileSync("generated/build_meta.json", "utf8");
    return JSON.parse(raw) as BuildMeta;
  } catch {
    return null;
  }
}

const meta = loadMeta();

if (!meta) {
  console.log("worksheet");
  process.exit(0);
}

const rule = meta.noCarry ? "no-carry" : "carry";
const name = `${meta.topic}_${rule}_${meta.range}_seed${meta.seed}_${meta.version}`;

console.log(name);

