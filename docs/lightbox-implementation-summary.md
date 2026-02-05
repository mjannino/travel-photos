# Lightbox Implementation Summary

**Last updated:** 2026-02-05
**Status:** Complete through pagination. Ready for next iteration.

---

## What exists today

A click-to-open lightbox for the photo gallery with sequential prev/next navigation. Users click any grid thumbnail to see it large, navigate between photos with arrow buttons or keyboard, and close via X button, overlay click, or Escape.

---

## Architecture

The gallery page (`app/gallery/page.tsx`) is a Server Component that fetches `PhotoMetadata[]` via `getPhotoManifest()` and passes it down to a client component. The server/client boundary is at `<GalleryGrid>`:

```
app/gallery/page.tsx (Server Component)
  └── <GalleryGrid photos={photos} imageBaseUrl={R2_PUBLIC_URL} />

components/gallery-grid.tsx (Client — owns state)
  ├── selectedIndex: number | null
  ├── derived selectedPhoto: photos[selectedIndex] | null
  ├── handlePrev / handleNext (circular modular arithmetic)
  ├── masonry grid of <button> wrapped <Image> thumbnails
  └── <Lightbox photo={selectedPhoto} imageBaseUrl onClose onPrev onNext />

components/lightbox.tsx (Client — stateless, controlled)
  └── Radix Dialog (open/onOpenChange)
      ├── overlay (bg-black/80)
      ├── close button (top-right)
      ├── prev button (left edge, vertically centered)
      ├── next button (right edge, vertically centered)
      ├── keyboard handler (ArrowLeft → onPrev, ArrowRight → onNext)
      └── <Image> with blur placeholder
```

**State ownership:** `GalleryGrid` owns `selectedIndex`. All navigation logic (prev, next, close) is computed in GalleryGrid and passed as callbacks. Lightbox is a pure controlled component — it receives a photo and calls callbacks. It knows nothing about arrays, indices, or ordering.

**Server/client boundary:** The `imageBaseUrl` (R2 public URL) is threaded from the server page through both components as a string prop, because `lib/images.ts` uses `fs`/`path` and cannot be imported client-side.

---

## Key files

| File | Role |
|---|---|
| `components/gallery-grid.tsx` | Client component. Renders masonry grid + manages which photo is selected via index. Computes prev/next with circular wrapping. |
| `components/lightbox.tsx` | Client component. Radix Dialog that displays a single photo with prev/next arrow buttons and keyboard navigation. Stateless/controlled. |
| `components/ui/dialog.tsx` | shadcn-generated Radix Dialog wrappers. **Not used by the lightbox** — the lightbox uses `@radix-ui/react-dialog` primitives directly because shadcn's DialogContent is styled for card-style modals (border, background, padding) which fight the full-viewport lightbox layout. |
| `app/gallery/page.tsx` | Server Component. Fetches photos, renders header + `<GalleryGrid>`. |
| `lib/images.ts` | Server-only module. Defines `PhotoMetadata` interface, `getPhotoManifest()`, `getImageUrl()`. Uses `fs`/`path` — cannot be imported from client components. |

---

## Navigation design

**Circular wrapping:** The photo array is treated as a ring. On the first photo, "previous" goes to the last photo. On the last photo, "next" goes to the first. Implemented with modular arithmetic:

```typescript
// prev: (0 - 1 + length) % length = length - 1 (last photo)
const handlePrev = () => {
  setSelectedIndex((i) => (i !== null ? (i - 1 + photos.length) % photos.length : null))
}

// next: (length - 1 + 1) % length = 0 (first photo)
const handleNext = () => {
  setSelectedIndex((i) => (i !== null ? (i + 1) % photos.length : null))
}
```

**Arrow buttons:** Positioned at the viewport extremities (`absolute left-4 top-1/2` and `absolute right-4 top-1/2`), vertically centered with `-translate-y-1/2`. Same visual style as the close button: `rounded-full bg-black/50 p-2 text-white hover:bg-black/70`. Icons are `ChevronLeft` and `ChevronRight` from `lucide-react`, sized `h-6 w-6`.

**Keyboard navigation:** `onKeyDown` handler on `DialogPrimitive.Content` (not `window`) because Radix Dialog traps focus. `ArrowLeft` calls `onPrev()`, `ArrowRight` calls `onNext()`. Both call `e.preventDefault()` to suppress browser scrolling.

**Close button:** `absolute right-4 top-4` (top-right corner). Does not overlap with the next arrow button which is at `right-4 top-1/2` (vertically centered).

---

## Gotchas encountered

### fill vs width/height on next/image

The initial lightbox implementation used `next/image` with the `fill` prop inside a container constrained by `max-w-[90vw]`, `max-h-[90vh]`, and `aspect-ratio`. This rendered a completely invisible image — no blur, no loaded image, nothing.

**Why:** `fill` renders the `<img>` with `position: absolute`, removing it from document flow. The parent div had only `max-*` constraints and `aspect-ratio`, but no in-flow content to give it any size. It collapsed to 0x0.

**Fix:** Switched to `width`/`height` props (the photo's native 6000x4000), which gives the `<img>` intrinsic dimensions. CSS `max-h-[90vh] max-w-[90vw] h-auto w-auto object-contain` handles viewport fitting.

**Takeaway:** Only use `fill` when the parent has a concrete size (e.g., explicit width/height, or fills a layout slot). If you're constraining with `max-*` only, use `width`/`height` props and let CSS do the capping.

### Keyboard events and Radix Dialog focus trap

Attaching keyboard listeners to `window` or `document` does not work when a Radix Dialog is open because Radix traps focus inside `DialogPrimitive.Content`. The `onKeyDown` handler must be on the `Content` element itself (or a child that has focus).

### shadcn Dialog vs Radix primitives

The lightbox uses `@radix-ui/react-dialog` primitives directly, not the shadcn `components/ui/dialog.tsx` wrapper. shadcn's `DialogContent` applies border, background, padding, and max-width styling designed for card-style modals. These fight the full-viewport lightbox layout. Using primitives directly gives full control over positioning and styling.

---

## What is NOT built yet

These are explicitly out of scope for the current iteration:

- **Per-photo shareable URLs** (no routing changes, no intercepting routes)
- **Swipe/touch navigation** (only click and keyboard)
- **Animated transitions between photos** (framer-motion is installed if wanted — `AnimatePresence` with `key={photo.src}` on the `<Image>` would handle crossfade/slide)
- **Photo metadata display** (title, EXIF, location) in the lightbox
- **Download button**
- **Zoom-beyond-viewport** interactions
- **Photo counter** (e.g., "3 of 182")
- **Thumbnail strip** or filmstrip navigation
- **Preloading** adjacent images for faster navigation

---

## Dependencies

All installed. No new packages were added for pagination.

| Dependency | Version | Purpose |
|---|---|---|
| `@radix-ui/react-dialog` | ^1.1.15 | Dialog primitives (overlay, content, close, portal) |
| `lucide-react` | ^0.284.0 | X, ChevronLeft, ChevronRight icons |
| `next/image` | via next@16.1.1 | Optimized image rendering |
| `framer-motion` | ^11.0.0 | Available for future animation work (not currently used by lightbox) |

---

## Commit history

```
dcbcb5b Add keyboard arrow navigation to Lightbox dialog
880a8d2 Add prev/next arrow buttons to Lightbox for photo navigation
e6fe033 Add onPrev/onNext navigation callbacks to Lightbox props
848259c Refactor GalleryGrid to index-based state for selected photo
```

Each commit is independently buildable and represents one logical change.
