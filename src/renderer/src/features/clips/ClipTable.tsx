import type { ClipMeta } from '../../../../shared/types';

interface ClipTableProps {
  clips: ClipMeta[];
}

const headerCells = ['Clip', 'Duration', 'Resolution', 'Codec', 'Size'];

export const ClipTable = ({ clips }: ClipTableProps) => {
  if (clips.length === 0) {
    return (
      <div className="rounded-md border border-border bg-background px-4 py-6 text-sm text-muted">
        No clips selected yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <div className="grid grid-cols-5 gap-2 border-b border-border bg-background px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-muted">
        {headerCells.map((cell) => (
          <span key={cell}>{cell}</span>
        ))}
      </div>
      <div className="divide-y divide-border">
        {clips.map((clip) => (
          <div key={clip.path}>
            <div className="grid grid-cols-5 gap-2 px-4 py-3 text-sm">
              <span className="font-medium">{clip.name}</span>
              <span>{clip.durationLabel}</span>
              <span>{clip.resolution}</span>
              <span className={clip.error ? 'text-rose-600' : undefined}>
                {clip.error ? 'Error' : clip.videoCodec}
              </span>
              <span>{clip.sizeLabel}</span>
            </div>
            {clip.error ? (
              <div className="px-4 pb-3 text-xs text-rose-600">{clip.error}</div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
};
