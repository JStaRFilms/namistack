import { app } from 'electron';
import { promises as fs } from 'fs';
import path from 'path';
import { defaultSettings } from '../../shared/defaults';
import type { AppSettings } from '../../shared/types';

const settingsPath = () => path.join(app.getPath('userData'), 'settings.json');

let cachedSettings: AppSettings | null = null;

const normalizeSettings = (input: Partial<AppSettings> | null | undefined): AppSettings => ({
  ffmpegPath: input?.ffmpegPath?.trim() ?? '',
  ffprobePath: input?.ffprobePath?.trim() ?? ''
});

export const loadSettings = async (): Promise<AppSettings> => {
  if (cachedSettings) return cachedSettings;

  try {
    const raw = await fs.readFile(settingsPath(), 'utf8');
    cachedSettings = normalizeSettings(JSON.parse(raw));
    return cachedSettings;
  } catch {
    cachedSettings = defaultSettings;
    return cachedSettings;
  }
};

export const saveSettings = async (settings: AppSettings): Promise<AppSettings> => {
  const normalized = normalizeSettings(settings);
  await fs.mkdir(path.dirname(settingsPath()), { recursive: true });
  await fs.writeFile(settingsPath(), JSON.stringify(normalized, null, 2), 'utf8');
  cachedSettings = normalized;
  return normalized;
};
