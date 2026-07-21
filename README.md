# Native Image Slideshow for Stash — v0.4.3

**Current plugin version: `v0.4.3`**

A root-level file named `VERSION-v0.4.3` is included so the current version is visible directly in the GitHub file list. On future releases, that filename and this heading should be updated alongside the manifest and package metadata.

A UI-only Stash plugin for clean, configurable image slideshows. It does not modify image metadata or the Stash source tree.

## Start a slideshow

- Open the slideshow button in Stash's top navigation to choose galleries, tag families, studios, performers, or the full image library.
- On any Images page, open the operations menu and choose **Start slideshow**. The plugin uses the page's complete active filter, not only the visible page.
- Select images first and choose **Start slideshow** to play only that selection.

Because the Images-page operation reuses Stash's active GraphQL filter, it works with folders, saved filters, galleries, hierarchical tags, performers, studios, ratings, dates, and combinations of those criteria.

## Options and controls

- Image duration: 1-60 seconds
- Transitions: Fade, Slide, Gentle zoom, or None
- Transition duration: 0-3 seconds
- Image fit: Contain, Cover, or Original size
- Custom background color
- Sort order and direction
- Source-picker sorting by name or image count; empty galleries, tags, studios, and performers are hidden
- Shuffle, continuous loop, captions, and next-image preloading
- Fullscreen support
- Optional native Audio record or legacy Scene video as the background clip

### Background audio player

Native Stash Audio records use WaveSurfer.js v7 with the official Timeline and Hover plugins. WaveSurfer attaches to the slideshow's existing `HTMLAudioElement` through its `media` option, so the waveform, custom controls, and browser media events all operate on one playback state.

The custom player includes:

- Interactive click-and-drag waveform seeking
- Play/pause and previous/next slideshow-item buttons
- Rewind and forward by 10 seconds
- Current time and total duration
- Volume slider and mute
- Playback speeds from 0.5x to 2x
- Repeat-current-track toggle
- A bottom-right docked layout
- Collapse and expand controls
- Dragging by the title bar with viewport-edge clamping

Changing the selected Audio record destroys the previous WaveSurfer instance before loading the new stream. Closing the slideshow destroys the instance, aborts waveform loading, and removes its listeners. If WaveSurfer, waveform fetching, or waveform decoding fails, the same audio element is shown with its native browser controls. Loading, buffering, unsupported-format, autoplay-blocked, and playback-error states appear in the player.

Legacy Scene background clips continue to use the existing hidden video element and compact controls. Spectrogram, minimap, regions, and waveform zoom are intentionally not enabled.

### Hotkey modes

Hotkey settings are available both on the slideshow setup page and inside the live Playback settings panel. They persist in the current browser profile.

**Linked mode** is the default:

- `Left` / `Right`: previous or next image and rewind or forward the audio by 10 seconds
- `Space` or `K`: synchronize slideshow and audio play/pause
- `M`: play or pause audio only
- `F`: fullscreen
- `Esc`: close the slideshow after leaving fullscreen

**Separate mode** provides independent configurable bindings for:

- Slideshow previous image, next image, and play/pause
- Audio rewind 10 seconds, forward 10 seconds, and play/pause

The default separate bindings are `Left`, `Right`, and `Space` for the slideshow, and `J`, `L`, and `M` for audio. Duplicate assignments are rejected so one key cannot accidentally trigger two separate actions.

## Installation

Copy this folder to Stash's configured plugins directory, reload plugins, and enable **Native Image Slideshow** in Settings > Plugins if it is not enabled automatically.

The manifest loads the locally vendored WaveSurfer core, Timeline plugin, and Hover plugin before `stash-image-slideshow.js`; no remote CDN is used. The plugin registers `/plugins/image-slideshow` and exposes a browser API at `window.StashImageSlideshow` for other plugins.

## Release-version convention

Every plugin release should update all of the following to the same version:

- `stash-image-slideshow.yml`
- User-visible runtime version constants
- `package.json`
- `package-lock.json`
- The README title and current-version line
- The root marker filename `VERSION-vX.Y.Z`

The runtime filenames remain stable so Stash installations can be updated without leaving obsolete versioned JavaScript or CSS files behind.

## Development

WaveSurfer.js is pinned in `package.json`. To refresh the checked-in browser files after installing dependencies:

```powershell
npm.cmd install
npm.cmd run vendor:wavesurfer
```

Run the unit tests with:

```powershell
npm.cmd test
```

Third-party version and license details are recorded in `THIRD_PARTY_NOTICES.md` and `vendor/LICENSE`.
