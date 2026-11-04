import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";

interface EditableTextProps {
  /** Current value; null/empty shows `children` (or nothing) until edited. */
  value: string | null;
  /** What to show when not editing. Defaults to the value. */
  children?: ReactNode;
  /** Accessible name, e.g. "Business name". */
  label: string;
  /** Empty input is rejected instead of saved. */
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
  /** Called with the trimmed new value. Reject (throw) to stay in edit mode. */
  onSave: (value: string) => Promise<unknown>;
}

/**
 * Text with a ✎ button that turns into an inline input.
 * Enter or "Save" saves, Esc or "Cancel" cancels.
 */
export function EditableText({
  value,
  children,
  label,
  required = false,
  maxLength,
  placeholder,
  onSave,
}: EditableTextProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isEditing = draft !== null;

  // When the editor opens, focus it with the text selected, so typing replaces it.
  useEffect(() => {
    if (!isEditing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isEditing]);

  const cancel = () => setDraft(null);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const next = (draft ?? "").trim();
    if (required && !next) return;
    if (next === (value ?? "")) return cancel();

    setSaving(true);
    try {
      await onSave(next);
      setDraft(null);
    } catch {
      // Keep editing; the failure is shown as a toast by the caller's action.
    } finally {
      setSaving(false);
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") cancel();
  };

  if (!isEditing) {
    return (
      <span className="editable">
        {children ?? value}
        <button
          type="button"
          className="editable__edit"
          aria-label={`Edit ${label.toLowerCase()}`}
          title={`Edit ${label.toLowerCase()}`}
          onClick={() => setDraft(value ?? "")}
        >
          ✎
        </button>
      </span>
    );
  }

  return (
    <form className="editable editable--editing" onSubmit={save}>
      <input
        ref={inputRef}
        aria-label={label}
        value={draft}
        required={required}
        maxLength={maxLength}
        placeholder={placeholder}
        disabled={saving}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
      />
      <button type="submit" className="link-button" disabled={saving}>
        Save
      </button>
      <button type="button" className="link-button editable__cancel" onClick={cancel} disabled={saving}>
        Cancel
      </button>
    </form>
  );
}
