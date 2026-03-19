/// <reference types="vite/client" />

import type {
  AppSettings,
  CommandPreview,
  FfmpegCapabilities,
  JobSnapshot,
  JobUpdateListener,
  OpenFilesResult,
  WorkflowState
} from '../../shared/types';

declare global {
  interface Window {
    ffmpegUI: {
      openFiles: () => Promise<OpenFilesResult>;
      selectOutputDirectory: () => Promise<string | null>;
      selectBinary: () => Promise<string | null>;
      loadCapabilities: () => Promise<FfmpegCapabilities>;
      loadSettings: () => Promise<AppSettings>;
      saveSettings: (settings: AppSettings) => Promise<FfmpegCapabilities>;
      buildPreview: (state: WorkflowState) => Promise<CommandPreview>;
      runWorkflow: (state: WorkflowState) => Promise<JobSnapshot>;
      cancelWorkflow: () => Promise<JobSnapshot>;
      onJobUpdate: (listener: JobUpdateListener) => () => void;
    };
  }
}

export {};
