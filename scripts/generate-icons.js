const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const sourceFile = path.join(__dirname, '../public/icon-512x512.png');
const outputDir = path.join(__dirname, '../public/icons');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
  if (!fs.existsSync(sourceFile)) {
    console.error(`Source file not found: ${sourceFile}`);
    process.exit(1);
  }

  console.log('Generating icons...');
  
  for (const size of sizes) {
    const outputFile = path.join(outputDir, `icon-${size}x${size}.png`);
    await sharp(sourceFile)
      .resize(size, size)
      .toFile(outputFile);
    console.log(`Generated: ${outputFile}`);
  }
  
  console.log('Done generating icons!');
}

generateIcons().catch(console.error);
