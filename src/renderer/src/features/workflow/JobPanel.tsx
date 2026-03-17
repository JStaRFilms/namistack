import type { JobSnapshot } from '../../../../shared/types';

type JobPanelProps = {
  job: JobSnapshot;
};

const statusTone: Record<JobSnapshot['status'], string> = {
  idle: 'text-muted',
  running: 'text-primary',
  success: 'text-emerald-700',
  error: 'text-rose-700',
  cancelled: 'text-amber-700'
};

export const JobPanel = ({ job }: JobPanelProps) => (
  <section className="border border-border bg-surface p-4">
    <div className="border-b border-border pb-3">
      <p className="text-[11px] uppercase tracking-[0.24em] text-muted">Job Console</p>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className={`font-semibold uppercase tracking-[0.18em] ${statusTone[job.status]}`}>
          {job.status}
        </span>
        <span className="font-mono text-xs">{Math.round(job.progress * 100)}%</span>
      </div>
      <div className="mt-2 h-2 bg-background">
        <div className="h-full bg-primary transition-all" style={{ width: `${job.progress * 100}%` }} />
      </div>
      <div className="mt-3 flex justify-between text-xs text-muted">
        <span>Speed: {job.speed}</span>
        <span>Processed: {job.processedSeconds.toFixed(1)}s</span>
      </div>
    </div>

    {job.error ? (
      <div className="mt-4 border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
        {job.error}
      </div>
    ) : null}

    <div className="mt-4 max-h-[220px] overflow-y-auto border border-border bg-[#11161c] p-3 font-mono text-[11px] leading-5 text-[#d4d9df]">
      {job.logs.length === 0 ? 'Logs will stream here when FFmpeg starts.' : job.logs.join('\n')}
    </div>
  </section>
);
