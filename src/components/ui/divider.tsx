export function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-border" />
      <span className="text-[11px] uppercase tracking-wide text-muted-subtle">{label}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
