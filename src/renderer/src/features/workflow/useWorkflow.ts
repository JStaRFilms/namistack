import { startTransition, useEffect, useState } from 'react';
import {
  defaultSettings,
  defaultWorkflowState,
  emptyCommandPreview,
  emptyJobSnapshot
} from '../../../../shared/defaults';
import type {
  ActionKind,
  AppSettings,
  ClipMeta,
  CommandPreview,
  ConvertSettings,
  FfmpegCapabilities,
  JobSnapshot,
  MergeSettings,
  SelectedFlag,
  ShrinkSettings,
  WorkflowState
} from '../../../../shared/types';

const dirname = (filePath: string) => {
  const slash = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
  return slash >= 0 ? filePath.slice(0, slash) : '';
};

const nextWorkflowAfterClips = (current: WorkflowState, clips: ClipMeta[]): WorkflowState => {
  if (clips.length === 0) return current;

  const mergedClips = [...current.clips];

  for (const clip of clips) {
    const existingIndex = mergedClips.findIndex((currentClip) => currentClip.path === clip.path);
    if (existingIndex >= 0) {
      mergedClips[existingIndex] = clip;
    } else {
      mergedClips.push(clip);
    }
  }

  const outputDirectory = current.outputDirectory || dirname(mergedClips[0].path);
  return {
    ...current,
    clips: mergedClips,
    outputDirectory
  };
};

export const useWorkflow = () => {
  const [workflow, setWorkflow] = useState<WorkflowState>(defaultWorkflowState);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [capabilities, setCapabilities] = useState<FfmpegCapabilities | null>(null);
  const [preview, setPreview] = useState<CommandPreview>(emptyCommandPreview);
  const [job, setJob] = useState<JobSnapshot>(emptyJobSnapshot);
  const [busy, setBusy] = useState({
    capabilities: true,
    preview: false,
    fileDialog: false,
    run: false
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([window.ffmpegUI.loadSettings(), window.ffmpegUI.loadCapabilities()])
      .then(([loadedSettings, result]) => {
        if (!active) return;
        startTransition(() => {
          setSettings(loadedSettings);
          setCapabilities(result);
          setBusy((current) => ({ ...current, capabilities: false }));
        });
      })
      .catch((err) => {
        if (!active) return;
        setBusy((current) => ({ ...current, capabilities: false }));
        setError(err instanceof Error ? err.message : 'Failed to load FFmpeg capabilities.');
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const unsubscribe = window.ffmpegUI.onJobUpdate((snapshot) => {
      startTransition(() => {
        setJob(snapshot);
        setBusy((current) => ({ ...current, run: snapshot.status === 'running' }));
      });
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!capabilities) return;
    let active = true;
    setBusy((current) => ({ ...current, preview: true }));

    window.ffmpegUI
      .buildPreview(workflow)
      .then((nextPreview) => {
        if (!active) return;
        startTransition(() => {
          setPreview(nextPreview);
          setBusy((current) => ({ ...current, preview: false }));
        });
      })
      .catch((err) => {
        if (!active) return;
        setBusy((current) => ({ ...current, preview: false }));
        setError(err instanceof Error ? err.message : 'Failed to build the FFmpeg command.');
      });

    return () => {
      active = false;
    };
  }, [workflow, capabilities]);

  const openFiles = async () => {
    setBusy((current) => ({ ...current, fileDialog: true }));
    setError(null);
    try {
      const clips = await window.ffmpegUI.openFiles();
      setWorkflow((current) => nextWorkflowAfterClips(current, clips));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open files.');
    } finally {
      setBusy((current) => ({ ...current, fileDialog: false }));
    }
  };

  const selectOutputDirectory = async () => {
    const selected = await window.ffmpegUI.selectOutputDirectory();
    if (!selected) return;
    setWorkflow((current) => ({ ...current, outputDirectory: selected }));
  };

  const updateSettings = (patch: Partial<AppSettings>) => {
    setSettings((current) => ({
      ...current,
      ...patch
    }));
  };

  const browseBinary = async (target: keyof AppSettings) => {
    const selected = await window.ffmpegUI.selectBinary();
    if (!selected) return;
    updateSettings({ [target]: selected });
  };

  const saveAppSettings = async () => {
    setBusy((current) => ({ ...current, capabilities: true }));
    setError(null);
    try {
      const nextCapabilities = await window.ffmpegUI.saveSettings(settings);
      startTransition(() => {
        setCapabilities(nextCapabilities);
        setSettings(nextCapabilities.settings);
        setBusy((current) => ({ ...current, capabilities: false }));
      });
    } catch (err) {
      setBusy((current) => ({ ...current, capabilities: false }));
      setError(err instanceof Error ? err.message : 'Failed to save settings.');
    }
  };

  const setAction = (action: ActionKind) => {
    setWorkflow((current) => ({ ...current, action }));
  };

  const updateShrink = (patch: Partial<ShrinkSettings>) => {
    setWorkflow((current) => ({ ...current, shrink: { ...current.shrink, ...patch } }));
  };

  const updateConvert = (patch: Partial<ConvertSettings>) => {
    setWorkflow((current) => ({ ...current, convert: { ...current.convert, ...patch } }));
  };

  const updateMerge = (patch: Partial<MergeSettings>) => {
    setWorkflow((current) => ({ ...current, merge: { ...current.merge, ...patch } }));
  };

  const updateOutput = (patch: Partial<Pick<WorkflowState, 'outputDirectory' | 'outputName'>>) => {
    setWorkflow((current) => ({ ...current, ...patch }));
  };

  const setFlagEnabled = (flagName: string, enabled: boolean) => {
    setWorkflow((current) => {
      const existing = current.flags.find((flag) => flag.name === flagName);
      let flags: SelectedFlag[];

      if (existing) {
        flags = current.flags.map((flag) =>
          flag.name === flagName
            ? {
                ...flag,
                enabled
              }
            : flag
        );
      } else {
        flags = [...current.flags, { name: flagName, enabled, value: '' }];
      }

      return { ...current, flags };
    });
  };

  const setFlagValue = (flagName: string, value: string) => {
    setWorkflow((current) => ({
      ...current,
      flags: current.flags.some((flag) => flag.name === flagName)
        ? current.flags.map((flag) => (flag.name === flagName ? { ...flag, value } : flag))
        : [...current.flags, { name: flagName, enabled: false, value }]
    }));
  };

  const runWorkflow = async () => {
    setError(null);
    setBusy((current) => ({ ...current, run: true }));
    try {
      const snapshot = await window.ffmpegUI.runWorkflow(workflow);
      setJob(snapshot);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'FFmpeg run failed.';
      setError(message);
      setJob((current) => ({ ...current, status: 'error', error: message }));
      setBusy((current) => ({ ...current, run: false }));
    }
  };

  const cancelWorkflow = async () => {
    const snapshot = await window.ffmpegUI.cancelWorkflow();
    setJob(snapshot);
    setBusy((current) => ({ ...current, run: false }));
  };

  return {
    workflow,
    capabilities,
    preview,
    job,
    busy,
    error,
    settings,
    openFiles,
    selectOutputDirectory,
    setAction,
    updateShrink,
    updateConvert,
    updateMerge,
    updateOutput,
    updateSettings,
    browseBinary,
    saveAppSettings,
    setFlagEnabled,
    setFlagValue,
    runWorkflow,
    cancelWorkflow
  };
};
