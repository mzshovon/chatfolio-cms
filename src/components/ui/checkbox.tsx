import { cn } from "@/lib/cn";
import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

type CheckboxProps = InputHTMLAttributes<HTMLInputElement> & {
  label: ReactNode;
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, ...props }, ref) => {
    return (
      <label className="flex cursor-pointer items-start gap-2 text-xs text-muted">
        <input
          ref={ref}
          type="checkbox"
          className={cn(
            "mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-border text-accent accent-accent",
            className
          )}
          {...props}
        />
        <span>{label}</span>
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";
