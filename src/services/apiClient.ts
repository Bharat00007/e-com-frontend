function normalizeApiBaseUrl(rawUrl?: string): string {
  const url = (rawUrl || 'https://e-com-backend-wheat.vercel.app').trim().replace(/\/+$/, '');
  if (url.endsWith('/api/v1')) {
    return url;
  }
  if (url.endsWith('/api')) {
    return `${url}/v1`;
  }
  return `${url}/api/v1`;
}

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

const GUEST_CART_TOKEN_KEY = 'sniff_co_guest_cart_token';

export function getGuestCartToken(): string {
  if (typeof window === 'undefined') return '';
  let token = localStorage.getItem(GUEST_CART_TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(GUEST_CART_TOKEN_KEY, token);
  }
  return token;
}

export function setGuestCartToken(token: string): void {
  if (typeof window !== 'undefined' && token) {
    localStorage.setItem(GUEST_CART_TOKEN_KEY, token);
  }
}

export function clearGuestCartToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(GUEST_CART_TOKEN_KEY);
  }
}

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
  const guestCartToken = getGuestCartToken();

  try {
    response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(guestCartToken ? { 'x-guest-cart-token': guestCartToken } : {}),
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

  // Preserve server-assigned guest cart token if received
  const serverGuestToken = response.headers.get('x-guest-cart-token');
  if (serverGuestToken) {
    setGuestCartToken(serverGuestToken);
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
