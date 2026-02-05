import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'

interface ManifestEntry {
  src: string
  alt: string
  width: number
  height: number
  blurDataURL: string
}

const SOURCE_DIR = path.resolve(__dirname, '../japan-2024')
const OUTPUT_FILE = path.resolve(__dirname, '../manifest.json')

async function generateBlurDataURL(filePath: string): Promise<string> {
  const buffer = await sharp(filePath)
    .resize(10, 10, { fit: 'inside' })
    .toFormat('png')
    .toBuffer()

  return `data:image/png;base64,${buffer.toString('base64')}`
}

async function processImage(filePath: string): Promise<ManifestEntry> {
  const filename = path.basename(filePath)
  const metadata = await sharp(filePath).metadata()

  if (!metadata.width || !metadata.height) {
    throw new Error(`Could not read dimensions for ${filename}`)
  }

  const blurDataURL = await generateBlurDataURL(filePath)

  return {
    src: filename,
    alt: '',
    width: metadata.width,
    height: metadata.height,
    blurDataURL,
  }
}

async function main() {
  console.log(`Reading images from ${SOURCE_DIR}...`)

  const files = await fs.readdir(SOURCE_DIR)
  const imageFiles = files
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .sort()

  console.log(`Found ${imageFiles.length} images`)

  const manifest: ManifestEntry[] = []

  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i]
    const filePath = path.join(SOURCE_DIR, file)

    try {
      const entry = await processImage(filePath)
      manifest.push(entry)
      process.stdout.write(`\r  Processed ${i + 1}/${imageFiles.length}: ${file}`)
    } catch (err) {
      console.error(`\n  Failed to process ${file}:`, err)
    }
  }

  console.log('\n')

  await fs.writeFile(OUTPUT_FILE, JSON.stringify(manifest, null, 2))
  console.log(`Manifest written to ${OUTPUT_FILE} (${manifest.length} entries)`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
