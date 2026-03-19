import { contextBridge, ipcRenderer } from 'electron';
import type {
  AppSettings,
  CommandPreview,
  FfmpegCapabilities,
  JobSnapshot,
  JobUpdateListener,
  OpenFilesResult,
  WorkflowState
} from '../shared/types';

contextBridge.exposeInMainWorld('ffmpegUI', {
  openFiles: (): Promise<OpenFilesResult> => ipcRenderer.invoke('media:open'),
  selectOutputDirectory: (): Promise<string | null> => ipcRenderer.invoke('dialog:selectOutputDirectory'),
  selectBinary: (): Promise<string | null> => ipcRenderer.invoke('dialog:selectBinary'),
  loadCapabilities: (): Promise<FfmpegCapabilities> => ipcRenderer.invoke('ffmpeg:capabilities'),
  loadSettings: (): Promise<AppSettings> => ipcRenderer.invoke('settings:load'),
  saveSettings: (settings: AppSettings): Promise<FfmpegCapabilities> => ipcRenderer.invoke('settings:save', settings),
  buildPreview: (state: WorkflowState): Promise<CommandPreview> => ipcRenderer.invoke('ffmpeg:preview', state),
  runWorkflow: (state: WorkflowState): Promise<JobSnapshot> => ipcRenderer.invoke('ffmpeg:run', state),
  cancelWorkflow: (): Promise<JobSnapshot> => ipcRenderer.invoke('ffmpeg:cancel'),
  onJobUpdate: (listener: JobUpdateListener) => {
    const wrapped = (_event: unknown, snapshot: JobSnapshot) => listener(snapshot);
    ipcRenderer.on('job:update', wrapped);
    return () => {
      ipcRenderer.removeListener('job:update', wrapped);
    };
  }
});
