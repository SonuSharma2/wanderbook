The optional HEIC/HEIF browser decoder uses unmodified **heic-to 1.6.6**
(Hopper Gee), licensed under LGPL-3.0-or-later, with libheif and libde265.
The package is loaded as a separate client chunk only when native HEIC
decoding fails. JPEG/PNG/WebP/AVIF uploads do not load the decoder.

- Package and corresponding source: https://github.com/hoppergee/heic-to
- libheif: https://github.com/strukturag/libheif
- libde265: https://github.com/strukturag/libde265
- Distributed license: [public/licenses/heic-to.txt](public/licenses/heic-to.txt)

The exact package version is declared in `package.json` and locked in
`package-lock.json`. To replace the decoder, update that dependency and
rebuild the app; the application source and build commands are public.
