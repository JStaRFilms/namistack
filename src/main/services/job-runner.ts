import { BrowserWindow } from 'electron';
import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import type { JobSnapshot, WorkflowState } from '../../shared/types';
import { emptyJobSnapshot } from '../../shared/defaults';
import { cleanupArtifacts, prepareExecution } from './command-builder';
import { loadCapabilities } from './ffmpeg';

const JOB_UPDATE_CHANNEL = 'job:update';

type ActiveJob = {
  process: ChildProcessWithoutNullStreams | null;
  snapshot: JobSnapshot;
  cancelled: boolean;
};

let activeJob: ActiveJob | null = null;

const emitJobUpdate = (snapshot: JobSnapshot) => {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(JOB_UPDATE_CHANNEL, snapshot);
  }
};

const pushLog = (snapshot: JobSnapshot, line: string) => {
  if (!line.trim()) return snapshot;
  const logs = [...snapshot.logs, line].slice(-200);
  return { ...snapshot, logs };
};

const parseProgress = (
  snapshot: JobSnapshot,
  line: string,
  totalDurationSec: number,
  completedSteps: number,
  totalSteps: number
) => {
  const [key, rawValue] = line.split('=');
  if (!key || rawValue === undefined) return snapshot;

  if (key === 'out_time_ms') {
    const seconds = Number(rawValue) / 1_000_000;
    const stepRatio = totalDurationSec > 0 ? Math.min(seconds / totalDurationSec, 1) : 0;
    const progress = Math.min((completedSteps + stepRatio) / Math.max(totalSteps, 1), 1);
    return { ...snapshot, processedSeconds: seconds, progress };
  }

  if (key === 'speed') {
    return { ...snapshot, speed: rawValue };
  }

  return snapshot;
};

const runStep = async (
  executable: string,
  stepArgs: string[],
  totalDurationSec: number,
  stepIndex: number,
  stepCount: number
) =>
  new Promise<void>((resolve, reject) => {
    const args = ['-progress', 'pipe:1', '-nostats', ...stepArgs];
    const proc = spawn(executable, args, { windowsHide: true });

    if (!activeJob) {
      proc.kill();
      reject(new Error('Job runner became unavailable.'));
      return;
    }

    activeJob.process = proc;
    activeJob.snapshot = {
      ...activeJob.snapshot,
      command: `${executable} ${args.join(' ')}`,
      status: 'running'
    };
    emitJobUpdate(activeJob.snapshot);

    let stdoutBuffer = '';
    let stderrBuffer = '';

    proc.stdout.on('data', (chunk) => {
      stdoutBuffer += chunk.toString();
      const lines = stdoutBuffer.split(/\r?\n/);
      stdoutBuffer = lines.pop() ?? '';

      if (!activeJob) return;

      for (const line of lines) {
        activeJob.snapshot = parseProgress(activeJob.snapshot, line, totalDurationSec, stepIndex, stepCount);
      }

      emitJobUpdate(activeJob.snapshot);
    });

    proc.stderr.on('data', (chunk) => {
      stderrBuffer += chunk.toString();
      const lines = stderrBuffer.split(/\r?\n/);
      stderrBuffer = lines.pop() ?? '';

      if (!activeJob) return;

      for (const line of lines) {
        activeJob.snapshot = pushLog(activeJob.snapshot, line);
      }

      emitJobUpdate(activeJob.snapshot);
    });

    proc.on('error', (error) => {
      reject(error);
    });

    proc.on('close', (code) => {
      if (activeJob?.cancelled) {
        resolve();
        return;
      }

      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(stderrBuffer || `FFmpeg exited with code ${code}`));
    });
  });

export const getJobSnapshot = () => activeJob?.snapshot ?? emptyJobSnapshot;

export const cancelActiveJob = () => {
  if (!activeJob?.process) return false;
  activeJob.cancelled = true;
  activeJob.process.kill();
  activeJob.snapshot = {
    ...activeJob.snapshot,
    status: 'cancelled',
    error: 'Cancelled by user.'
  };
  emitJobUpdate(activeJob.snapshot);
  return true;
};

export const runWorkflowJob = async (state: WorkflowState) => {
  if (activeJob?.snapshot.status === 'running') {
    throw new Error('A job is already running.');
  }

  const capabilities = await loadCapabilities();
  if (capabilities.status !== 'ready' || !capabilities.ffmpegPath) {
    throw new Error('FFmpeg was not found on PATH.');
  }

  const prepared = await prepareExecution(state, capabilities.ffmpegPath, false);
  if (prepared.steps.length === 0) {
    throw new Error(prepared.preview.warnings[0] ?? 'No FFmpeg command could be created.');
  }

  activeJob = {
    process: null,
    cancelled: false,
    snapshot: {
      ...emptyJobSnapshot,
      status: 'running',
      warnings: prepared.preview.warnings,
      outputPath: prepared.preview.outputPath,
      command: prepared.preview.display
    }
  };
  emitJobUpdate(activeJob.snapshot);

  try {
    for (const [index, step] of prepared.steps.entries()) {
      if (activeJob?.cancelled) {
        break;
      }

      await runStep(
        capabilities.ffmpegPath,
        step.args,
        prepared.totalDurationSec,
        index,
        prepared.steps.length
      );
    }

    if (!activeJob.cancelled) {
      activeJob.snapshot = {
        ...activeJob.snapshot,
        status: 'success',
        progress: 1,
        error: null
      };
      emitJobUpdate(activeJob.snapshot);
    }
  } catch (error) {
    if (activeJob && !activeJob.cancelled) {
      activeJob.snapshot = {
        ...activeJob.snapshot,
        status: 'error',
        error: error instanceof Error ? error.message : 'FFmpeg job failed.'
      };
      emitJobUpdate(activeJob.snapshot);
    }
    throw error;
  } finally {
    await cleanupArtifacts(prepared.cleanup);
    activeJob = activeJob
      ? {
          ...activeJob,
          process: null
        }
      : null;
  }

  return getJobSnapshot();
};

export const jobUpdateChannel = JOB_UPDATE_CHANNEL;
