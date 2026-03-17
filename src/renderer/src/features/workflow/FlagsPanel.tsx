import { useDeferredValue, useState } from 'react';
import type { FlagDefinition, SelectedFlag } from '../../../../shared/types';

type FlagsPanelProps = {
  definitions: FlagDefinition[];
  selectedFlags: SelectedFlag[];
  onToggle: (flagName: string, enabled: boolean) => void;
  onValueChange: (flagName: string, value: string) => void;
};

const findSelection = (selectedFlags: SelectedFlag[], flagName: string) =>
  selectedFlags.find((flag) => flag.name === flagName);

export const FlagsPanel = ({
  definitions,
  selectedFlags,
  onToggle,
  onValueChange
}: FlagsPanelProps) => {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const query = deferredSearch.trim().toLowerCase();
  const filtered = definitions
    .filter((flag) => {
      if (!query) return true;
      return (
        flag.name.toLowerCase().includes(query) ||
        flag.description.toLowerCase().includes(query) ||
        flag.category.toLowerCase().includes(query)
      );
    })
    .slice(0, 80);

  return (
    <section className="border border-border bg-surface p-4">
      <div className="border-b border-border pb-3">
        <p className="text-[11px] uppercase tracking-[0.24em] text-muted">Advanced Flags</p>
        <input
          className="mt-3 w-full border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary"
          placeholder="Search ffmpeg flags"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1">
        {filtered.map((flag) => {
          const selected = findSelection(selectedFlags, flag.name);
          return (
            <div key={flag.name} className="border border-border bg-background px-3 py-3">
              <label className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-foreground">{flag.name}</p>
                  <p className="mt-1 text-xs text-muted">{flag.description}</p>
                  <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-muted">
                    {flag.category}
                  </p>
                </div>
                <input
                  checked={selected?.enabled ?? false}
                  onChange={(event) => onToggle(flag.name, event.target.checked)}
                  type="checkbox"
                />
              </label>
              {flag.takesValue ? (
                <input
                  className="mt-3 w-full border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary"
                  placeholder={flag.placeholder ?? 'Value'}
                  value={selected?.value ?? ''}
                  onChange={(event) => onValueChange(flag.name, event.target.value)}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
};
