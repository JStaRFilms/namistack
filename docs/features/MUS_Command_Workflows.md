# MUS Command Workflows

## Overview
The desktop app now covers the full MUS workflow after file intake: shrink-to-size, format conversion, lossless merge, advanced FFmpeg flag toggles, and live job execution with progress/log streaming. The UI stays intentionally industrial and editorial, with hard surfaces, restrained corners, and no glassmorphism.

## Architecture
- Main process
  - `src/main/services/ffmpeg.ts`: detects `ffmpeg` and `ffprobe`, reads version info, indexes flags from `ffmpeg -h full`, and captures hardware acceleration options.
  - `src/main/services/command-builder.ts`: turns `WorkflowState` into command previews and executable steps, including two-pass shrink jobs and concat-list generation for merges.
  - `src/main/services/job-runner.ts`: runs FFmpeg, parses `-progress pipe:1`, streams logs, supports cancel, and cleans up temp files.
  - `src/main/ipc/workflow.ts`: exposes capabilities, preview generation, job start/cancel, and output-directory dialogs to the renderer.
- Shared
  - `src/shared/types.ts`: shared media, workflow, flag, preview, and job types.
  - `src/shared/defaults.ts`: default action settings and empty states.
- Renderer
  - `src/renderer/src/features/workflow/useWorkflow.ts`: owns app state, capability loading, live preview refresh, and job subscriptions.
  - `src/renderer/src/features/workflow/*.tsx`: modular panels for actions, settings, flags, command preview, and job console.

## Data Flow
1. The renderer loads FFmpeg capabilities and opens media files through preload IPC.
2. Any change to workflow state triggers a fresh command preview from the main-process builder.
3. Running a job reuses the same builder output, then the job runner emits live progress snapshots back to the renderer.
4. The renderer updates the command panel and job console from those snapshots without constructing FFmpeg args on the client.

## Implementation Notes
- Shrink-to-size computes bitrate from target size, duration, and audio bitrate, with optional two-pass execution.
- Convert supports CRF, bitrate mode, and full stream-copy.
- Merge uses concat demuxer plus compatibility warnings for mixed resolution or codec inputs.
- Advanced flags are parsed dynamically, searchable in the UI, and stored as toggle-plus-value pairs.

## Verification
- `npx tsc --noEmit`
- `pnpm build`
- `python scripts/vibe-verify.py`

## Hotfixes
### 2026-03-17: Electron and Tailwind boot fixes
- Corrected Electron dev startup to use `ELECTRON_RENDERER_URL` and the emitted preload `.mjs` file.
- Swapped Tailwind v4 PostCSS setup to `@tailwindcss/postcss`.
- Normalized the verification script output for Windows console encoding.
