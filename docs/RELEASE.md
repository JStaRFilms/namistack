# NamiStack Release Guide

This project uses GitHub Actions to build the Windows portable EXE and publish a GitHub Release.

## What The Workflow Does

The release workflow lives in `.github/workflows/release.yml`.

When it runs, it:

- checks out the repo
- installs dependencies with `pnpm`
- regenerates brand assets
- builds the Electron app
- packages a Windows portable EXE
- uploads the EXE to the GitHub Release for the matching tag

## How To Trigger A Release

### Option 1: Push A Tag

This is the simplest path.

```bash
git tag v0.1.1
git push origin v0.1.1
```

That tag push triggers GitHub Actions automatically.

### Option 2: Run The Workflow Manually

You can also use the GitHub Actions tab and run the release workflow manually.

Enter the tag you want to publish, for example:

```text
v0.1.1
```

## Before Releasing

- Update the version in `package.json` if you want the artifact name to match the release number
- Run `pnpm typecheck`
- Run `pnpm build`
- Confirm the app starts with `pnpm dev`

## Local Portable Build

If you want to make the same portable EXE locally, run:

```bash
pnpm dist:portable
```

That produces a single-file Windows executable in `release/`.

## Where To Find The Output

- GitHub Release asset: `NamiStack-*-Portable.exe`
- Local portable output: `release/`

