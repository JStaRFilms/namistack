import type { WorkflowState } from '../../../../shared/types';

type ActionEditorProps = {
  workflow: WorkflowState;
  onOutputChange: (patch: Partial<Pick<WorkflowState, 'outputDirectory' | 'outputName'>>) => void;
  onSelectOutputDirectory: () => void;
  onShrinkChange: (patch: Partial<WorkflowState['shrink']>) => void;
  onConvertChange: (patch: Partial<WorkflowState['convert']>) => void;
  onMergeChange: (patch: Partial<WorkflowState['merge']>) => void;
};

const Field = ({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <label className="space-y-2 text-[11px] uppercase tracking-[0.22em] text-muted">
    <span>{label}</span>
    {children}
  </label>
);

const inputClassName =
  'w-full border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary';

export const ActionEditor = ({
  workflow,
  onOutputChange,
  onSelectOutputDirectory,
  onShrinkChange,
  onConvertChange
  ,
  onMergeChange
}: ActionEditorProps) => (
  <section className="border border-border bg-surface p-5">
    <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
      <div>
        <p className="text-[11px] uppercase tracking-[0.24em] text-muted">Action Settings</p>
        <h2 className="mt-2 text-xl font-semibold">
          {workflow.action === 'shrink'
            ? 'Shrink to a target size'
            : workflow.action === 'convert'
              ? 'Convert into a new format'
              : 'Merge clips losslessly'}
        </h2>
      </div>
      <div className="flex gap-2">
        <button
          className="border border-border bg-background px-3 py-2 text-xs font-medium hover:border-primary"
          onClick={onSelectOutputDirectory}
          type="button"
        >
          Choose Folder
        </button>
      </div>
    </div>

    <div className="mt-5 grid gap-4 md:grid-cols-2">
      <Field label="Output Folder">
        <input
          className={inputClassName}
          value={workflow.outputDirectory}
          onChange={(event) => onOutputChange({ outputDirectory: event.target.value })}
        />
      </Field>
      <Field label="Output Name">
        <input
          className={inputClassName}
          value={workflow.outputName}
          onChange={(event) => onOutputChange({ outputName: event.target.value })}
          placeholder="Leave blank for auto naming"
        />
      </Field>
    </div>

    {workflow.action === 'shrink' ? (
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Target Size (MB)">
          <input
            className={inputClassName}
            type="number"
            min={1}
            value={workflow.shrink.targetSizeMb}
            onChange={(event) => onShrinkChange({ targetSizeMb: Number(event.target.value) })}
          />
        </Field>
        <Field label="Audio Bitrate (kbps)">
          <input
            className={inputClassName}
            type="number"
            min={32}
            value={workflow.shrink.audioBitrateKbps}
            onChange={(event) => onShrinkChange({ audioBitrateKbps: Number(event.target.value) })}
          />
        </Field>
        <Field label="Video Codec">
          <select
            className={inputClassName}
            value={workflow.shrink.videoCodec}
            onChange={(event) => onShrinkChange({ videoCodec: event.target.value })}
          >
            <option value="libx264">H.264 / libx264</option>
            <option value="libx265">H.265 / libx265</option>
            <option value="libvpx-vp9">VP9</option>
          </select>
        </Field>
        <Field label="Container">
          <select
            className={inputClassName}
            value={workflow.shrink.container}
            onChange={(event) => onShrinkChange({ container: event.target.value })}
          >
            <option value="mp4">MP4</option>
            <option value="mkv">MKV</option>
            <option value="webm">WEBM</option>
          </select>
        </Field>
        <label className="flex items-center gap-3 border border-border bg-background px-4 py-3 text-sm">
          <input
            checked={workflow.shrink.twoPass}
            onChange={(event) => onShrinkChange({ twoPass: event.target.checked })}
            type="checkbox"
          />
          <span>Use 2-pass encode for closer size matching</span>
        </label>
      </div>
    ) : null}

    {workflow.action === 'convert' ? (
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Container">
          <select
            className={inputClassName}
            value={workflow.convert.container}
            onChange={(event) => onConvertChange({ container: event.target.value })}
          >
            <option value="mp4">MP4</option>
            <option value="mkv">MKV</option>
            <option value="mov">MOV</option>
            <option value="webm">WEBM</option>
          </select>
        </Field>
        <Field label="Quality Mode">
          <select
            className={inputClassName}
            value={workflow.convert.qualityMode}
            onChange={(event) =>
              onConvertChange({
                qualityMode: event.target.value as WorkflowState['convert']['qualityMode']
              })
            }
          >
            <option value="crf">CRF</option>
            <option value="bitrate">Bitrate</option>
            <option value="copy">Copy Streams</option>
          </select>
        </Field>
        <Field label="Video Codec">
          <select
            className={inputClassName}
            value={workflow.convert.videoCodec}
            onChange={(event) => onConvertChange({ videoCodec: event.target.value })}
          >
            <option value="libx264">H.264 / libx264</option>
            <option value="libx265">H.265 / libx265</option>
            <option value="libvpx-vp9">VP9</option>
            <option value="copy">Copy</option>
          </select>
        </Field>
        <Field label="Audio Codec">
          <select
            className={inputClassName}
            value={workflow.convert.audioCodec}
            onChange={(event) => onConvertChange({ audioCodec: event.target.value })}
          >
            <option value="aac">AAC</option>
            <option value="libopus">Opus</option>
            <option value="copy">Copy</option>
          </select>
        </Field>
        {workflow.convert.qualityMode === 'crf' ? (
          <>
            <Field label="CRF">
              <input
                className={inputClassName}
                type="number"
                min={0}
                max={51}
                value={workflow.convert.crf}
                onChange={(event) => onConvertChange({ crf: Number(event.target.value) })}
              />
            </Field>
            <Field label="Preset">
              <select
                className={inputClassName}
                value={workflow.convert.preset}
                onChange={(event) => onConvertChange({ preset: event.target.value })}
              >
                <option value="veryfast">veryfast</option>
                <option value="fast">fast</option>
                <option value="medium">medium</option>
                <option value="slow">slow</option>
              </select>
            </Field>
          </>
        ) : null}
        {workflow.convert.qualityMode === 'bitrate' ? (
          <>
            <Field label="Video Bitrate (kbps)">
              <input
                className={inputClassName}
                type="number"
                min={128}
                value={workflow.convert.videoBitrateKbps}
                onChange={(event) => onConvertChange({ videoBitrateKbps: Number(event.target.value) })}
              />
            </Field>
            <Field label="Audio Bitrate (kbps)">
              <input
                className={inputClassName}
                type="number"
                min={32}
                value={workflow.convert.audioBitrateKbps}
                onChange={(event) => onConvertChange({ audioBitrateKbps: Number(event.target.value) })}
              />
            </Field>
          </>
        ) : null}
      </div>
    ) : null}

    {workflow.action === 'merge' ? (
      <div className="mt-5 space-y-4">
        <Field label="Container">
          <select
            className={inputClassName}
            value={workflow.merge.container}
            onChange={(event) => onMergeChange({ container: event.target.value })}
          >
            <option value="mp4">MP4</option>
            <option value="mkv">MKV</option>
            <option value="mov">MOV</option>
          </select>
        </Field>
        <div className="border border-border bg-background px-4 py-4 text-sm text-muted">
          Merge uses the concat demuxer with <code>-c copy</code>. Pick clips with matching codec,
          frame size, and timing for true lossless joining.
        </div>
      </div>
    ) : null}
  </section>
);
