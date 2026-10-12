export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-3 py-16 text-ink-muted">
      <span
        aria-hidden="true"
        className="size-4 rounded-full border-2 border-line border-t-accent motion-safe:animate-spin"
      />
      <span className="text-sm">{label}</span>
    </div>
  );
}
