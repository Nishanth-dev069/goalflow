import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PWA_ICON_SIZES = [192, 512];
const SVG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" rx="128" fill="#111111" />
  <rect width="512" height="512" rx="128" fill="#4F46E5" fill-opacity="0.2" />
  <circle cx="256" cy="256" r="140" stroke="#4F46E5" stroke-width="40" stroke-linecap="round" />
  <circle cx="256" cy="256" r="40" fill="#10B981" />
  <path d="M256 116 L256 36" stroke="#4F46E5" stroke-width="40" stroke-linecap="round" />
  <path d="M355 157 L411 101" stroke="#4F46E5" stroke-width="40" stroke-linecap="round" />
  <path d="M396 256 L476 256" stroke="#4F46E5" stroke-width="40" stroke-linecap="round" />
  <path d="M355 355 L411 411" stroke="#4F46E5" stroke-width="40" stroke-linecap="round" />
  <path d="M256 396 L256 476" stroke="#4F46E5" stroke-width="40" stroke-linecap="round" />
  <path d="M157 355 L101 411" stroke="#4F46E5" stroke-width="40" stroke-linecap="round" />
  <path d="M116 256 L36 256" stroke="#4F46E5" stroke-width="40" stroke-linecap="round" />
  <path d="M157 157 L101 101" stroke="#4F46E5" stroke-width="40" stroke-linecap="round" />
</svg>`;

async function generateIcons() {
  const publicDir = path.join(__dirname, 'public');
  
  // Ensure public directory exists
  try {
    await fs.mkdir(publicDir, { recursive: true });
  } catch (err) {
    // Ignore error if directory already exists
  }

  const svgBuffer = Buffer.from(SVG_ICON);

  console.log('Generating PWA icons...');

  for (const size of PWA_ICON_SIZES) {
    const filename = `icon-${size}x${size}.png`;
    const filepath = path.join(publicDir, filename);

    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(filepath);

    console.log(`✓ Created ${filename}`);
  }
}

generateIcons().catch(console.error);
