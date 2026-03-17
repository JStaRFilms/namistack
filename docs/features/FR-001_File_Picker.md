# Feature Plan: FR-001 File Picker + Clip List With Metadata

## High-Level Goal
Enable users to pick one or more media files from a native dialog and render a clip list showing filename, duration, resolution, codec, and size.

## Component Breakdown

- Main (Electron)
  - IPC handler to open file dialog and return file metadata.
  - Media probe utility to call `ffprobe` (fallback to `ffmpeg -i`).
- Preload
  - Typed bridge method `openFiles()` that returns an array of clip metadata.
- Renderer (React)
  - `useClips` hook to store clip list and loading/error states.
  - `ClipTable` component for list rendering.
  - Wire the “Open Files” button to call `openFiles()`.

## Logic & Data Breakdown

- `ClipMeta`
  - `path`, `name`, `durationSec`, `durationLabel`, `resolution`, `videoCodec`, `sizeBytes`, `sizeLabel`.
- `openFiles()`
  - Returns `ClipMeta[]` or throws with a user-friendly error.
- Error flow
  - If probe fails, return per-clip error entries and surface in UI.

## Step-by-Step Implementation Plan

1. Main: add `src/main/ipc/media.ts` with `registerMediaHandlers()` and `openFiles` IPC handler.
2. Main: add `src/main/services/ffprobe.ts` to execute probe and parse JSON output.
3. Preload: expose `openFiles()` via `contextBridge` with proper typing.
4. Renderer: create `src/renderer/src/features/clips` with `useClips` hook + `ClipTable`.
5. Renderer: wire “Open Files” button to load clips and render results.
6. Add basic error surface in the clips section.

## Notes
- No drag-and-drop in this pass.
- Use PATH detection for `ffprobe` initially; config/override can come later.

## Approval Needed
Please confirm this plan before I start implementing FR-001.
