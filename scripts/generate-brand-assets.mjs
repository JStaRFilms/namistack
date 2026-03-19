import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(currentDir, '..');
const brandDir = path.join(rootDir, 'assets', 'brand');
const markPath = path.join(brandDir, 'namistack-mark.svg');
const lockupPath = path.join(brandDir, 'namistack-lockup.svg');

const iconPngPath = path.join(brandDir, 'icon-512.png');
const heroPngPath = path.join(brandDir, 'lockup-1200.png');
const iconIcoPath = path.join(brandDir, 'icon.ico');

await mkdir(brandDir, { recursive: true });

await sharp(markPath).resize(512, 512).png().toFile(iconPngPath);
await sharp(lockupPath).resize(1200, 320).png().toFile(heroPngPath);

const iconBuffer = await pngToIco(iconPngPath);
await writeFile(iconIcoPath, iconBuffer);

console.log('Generated brand assets:', iconPngPath, heroPngPath, iconIcoPath);
