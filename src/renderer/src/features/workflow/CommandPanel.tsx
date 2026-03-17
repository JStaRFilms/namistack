import type { CommandPreview } from '../../../../shared/types';

type CommandPanelProps = {
  preview: CommandPreview;
  busy: boolean;
  onRun: () => void;
  onCancel: () => void;
  running: boolean;
  onCopy: () => void;
};

export const CommandPanel = ({
  preview,
  busy,
  onRun,
  onCancel,
  running,
  onCopy
}: CommandPanelProps) => (
  <section className="border border-border bg-surface p-4">
    <div className="border-b border-border pb-3">
      <p className="text-[11px] uppercase tracking-[0.24em] text-muted">Command Preview</p>
      <p className="mt-2 text-sm text-muted">Every workflow turns into a copyable FFmpeg command.</p>
    </div>

    <pre className="mt-4 overflow-x-auto border border-border bg-[#101419] p-4 font-mono text-xs leading-6 text-[#d7f9ef]">
      {preview.display}
    </pre>

    {preview.outputPath ? (
      <p className="mt-3 text-xs text-muted">Output: {preview.outputPath}</p>
    ) : null}

    {preview.warnings.length > 0 ? (
      <div className="mt-4 space-y-2">
        {preview.warnings.map((warning) => (
          <div key={warning} className="border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {warning}
          </div>
        ))}
      </div>
    ) : null}

    <div className="mt-4 flex gap-2">
      <button
        className="border border-border bg-background px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
        disabled={preview.steps.length === 0}
        onClick={onCopy}
        type="button"
      >
        Copy
      </button>
      <button
        className="flex-1 border border-primary bg-primary px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={busy || preview.steps.length === 0 || running}
        onClick={onRun}
        type="button"
      >
        {running ? 'Running...' : busy ? 'Building...' : 'Run FFmpeg'}
      </button>
      <button
        className="border border-border bg-background px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
        disabled={!running}
        onClick={onCancel}
        type="button"
      >
        Cancel
      </button>
    </div>
  </section>
);
