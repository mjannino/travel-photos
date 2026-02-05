import type { Metadata } from 'next'
import Link from 'next/link'
import { getPhotoManifest } from '@/lib/images'
import { GalleryGrid } from '@/components/gallery-grid'

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'Browse travel photos from Japan and beyond.',
}

export default async function GalleryPage() {
  const photos = await getPhotoManifest()

  if (photos.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4">
        <h1 className="mb-4 text-3xl font-bold">Gallery</h1>
        <p className="text-muted-foreground">No photos available yet.</p>
        <Link
          href="/"
          className="mt-6 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Back home
        </Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; Home
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Gallery
          </h1>
          <p className="mt-2 text-muted-foreground">
            {photos.length} photos from Japan, 2024
          </p>
        </div>

        <GalleryGrid
          photos={photos}
          imageBaseUrl={process.env.R2_PUBLIC_URL || ''}
        />
      </div>
    </main>
  )
}
