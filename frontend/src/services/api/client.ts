/**
 * Centralized API Client
 * Manages baseURL, default headers, JWT authentication injection, and error formatting.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
const STORAGE_KEY_AUTH = 'mira.auth';
const LEGACY_STORAGE_KEY_AUTH = 'invite-studio.auth';

export class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function getStoredToken(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH) || localStorage.getItem(LEGACY_STORAGE_KEY_AUTH);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return (
      parsed?.accessToken ||
      parsed?.data?.accessToken ||
      parsed?.data?.data?.accessToken ||
      parsed?.tokens?.accessToken ||
      null
    );
  } catch {
    return null;
  }
}

export function saveStoredAuth(tokens: unknown): void {
  try {
    const serialized = typeof tokens === 'string' ? tokens : JSON.stringify(tokens);
    localStorage.setItem(STORAGE_KEY_AUTH, serialized);
    localStorage.setItem(LEGACY_STORAGE_KEY_AUTH, serialized);
  } catch {
    // Ignore storage errors
  }
}

export function clearStoredAuth(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_AUTH);
    localStorage.removeItem(LEGACY_STORAGE_KEY_AUTH);
  } catch {
    // Ignore storage errors
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = getStoredToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  let data: any = null;

  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMessage =
      (data && typeof data === 'object' && (data.message || data.error)) ||
      `Request failed with status ${response.status}`;
    throw new ApiError(
      Array.isArray(errorMessage) ? errorMessage.join(', ') : String(errorMessage),
      response.status,
      data
    );
  }

  return data as T;
}

export const apiClient = {
  get: <T>(endpoint: string, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: 'GET', headers }),

  post: <T>(endpoint: string, body?: unknown, headers?: Record<string, string>) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers,
    }),

  patch: <T>(endpoint: string, body?: unknown, headers?: Record<string, string>) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers,
    }),

  delete: <T>(endpoint: string, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: 'DELETE', headers }),

  /**
   * Upload binary or multipart form-data (e.g. Excel import)
   */
  uploadFile: async <T>(
    endpoint: string,
    body: FormData | Blob | File,
    headers?: Record<string, string>
  ): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const token = getStoredToken();
    const reqHeaders: Record<string, string> = {
      Accept: 'application/json',
      ...(headers || {}),
    };
    if (token && !reqHeaders['Authorization']) {
      reqHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: reqHeaders,
      body,
    });

    const contentType = response.headers.get('content-type') || '';
    let data: any = null;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorMessage =
        (data && typeof data === 'object' && (data.message || data.error)) ||
        `Upload failed with status ${response.status}`;
      throw new ApiError(
        Array.isArray(errorMessage) ? errorMessage.join(', ') : String(errorMessage),
        response.status,
        data
      );
    }

    return data as T;
  },

  /**
   * Stream/download binary response (e.g. Excel export, PDF pass)
   */
  downloadBlob: async (
    endpoint: string,
    headers?: Record<string, string>
  ): Promise<Blob> => {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const token = getStoredToken();
    const reqHeaders: Record<string, string> = {
      ...(headers || {}),
    };
    if (token && !reqHeaders['Authorization']) {
      reqHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: reqHeaders,
    });

    if (!response.ok) {
      let errDetail: any = null;
      try {
        errDetail = await response.json();
      } catch {
        // ignore
      }
      throw new ApiError(
        (errDetail && (errDetail.message || errDetail.error)) ||
          `Download failed with status ${response.status}`,
        response.status,
        errDetail
      );
    }

    return response.blob();
  },
};
