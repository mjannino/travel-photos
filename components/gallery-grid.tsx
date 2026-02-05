'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { PhotoMetadata } from '@/lib/images'
import { Lightbox } from '@/components/lightbox'

interface GalleryGridProps {
  photos: PhotoMetadata[]
  imageBaseUrl: string
}

export function GalleryGrid({ photos, imageBaseUrl }: GalleryGridProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const selectedPhoto = selectedIndex !== null ? photos[selectedIndex] : null

  const handlePrev = () => {
    setSelectedIndex((i) => (i !== null ? (i - 1 + photos.length) % photos.length : null))
  }

  const handleNext = () => {
    setSelectedIndex((i) => (i !== null ? (i + 1) % photos.length : null))
  }

  return (
    <>
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
        {photos.map((photo, index) => (
          <div key={photo.src} className="mb-4 break-inside-avoid">
            <button
              type="button"
              className="w-full cursor-zoom-in"
              onClick={() => setSelectedIndex(index)}
            >
              <Image
                src={`${imageBaseUrl}/${photo.src}`}
                alt={photo.alt || photo.src}
                width={photo.width}
                height={photo.height}
                placeholder={photo.blurDataURL ? 'blur' : 'empty'}
                blurDataURL={photo.blurDataURL}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                className="w-full rounded-sm"
              />
            </button>
          </div>
        ))}
      </div>
      <Lightbox
        photo={selectedPhoto}
        imageBaseUrl={imageBaseUrl}
        onClose={() => setSelectedIndex(null)}
        onPrev={handlePrev}
        onNext={handleNext}
      />
    </>
  )
}
