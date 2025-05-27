import { useAuth0 } from "@auth0/auth0-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
  getAuthToken: () => Promise<string>
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

const getHttpClient = (getAuthToken: () => Promise<string>) => ({
  get: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: "GET" }, getAuthToken),

  post: <T>(endpoint: string, data: unknown, options?: RequestOptions) =>
    apiRequest<T>(
      endpoint,
      {
        ...options,
        method: "POST",
        body: JSON.stringify(data),
      },
      getAuthToken
    ),

  put: <T>(endpoint: string, data: unknown, options?: RequestOptions) =>
    apiRequest<T>(
      endpoint,
      {
        ...options,
        method: "PUT",
        body: JSON.stringify(data),
      },
      getAuthToken
    ),

  patch: <T>(endpoint: string, data: unknown, options?: RequestOptions) =>
    apiRequest<T>(
      endpoint,
      {
        ...options,
        method: "PATCH",
        body: JSON.stringify(data),
      },
      getAuthToken
    ),

  delete: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    apiRequest<T>(
      endpoint,
      {
        ...options,
        method: "DELETE",
        body: data ? JSON.stringify(data) : undefined,
      },
      getAuthToken
    ),
});

export const useHttpClient = () => {
  const { getAccessTokenSilently } = useAuth0();

  return getHttpClient(getAccessTokenSilently);
};
