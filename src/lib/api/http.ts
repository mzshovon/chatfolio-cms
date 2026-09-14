export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  accessToken?: string;
  signal?: AbortSignal;
  // Almost everything lives under /v1 (the default). The anonymous feedback
  // endpoint lives under /v1/public instead (unauthenticated, submitted from
  // outside the normal candidate/admin API surface), so this lets a caller
  // override the prefix rather than every call site assuming plain /v1.
  prefix?: string;
};

const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";

// FastAPI/Pydantic validation errors (422) shape `detail` as an ARRAY of
// { type, loc, msg, ... } objects, not a string like every other error in
// this API. The naive `String(detail)` on an array of objects produces the
// literal text "[object Object]" — this extracts each item's `msg`
// (prefixed with its field name, from the last segment of `loc`, when that
// adds information) and joins them, so validation errors read like
// "slug: String should match pattern '...'" instead.
function formatErrorDetail(detail: unknown): string | null {
  if (typeof detail === "string") return detail;
  if (!Array.isArray(detail) || detail.length === 0) return null;

  const messages = detail.map((item) => {
    if (!item || typeof item !== "object") return String(item);
    const { loc, msg } = item as { loc?: unknown[]; msg?: unknown };
    const field = Array.isArray(loc) ? loc[loc.length - 1] : null;
    const text = typeof msg === "string" ? msg : JSON.stringify(item);
    return typeof field === "string" ? `${field}: ${text}` : text;
  });

  return messages.join("; ");
}

export async function apiRequest<T>(
  path: string,
  { method = "GET", body, query, accessToken, signal, prefix = "/v1" }: RequestOptions = {}
): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const headers: Record<string, string> = {};
  if (body !== undefined && !isFormData) headers["Content-Type"] = "application/json";
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const search = query
    ? new URLSearchParams(
        Object.entries(query).filter(([, v]) => v !== undefined) as [string, string][]
      ).toString()
    : "";

  let response: Response;
  try {
    // Same-origin path — Next.js rewrites this to the real backend
    // server-side (see next.config.ts), so the browser never makes a
    // cross-origin request and CORS never comes into play.
    response = await fetch(`/api${prefix}${path}${search ? `?${search}` : ""}`, {
      method,
      headers,
      body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch {
    throw new ApiError(0, "Could not reach the server. Check your connection.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = data && typeof data === "object" && "detail" in data ? (data as { detail: unknown }).detail : null;
    const message = formatErrorDetail(detail) ?? GENERIC_ERROR_MESSAGE;
    throw new ApiError(response.status, message);
  }

  return data as T;
}
