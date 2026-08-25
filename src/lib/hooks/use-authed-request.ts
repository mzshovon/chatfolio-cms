"use client";

import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

// Every dashboard-side API call needs a live access token; this centralizes
// "get one (refreshing if needed), or bounce to /login if the session is
// gone" so pages don't each re-implement that fallback.
export function useAuthedRequest() {
  const getValidAccessToken = useAuthStore((state) => state.getValidAccessToken);
  const router = useRouter();

  return useCallback(
    async <T,>(fn: (token: string) => Promise<T>): Promise<T> => {
      const token = await getValidAccessToken();
      if (!token) {
        router.replace("/login");
        throw new Error("Not authenticated");
      }
      return fn(token);
    },
    [getValidAccessToken, router]
  );
}
