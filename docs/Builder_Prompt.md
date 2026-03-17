# Builder Prompt

## Stack-Specific Instructions

- Build as a desktop app with Electron + React + TypeScript + Tailwind CSS.
- Use the main process to spawn `ffmpeg` and capture stderr for progress parsing.
- Use a preload script + IPC for file dialogs, running jobs, and streaming logs to the renderer.
- Autodetect `ffmpeg` from PATH on startup and allow manual override in settings.

## MUS Priority Order

1. FR-001: File picker + clip list with metadata
2. FR-002: Shrink-to-size action builder
3. FR-003: Convert format action builder
4. FR-004: Lossless merge (concat)
5. FR-005: FFmpeg flags explorer with toggles
6. FR-006: Job execution, progress, and logs

## Special Considerations

- Lossless merge should use the concat demuxer and validate matching codecs, frame rate, and dimensions.
- The “every flag is a toggle” requirement should parse `ffmpeg -h` / `ffmpeg -h full` output and expose flags with value inputs where required.
- Handle Windows path quoting consistently when building commands.
- Always show the generated command and allow copy-to-clipboard.
