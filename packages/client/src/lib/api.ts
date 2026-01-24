import type {
  ApiResponse,
  Amortizare,
  GenereazaAmortizareResult,
  AmortizareSumar,
  AmortizareVerificare,
} from "shared";

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

/**
 * Fetch depreciation history for a specific asset.
 */
export async function getAmortizariIstoric(mijlocFixId: number): Promise<Amortizare[]> {
  const response = await fetch(`${API_BASE}/amortizari/istoric/${mijlocFixId}`);
  const data: ApiResponse<Amortizare[]> = await response.json();
  if (!data.success) {
    throw new Error(data.message || "Failed to fetch depreciation history");
  }
  return data.data || [];
}

/**
 * Generate depreciation for a specific month/year.
 */
export async function genereazaAmortizare(
  an: number,
  luna: number
): Promise<GenereazaAmortizareResult> {
  const response = await fetch(`${API_BASE}/amortizari/genereaza`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ an, luna }),
  });
  const data: ApiResponse<GenereazaAmortizareResult> = await response.json();
  if (!data.success) {
    throw new Error(data.message || "Failed to generate depreciation");
  }
  return data.data!;
}

/**
 * Get depreciation summary by month/year.
 */
export async function getAmortizariSumar(an?: number): Promise<AmortizareSumar[]> {
  const url = an ? `${API_BASE}/amortizari/sumar?an=${an}` : `${API_BASE}/amortizari/sumar`;
  const response = await fetch(url);
  const data: ApiResponse<AmortizareSumar[]> = await response.json();
  if (!data.success) {
    throw new Error(data.message || "Failed to fetch summary");
  }
  return data.data || [];
}

/**
 * Get verification of which months are processed.
 */
export async function getAmortizariVerificare(an: number): Promise<AmortizareVerificare[]> {
  const response = await fetch(`${API_BASE}/amortizari/verificare?an=${an}`);
  const data: ApiResponse<AmortizareVerificare[]> = await response.json();
  if (!data.success) {
    throw new Error(data.message || "Failed to fetch verification");
  }
  return data.data || [];
}
