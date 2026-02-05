# Lightbox Pagination Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add prev/next arrow navigation to the lightbox so users can browse photos sequentially without closing the modal, with circular wrapping (last→first, first→last).

**Architecture:** Convert `GalleryGrid`'s state from `selectedPhoto: PhotoMetadata | null` to `selectedIndex: number | null`. Pass the full `photos` array and `onPrev`/`onNext` callbacks into `Lightbox`. Add `<ChevronLeft>` and `<ChevronRight>` buttons at the left and right edges of the viewport inside `DialogPrimitive.Content`, and register `ArrowLeft`/`ArrowRight` keyboard listeners inside the dialog content (not on `window`, because Radix Dialog traps focus).

**Tech Stack:** React 19.2, Next.js 16.1.1, @radix-ui/react-dialog, lucide-react (ChevronLeft, ChevronRight icons), Tailwind CSS

---

## Design Decisions

### Why index-based state instead of photo-object state

`GalleryGrid` currently stores `selectedPhoto: PhotoMetadata | null`. This works for open/close but makes prev/next awkward — you'd need to find the current photo's index in the array every time. Switching to `selectedIndex: number | null` makes navigation trivial arithmetic: `(i + 1) % photos.length` for next, `(i - 1 + photos.length) % photos.length` for prev. The photo object is derived: `photos[selectedIndex]`.

### Why circular wrapping

The acceptance criteria explicitly state: on the first image, "previous" goes to the last; on the last, "next" goes to the first. This is standard lightbox behavior and avoids disabled-state buttons.

### Why arrow buttons at viewport extremes

The acceptance criteria say "placement at the extremities of the browser window, similar to the close button." The close button is `absolute right-4 top-4`. The arrow buttons will be `absolute left-4 top-1/2 -translate-y-1/2` and `absolute right-4 top-1/2 -translate-y-1/2`. This mirrors how the close button is positioned — fixed to the viewport edge, not to the image edge. The buttons use the same styling language (semi-transparent black circle, white icon, hover state) for visual consistency.

### Why keyboard listeners inside DialogPrimitive.Content

Radix Dialog traps focus inside `DialogPrimitive.Content`. Attaching `keydown` listeners to `window` or `document` won't reliably fire because focus is trapped. The correct approach is to use an `onKeyDown` handler on the `DialogPrimitive.Content` element itself, which receives keyboard events because it (or its children) hold focus.

### Why Lightbox remains a controlled, stateless component

`Lightbox` today is stateless — it receives props and calls callbacks. We keep this pattern. `GalleryGrid` owns the index state and passes `onPrev`, `onNext`, `onClose` callbacks plus the current `photo` object. `Lightbox` doesn't know about arrays or indices. This keeps responsibility clean: `GalleryGrid` = state owner, `Lightbox` = presentation.

---

## Current State of Files

### `components/gallery-grid.tsx` (will modify)
- Client component with `'use client'`
- State: `selectedPhoto: PhotoMetadata | null` (line 14)
- Renders masonry grid of `<button>`-wrapped `<Image>` thumbnails
- Passes `photo={selectedPhoto}` and `onClose` to `<Lightbox>`

### `components/lightbox.tsx` (will modify)
- Client component with `'use client'`
- Props: `{ photo: PhotoMetadata | null, imageBaseUrl: string, onClose: () => void }`
- Renders Radix `DialogPrimitive.Root` in controlled mode
- Close button at `absolute right-4 top-4` with Lucide `X` icon
- Image rendered with `width`/`height` props (not `fill`) — per the lesson learned about `fill` requiring concrete parent sizes

### `lib/images.ts` (no changes)
- Defines `PhotoMetadata` interface: `{ src, alt, width, height, blurDataURL? }`
- Server-only module (uses `fs`, `path`)

### `app/gallery/page.tsx` (no changes)
- Server Component, passes `photos` and `imageBaseUrl` to `<GalleryGrid>`

---

## Tasks

### Task 1: Convert GalleryGrid from photo-object state to index-based state

**Files:**
- Modify: `components/gallery-grid.tsx`

This is the foundational refactor. The lightbox behavior (open photo, close photo) must remain identical after this change — we're only changing the internal state representation.

**Step 1: Update the state declaration and derived photo**

In `components/gallery-grid.tsx`, change:

```typescript
const [selectedPhoto, setSelectedPhoto] = useState<PhotoMetadata | null>(null)
```

to:

```typescript
const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
const selectedPhoto = selectedIndex !== null ? photos[selectedIndex] : null
```

**Step 2: Update the click handler**

Change the `onClick` in the grid from:

```typescript
onClick={() => setSelectedPhoto(photo)}
```

to:

```typescript
onClick={() => setSelectedIndex(index)}
```

This requires adding `index` to the `.map()` call. Change:

```typescript
{photos.map((photo) => (
```

to:

```typescript
{photos.map((photo, index) => (
```

