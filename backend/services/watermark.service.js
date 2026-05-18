const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

exports.generateWatermarkedPreview = async (inputPath, outputFileName, watermarkText = 'SECUREDELIVER') => {
  const tmpDir = path.join(__dirname, '../tmp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  const outputPath = path.join(tmpDir, `watermarked-${outputFileName}`);
  
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  
  let width = metadata.width;
  let height = metadata.height;
  const ratio = Math.min(1000 / width, 1000 / height);
  if (ratio < 1) {
    width = Math.floor(width * ratio);
    height = Math.floor(height * ratio);
  }

  // Define tile size relative to image width
  const tileSize = Math.floor(width / 5);
  const fontSize = Math.floor(tileSize / 8);

  const watermarkSvg = `
    <svg width="${width}" height="${height}">
      <defs>
        <pattern id="watermark" width="${tileSize}" height="${tileSize}" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
          <text 
            x="${tileSize/2}" 
            y="${tileSize/2}" 
            font-size="${fontSize}" 
            fill="rgba(255,255,255,0.15)" 
            font-family="Arial, sans-serif"
            font-weight="bold"
            text-anchor="middle"
          >
            ${watermarkText}
          </text>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#watermark)" />
    </svg>`;
  
  await image
    .resize(width, height)
    .composite([
      {
        input: Buffer.from(watermarkSvg),
        gravity: 'center'
      }
    ])
    .toFile(outputPath);

  return outputPath;
};
