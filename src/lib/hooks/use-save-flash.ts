"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type FlashState = "hidden" | "visible" | "fading";

const VISIBLE_MS = 5000;
const FADE_MS = 400;

type Timers = { fade?: ReturnType<typeof setTimeout>; hide?: ReturnType<typeof setTimeout> };

// Drives a per-key "Saved" confirmation: visible for 5s after `flash(key)`,
// then eases out over 400ms, then gone — rather than a badge that just sits
// there forever once something has ever been saved. Keyed so a page with
// many independently-saveable rows (experience, projects, …) can flash one
// row without touching the others.
export function useSaveFlash() {
  const [states, setStates] = useState<Record<string, FlashState>>({});
  const timers = useRef<Record<string, Timers>>({});

  useEffect(() => {
    const timersAtMount = timers.current;
    return () => {
      Object.values(timersAtMount).forEach(({ fade, hide }) => {
        clearTimeout(fade);
        clearTimeout(hide);
      });
    };
  }, []);

  const flash = useCallback((key: string) => {
    const existing = timers.current[key];
    if (existing) {
      clearTimeout(existing.fade);
      clearTimeout(existing.hide);
    }
    setStates((prev) => ({ ...prev, [key]: "visible" }));
    const fade = setTimeout(() => {
      setStates((prev) => ({ ...prev, [key]: "fading" }));
    }, VISIBLE_MS);
    const hide = setTimeout(() => {
      setStates((prev) => ({ ...prev, [key]: "hidden" }));
    }, VISIBLE_MS + FADE_MS);
    timers.current[key] = { fade, hide };
  }, []);

  const get = useCallback((key: string): FlashState => states[key] ?? "hidden", [states]);

  return { get, flash };
}