**Step 3: Update the onClose callback**

Change:

```typescript
onClose={() => setSelectedPhoto(null)}
```

to:

```typescript
onClose={() => setSelectedIndex(null)}
```

**Step 4: Verify manually**

Run: `npm run dev`

Open the gallery. Click a photo — lightbox should open with the correct photo. Close via X, overlay click, and Escape. All three should work identically to before. The grid should look the same. No visual changes whatsoever.

**Step 5: Verify build**

Run: `npm run build`

Expected: Build succeeds with no errors.

**Step 6: Commit**

```bash
git add components/gallery-grid.tsx
git commit -m "refactor: convert gallery-grid to index-based selection state

Prepares for prev/next navigation by storing selectedIndex instead of
the photo object directly. Derived selectedPhoto is computed from the
index. No behavior change."
```

---

### Task 2: Add onPrev/onNext callbacks to GalleryGrid and wire into Lightbox props

**Files:**
- Modify: `components/gallery-grid.tsx`
- Modify: `components/lightbox.tsx`

This task extends the Lightbox prop interface and threads the navigation callbacks from GalleryGrid into Lightbox. The buttons in Lightbox are added in Task 3 — this task is just the plumbing.

**Step 1: Define the navigation callbacks in GalleryGrid**

In `components/gallery-grid.tsx`, after the state declarations, add:

```typescript
const handlePrev = () => {
  setSelectedIndex((i) => (i !== null ? (i - 1 + photos.length) % photos.length : null))
}

const handleNext = () => {
  setSelectedIndex((i) => (i !== null ? (i + 1) % photos.length : null))
}
```

Note: The modular arithmetic handles circular wrapping. When `i` is 0 (first photo), `(0 - 1 + length) % length` = `length - 1` (last photo). When `i` is `length - 1` (last photo), `(length - 1 + 1) % length` = `0` (first photo).

**Step 2: Update Lightbox props interface**

In `components/lightbox.tsx`, change:

```typescript
interface LightboxProps {
  photo: PhotoMetadata | null
  imageBaseUrl: string
  onClose: () => void
}
```

to:

```typescript
interface LightboxProps {
  photo: PhotoMetadata | null
  imageBaseUrl: string
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}
```

**Step 3: Destructure new props in Lightbox**

Change:

```typescript
export function Lightbox({ photo, imageBaseUrl, onClose }: LightboxProps) {
```

to:

```typescript
export function Lightbox({ photo, imageBaseUrl, onClose, onPrev, onNext }: LightboxProps) {
```

**Step 4: Pass new props from GalleryGrid to Lightbox**

In `components/gallery-grid.tsx`, change:

```typescript
<Lightbox
  photo={selectedPhoto}
  imageBaseUrl={imageBaseUrl}
  onClose={() => setSelectedIndex(null)}
/>
```

to:

```typescript
<Lightbox
  photo={selectedPhoto}
  imageBaseUrl={imageBaseUrl}
  onClose={() => setSelectedIndex(null)}
  onPrev={handlePrev}
  onNext={handleNext}
/>
```

**Step 5: Verify build**

Run: `npm run build`

Expected: Build succeeds. No runtime behavior change yet — the callbacks exist but nothing calls them in the UI.

**Step 6: Commit**

```bash
git add components/gallery-grid.tsx components/lightbox.tsx
git commit -m "feat: add onPrev/onNext navigation callbacks to lightbox

GalleryGrid computes prev/next indices with circular wrapping and
passes them as callbacks. Lightbox accepts the new props but doesn't
render navigation UI yet."
```

---

### Task 3: Add prev/next arrow buttons to Lightbox

**Files:**
- Modify: `components/lightbox.tsx`

This is the main visual feature. We add two arrow buttons inside `DialogPrimitive.Content`, positioned at the left and right edges of the viewport.

**Step 1: Import the Lucide arrow icons**

In `components/lightbox.tsx`, change:

```typescript
import { X } from 'lucide-react'
```

to:

```typescript
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
```

**Step 2: Add the prev button (left edge)**

Inside `DialogPrimitive.Content`, after the `DialogPrimitive.Close` (close button) and before the `<Image>`, add:

```tsx
<button
  type="button"
  onClick={onPrev}
  className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
  aria-label="Previous photo"
>
  <ChevronLeft className="h-6 w-6" />
</button>
```

**Step 3: Add the next button (right edge)**

Immediately after the prev button, add:

```tsx
<button
  type="button"
  onClick={onNext}
  className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
  aria-label="Next photo"
>
  <ChevronRight className="h-6 w-6" />
</button>
```

**Important note on close button position conflict:** The close button is currently at `absolute right-4 top-4`. The next arrow is at `absolute right-4 top-1/2`. These are different vertical positions (top corner vs vertical center), so they don't visually overlap. No position adjustments needed.

**Step 4: Verify manually**

Run: `npm run dev`

