import { dialog, ipcMain } from 'electron';
import { probeMedia } from '../services/ffprobe';
import type { OpenFilesResult } from '../../shared/types';

const mediaFilters = [
  {
    name: 'Media',
    extensions: ['mp4', 'mov', 'mkv', 'mp3', 'wav', 'avi', 'webm']
  }
];

export const registerMediaHandlers = () => {
  ipcMain.handle('media:open', async (): Promise<OpenFilesResult> => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: mediaFilters
    });

    if (canceled || filePaths.length === 0) return [];

    const results = await Promise.all(filePaths.map((filePath) => probeMedia(filePath)));
    return results;
  });
};
