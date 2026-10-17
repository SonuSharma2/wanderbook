# Wanderbook

A private travel journal for photos, trekking, wandering, and food discoveries.

The homepage leads with a short headline, one primary Add a memory action, and an animated photo desk. Cinematic backgrounds, floating layered photographs, pointer parallax, a rotating compass and a drawn route provide motion without decorative slogans, statistics or a text ticker. Drag the main photograph to sweep between place albums. Stories and albums use compact headings and place names. Notes show titles and location/date details; the full writing opens inside an entry. Motion has pause controls and follows reduced-motion and background-tab preferences.

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

Editorial sample photos are from Unsplash. They illustrate the design and are not the owner's real journal. World land outlines are from the public-domain Natural Earth dataset. Fonts are DM Sans and DM Serif Display from Google Fonts, with system fallbacks. Using current-location lookup is optional; coordinates can always be entered manually. Public album links expose photographs and captions from that album. Private notes, spending, trip details and coordinates are excluded.


## GitHub Pages version

GitHub Pages serves the React app through the separate `github-pages/` entrypoint, built with `npm run build:pages`. Its base path is `/wanderbook/`. The cloud Worker, authentication code, database files and user uploads are not included in this static build.

GitHub Pages opens the full animated journal homepage at https://sonusharma2.github.io/wanderbook/. The original photo desk cover, floating photos, pause controls, Stories, place album shelf, My map and Passport navigation are restored. Selecting Panchpokhari opens its photo album inside the homepage; opening the website does not start inside an album. This public home reads the same shared cloud photo API without credentials, redirects, IndexedDB or localStorage. The cloud host also retains its standalone public album viewer. Private journal APIs and all writes separately authorize the journal owner. Manage journal opens the owner interface in a separate tab. The trusted owner email is configured through the Sites secret JOURNAL_OWNER_EMAIL; records use journal-owner. No credential or owner email is embedded in the public client.

Public homepage components receive a photo-only view adapter: no visit date, private notes, precise coordinates, trip, cost or rating is invented or exposed. Public Stories use a shared-album label when no date is published. The public album hides editing controls and private visit links. My map keeps the world map controls and offers a place-name search; Passport opens shared place albums. The owner/device editor retains its full existing behavior. `?album=Panchpokhari` can explicitly open the album; normal visits show the homepage.

Panchpokhari is the explicitly published default album. Other albums receive separate UUID links using Share album. Turn off this link disables both album reads and direct photo URLs. Public photo responses use no-store caching, and shared pages request no indexing and no referrer. Slideshow and swipe/fullscreen controls work on the public viewer. The database holds metadata and sharing records; photo bytes stay in R2. Viewers refresh on focus, reconnect, every 30 seconds while visible, or manually.

A temporary server-only upload credential was used for the hosted sample test. After the check, its authorization path was removed from application code, and the credential was removed from hosting settings. Production uploads authorize only the signed-in owner. The test used an illustrative sample JPEG, verified anonymous retrieval and album isolation, then deleted its test memories and files. Sharing revocation leaves a disabled link record by design.

Existing device journals stay available on their original browser. Choose Move to cloud, download the JSON backup, then open the cloud import link and select that file. This transfer requires a user file selection because the cloud origin cannot read the GitHub origin's IndexedDB. Migration preserves valid memory/photo IDs so retrying a partially uploaded transfer updates those records. Ordinary Restore backup still makes new copies. The original device data is retained. `?device=1` explicitly opens the device journal for recovery; clearing site data removes it, and incognito data lasts only for its session.

Panchpokhari is an empty starter album in both versions. Choose Upload photos, select images, check the date and Save photos. The place and title are prefilled, and saving returns to that album. Create album adds empty folders without inventing a memory or visit date. In cloud mode folders are saved to the account; in device mode they use localStorage. Both are included in backups. Uploaded photos also appear in the place's Stories and animated cover.

The `Deploy Wanderbook to GitHub Pages` workflow tests, builds and deploys Pages whenever `main` changes. To preview the device version locally, use `npm run dev:pages` and open `http://127.0.0.1:5174/wanderbook/?device=1`. `npm run test:pages` checks device persistence, album uploads, migration imports, a second cloud UI instance, focus/manual refresh, expired-session feedback and cleanup with emulated DOM, IndexedDB, cloud HTTP and canvas. `node scripts/cloud-sync-check.mjs` runs the real cloud adapter against local D1/R2 using two separately signed-in HTTP clients and removes only its disposable records. Rendered appearance and image decoding still require real-browser QA.

`node scripts/run-pages-entry-check.mjs` runs the actual GitHub entrypoint with browser storage unavailable and mocked cloud HTTP. It checks the animated homepage, six-photo album opening, fullscreen gallery, Stories, My map, Passport, sharing recovery, absence of redirects and credential use, and timer cleanup. This check is also part of the Pages deployment workflow. The live public API must return Access-Control-Allow-Origin: * for GitHub browser reads. Browser visual QA is unavailable when no browser surface is exposed by the environment.

For local owner authentication, put only the local mock owner email JOURNAL_OWNER_EMAIL="seedy@sites.test" in ignored .dev.vars. `node scripts/shared-upload-check.mjs` exercises actual local uploads, anonymous page/photo retrieval, private API rejection, album boundaries and link revocation. `node scripts/run-public-album-check.mjs` checks the viewer and sharing controls in an emulated DOM. The historical --hosted mode received a temporary credential over hidden stdin; that authorization path is deliberately absent from the final production app.
