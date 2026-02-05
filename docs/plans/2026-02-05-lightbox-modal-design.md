# Lightbox Modal for Gallery Photos

**Date:** 2026-02-05
**Status:** Proposed
**Author:** Product

---

## Problem

The gallery displays 182 photos in a responsive masonry layout, but users cannot click a photo to see it larger. The images in the grid are served at column-width resolution (roughly 300-700px depending on viewport). There is no way to inspect a photo at a size that fills the screen.

## Acceptance Criteria

1. A user can click any photo in the gallery grid to open a lightbox modal.
2. The lightbox displays the photo scaled to fit within the browser viewport (not cropped, not scrollable).
3. The lightbox has a visible X button to close.
4. Clicking the darkened area outside the photo closes the lightbox.
5. Pressing Escape closes the lightbox (accessibility baseline).
6. The lightbox photo shows a blur placeholder while the larger image loads.

## Non-Goals

- Per-photo shareable URLs (no routing changes).
- Swipe/arrow navigation between photos within the lightbox.
- Photo metadata display (title, EXIF, location) in the lightbox.
- Download button.
- Zoom-beyond-viewport interactions.

These may be added later but are explicitly out of scope for this iteration.

---

## Approach Decision

Two approaches were evaluated:

| | Client-side Dialog (A) | Intercepting Route Modal (B) |
|---|---|---|
| Description | Manage selected-photo state in a client component. Render a Radix Dialog when a photo is selected. URL does not change. | Use Next.js intercepting routes + parallel route slots. Each photo gets a URL segment. Modal renders on soft navigation, full page on hard navigation. |
| Pros | Simple. No routing changes. Fast open/close. Minimal refactor. | Shareable per-photo URLs. Browser back button closes modal. SEO benefit. |
| Cons | No shareable per-photo URL. No browser back-button close. | Significant routing scaffolding. Photos need stable IDs. More files, more complexity. Parallel route edge cases in Next.js 16. |

**Decision: Approach A (Client-side Dialog).**

Rationale: This is a personal photography portfolio. Per-photo URLs add complexity without meaningful user value at this stage. If shareable URLs become needed later, the lightbox component itself can be reused inside an intercepting route modal with minimal rework.

---

## Architecture

### Current State

```
app/gallery/page.tsx (Server Component)
  ├── calls getPhotoManifest() — returns PhotoMetadata[]
  ├── renders masonry grid inline
  └── renders each <Image> directly
```

### Target State

```
app/gallery/page.tsx (Server Component)
  ├── calls getPhotoManifest() — returns PhotoMetadata[]
  └── renders <GalleryGrid photos={photos} />

components/gallery-grid.tsx (Client Component — "use client")
  ├── receives photos: PhotoMetadata[] as prop
  ├── manages state: selectedPhoto: PhotoMetadata | null
  ├── renders masonry grid with clickable images
  └── renders <Lightbox photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />

components/lightbox.tsx (Client Component — "use client")
  ├── receives photo: PhotoMetadata | null, onClose: () => void
  └── renders Radix Dialog with overlay, image, close button
```

### Server/Client Boundary

The boundary is at `<GalleryGrid>`. Everything above it (the page, data fetching, metadata export, header markup) stays as a Server Component. The serialization boundary passes `PhotoMetadata[]` — a plain JSON-serializable array. No functions, no classes, no circular references.

The `getImageUrl` function is currently defined in `lib/images.ts` (a server module that uses `fs` and `path`). Since the Client Component needs to construct image URLs, the engineer must either:

- **(Preferred)** Pass the base URL as a prop from the server, and have `GalleryGrid` construct URLs with simple string concatenation, or
- Extract `getImageUrl` into a shared utility that doesn't import `fs`/`path` (e.g., a separate `lib/image-url.ts` file with only the URL helper).

Either approach works. The key constraint is that `lib/images.ts` in its current form cannot be imported from a Client Component because it uses Node.js built-ins (`fs`, `path`).

---

## Component Specifications

### `components/gallery-grid.tsx`

**Props:**

```typescript
interface GalleryGridProps {
  photos: PhotoMetadata[]
  imageBaseUrl: string  // R2_PUBLIC_URL, passed from the server page
}
```

**Behavior:**

- Renders the same CSS columns masonry layout currently in `app/gallery/page.tsx` (lines 47-62).
- Each image is wrapped in a `<button>` element (not a `<div onClick>`) for semantic accessibility.
- The button has `cursor-zoom-in` to signal the interaction affordance.
- Clicking a button calls `setSelectedPhoto(photo)`.
- The `<Image>` props (src, alt, width, height, placeholder, blurDataURL, sizes, className) remain identical to the current implementation.

