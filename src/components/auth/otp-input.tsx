"use client";

import { cn } from "@/lib/cn";
import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";

type OtpInputProps = {
  length?: number;
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
};

export function OtpInput({ length = 6, value, onChange, disabled }: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const setDigit = (index: number, raw: string) => {
    const digit = raw.replace(/[^0-9]/g, "").slice(-1);
    const next = [...value];
    next[index] = digit;
    onChange(next);
    if (digit && index < length - 1) refs.current[index + 1]?.focus();
  };

  const onKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    const next = Array.from({ length }, (_, i) => pasted[i] ?? value[i] ?? "");
    onChange(next);
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={value[i] ?? ""}
          onChange={(e) => setDigit(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={onPaste}
          disabled={disabled}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          aria-label={`Digit ${i + 1} of ${length}`}
          className={cn(
            "h-[52px] w-11 rounded-[10px] border border-border bg-surface-strong text-center text-xl font-semibold text-foreground outline-none transition-colors focus:border-accent",
            disabled && "opacity-60"
          )}
        />
      ))}
    </div>
  );
}
