import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Button } from './Button.tsx';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  pending?: boolean;
  /** Shown inside the dialog when the confirmed action failed. */
  error?: string;
}

/** A modal confirmation on the native `<dialog>`; Escape cancels. */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  onConfirm,
  onCancel,
  pending = false,
  error,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const bodyId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      cancelRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      onCancel={(event) => {
        // Escape: keep the dialog's open state owned by `open`.
        event.preventDefault();
        if (!pending) onCancel();
      }}
      onClose={() => {
        // The browser may close it anyway (e.g. a repeated Escape).
        if (!open) return;
        if (pending) dialogRef.current?.showModal();
        else onCancel();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-mist bg-paper p-6 text-ink shadow-xl"
    >
      <h2 id={titleId} className="text-2xl font-semibold">
        {title}
      </h2>
      <div id={bodyId} className="mt-3 text-ink-soft">
        {children}
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      )}
      <div className="mt-6 flex justify-end gap-3">
        <Button
          ref={cancelRef}
          variant="secondary"
          onClick={onCancel}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={pending}>
          {pending ? 'Working…' : confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