**What moves out of `app/gallery/page.tsx`:**

Only the `<div className="columns-1 ...">` block and its children (lines 47-62). The page header, back link, title, and photo count stay in the server page.

### `components/lightbox.tsx`

**Props:**

```typescript
interface LightboxProps {
  photo: PhotoMetadata | null
  imageBaseUrl: string
  onClose: () => void
}
```

**Behavior:**

- When `photo` is `null`, renders nothing (dialog is closed).
- When `photo` is set, renders a Radix `Dialog.Root` in controlled mode: `open={!!photo}`, `onOpenChange={(open) => { if (!open) onClose() }}`.

**Visual Structure (inside `Dialog.Portal`):**

1. **Overlay (`Dialog.Overlay`):**
   - Fixed position, covers full viewport (`fixed inset-0`).
   - Background: `bg-black/80` (black at 80% opacity).
   - `z-50` to sit above all page content.
   - Clicking the overlay closes the dialog (Radix built-in behavior).

2. **Content (`Dialog.Content`):**
   - Fixed position, full viewport (`fixed inset-0`).
   - Flexbox centered: `flex items-center justify-center`.
   - Padding: `p-4` on mobile, `sm:p-8` on larger screens. This padding is the "breathing room" between the image and the viewport edge.
   - `z-50` to match overlay stacking.

3. **Close Button (`Dialog.Close`):**
   - Positioned `absolute top-4 right-4` within the Content container.
   - Renders the Lucide `X` icon.
   - Styled: white icon, semi-transparent background circle for contrast against both light and dark photos. Suggested: `rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors`.
   - `z-10` within the content to ensure it sits above the image.

4. **Image Container:**
   - A `<div>` with `relative` positioning.
   - Constrained by `max-w-[90vw]` and `max-h-[90vh]`.
   - Aspect ratio set dynamically from the photo's metadata: `style={{ aspectRatio: \`${photo.width}/${photo.height}\` }}`.
   - This container must also have explicit `width` and `height` constraints. Since all current photos are 6000x4000 (landscape, 3:2), the container will be wide. But the implementation should use the actual `width`/`height` from metadata to handle any aspect ratio.

5. **Image (`next/image`):**
   - Uses the `fill` prop (not `width`/`height`) so it fills the container.
   - `object-contain` to scale without cropping.
   - `sizes="90vw"` — tells the Next.js optimizer the image will occupy ~90% of the viewport. This will serve a much larger image than the grid thumbnails but won't serve the full 6000px original for most devices.
   - `placeholder="blur"` with `blurDataURL` from the photo metadata (the same 10x10 base64 placeholder used in the grid). This provides instant visual feedback while the larger image loads.
   - `priority={true}` — since the user explicitly requested this image, it should load eagerly, not lazily.

**Close Triggers (all handled by Radix Dialog automatically):**

| Trigger | Mechanism |
|---|---|
| X button click | `Dialog.Close` component |
| Overlay click | `Dialog.Overlay` click-outside behavior |
| Escape key | Radix Dialog built-in keyboard handler |

**Focus Management (Radix Dialog built-in):**

- Focus is trapped within the dialog while open.
- Focus moves to the close button when the dialog opens.
- Focus returns to the clicked image's button when the dialog closes.

---

## Image Loading Strategy

### Grid Images (existing, no change)

- `sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"`
- On a 1440px display, Next.js serves ~360px-wide images.
- Lazy loaded (Next.js default).

### Lightbox Image (new)

- `sizes="90vw"`
- On a 1440px display, Next.js serves ~1296px-wide images.
- On a 1920px display, Next.js serves ~1728px-wide images.
- `priority={true}` for eager loading.
- The Next.js image optimizer generates and caches these sizes on first request. Subsequent opens of the same photo are instant.

### What the user experiences

1. User clicks a grid thumbnail.
2. Modal opens immediately. The 10x10 blur placeholder fills the lightbox container.
3. Next.js fetches an optimized image at ~90vw width (WebP, quality 75 default).
4. Image fades in over the blur (Next.js built-in transition).

The original 6000x4000 JPEGs are never sent to the browser. The largest served image will be ~1920px wide on a typical display, which is well under the 6000px originals.

---

## Accessibility

All handled by Radix Dialog primitives:

- `role="dialog"` and `aria-modal="true"` on the content.
- `aria-label` or `aria-labelledby` — use the photo's `alt` text (or filename fallback) as the dialog's accessible label.
- Focus trap: Tab cycles within the dialog (only the close button is focusable).
- Focus restoration: Focus returns to the triggering button on close.
- Escape key closes the dialog.
- The image alt text is preserved on the lightbox `<Image>`.

