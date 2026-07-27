import { useAuthStore } from "./auth-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * Custom Error class to include the status code from the API response
 */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  skipRetry?: boolean;
}

/**
 * Attempts to refresh the JWT access token using the refresh cookie
 */
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) return null;

    const data = await res.json();
    useAuthStore.getState().setSession(data.user, data.accessToken);
    return data.accessToken as string;
  } catch (error) {
    console.error("Token refresh failed:", error);
    return null;
  }
}

/**
 * Universal fetch wrapper for API calls
 */
export async function apiFetch<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth, skipRetry, headers, ...rest } = options;
  const token = useAuthStore.getState().accessToken;

  // 1. Make the request
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token && !skipAuth ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  // 2. Handle Token Expiration (401 Unauthorized)
  if (res.status === 401 && !skipAuth && !skipRetry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      // Retry the original request once with the new token
      return apiFetch<T>(path, { ...options, skipRetry: true });
    }
    // If refresh fails, clear the session (logs the user out)
    useAuthStore.getState().clearSession();
  }

  // 3. Parse Response Body
  const contentType = res.headers.get("content-type") || "";
  let body = null;

  if (contentType.includes("application/json")) {
    body = await res.json();
  }

  // 4. Handle Errors (This is where your "Roadmap not found" error is caught)
  if (!res.ok) {
    const errorMessage = body?.message || `Request failed with status ${res.status}`;
    // We throw our custom ApiError which includes the status code
    throw new ApiError(errorMessage, res.status);
  }

  return body as T;
}

export { API_URL };
