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
};

const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";

export async function apiRequest<T>(
  path: string,
  { method = "GET", body, query, accessToken, signal }: RequestOptions = {}
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
    response = await fetch(`/api/v1${path}${search ? `?${search}` : ""}`, {
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
    const message =
      (data && typeof data === "object" && "detail" in data
        ? String((data as { detail: unknown }).detail)
        : null) ?? GENERIC_ERROR_MESSAGE;
    throw new ApiError(response.status, message);
  }

  return data as T;
}
