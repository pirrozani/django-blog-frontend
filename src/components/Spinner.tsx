export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-3 py-10 text-ink-soft">
      <span
        aria-hidden="true"
        className="size-5 rounded-full border-2 border-mist border-t-moss motion-safe:animate-spin"
      />
      <span className="text-sm">{label}</span>
    </div>
  );
}
