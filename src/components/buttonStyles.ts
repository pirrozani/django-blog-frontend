export type ButtonVariant = 'primary' | 'secondary' | 'danger';

const base =
  'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition duration-200 ease-in-out disabled:pointer-events-none disabled:opacity-50';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-paper shadow-sm hover:bg-accent-deep hover:shadow-lift',
  secondary:
    'bg-paper text-ink ring-1 ring-line ring-inset hover:ring-ink-muted hover:shadow-lift',
  danger: 'bg-danger text-paper shadow-sm hover:brightness-90',
};

/** Button classes, shared by `<Button>` and links that look like buttons. */
export function buttonClass(variant: ButtonVariant = 'primary', extra = '') {
  return `${base} ${variants[variant]} ${extra}`.trim();
}
