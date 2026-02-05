import fs from 'fs/promises'
import path from 'path'

export interface PhotoMetadata {
  src: string
  alt: string
  width: number
  height: number
  blurDataURL?: string
}

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || ''

/**
 * Generate the full R2 URL for an image
 */
export function getImageUrl(imagePath: string): string {
  return `${R2_PUBLIC_URL}/${imagePath}`
}

/**
 * Fetch the photo manifest. Tries R2 first, falls back to local manifest.json.
 */
export async function getPhotoManifest(): Promise<PhotoMetadata[]> {
  // Try fetching from R2
  if (R2_PUBLIC_URL) {
    try {
      const response = await fetch(`${R2_PUBLIC_URL}/manifest.json`, {
        next: { revalidate: 3600 },
      })

      if (response.ok) {
        return response.json()
      }
    } catch {
      // Fall through to local file
    }
  }

  // Fall back to local manifest.json (for dev or if R2 manifest not uploaded yet)
  try {
    const localPath = path.resolve(process.cwd(), 'manifest.json')
    const data = await fs.readFile(localPath, 'utf-8')
    return JSON.parse(data)
  } catch {
    console.warn('No manifest found (neither R2 nor local)')
    return []
  }
}
