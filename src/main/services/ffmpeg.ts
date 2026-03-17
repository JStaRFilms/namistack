import { spawn } from 'child_process';
import type { FfmpegCapabilities, FlagDefinition } from '../../shared/types';

const fallbackFlags: FlagDefinition[] = [
  {
    name: '-movflags',
    description: 'Set container flags such as faststart.',
    category: 'muxing',
    takesValue: true,
    placeholder: 'faststart'
  },
  {
    name: '-pix_fmt',
    description: 'Set output pixel format.',
    category: 'video',
    takesValue: true,
    placeholder: 'yuv420p'
  },
  {
    name: '-vf',
    description: 'Set video filtergraph.',
    category: 'video',
    takesValue: true,
    placeholder: 'scale=1920:-2'
  },
  {
    name: '-af',
    description: 'Set audio filtergraph.',
    category: 'audio',
    takesValue: true,
    placeholder: 'loudnorm'
  },
  {
    name: '-shortest',
    description: 'Stop muxing at the end of the shortest stream.',
    category: 'timing',
    takesValue: false
  }
];

const runBinary = (binary: string, args: string[]) =>
  new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const proc = spawn(binary, args, { windowsHide: true });
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('error', (error) => {
      reject(error);
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      if (stdout || stderr) {
        resolve({ stdout, stderr });
        return;
      }

      reject(new Error(`${binary} exited with code ${code}`));
    });
  });

const detectBinary = async (binary: string) => {
  try {
    const result = await runBinary(binary, ['-version']);
    const versionLine = `${result.stdout}\n${result.stderr}`.split(/\r?\n/).find(Boolean) ?? '';
    return {
      path: binary,
      version: versionLine.trim()
    };
  } catch {
    return {
      path: null,
      version: ''
    };
  }
};

const inferCategory = (name: string, description: string) => {
  const lowerName = name.toLowerCase();
  const lowerDescription = description.toLowerCase();

  if (lowerName.includes('a') || lowerDescription.includes('audio')) return 'audio';
  if (lowerName.includes('v') || lowerDescription.includes('video')) return 'video';
  if (lowerDescription.includes('subtitle')) return 'subtitle';
  if (lowerDescription.includes('metadata')) return 'metadata';
  if (lowerDescription.includes('filter')) return 'filters';
  return 'general';
};

const inferTakesValue = (name: string, description: string) => {
  if (['-shortest', '-y', '-n', '-copyts'].includes(name)) return false;

  const lowerDescription = description.toLowerCase();
  if (!description) return false;
  if (lowerDescription.startsWith('set ')) return true;
  if (description.includes('<') || description.includes('=')) return true;
  if (/(specify|select|force|set|use)\b/i.test(description)) return true;
  return false;
};

const parseFlags = (rawHelp: string) => {
  const map = new Map<string, FlagDefinition>();
  const lines = rawHelp.split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(/^\s*(-[\w:.]+)\s+(.*)$/);
    if (!match) continue;

    const [, name, description] = match;
    if (map.has(name)) continue;

    map.set(name, {
      name,
      description: description.trim(),
      category: inferCategory(name, description),
      takesValue: inferTakesValue(name, description)
    });
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
};

const readFlags = async (binary: string) => {
  try {
    const result = await runBinary(binary, ['-hide_banner', '-h', 'full']);
    const parsed = parseFlags(`${result.stdout}\n${result.stderr}`);
    return parsed.length > 0 ? parsed : fallbackFlags;
  } catch {
    return fallbackFlags;
  }
};

const readHwaccels = async (binary: string) => {
  try {
    const result = await runBinary(binary, ['-hide_banner', '-hwaccels']);
    return `${result.stdout}\n${result.stderr}`
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && line !== 'Hardware acceleration methods:');
  } catch {
    return [];
  }
};

let cachedCapabilities: FfmpegCapabilities | null = null;

export const loadCapabilities = async (): Promise<FfmpegCapabilities> => {
  if (cachedCapabilities) return cachedCapabilities;

  const ffmpeg = await detectBinary('ffmpeg');
  const ffprobe = await detectBinary('ffprobe');

  if (!ffmpeg.path) {
    cachedCapabilities = {
      status: 'missing',
      ffmpegPath: null,
      ffprobePath: ffprobe.path,
      flags: fallbackFlags,
      hwaccels: [],
      version: ''
    };
    return cachedCapabilities;
  }

  const [flags, hwaccels] = await Promise.all([
    readFlags(ffmpeg.path),
    readHwaccels(ffmpeg.path)
  ]);

  cachedCapabilities = {
    status: 'ready',
    ffmpegPath: ffmpeg.path,
    ffprobePath: ffprobe.path,
    flags,
    hwaccels,
    version: ffmpeg.version
  };

  return cachedCapabilities;
};

export const clearCapabilitiesCache = () => {
  cachedCapabilities = null;
};
