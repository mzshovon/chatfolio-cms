import { cn } from "@/lib/cn";
import { forwardRef, useId, type InputHTMLAttributes } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hideLabel?: boolean;
  error?: string;
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, hideLabel = true, error, className, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className={hideLabel ? "sr-only" : "text-sm font-medium text-foreground"}>
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          className={cn(
            "w-full rounded-[10px] border bg-surface-strong px-3.5 py-3 text-sm text-foreground placeholder:text-muted-subtle outline-none transition-colors focus:border-accent",
            error ? "border-danger-fg/60" : "border-border",
            className
          )}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-xs text-danger-fg">
            {error}
          </p>
        )}
      </div>
    );
  }
);

TextField.displayName = "TextField";
