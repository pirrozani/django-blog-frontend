import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from './ConfirmDialog.tsx';

function renderDialog(open: boolean) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  const result = render(
    <ConfirmDialog
      open={open}
      title='Delete "Hello"?'
      confirmLabel="Delete"
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      This can't be undone.
    </ConfirmDialog>,
  );
  return { ...result, onConfirm, onCancel };
}

describe('ConfirmDialog', () => {
  it('opens as a modal with Cancel focused', () => {
    renderDialog(true);
    const dialog = screen.getByRole('dialog', { name: 'Delete "Hello"?' });
    expect(dialog).toHaveAttribute('open');
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
  });

  it('stays closed when not open', () => {
    renderDialog(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('cancels on Escape (the dialog cancel event)', () => {
    const { onCancel } = renderDialog(true);
    fireEvent(screen.getByRole('dialog'), new Event('cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('cancels when the browser closes it natively', () => {
    const { onCancel } = renderDialog(true);
    (screen.getByRole('dialog') as HTMLDialogElement).close();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm', async () => {
    const { onConfirm } = renderDialog(true);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
