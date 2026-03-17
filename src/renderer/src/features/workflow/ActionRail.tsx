import type { ActionKind } from '../../../../shared/types';

const actions: { id: ActionKind; label: string; description: string }[] = [
  {
    id: 'shrink',
    label: 'Shrink to Size',
    description: 'Hit a target filesize without guessing bitrates.'
  },
  {
    id: 'convert',
    label: 'Convert Format',
    description: 'Switch container, codecs, and quality mode.'
  },
  {
    id: 'merge',
    label: 'Lossless Merge',
    description: 'Concat compatible clips with stream copy.'
  }
];

type ActionRailProps = {
  value: ActionKind;
  onChange: (action: ActionKind) => void;
};

export const ActionRail = ({ value, onChange }: ActionRailProps) => (
  <div className="space-y-3">
    <div className="border-b border-border pb-3">
      <p className="text-[11px] uppercase tracking-[0.24em] text-muted">Actions</p>
      <p className="mt-2 text-sm text-muted">Choose the workflow, then shape the flags below.</p>
    </div>

    {actions.map((action) => {
      const active = value === action.id;
      return (
        <button
          key={action.id}
          className={`w-full border px-4 py-4 text-left transition ${
            active
              ? 'border-primary bg-[linear-gradient(135deg,#f5fffc,white)]'
              : 'border-border bg-background hover:border-primary'
          }`}
          onClick={() => onChange(action.id)}
          type="button"
        >
          <p className="text-sm font-semibold">{action.label}</p>
          <p className="mt-1 text-xs text-muted">{action.description}</p>
        </button>
      );
    })}
  </div>
);
