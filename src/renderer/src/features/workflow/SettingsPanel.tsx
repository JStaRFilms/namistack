import type { AppSettings, FfmpegCapabilities } from '../../../../shared/types';

type SettingsPanelProps = {
  capabilities: FfmpegCapabilities | null;
  settings: AppSettings;
  saving: boolean;
  onChange: (patch: Partial<AppSettings>) => void;
  onBrowse: (target: keyof AppSettings) => void;
  onSave: () => void;
};

const inputClassName =
  'w-full border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary';

export const SettingsPanel = ({
  capabilities,
  settings,
  saving,
  onChange,
  onBrowse,
  onSave
}: SettingsPanelProps) => (
  <section className="border border-border bg-surface p-4">
    <div className="border-b border-border pb-3">
      <p className="text-[11px] uppercase tracking-[0.24em] text-muted">FFmpeg Settings</p>
      <p className="mt-2 text-sm text-muted">
        Auto-detect from PATH and common folders works by default. Add manual paths only if detection misses.
      </p>
    </div>

    <div className="mt-4 space-y-4">
      <div className="grid gap-2">
        <label className="text-[11px] uppercase tracking-[0.22em] text-muted">FFmpeg Path</label>
        <div className="flex gap-2">
          <input
            className={inputClassName}
            placeholder="Leave blank for auto-detect"
            value={settings.ffmpegPath}
            onChange={(event) => onChange({ ffmpegPath: event.target.value })}
          />
          <button
            className="border border-border bg-background px-3 py-2 text-xs font-medium hover:border-primary"
            onClick={() => onBrowse('ffmpegPath')}
            type="button"
          >
            Browse
          </button>
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-[11px] uppercase tracking-[0.22em] text-muted">FFprobe Path</label>
        <div className="flex gap-2">
          <input
            className={inputClassName}
            placeholder="Leave blank for auto-detect"
            value={settings.ffprobePath}
            onChange={(event) => onChange({ ffprobePath: event.target.value })}
          />
          <button
            className="border border-border bg-background px-3 py-2 text-xs font-medium hover:border-primary"
            onClick={() => onBrowse('ffprobePath')}
            type="button"
          >
            Browse
          </button>
        </div>
      </div>

      <div className="space-y-2 border border-border bg-background px-3 py-3 text-xs text-muted">
        <div className="flex items-center justify-between">
          <span>Detection mode</span>
          <span className="font-medium text-foreground">{capabilities?.source ?? 'auto'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Resolved FFmpeg</span>
          <span className="max-w-[190px] text-right">{capabilities?.ffmpegPath ?? 'Not found'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Resolved FFprobe</span>
          <span className="max-w-[190px] text-right">{capabilities?.ffprobePath ?? 'Not found'}</span>
        </div>
      </div>

      <button
        className="w-full border border-primary bg-primary px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={saving}
        onClick={onSave}
        type="button"
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  </section>
);
