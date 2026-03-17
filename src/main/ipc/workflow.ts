import { dialog, ipcMain } from 'electron';
import type { WorkflowState } from '../../shared/types';
import { buildCommandPreview } from '../services/command-builder';
import { loadCapabilities } from '../services/ffmpeg';
import { cancelActiveJob, getJobSnapshot, runWorkflowJob } from '../services/job-runner';

export const registerWorkflowHandlers = () => {
  ipcMain.handle('ffmpeg:capabilities', async () => loadCapabilities());

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
};
