export type ClipMeta = {
  path: string;
  name: string;
  durationSec: number | null;
  durationLabel: string;
  resolution: string;
  videoCodec: string;
  sizeBytes: number | null;
  sizeLabel: string;
  error?: string | null;
};

export type OpenFilesResult = ClipMeta[];

export type ActionKind = 'shrink' | 'convert' | 'merge';

export type ShrinkSettings = {
  targetSizeMb: number;
  audioBitrateKbps: number;
  twoPass: boolean;
  videoCodec: string;
  audioCodec: string;
  container: string;
};

export type ConvertSettings = {
  container: string;
  videoCodec: string;
  audioCodec: string;
  qualityMode: 'crf' | 'bitrate' | 'copy';
  crf: number;
  videoBitrateKbps: number;
  audioBitrateKbps: number;
  preset: string;
};

export type MergeSettings = {
  container: string;
};

export type SelectedFlag = {
  name: string;
  enabled: boolean;
  value: string;
};

export type FlagDefinition = {
  name: string;
  description: string;
  category: string;
  takesValue: boolean;
  placeholder?: string;
};

export type AppSettings = {
  ffmpegPath: string;
  ffprobePath: string;
};

export type WorkflowState = {
  action: ActionKind;
  clips: ClipMeta[];
  outputDirectory: string;
  outputName: string;
  shrink: ShrinkSettings;
  convert: ConvertSettings;
  merge: MergeSettings;
  flags: SelectedFlag[];
};

export type CommandStep = {
  label: string;
  args: string[];
};

export type CommandPreview = {
  executable: string;
  outputPath: string | null;
  display: string;
  warnings: string[];
  steps: CommandStep[];
};

export type CapabilityStatus = 'ready' | 'missing';

export type FfmpegCapabilities = {
  status: CapabilityStatus;
  ffmpegPath: string | null;
  ffprobePath: string | null;
  flags: FlagDefinition[];
  hwaccels: string[];
  version: string;
  source: 'auto' | 'manual';
  settings: AppSettings;
};

export type JobStatus = 'idle' | 'running' | 'success' | 'error' | 'cancelled';

export type JobSnapshot = {
  status: JobStatus;
  progress: number;
  processedSeconds: number;
  speed: string;
  logs: string[];
  command: string;
  outputPath: string | null;
  warnings: string[];
  error: string | null;
};

export type JobUpdateListener = (snapshot: JobSnapshot) => void;
