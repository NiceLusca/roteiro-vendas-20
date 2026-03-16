import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Pencil } from 'lucide-react';

// --- Generic text/number inline cell ---

interface InlineEditCellProps {
  value: string | number | null | undefined;
  onSave: (value: string) => Promise<void>;
  type?: 'text' | 'number';
  placeholder?: string;
  className?: string;
  displayClassName?: string;
  emptyText?: string;
}

export const InlineEditCell = memo(function InlineEditCell({
  value,
  onSave,
  type = 'text',
  placeholder,
  className,
  displayClassName,
  emptyText = '—',
}: InlineEditCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? ''));
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(String(value ?? ''));
      setTimeout(() => inputRef.current?.select(), 0);
    }
  }, [editing, value]);

  const commit = useCallback(async () => {
    const trimmed = draft.trim();
    const original = String(value ?? '').trim();
    if (trimmed === original) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(trimmed);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }, [draft, value, onSave]);

  const cancel = useCallback(() => {
    setDraft(String(value ?? ''));
    setEditing(false);
  }, [value]);

  if (editing) {
    return (
      <div onClick={e => e.stopPropagation()} className={cn('w-full', className)}>
        <input
          ref={inputRef}
          type={type}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') cancel();
          }}
          onBlur={commit}
          disabled={saving}
          placeholder={placeholder}
          className="w-full h-7 px-1.5 text-xs rounded border border-primary/40 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
    );
  }

  const display = value != null && String(value).trim() !== '' ? String(value) : emptyText;

  return (
    <div
      onClick={e => {
        e.stopPropagation();
        setEditing(true);
      }}
      className={cn(
        'group/cell cursor-pointer rounded px-1 -mx-1 hover:bg-accent/60 transition-colors flex items-center gap-1 min-h-[28px]',
        displayClassName
      )}
      title="Clique para editar"
    >
      <span className={cn('text-xs truncate', display === emptyText && 'text-muted-foreground')}>
        {display}
      </span>
      <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover/cell:opacity-100 transition-opacity shrink-0" />
    </div>
  );
});

// --- Select inline cell (for enums like status) ---

interface SelectOption {
  value: string;
  label: string;
  className?: string;
}

interface InlineSelectCellProps {
  value: string | null | undefined;
  options: SelectOption[];
  onSave: (value: string) => Promise<void>;
  className?: string;
  renderDisplay?: (value: string | null | undefined, option?: SelectOption) => React.ReactNode;
}

export const InlineSelectCell = memo(function InlineSelectCell({
  value,
  options,
  onSave,
  className,
  renderDisplay,
}: InlineSelectCellProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (editing) {
      setTimeout(() => selectRef.current?.focus(), 0);
    }
  }, [editing]);

  const commit = useCallback(async (newValue: string) => {
    if (newValue === (value ?? '')) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(newValue);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }, [value, onSave]);

  if (editing) {
    return (
      <div onClick={e => e.stopPropagation()} className={cn('w-full', className)}>
        <select
          ref={selectRef}
          value={value ?? ''}
          onChange={e => commit(e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={e => { if (e.key === 'Escape') setEditing(false); }}
          disabled={saving}
          className="w-full h-7 px-1 text-xs rounded border border-primary/40 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">—</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    );
  }

  const currentOption = options.find(o => o.value === value);

  const display = renderDisplay
    ? renderDisplay(value, currentOption)
    : currentOption
      ? <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', currentOption.className)}>{currentOption.label}</Badge>
      : <span className="text-muted-foreground text-xs">—</span>;

  return (
    <div
      onClick={e => {
        e.stopPropagation();
        setEditing(true);
      }}
      className="group/cell cursor-pointer rounded px-1 -mx-1 hover:bg-accent/60 transition-colors flex items-center gap-1 min-h-[28px]"
      title="Clique para editar"
    >
      {display}
      <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover/cell:opacity-100 transition-opacity shrink-0" />
    </div>
  );
});
