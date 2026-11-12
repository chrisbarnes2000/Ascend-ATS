import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function run() {
  const sourcePath = path.resolve(process.cwd(), 'src/assets/images/ascend_extension_icon_1794450361985.jpg');
  const extDir = path.resolve(process.cwd(), 'extension');

  if (!fs.existsSync(sourcePath)) {
    console.error('Source icon image not found at:', sourcePath);
    process.exit(1);
  }

  if (!fs.existsSync(extDir)) {
    fs.mkdirSync(extDir, { recursive: true });
  }

  const sizes = [16, 32, 48, 128];
  for (const size of sizes) {
    const outName = size === 32 ? 'icon32.png' : `icon${size}.png`;
    const outPath = path.join(extDir, outName);
    await sharp(sourcePath)
      .resize(size, size, { fit: 'cover' })
      .png()
      .toFile(outPath);
    console.log(`Generated ${outName} (${size}x${size})`);
  }

  console.log('All extension PNG icons generated successfully!');
}

run().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