No additional ARIA work is needed beyond what Radix provides.

---

## Dependencies

All dependencies are already installed. No new packages are required.

| Dependency | Version | Purpose | Status |
|---|---|---|---|
| `@radix-ui/react-dialog` | (needs install) | Dialog primitives | **Not currently in package.json — must be added** |
| `lucide-react` | ^0.284.0 | X icon for close button | Installed |
| `next/image` | via next@16.1.1 | Optimized image rendering | Installed |
| `framer-motion` | ^11.0.0 | Optional: animate modal open/close | Installed (use is optional) |

**Note on `@radix-ui/react-dialog`:** While other Radix packages are installed, `react-dialog` is not currently listed in `package.json`. The engineer should either:
- Run `npx shadcn@latest add dialog` (preferred — generates a styled `components/ui/dialog.tsx` wrapper), or
- Run `npm install @radix-ui/react-dialog` and use the primitives directly.

The shadcn route is preferred because the project already has `components.json` configured for shadcn.

---

## Optional Enhancement: Animation

If the engineer wants a polished open/close transition, Framer Motion is already installed. A simple approach:

- Wrap `Dialog.Overlay` in a `motion.div` with `animate={{ opacity: 1 }}` / `exit={{ opacity: 0 }}`.
- Wrap `Dialog.Content` in a `motion.div` with a subtle scale: `initial={{ opacity: 0, scale: 0.95 }}`, `animate={{ opacity: 1, scale: 1 }}`.
- Wrap both in `<AnimatePresence>`.

This is a nice-to-have, not a requirement. The lightbox is fully functional without animation.

---

## Engineering Tasks

These are ordered for implementation. Each task is independently verifiable.

### Task 1: Add Radix Dialog dependency

Run `npx shadcn@latest add dialog`. This will:
- Install `@radix-ui/react-dialog` if not already present.
- Generate `components/ui/dialog.tsx` with pre-styled Radix Dialog wrappers.

Verify: `components/ui/dialog.tsx` exists and the project builds.

### Task 2: Create `components/lightbox.tsx`

Create the lightbox component per the specification above. Key points:
- Controlled Radix Dialog (`open`/`onOpenChange`).
- Overlay with `bg-black/80`.
- Close button with Lucide `X` icon, positioned top-right.
- Image container with `max-w-[90vw]`, `max-h-[90vh]`, dynamic aspect ratio.
- `next/image` with `fill`, `object-contain`, `sizes="90vw"`, `priority`, blur placeholder.

Verify: Component renders without errors when imported (can test in isolation with a hardcoded photo object).

### Task 3: Create `components/gallery-grid.tsx`

Create the client component per the specification above. Key points:
- `"use client"` directive.
- `selectedPhoto` state via `useState`.
- Move masonry grid markup from `app/gallery/page.tsx`.
- Wrap each image in a `<button>` with `cursor-zoom-in` and click handler.
- Render `<Lightbox>` with the selected photo and close handler.

Verify: Grid renders identically to the current gallery. Clicking an image opens the lightbox. All close triggers work.

### Task 4: Update `app/gallery/page.tsx`

Refactor the page to use `<GalleryGrid>`:
- Remove the inline masonry grid markup (lines 47-62).
- Import `GalleryGrid`.
- Pass `photos` and `imageBaseUrl` (from `process.env.R2_PUBLIC_URL`) as props.
- Page remains a Server Component. The `metadata` export and header markup are unchanged.

Verify: Gallery page renders identically. No visual regressions in the grid. `next build` succeeds.

### Task 5: End-to-end verification

Test all interactions across viewports:
- Click photo to open lightbox.
- Lightbox image loads at appropriate resolution (not 6000px).
- Blur placeholder visible during load.
- Close via X button.
- Close via overlay click.
- Close via Escape key.
- Focus returns to the clicked photo after close.
- Test on mobile viewport (lightbox should still be usable with `p-4` padding).
- `next build` passes with no errors or warnings.

---

## File Change Summary

| File | Change |
|---|---|
| `components/ui/dialog.tsx` | **New** — generated by shadcn CLI |
| `components/lightbox.tsx` | **New** — lightbox modal component |
| `components/gallery-grid.tsx` | **New** — client-side gallery grid with click state |
| `app/gallery/page.tsx` | **Modified** — replace inline grid with `<GalleryGrid>` component |
| `package.json` | **Modified** — `@radix-ui/react-dialog` added (via shadcn) |
