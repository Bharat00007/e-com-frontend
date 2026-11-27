const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    code = 'API_ERROR',
    details?: Record<string, string[]>
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  let response: Response;
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('sniff_co_admin_token') : null;
  try {
    response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
        ...(options.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError(
      'Unable to connect to the server. Please check your connection and try again.',
      0,
      'NETWORK_ERROR'
    );
  }

  const payload = (await response.json().catch(() => null)) as {
    success?: boolean;
    data?: T;
    error?: { code?: string; message?: string; details?: Record<string, string[]> };
  } | null;

  if (!response.ok || !payload?.success) {
    throw new ApiError(
      payload?.error?.message ?? `Request failed (${response.status})`,
      response.status,
      payload?.error?.code ?? 'API_ERROR',
      payload?.error?.details
    );
  }

  return payload.data as T;
}
