import { dialog, ipcMain } from 'electron';
import type { AppSettings, WorkflowState } from '../../shared/types';
import { buildCommandPreview } from '../services/command-builder';
import { clearCapabilitiesCache, loadCapabilities } from '../services/ffmpeg';
import { cancelActiveJob, getJobSnapshot, runWorkflowJob } from '../services/job-runner';
import { loadSettings, saveSettings } from '../services/settings';

const binaryFilters = [
  {
    name: 'Executables',
    extensions: process.platform === 'win32' ? ['exe', 'cmd', 'bat'] : ['*']
  }
];

export const registerWorkflowHandlers = () => {
  ipcMain.handle('ffmpeg:capabilities', async () => loadCapabilities());

  ipcMain.handle('settings:load', async () => loadSettings());

  ipcMain.handle('settings:save', async (_event, settings: AppSettings) => {
    await saveSettings(settings);
    clearCapabilitiesCache();
    return loadCapabilities();
  });

  ipcMain.handle('ffmpeg:preview', async (_event, state: WorkflowState) => {
    const capabilities = await loadCapabilities();
    return buildCommandPreview(state, capabilities.ffmpegPath ?? 'ffmpeg');
  });

  ipcMain.handle('ffmpeg:run', async (_event, state: WorkflowState) => {
    return runWorkflowJob(state);
  });

  ipcMain.handle('ffmpeg:cancel', async () => {
    cancelActiveJob();
    return getJobSnapshot();
  });

  ipcMain.handle('dialog:selectOutputDirectory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  ipcMain.handle('dialog:selectBinary', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: binaryFilters
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });
};
