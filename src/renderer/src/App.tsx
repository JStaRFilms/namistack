import { ClipTable } from './features/clips/ClipTable';
import { ActionEditor } from './features/workflow/ActionEditor';
import { ActionRail } from './features/workflow/ActionRail';
import { CommandPanel } from './features/workflow/CommandPanel';
import { FlagsPanel } from './features/workflow/FlagsPanel';
import { JobPanel } from './features/workflow/JobPanel';
import { SettingsPanel } from './features/workflow/SettingsPanel';
import { useWorkflow } from './features/workflow/useWorkflow';

export default function App() {
  const {
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
  } = useWorkflow();

  const copyCommand = async () => {
    if (!preview.display) return;
    await navigator.clipboard.writeText(preview.display);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="min-h-screen bg-[linear-gradient(180deg,rgba(14,165,164,0.08),transparent_22%),linear-gradient(90deg,rgba(13,17,23,0.03)_1px,transparent_1px)] bg-[size:100%_100%,24px_24px]">
        <header className="border-b border-border bg-[rgba(246,247,243,0.94)]">
          <div className="mx-auto flex max-w-[1480px] items-center justify-between px-6 py-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-muted">NamiStack</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">NamiStack: desktop FFmpeg workbench for people who hate flags.</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="border border-border bg-surface px-3 py-2 text-xs">
                <span className={`mr-2 inline-block h-2 w-2 rounded-full ${capabilities?.status === 'ready' ? 'bg-primary' : 'bg-rose-500'}`} />
                {capabilities?.status === 'ready' ? 'FFmpeg ready' : 'FFmpeg missing'}
              </div>
              <button
                className="border border-border bg-surface px-4 py-2 text-xs font-medium hover:border-primary disabled:cursor-not-allowed disabled:opacity-60"
                disabled={busy.fileDialog}
                onClick={openFiles}
                type="button"
              >
                {busy.fileDialog ? 'Opening...' : 'Open Files'}
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto grid max-w-[1480px] grid-cols-12 gap-6 px-6 py-6">
          <aside className="col-span-12 space-y-6 xl:col-span-3">
            <section className="border border-border bg-surface p-4">
              <ActionRail value={workflow.action} onChange={setAction} />
            </section>

            <section className="border border-border bg-surface p-4">
              <div className="border-b border-border pb-3">
                <p className="text-[11px] uppercase tracking-[0.24em] text-muted">Environment</p>
              </div>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span>Version</span>
                  <span className="max-w-[180px] text-right text-xs text-muted">
                    {capabilities?.version || 'Not detected'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Hardware acceleration</span>
                  <span className="text-xs text-muted">
                    {capabilities?.hwaccels.length ? capabilities.hwaccels.join(', ') : 'none found'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Flags indexed</span>
                  <span className="text-xs text-muted">{capabilities?.flags.length ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Detection</span>
                  <span className="text-xs text-muted">{capabilities?.source ?? 'auto'}</span>
                </div>
              </div>
            </section>

            <SettingsPanel
              capabilities={capabilities}
              settings={settings}
              saving={busy.capabilities}
              onChange={updateSettings}
              onBrowse={browseBinary}
              onSave={saveAppSettings}
            />
          </aside>

          <section className="col-span-12 space-y-6 xl:col-span-6">
            {error ? (
              <div className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
            ) : null}

            <section className="border border-border bg-surface p-5">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-muted">Input Clips</p>
                  <h2 className="mt-2 text-xl font-semibold">Media intake</h2>
                </div>
                <button
                  className="border border-border bg-background px-3 py-2 text-xs font-medium hover:border-primary"
                  onClick={openFiles}
                  type="button"
                >
                  Add Clips
                </button>
              </div>
              <div className="mt-5">
                <ClipTable clips={workflow.clips} />
              </div>
            </section>

            <ActionEditor
              workflow={workflow}
              onOutputChange={updateOutput}
              onSelectOutputDirectory={selectOutputDirectory}
              onShrinkChange={updateShrink}
              onConvertChange={updateConvert}
              onMergeChange={updateMerge}
            />
          </section>

          <aside className="col-span-12 space-y-6 xl:col-span-3">
            <CommandPanel
              preview={preview}
              busy={busy.preview || busy.capabilities}
              onRun={runWorkflow}
              onCancel={cancelWorkflow}
              running={busy.run}
              onCopy={copyCommand}
            />
            <JobPanel job={job} />
            <FlagsPanel
              definitions={capabilities?.flags ?? []}
              selectedFlags={workflow.flags}
              onToggle={setFlagEnabled}
              onValueChange={setFlagValue}
            />
          </aside>
        </main>
      </div>
    </div>
  );
}
