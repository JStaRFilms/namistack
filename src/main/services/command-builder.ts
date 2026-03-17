import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import type {
  ClipMeta,
  CommandPreview,
  CommandStep,
  SelectedFlag,
  WorkflowState
} from '../../shared/types';
import { emptyCommandPreview } from '../../shared/defaults';

type CleanupTarget =
  | { kind: 'file'; target: string }
  | { kind: 'prefix'; target: string };

export type PreparedExecution = {
  preview: CommandPreview;
  steps: CommandStep[];
  cleanup: CleanupTarget[];
  totalDurationSec: number;
};

type StepBuildResult = {
  warnings: string[];
  steps: CommandStep[];
  cleanup: CleanupTarget[];
};

const quote = (value: string) => {
  if (!value) return '""';
  return /\s/.test(value) ? `"${value.replace(/"/g, '\\"')}"` : value;
};

const selectedInputClips = (clips: ClipMeta[]) => clips.filter((clip) => !clip.error);

const appendFlags = (args: string[], flags: SelectedFlag[]) => {
  for (const flag of flags) {
    if (!flag.enabled) continue;
    args.push(flag.name);
    if (flag.value.trim()) {
      args.push(flag.value.trim());
    }
  }
};

const resolveExtension = (state: WorkflowState) => {
  switch (state.action) {
    case 'shrink':
      return state.shrink.container;
    case 'convert':
      return state.convert.container;
    case 'merge':
      return state.merge.container;
  }
};

const buildDefaultName = (state: WorkflowState, clips: ClipMeta[]) => {
  const base = clips[0]?.name.replace(/\.[^.]+$/, '') || 'output';
  switch (state.action) {
    case 'shrink':
      return `${base}-shrunk`;
    case 'convert':
      return `${base}-converted`;
    case 'merge':
      return `${base}-merged`;
  }
};

const resolveOutputPath = (state: WorkflowState, clips: ClipMeta[]) => {
  const fallbackDirectory =
    state.outputDirectory || (clips[0] ? path.dirname(clips[0].path) : '');
  const extension = resolveExtension(state);
  const explicitName = state.outputName.trim() || buildDefaultName(state, clips);
  const fileName = explicitName.endsWith(`.${extension}`) ? explicitName : `${explicitName}.${extension}`;

  return fallbackDirectory ? path.join(fallbackDirectory, fileName) : null;
};

const totalDuration = (clips: ClipMeta[]) =>
  clips.reduce((total, clip) => total + (clip.durationSec ?? 0), 0);

const buildDisplay = (executable: string, steps: CommandStep[]) =>
  steps
    .map((step) => [quote(executable), ...step.args.map(quote)].join(' '))
    .join('\n\n');

const shrinkBitrate = (durationSec: number, targetSizeMb: number, audioBitrateKbps: number) => {
  const targetKilobits = targetSizeMb * 8192;
  const audioKilobits = audioBitrateKbps * durationSec;
  const videoKbps = Math.floor((targetKilobits - audioKilobits) / Math.max(durationSec, 1));
  return Math.max(videoKbps, 150);
};

const shrinkSteps = (
  state: WorkflowState,
  input: ClipMeta,
  outputPath: string,
  previewMode: boolean
): StepBuildResult => {
  const warnings: string[] = [];
  const durationSec = input.durationSec ?? 0;

  if (!durationSec) {
    warnings.push('Duration could not be read, so shrink-to-size cannot estimate output accurately.');
  }

  if (state.shrink.targetSizeMb < 5) {
    warnings.push('Very small targets can look poor or fail on longer clips.');
  }

  const videoBitrate = shrinkBitrate(durationSec || 1, state.shrink.targetSizeMb, state.shrink.audioBitrateKbps);
  const baseArgs = [
    '-y',
    '-i',
    input.path,
    '-c:v',
    state.shrink.videoCodec,
    '-b:v',
    `${videoBitrate}k`,
    '-maxrate',
    `${videoBitrate}k`,
    '-bufsize',
    `${videoBitrate * 2}k`,
    '-c:a',
    state.shrink.audioCodec,
    '-b:a',
    `${state.shrink.audioBitrateKbps}k`
  ];

  if (!state.shrink.twoPass) {
    const args = [...baseArgs];
    appendFlags(args, state.flags);
    args.push(outputPath);

    return {
      warnings,
      steps: [{ label: 'encode', args }],
      cleanup: [] as CleanupTarget[]
    };
  }

  const passLogBase = previewMode
    ? '<ffmpegui-passlog>'
    : path.join(os.tmpdir(), `ffmpegui-pass-${randomUUID()}`);
  const nullSink = process.platform === 'win32' ? 'NUL' : '/dev/null';

  const firstPass = [...baseArgs, '-pass', '1', '-passlogfile', passLogBase, '-an', '-f', 'null', nullSink];
  const secondPass = [...baseArgs, '-pass', '2', '-passlogfile', passLogBase];
  appendFlags(secondPass, state.flags);
  secondPass.push(outputPath);

  return {
    warnings,
    steps: [
      { label: 'pass 1', args: firstPass },
      { label: 'pass 2', args: secondPass }
    ],
    cleanup: previewMode ? [] : [{ kind: 'prefix', target: passLogBase }]
  };
};

