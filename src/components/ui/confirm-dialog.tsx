type ConfirmDialogProps = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Yes, delete",
  cancelLabel = "No, keep it",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-[340px] rounded-2xl bg-surface-strong p-6 shadow-2xl">
        <div className="text-[15px] font-semibold text-foreground">{title}</div>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">{description}</p>
        <div className="mt-5 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border px-4 py-2 text-[13px] font-semibold text-foreground"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-danger-solid px-4 py-2 text-[13px] font-semibold text-white hover:bg-danger-solid-hover"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
