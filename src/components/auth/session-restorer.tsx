"use client";

import { useAuthStore } from "@/store/auth-store";
import { useEffect, useRef } from "react";

// Mounted once in the root layout. Kicks off the silent restore-from-stored-
// refresh-token attempt as early as possible so RequireAuth/GuestOnly have a
// real answer (not just "no user yet") before they'd otherwise redirect.
export function SessionRestorer() {
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const ranOnce = useRef(false);

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;
    restoreSession();
  }, [restoreSession]);

  return null;
}
