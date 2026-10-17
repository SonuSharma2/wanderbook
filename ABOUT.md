# Wanderbook

A private travel journal for photos, trekking, wandering, and food discoveries.

The homepage uses an editorial split cover with warm paper tones, forest-green typography, a framed destination photograph, a small postcard preview, and live journal statistics. Destination thumbnails switch the featured place; its photo button opens the matching album. The cover stacks on narrow screens and respects reduced-motion preferences.

## What works

- Create, edit, and delete memories with dates, places, countries, trip names, moods, experience ratings, and spending notes.
- Upload up to 24 photos per memory; images are resized in the browser, stored privately in R2, and served only to their owner. Reorder photos, choose a cover, and write individual captions.
- Search the full journal, filter by category or mood, keep favorites, sort memories, and switch between grid and timeline views.
- Pin locations on a world map, enter precise coordinates, use your current location with browser permission, and open locations in OpenStreetMap.
- Browse place stamps in a personal passport and revisit a random memory.
- Animated place albums on the homepage group photos from all visits to the same location and country. Open an album to browse its photographs, change visit order, open a full-screen gallery, and jump to the original story. The album shelf supports swiping, previous/next controls, pause/play, and reduced-motion preferences.
- The sample journal contains six illustrative place albums, seven memories, and 19 photo placements using 12 image files. It is separate from the owner's records. Gallery order follows the selected visit order and supports arrow keys and horizontal swipes.
- Download a complete JSON backup including photo bytes, then restore it as new memories.
- Responsive layouts, keyboard-accessible dialogs, photo gallery controls, reduced-motion support, and sample content clearly separated from the personal journal.

## Data and privacy

The site starts owner-private. Hosted authentication is provided by Sites. API operations require a signed-in user and scope every record and photo to that user's stable Site identity. Structured entries live in D1; photos live in R2. Browser storage only remembers whether to show the sample or personal journal. Deleting a memory permanently removes its photos; the UI asks for confirmation first. Backups contain your photos and stories, so keep downloaded files somewhere private.

## Development

Use Node 22.13 or newer. Install with `npm run install:ci`, then run `npm run dev`. Portable development serves at `http://127.0.0.1:5173/`. The local sign-in link creates a development-only identity. Hosted sign-in is handled by the platform.

The hosting manifest declares `DB` and `BUCKET`. SQL migrations and Drizzle metadata are tracked in `drizzle/`. After the initial build, apply the SQL locally using the Wrangler D1 command documented in the starter README. Local storage is separate from hosted storage.

Checks used: `node node_modules/typescript/bin/tsc --noEmit`, the Sites production build helper, and `node scripts/smoke-test.mjs` against the running local dev server. The integration script creates and removes only its own disposable local record. It checks authentication, upload and byte-for-byte retrieval, persistence, edits, validation, cross-origin write rejection, deletion, and file cleanup.

`node scripts/run-album-ui-check.mjs` checks the React interactions in Happy DOM: cover cycling, automatic shelf movement, pause/play, hover/focus pausing, reduced-motion and page-visibility behavior, manual controls, place opening, repeat-visit photo ordering, story links, fullscreen arrows/wrapping, keyboard controls, touch swipes, Escape, and cleanup. This is a DOM emulation check; it does not assess rendered appearance or animation smoothness. `node scripts/photo-upload-check.mjs` decodes and uploads every JPEG asset through the real local API, checks exact retrieval from local R2, verifies cross-visit grouping, then removes its disposable local records.

## Assets

Editorial sample photos are from Unsplash. They illustrate the design and are not the owner's real journal. World land outlines are from the public-domain Natural Earth dataset. Fonts are DM Sans and DM Serif Display from Google Fonts, with system fallbacks. Using current-location lookup is optional; coordinates can always be entered manually. The published journal is private; it does not issue public trip links.
