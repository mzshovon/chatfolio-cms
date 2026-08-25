import { cn } from "@/lib/cn";
import type { FlashState } from "@/lib/hooks/use-save-flash";

export function SavedFlash({ state, className }: { state: FlashState; className?: string }) {
  if (state === "hidden") return null;

  return (
    <span
      className={cn(
        "text-[11.5px] text-success-fg transition-opacity duration-500",
        state === "fading" ? "opacity-0" : "opacity-100",
        className
      )}
    >
      Saved
    </span>
  );
}
