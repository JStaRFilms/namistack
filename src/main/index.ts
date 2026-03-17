import { app, BrowserWindow } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { registerMediaHandlers } from './ipc/media';
import { registerWorkflowHandlers } from './ipc/workflow';

const currentDir = dirname(fileURLToPath(import.meta.url));

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 980,
    minHeight: 640,
    backgroundColor: '#0f1115',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(currentDir, '../preload/index.js')
    }
  });

  win.webContents.on('did-fail-load', (_event, code, description, validatedUrl) => {
    console.error('[ffmpegui] did-fail-load', { code, description, validatedUrl });
  });

  win.webContents.on('render-process-gone', (_event, details) => {
    console.error('[ffmpegui] render-process-gone', details);
  });

  win.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    console.log('[renderer]', { level, message, line, sourceId });
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    win.loadFile(join(currentDir, '../../out/renderer/index.html'));
  }
};

app.whenReady().then(() => {
  registerMediaHandlers();
  registerWorkflowHandlers();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