const convertSteps = (state: WorkflowState, input: ClipMeta, outputPath: string): StepBuildResult => {
  const warnings: string[] = [];
  const args = ['-y', '-i', input.path];

  if (state.convert.qualityMode === 'copy') {
    args.push('-c', 'copy');
  } else {
    args.push('-c:v', state.convert.videoCodec, '-c:a', state.convert.audioCodec);
    if (state.convert.qualityMode === 'crf') {
      args.push('-crf', String(state.convert.crf), '-preset', state.convert.preset);
    } else {
      args.push(
        '-b:v',
        `${state.convert.videoBitrateKbps}k`,
        '-b:a',
        `${state.convert.audioBitrateKbps}k`
      );
    }
  }

  if (state.convert.container === 'mp4' && state.convert.videoCodec === 'libx264') {
    warnings.push('Use -movflags faststart if the file will be streamed on the web.');
  }

  appendFlags(args, state.flags);
  args.push(outputPath);

  return {
    warnings,
    steps: [{ label: 'convert', args }],
    cleanup: [] as CleanupTarget[]
  };
};

const escapeConcatPath = (filePath: string) => filePath.replace(/'/g, "'\\''");

const validateMerge = (clips: ClipMeta[]) => {
  const warnings: string[] = [];
  const [first] = clips;

  if (!first) return warnings;

  for (const clip of clips.slice(1)) {
    if (clip.resolution !== first.resolution) {
      warnings.push('Merge inputs have mixed resolutions. Lossless concat may fail.');
      break;
    }
  }

  for (const clip of clips.slice(1)) {
    if (clip.videoCodec !== first.videoCodec) {
      warnings.push('Merge inputs have mixed codecs. FFmpeg may reject -c copy.');
      break;
    }
  }

  return warnings;
};

const mergeSteps = async (
  state: WorkflowState,
  clips: ClipMeta[],
  outputPath: string,
  previewMode: boolean
): Promise<StepBuildResult> => {
  const warnings = validateMerge(clips);
  const concatBody = clips.map((clip) => `file '${escapeConcatPath(clip.path)}'`).join('\n');
  let concatPath = '<concat-list.txt>';
  const cleanup: CleanupTarget[] = [];

  if (!previewMode) {
    concatPath = path.join(os.tmpdir(), `ffmpegui-concat-${randomUUID()}.txt`);
    await fs.writeFile(concatPath, concatBody, 'utf8');
    cleanup.push({ kind: 'file', target: concatPath });
  }

  const args = ['-y', '-f', 'concat', '-safe', '0', '-i', concatPath, '-c', 'copy'];
  appendFlags(args, state.flags);
  args.push(outputPath);

  return {
    warnings,
    steps: [{ label: 'merge', args }],
    cleanup
  };
};

export const buildCommandPreview = async (
  state: WorkflowState,
  executable = 'ffmpeg'
): Promise<CommandPreview> => {
  const prepared = await prepareExecution(state, executable, true);
  return prepared.preview;
};

export const prepareExecution = async (
  state: WorkflowState,
  executable = 'ffmpeg',
  previewMode = false
): Promise<PreparedExecution> => {
  const clips = selectedInputClips(state.clips);

  if (clips.length === 0) {
    return {
      preview: emptyCommandPreview,
      steps: [],
      cleanup: [],
      totalDurationSec: 0
    };
  }

  const outputPath = resolveOutputPath(state, clips);
  const warnings: string[] = [];

  if (!outputPath) {
    return {
      preview: {
        ...emptyCommandPreview,
        warnings: ['Choose an output directory before running the job.']
      },
      steps: [],
      cleanup: [],
      totalDurationSec: totalDuration(clips)
    };
  }

  let result: StepBuildResult = {
    warnings: [],
    steps: [],
    cleanup: []
  };

  if (state.action === 'shrink') {
    result = shrinkSteps(state, clips[0], outputPath, previewMode);
  } else if (state.action === 'convert') {
    result = convertSteps(state, clips[0], outputPath);
  } else if (clips.length >= 2) {
    result = await mergeSteps(state, clips, outputPath, previewMode);
  } else {
    warnings.push('Select at least two clips for lossless merge.');
  }

  warnings.push(...result.warnings);

  const preview: CommandPreview = {
    executable,
    outputPath,
    display: buildDisplay(executable, result.steps),
    warnings,
    steps: result.steps
  };

  return {
    preview,
    steps: result.steps,
    cleanup: result.cleanup,
    totalDurationSec: state.action === 'merge' ? totalDuration(clips) : clips[0].durationSec ?? totalDuration(clips)
  };
};

export const cleanupArtifacts = async (targets: CleanupTarget[]) => {
  await Promise.all(
    targets.map(async (target) => {
      try {
        if (target.kind === 'file') {
          await fs.rm(target.target, { force: true });
          return;
        }

        const directory = path.dirname(target.target);
        const basename = path.basename(target.target);
        const entries = await fs.readdir(directory);
        await Promise.all(
          entries
            .filter((entry) => entry.startsWith(basename))
            .map((entry) => fs.rm(path.join(directory, entry), { force: true }))
        );
      } catch {
        return;
      }
    })
  );
};
