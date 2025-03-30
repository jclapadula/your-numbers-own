import { useAuth0 } from "@auth0/auth0-react";

const API_BASE_URL = import.meta.env.API_BASE_URL;

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

async function getAuthToken(): Promise<string> {
  const { getAccessTokenSilently } = useAuth0();
  return getAccessTokenSilently();
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requiresAuth = true, ...fetchOptions } = options;

  const headers = new Headers({
    "Content-Type": "application/json",
    ...fetchOptions.headers,
  });

  if (requiresAuth) {
    const token = await getAuthToken();
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json();
}

// Convenience methods for common HTTP operations
export const httpClient = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, data: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
    }),

  put: <T>(endpoint: string, data: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: "DELETE" }),
};
