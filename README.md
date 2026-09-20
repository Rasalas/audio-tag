# audioTag

**[rasalas.github.io/audio-tag](https://rasalas.github.io/audio-tag/)**

Cover art and tags for MP3, M4A, FLAC and OGG/Opus files, right in the browser. Built for phones, works on desktop too.
Nothing is uploaded; the file is rewritten locally and handed back as a download.

Sibling of [msg-reader](https://github.com/Rasalas/msg-reader): same idea (drop files, list on the left, detail on the right), different job.

## How it works

1. Tap the **Add music** button (floating on phones, at the top of the list on desktop) or drop files onto the page.
2. Tap a track, then **Choose image** on the cover and pick a photo.
3. Tap the title card below the cover to edit title, artist, album, year, track number and genre in a sheet. After changing album or artist with several tracks loaded, the list offers to copy both to all tracks.
4. Tap **Save file**. The download is your original file with the new cover and tags written in; everything else in the file stays as it was.

After picking an image with more than one track loaded, a small row at the top of the list offers to use it for all tracks, which is handy for a whole album. Dismiss it with the X.

You can also import music and images together, in one drop or one file picker selection:

| What you import | What happens |
|---|---|
| Music only | Tracks are added. |
| Music plus one image | The image becomes the cover of every track in that import. |
| Music plus several images | Images are matched to tracks by file name (`song.m4a` + `song.jpg`). One leftover image goes to the remaining tracks, more than one leftover waits in the library. |
| One image only, tracks loaded | Applied to all tracks (or matched by name). |
| One image only, nothing loaded | Kept and applied to the next music you add. |

Every image seen in a session lands in a small library, newest first. **Choose image** on a track opens it as a scrollable grid (plus the covers the files came with) with **New image** at the top for the photo picker. Removing an image from the library only affects the library, not the tracks using it.

Nothing is persisted: tracks, images and the library live in memory and are gone after a reload or browser restart. Only the settings are kept in local storage. **Clear session** in the three-dot menu drops everything in memory; **Reset settings** in the settings sheet restores the defaults.
The X in the corner of the cover removes it. **Save all** in the top bar downloads every changed track in sequence.

The look follows Material 3 Expressive: pill buttons, tonal surfaces, a custom pill player, springy press feedback, light and dark mode.

Accessibility: all text meets WCAG AA contrast in both themes, sizes are in rem so browser text zoom works, every icon button has a label, focus rings are visible, and animations are dropped when the system asks for reduced motion.

Photos from a phone camera are downscaled to 1200px on the long edge and re-encoded as JPEG before embedding. HEIC works wherever the browser can decode it (Safari on iOS does).

Non-square photos are cropped to a square by default. Picking a photo for one track opens a crop view where you drag and zoom the square; imported photos are centre-cropped and **Adjust crop** in the track view lets you fix that later. The setting *Non-square images* switches to keeping the original aspect ratio instead.

The three-dot menu in the top bar opens Settings (light or dark mode, language auto/English/German, cover size, square crop), About (project, support, legal links and the version) and Clear session. Tapping the brand name also opens About. On phones the system back gesture closes the detail view and the sheets, and a sheet can be swiped down anywhere to dismiss it.

## Formats

| Format | Cover | Text tags | Notes |
|---|---|---|---|
| MP3 | ID3v2 `APIC` | `TIT2`, `TPE1`, `TALB`, `TDRC`/`TYER`, `TRCK`, `TCON` | v2.3 and v2.4 are rewritten in place (v2.3 text as UTF-16), other frames are kept. v2.2 or unsynchronised tags are replaced by a fresh v2.3 tag; the UI warns. |
| M4A / MP4 / AAC | `ilst/covr` | `©nam`, `©ART`, `©alb`, `©day`, `trkn`, `©gen` | Missing `udta`, `meta` or `ilst` atoms are created. Chunk offsets in `stco`/`co64` are shifted when `moov` sits before `mdat` (faststart files). |
| FLAC | `PICTURE` block | `VORBIS_COMMENT` (TITLE, ARTIST, ALBUM, DATE, TRACKNUMBER, GENRE) | Existing picture blocks are replaced, the rest is kept. |
| OGG Vorbis, Opus | `METADATA_BLOCK_PICTURE` | same Vorbis comment keys | The comment header is rebuilt and re-paged; following pages get new sequence numbers and CRCs. WhatsApp voice notes are Opus. |

WAV is skipped because players mostly ignore cover art in WAV.

## Running locally

There is no build step. `make dev` serves the folder with live reload and opens the browser (uses `npx live-server`, so Node is needed once). Any static file server works too:

```bash
python3 -m http.server 8000
```

## Releasing to GitHub Pages

Pages is deployed by `.github/workflows/pages.yml` whenever a `v*` tag is pushed. Set the repository's Pages source to "GitHub Actions" once. Then:

```bash
make release VERSION=1.2.0
```

This bumps `APP_VERSION` in `app.js`, commits, tags `v1.2.0` and pushes. The workflow stamps the tag's version into the deployed app as well, so the About sheet always shows the released version.

## Files

- `index.html` – markup, both panes
- `styles.css` – mobile-first layout, dark mode via `prefers-color-scheme`
- `app.js` – state, rendering, file handling, image resizing, settings, sheets. `APP_VERSION` lives at the top.
- `id3.js` – minimal ID3v2 parser and writer
- `formats.js` – format detection plus the M4A and FLAC readers/writers
