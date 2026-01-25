// Contentful image loader for Next.js Image component
// See: https://www.contentful.com/developers/docs/references/images-api/

export default function contentfulLoader({
  src,
  width,
  quality,
}: {
  src: string
  width: number
  quality?: number
}) {
  const url = new URL(src)
  url.searchParams.set('w', width.toString())
  url.searchParams.set('q', (quality || 75).toString())
  return url.href
}
