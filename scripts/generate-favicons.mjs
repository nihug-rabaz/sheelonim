import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import toIco from "to-ico";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "public/branding/nihug.png");
const appDir = join(root, "src/app");
const publicDir = join(root, "public");

mkdirSync(appDir, { recursive: true });

const input = readFileSync(source);

async function png(size) {
  return sharp(input)
    .resize(size, size, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toBuffer();
}

const png16 = await png(16);
const png32 = await png(32);
const png48 = await png(48);
const png180 = await png(180);
const png512 = await png(512);
const ico = await toIco([png16, png32, png48]);

writeFileSync(join(appDir, "favicon.ico"), ico);
writeFileSync(join(appDir, "icon.png"), png32);
writeFileSync(join(appDir, "apple-icon.png"), png180);
writeFileSync(join(publicDir, "favicon.ico"), ico);
writeFileSync(join(publicDir, "favicon-16x16.png"), png16);
writeFileSync(join(publicDir, "favicon-32x32.png"), png32);
writeFileSync(join(publicDir, "apple-touch-icon.png"), png180);
writeFileSync(join(publicDir, "icon-512.png"), png512);

console.log("Favicons generated.");
