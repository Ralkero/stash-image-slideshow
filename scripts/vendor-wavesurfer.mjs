import { copyFile, mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const packageRoot = join(root, "node_modules", "wavesurfer.js");
const outputRoot = join(root, "vendor");
const files = [
  ["dist/wavesurfer.min.js", "wavesurfer.min.js"],
  ["dist/plugins/timeline.min.js", "timeline.min.js"],
  ["dist/plugins/hover.min.js", "hover.min.js"],
  ["LICENSE", "LICENSE"]
];

const packageMetadata = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8"));
if (packageMetadata.version !== "7.12.11") {
  throw new Error(`Expected WaveSurfer.js 7.12.11, found ${packageMetadata.version || "unknown"}`);
}

await mkdir(outputRoot, { recursive: true });
for (const [source, destination] of files) {
  await copyFile(join(packageRoot, source), join(outputRoot, destination));
}

console.log(`Vendored WaveSurfer.js ${packageMetadata.version} with Timeline and Hover plugins.`);
