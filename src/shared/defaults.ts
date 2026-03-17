import type { CommandPreview, JobSnapshot, WorkflowState } from './types';

export const defaultWorkflowState: WorkflowState = {
  action: 'shrink',
  clips: [],
  outputDirectory: '',
  outputName: '',
  shrink: {
    targetSizeMb: 45,
    audioBitrateKbps: 128,
    twoPass: true,
    videoCodec: 'libx264',
    audioCodec: 'aac',
    container: 'mp4'
  },
  convert: {
    container: 'mp4',
    videoCodec: 'libx264',
    audioCodec: 'aac',
    qualityMode: 'crf',
    crf: 22,
    videoBitrateKbps: 4500,
    audioBitrateKbps: 160,
    preset: 'medium'
  },
  merge: {
    container: 'mp4'
  },
  flags: []
};

export const emptyCommandPreview: CommandPreview = {
  executable: 'ffmpeg',
  outputPath: null,
  display: 'ffmpeg',
  warnings: ['Open one or more files to build a command.'],
  steps: []
};

export const emptyJobSnapshot: JobSnapshot = {
  status: 'idle',
  progress: 0,
  processedSeconds: 0,
  speed: '0x',
  logs: [],
  command: '',
  outputPath: null,
  warnings: [],
  error: null
};
