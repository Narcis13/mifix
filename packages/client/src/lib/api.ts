import type { ApiResponse } from "shared";

const API_BASE = "/api";

/**
 * Generic fetch wrapper with error handling.
 * Uses Vite's proxy configuration - requests to /api/* go to the server.
 */
export async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    if (!res.ok) {
      // Try to parse error response from server
      const errorData = await res.json().catch(() => null);
      return {
        success: false,
        message: errorData?.message || `Request failed with status ${res.status}`,
        errors: errorData?.errors,
      };
    }

    return res.json();
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Network error",
    };
  }
}

/**
 * API client with typed methods for CRUD operations.
 */
export const api = {
  get: <T>(endpoint: string) => fetchApi<T>(endpoint),

  post: <T>(endpoint: string, data: unknown) =>
    fetchApi<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  put: <T>(endpoint: string, data: unknown) =>
    fetchApi<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: <T>(endpoint: string) =>
    fetchApi<T>(endpoint, {
      method: "DELETE",
    }),
};
