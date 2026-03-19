# Project Requirements Document

## Project Overview

**Name:** NamiStack
**Mission:** Local desktop UI for building and running FFmpeg commands with simple toggles for common tasks.
**Tech Stack:** Electron, React, TypeScript, Tailwind CSS, Node.js

## Functional Requirements

| FR ID | Description | User Story | Status |
| :--- | :--- | :--- | :--- |
| FR-001 | File picker + clip list with metadata | As a user, I want to open media files and see them in a list with basic metadata, so that I can choose inputs. | MUS |
| FR-002 | Shrink-to-size action builder | As a user, I want to target a final file size and let the app compute bitrate settings, so that I can shrink videos predictably. | MUS |
| FR-003 | Convert format action builder | As a user, I want to choose an output format and codec options, so that I can convert media reliably. | MUS |
| FR-004 | Lossless merge (concat) | As a user, I want to merge multiple clips into one lossless video, so that I can combine footage without re-encoding. | MUS |
| FR-005 | FFmpeg flags explorer with toggles | As a user, I want every FFmpeg flag exposed as a simple toggle (and value input when needed), so that I can customize commands without memorizing syntax. | MUS |
| FR-006 | Job execution, progress, and logs | As a user, I want to run jobs and see progress/logs, so that I can verify results and troubleshoot failures. | MUS |
| FR-007 | Presets and history | As a user, I want to save presets and view past jobs, so that I can repeat workflows quickly. | Future |
| FR-008 | Hardware acceleration profiles | As a user, I want to select hardware acceleration presets, so that I can speed up processing. | Future |
