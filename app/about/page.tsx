import type { Metadata } from 'next'
import Link from 'next/link'
import { Camera } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About',
  description: 'About the photographer behind Travel Photos.',
}

export default function AboutPage() {
  return (
    <main className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-10">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; Home
          </Link>
        </div>

        <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Camera className="h-8 w-8 text-muted-foreground" />
        </div>

        <h1 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl">
          About
        </h1>

        <div className="space-y-4 text-muted-foreground">
          <p>
            I&apos;m a photographer who loves capturing the world through a
            lens. This site showcases photos from my travels, shot primarily
            with a Ricoh GR III.
          </p>
          <p>
            The images here are from trips across Japan and other destinations.
            I&apos;m drawn to street scenes, architecture, and the quiet
            moments between the landmarks.
          </p>
        </div>

        <div className="mt-10">
          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 rounded-md bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            View Gallery
          </Link>
        </div>
      </div>
    </main>
  )
}
