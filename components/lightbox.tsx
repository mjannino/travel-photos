'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import Image from 'next/image'
import type { PhotoMetadata } from '@/lib/images'

interface LightboxProps {
  photo: PhotoMetadata | null
  imageBaseUrl: string
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

export function Lightbox({ photo, imageBaseUrl, onClose, onPrev, onNext }: LightboxProps) {
  if (!photo) return null

  return (
    <DialogPrimitive.Root
      open={!!photo}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
          aria-label={photo.alt || photo.src}
        >
          <DialogPrimitive.Title className="sr-only">
            {photo.alt || photo.src}
          </DialogPrimitive.Title>
          <DialogPrimitive.Close className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70">
            <X className="h-6 w-6" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
          <button
            type="button"
            onClick={onPrev}
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={onNext}
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
            aria-label="Next photo"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <Image
            src={`${imageBaseUrl}/${photo.src}`}
            alt={photo.alt || photo.src}
            width={photo.width}
            height={photo.height}
            className="max-h-[90vh] max-w-[90vw] h-auto w-auto object-contain"
            sizes="90vw"
            priority
            placeholder={photo.blurDataURL ? 'blur' : 'empty'}
            blurDataURL={photo.blurDataURL}
          />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