Open the gallery, click a photo:
- Two arrow buttons visible at left and right edges of the viewport, vertically centered.
- Left arrow navigates to the previous photo. Right arrow navigates to the next.
- On the first photo, left arrow goes to the last photo.
- On the last photo, right arrow goes to the first photo.
- X button still works, overlay click still works, Escape still works.
- Arrow buttons share the same visual style as the close button (semi-transparent black circle, white icon).

**Step 5: Commit**

```bash
git add components/lightbox.tsx
git commit -m "feat: add prev/next arrow buttons to lightbox

Chevron buttons at left/right viewport edges for navigating between
photos. Same visual style as the close button. Circular wrapping
handled by parent callbacks."
```

---

### Task 4: Add keyboard arrow navigation inside the dialog

**Files:**
- Modify: `components/lightbox.tsx`

Users expect to navigate with arrow keys when the lightbox is open. Because Radix Dialog traps focus inside `DialogPrimitive.Content`, we attach the `onKeyDown` handler directly to that element.

**Step 1: Add onKeyDown handler to DialogPrimitive.Content**

In `components/lightbox.tsx`, add a `onKeyDown` prop to `DialogPrimitive.Content`. Change:

```tsx
<DialogPrimitive.Content
  className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
  aria-label={photo.alt || photo.src}
>
```

to:

```tsx
<DialogPrimitive.Content
  className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
  aria-label={photo.alt || photo.src}
  onKeyDown={(e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      onPrev()
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      onNext()
    }
  }}
>
```

The `e.preventDefault()` calls prevent any default browser behavior for arrow keys (e.g., scrolling) while the dialog is open.

**Step 2: Verify manually**

Run: `npm run dev`

Open lightbox:
- Press `ArrowRight` → advances to next photo.
- Press `ArrowLeft` → goes to previous photo.
- Press `Escape` → still closes the dialog (Radix built-in, unaffected).
- Tab key → still cycles focus between close button and arrow buttons (Radix focus trap).
- Rapid arrow key presses → cycles smoothly through photos.

**Step 3: Verify build**

Run: `npm run build`

Expected: Build succeeds with no errors or warnings.

**Step 4: Commit**

```bash
git add components/lightbox.tsx
git commit -m "feat: add keyboard arrow navigation to lightbox

ArrowLeft/ArrowRight keys navigate between photos when the lightbox
is open. Handler is on DialogPrimitive.Content so it works within
the Radix focus trap."
```

---

### Task 5: End-to-end verification

**Files:** None (verification only)

This task is a manual QA pass across viewports and interaction modes.

**Step 1: Run the dev server**

Run: `npm run dev`

**Step 2: Test click-to-open**

- Click any photo in the grid → lightbox opens with the correct photo.

**Step 3: Test next/prev buttons**

- Click right arrow → next photo loads.
- Click left arrow → previous photo loads.
- Navigate to the first photo, click left arrow → wraps to last photo.
- Navigate to the last photo, click right arrow → wraps to first photo.

**Step 4: Test keyboard navigation**

- With lightbox open, press `ArrowRight` → next photo.
- Press `ArrowLeft` → previous photo.
- Rapid key presses → cycles correctly, no errors in console.

**Step 5: Test close behaviors**

- Click X button → lightbox closes.
- Reopen, click overlay (dark area outside photo) → closes.
- Reopen, press `Escape` → closes.
- After close, focus returns to the grid photo that was clicked.

**Step 6: Test mobile viewport**

- Resize browser to ~375px wide (or use DevTools mobile mode).
- Arrow buttons still visible and tappable.
- Arrow buttons don't overlap the image excessively.
- Close button doesn't overlap with the right arrow (different vertical positions).

**Step 7: Test image loading**

- Open lightbox on a photo → blur placeholder shows, then full image loads.
- Navigate to another photo → new blur placeholder, then image loads.
- Navigate back → image may load from cache (fast).

**Step 8: Production build**

Run: `npm run build`

Expected: Build succeeds with zero errors.

**Step 9: Commit (if any fixes were needed)**

If any issues were found and fixed during verification, commit those fixes.

---

## Final File State

After all tasks, the two modified files will look like this:

### `components/gallery-grid.tsx`

```typescript
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
```

### `components/lightbox.tsx`

```typescript
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
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') {
              e.preventDefault()
              onPrev()
            } else if (e.key === 'ArrowRight') {
              e.preventDefault()
              onNext()
            }
          }}
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
```

---

## File Change Summary

| File | Change | Lines affected |
|---|---|---|
| `components/gallery-grid.tsx` | **Modified** — index-based state, navigation callbacks, pass new props to Lightbox | ~15 lines changed |
| `components/lightbox.tsx` | **Modified** — new props, arrow buttons, keyboard handler | ~25 lines added/changed |

No new files. No new dependencies. No changes to `app/gallery/page.tsx` or `lib/images.ts`.
