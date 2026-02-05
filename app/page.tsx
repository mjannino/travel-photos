import Link from 'next/link'
import { Camera, MapPin, Heart } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Camera className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Travel Photos
        </h1>
        <p className="mb-8 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Capturing moments from around the world. A photography portfolio
          showcasing beautiful destinations and unforgettable adventures.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 rounded-md bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            View Gallery
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            About Me
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border bg-muted/50 px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-2xl font-semibold">
            Explore the Collection
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            <FeatureCard
              icon={<Camera className="h-6 w-6" />}
              title="High Quality"
              description="Every photo captured with attention to detail and professional equipment."
            />
            <FeatureCard
              icon={<MapPin className="h-6 w-6" />}
              title="Global Destinations"
              description="From local hidden gems to iconic landmarks across continents."
            />
            <FeatureCard
              icon={<Heart className="h-6 w-6" />}
              title="Authentic Moments"
              description="Real stories and genuine experiences from every journey."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-8">
        <div className="mx-auto max-w-4xl text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Travel Photos. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-background text-muted-foreground">
        {icon}
      </div>
      <h3 className="mb-2 font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
