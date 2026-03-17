import { spawn } from 'child_process';
import { basename } from 'path';
import type { ClipMeta } from '../../shared/types';

type FfprobeStream = {
  codec_type?: string;
  codec_name?: string;
  width?: number;
  height?: number;
  duration?: string;
};

type FfprobeFormat = {
  duration?: string;
  size?: string;
};

type FfprobeOutput = {
  streams?: FfprobeStream[];
  format?: FfprobeFormat;
};

const formatDuration = (seconds: number | null) => {
  if (seconds === null || Number.isNaN(seconds)) return '—';
  const total = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const label = [hrs, mins, secs].map((value) => String(value).padStart(2, '0')).join(':');
  return label;
};

const formatBytes = (bytes: number | null) => {
  if (bytes === null || Number.isNaN(bytes)) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
};

const parseNumber = (value?: string) => {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseSize = (value?: string) => {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const runFfprobe = (filePath: string) => {
  const args = ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', filePath];
  return new Promise<string>((resolve, reject) => {
    const proc = spawn('ffprobe', args, { windowsHide: true });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    proc.on('error', (error) => reject(error));
    proc.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(stderr || `ffprobe exited with code ${code}`));
      }
    });
  });
};

const buildErrorClip = (filePath: string, message: string): ClipMeta => ({
  path: filePath,
  name: basename(filePath),
  durationSec: null,
  durationLabel: '—',
  resolution: '—',
  videoCodec: '—',
  sizeBytes: null,
  sizeLabel: '—',
  error: message
});

export const probeMedia = async (filePath: string): Promise<ClipMeta> => {
  try {
    const output = await runFfprobe(filePath);
    const parsed = JSON.parse(output) as FfprobeOutput;
    const streams = parsed.streams ?? [];
    const format = parsed.format ?? {};
    const videoStream = streams.find((stream) => stream.codec_type === 'video');
    const durationSec = parseNumber(format.duration) ?? parseNumber(videoStream?.duration);
    const sizeBytes = parseSize(format.size);
    const resolution = videoStream?.width && videoStream?.height
      ? `${videoStream.width}x${videoStream.height}`
      : '—';
    const videoCodec = videoStream?.codec_name ?? '—';

    return {
      path: filePath,
      name: basename(filePath),
      durationSec,
      durationLabel: formatDuration(durationSec),
      resolution,
      videoCodec,
      sizeBytes,
      sizeLabel: formatBytes(sizeBytes),
      error: null
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ffprobe failed';
    return buildErrorClip(filePath, message);
  }
};
