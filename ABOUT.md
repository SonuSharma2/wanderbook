# Wanderbook

A private travel journal for photos, trekking, wandering, and food discoveries.

The homepage is an animated photo desk: a cinematic landscape backdrop, staggered typography, floating layered photographs, pointer parallax, a rotating compass seal, a drawn route, and a moving travel ticker. Drag the main photograph to sweep to another place, select a destination in the thumbnail dock, open its album, or play its Stories. The scene has a pause control and follows reduced-motion and background-tab preferences. Lower sections add animated Story rings, opt-in interaction effects and scroll reveals. An empty personal journal shows a first-memory prompt without sample photographs.

## What works

- Create, edit, and delete memories with dates, places, countries, trip names, moods, experience ratings, and spending notes.
- Upload up to 24 photos per memory; images are resized in the browser, stored privately in R2, and served only to their owner. Reorder photos, choose a cover, and write individual captions.
- Search the full journal, filter by category or mood, keep favorites, sort memories, and switch between grid and timeline views.
- Pin locations on a world map, enter precise coordinates, use your current location with browser permission, and open locations in OpenStreetMap.
- Browse place stamps in a personal passport and revisit a random memory.
- Animated place albums on the homepage group photos from all visits to the same location and country. Open an album to browse its photographs, change visit order, open a full-screen gallery, and jump to the original story. The album shelf supports swiping, previous/next controls, a slideshow with pause/play controls, and reduced-motion preferences. Repeat-visit albums also show dated links to each visit’s journal entry.
- Pull the featured cover or a fullscreen gallery photograph with a mouse or touch: the card follows the gesture, tilts, and sweeps away to reveal the next place or photo. Short and cancelled pulls settle back; arrows and keyboard controls provide the same navigation.
- Stories circles open private, fullscreen photo sequences grouped by place, with progress segments, captions, dates, blurred image backdrops, previous/next controls, and album links. Loaded photographs advance every 5.5 seconds. Tap left/right for photos, swipe horizontally for another place, hold to pause, or pull down to close. Autoplay pauses in background tabs; reduced-motion users start paused. Stories remain available with the journal, without a 24-hour expiry or an Instagram account connection.
- The sample journal contains six illustrative place albums, seven memories, and 19 photo placements using 12 image files. It is separate from the owner's records. Gallery order follows the selected visit order and supports arrow keys and horizontal swipes.
- Download a complete JSON backup including photo bytes, then restore it as new memories.
- Responsive layouts, keyboard-accessible dialogs, photo gallery controls, reduced-motion support, and sample content clearly separated from the personal journal.

## Data and privacy

The site starts owner-private. Hosted authentication is provided by Sites. API operations require a signed-in user and scope every record and photo to that user's stable Site identity. Structured entries live in D1; photos live in R2. Browser storage remembers the sample/personal view and which place stories were completed on this browser. Deleting a memory permanently removes its photos; the UI asks for confirmation first. Backups contain your photos and stories, so keep downloaded files somewhere private.

## Development

Use Node 22.13 or newer. Install with `npm run install:ci`, then run `npm run dev`. Portable development serves at `http://127.0.0.1:5173/`. The local sign-in link creates a development-only identity. Hosted sign-in is handled by the platform.

The hosting manifest declares `DB` and `BUCKET`. SQL migrations and Drizzle metadata are tracked in `drizzle/`. After the initial build, apply the SQL locally using the Wrangler D1 command documented in the starter README. Local storage is separate from hosted storage.

Checks used: `node node_modules/typescript/bin/tsc --noEmit`, the Sites production build helper, and `node scripts/smoke-test.mjs` against the running local dev server. The integration script creates and removes only its own disposable local record. It checks authentication, upload and byte-for-byte retrieval, persistence, edits, validation, cross-origin write rejection, deletion, and file cleanup.

`node scripts/run-album-ui-check.mjs` checks the React interactions in Happy DOM: cover cycling and shelf movement, pause/play, hover/focus pausing, reduced-motion and page-visibility behavior, controls, place opening, repeat-visit photo ordering, story links, fullscreen arrows/wrapping, pointer drag tracking, sweep phases, short/cancelled pulls, Stories autoplay, hold/pause/play, photo taps, place swipes, progress seeking, failed-photo skipping, completed-view status, Escape, and cleanup. This is a DOM emulation check; rendered appearance and animation smoothness require a browser preview; DOM checks do not verify visual quality. `node scripts/photo-upload-check.mjs` decodes and uploads every JPEG asset through the real local API, checks exact retrieval from local R2, verifies cross-visit grouping, then removes its disposable local records.

## Assets

Editorial sample photos are from Unsplash. They illustrate the design and are not the owner's real journal. World land outlines are from the public-domain Natural Earth dataset. Fonts are DM Sans and DM Serif Display from Google Fonts, with system fallbacks. Using current-location lookup is optional; coordinates can always be entered manually. The published journal is private; it does not issue public trip links.


## GitHub Pages version

GitHub Pages serves the React app through the separate `github-pages/` entrypoint, built with `npm run build:pages`. Its base path is `/wanderbook/`. The cloud Worker, authentication code, database files and user uploads are not included in this static build.

The Pages version saves entries and photo blobs in IndexedDB on the visitor's current browser. It has no cloud login or automatic cross-device synchronization. Clearing browser/site data removes that local journal. The page displays a device-storage notice; use Back up journal and Restore backup to keep a portable copy. Incognito storage lasts only for that incognito session. Existing cloud records are separate and can be transferred using a downloaded journal backup.

The `Deploy Wanderbook to GitHub Pages` workflow tests, builds and deploys Pages whenever `main` changes. To preview locally, use `npm run dev:pages` and open `http://127.0.0.1:5174/wanderbook/`. `npm run test:pages` checks JPEG persistence, reopening, edits, photo order and deletion, backup-style restoration, correct subdirectory asset paths and the real Journal UI with no backend requests. Its IndexedDB implementation is emulated for testing.
