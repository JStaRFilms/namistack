# NamiStack

NamiStack is a desktop FFmpeg workbench for Windows. It gives you a visual way to open media files, choose actions like shrink, convert, or merge, and run FFmpeg without memorizing a wall of flags.

## What It Does

- Open one or many media files with a native file picker
- Inspect basic media metadata with `ffprobe`
- Shrink clips to a target size
- Convert clips to another format
- Merge multiple clips into one lossless output
- Toggle common FFmpeg flags with a searchable UI
- Preview the exact command before running it
- Watch progress and logs while jobs run
- Auto-detect FFmpeg/FFprobe from PATH or common Windows install locations
- Override FFmpeg paths manually in Settings if needed

## Tech Stack

- Electron
- React
- TypeScript
- Vite / electron-vite
- Tailwind CSS v4

## Requirements

- Windows 10 or newer
- `ffmpeg.exe` and `ffprobe.exe` available on PATH, or set manually inside the app
- `pnpm`

## Getting Started

Install dependencies:

```bash
pnpm install
```

Run the app in development:

```bash
pnpm dev
```

Or use the alias:

```bash
pnpm start
```

Build the app:

```bash
pnpm build
```

Package Windows installers and portable builds:

```bash
pnpm dist:win
```

Build just the portable EXE:

```bash
pnpm dist:portable
```

## FFmpeg Setup

NamiStack tries to detect FFmpeg and FFprobe automatically. If that fails, open the Settings panel in the app and point it at:

- `ffmpeg.exe`
- `ffprobe.exe`

It will remember those paths locally.

## Project Branding

The name `NamiStack` comes from the Japanese word `nami` (`波`), meaning wave. It fits the media-processing theme without feeling overdesigned.

## Repository Layout

- `src/main` - Electron main process and FFmpeg plumbing
- `src/preload` - secure bridge into the renderer
- `src/renderer` - React UI
- `src/shared` - shared types and defaults
- `docs` - build notes, feature docs, and handoff material
- `assets/brand` - logo and icon assets

## Packaging

Windows packaging is configured in `package.json` with:

- NSIS installer output
- portable build output
- custom app icon

Build artifacts are written to `release/`.

For the GitHub Actions release flow, see `docs/RELEASE.md`.

## Status

The core FFmpeg workflow is implemented and the app is ready for packaging and release.
