function normalizeApiBaseUrl(rawUrl?: string): string {
  // In local development on plain HTTP localhost, use the local Vite proxy `/api/v1`
  // so HttpOnly cookies can be stored and sent without browser cross-site HTTPS restrictions.
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return '/api/v1';
    }
  }

  // In production / deployed environments, always use the explicitly configured API URL or production backend
  const envUrl = (rawUrl || import.meta.env.VITE_API_BASE_URL || '').trim();
  if (envUrl) {
    const trimmed = envUrl.replace(/\/+$/, '');
    if (trimmed.endsWith('/api/v1')) return trimmed;
    if (trimmed.endsWith('/api')) return `${trimmed}/v1`;
    return `${trimmed}/api/v1`;
  }

  return 'https://e-com-backend-wheat.vercel.app/api/v1';
}

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

const DEFAULT_TIMEOUT_MS = 15000;
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Non-persistent in-memory CSRF token (never stored in localStorage)
let inMemoryCsrfToken: string | null = null;
let csrfPromise: Promise<string | null> | null = null;
let legacyCleaned = false;

/** Clears deprecated unauthenticated/token keys from earlier client builds so stale caches cannot leak. */
export function purgeLegacyClientAuthAndCartCaches(): void {
  if (typeof window === 'undefined' || legacyCleaned) return;
  legacyCleaned = true;
  try {
    localStorage.removeItem('sniff_co_customer_token');
    localStorage.removeItem('sniff_co_guest_cart_token');
    localStorage.removeItem('sniff_co_guest_cart_items');
  } catch {
    // Ignore storage access restriction
  }
}

export function setInMemoryCsrfToken(token: string | null): void {
  if (token && typeof token === 'string') {
    inMemoryCsrfToken = token;
  }
}

export function resetInMemoryCsrfToken(): void {
  inMemoryCsrfToken = null;
  csrfPromise = null;
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

function logApiDiagnostic(
  method: string,
  path: string,
  status: number | string,
  durationMs: number,
  requestId?: string,
  category?: string
) {
  if (import.meta.env.DEV) {
    console.debug(
      `[API] ${method} ${path} -> ${status} (${durationMs}ms)${requestId ? ` reqId=${requestId}` : ''}${
        category ? ` [${category}]` : ''
      }`
    );
  }
}

async function ensureCsrfToken(): Promise<string | null> {
  if (inMemoryCsrfToken) return inMemoryCsrfToken;
  if (csrfPromise) return csrfPromise;

  csrfPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/csrf`, {
        method: 'GET',
        credentials: 'include',
      });
      const headerToken = res.headers.get('x-csrf-token');
      if (headerToken) {
        inMemoryCsrfToken = headerToken;
        return inMemoryCsrfToken;
      }
      if (res.ok) {
        const json = (await res.json().catch(() => null)) as {
          data?: { csrfToken?: string };
        } | null;
        if (json?.data?.csrfToken) {
          inMemoryCsrfToken = json.data.csrfToken;
          return inMemoryCsrfToken;
        }
      }
    } catch {
      // Gracefully fall through cleanly
    } finally {
      csrfPromise = null;
    }
    return inMemoryCsrfToken;
  })();

  return csrfPromise;
}

export interface ApiRequestOptions extends RequestInit {
  timeoutMs?: number;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
  retries = 2
): Promise<T> {
  purgeLegacyClientAuthAndCartCaches();

  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal: externalSignal, ...fetchOptions } = options;
  const url = `${API_BASE_URL}${path}`;
  const method = (fetchOptions.method || 'GET').toUpperCase();
  const isIdempotent = method === 'GET' || method === 'HEAD';
  const isMutating = MUTATING_METHODS.has(method);

  if (isMutating && !inMemoryCsrfToken && path !== '/auth/csrf') {
    await ensureCsrfToken();
  }

  // Only send admin Bearer header for explicit `/admin` API calls; customer sessions rely strictly on HttpOnly cookies
  const adminToken =
    typeof window !== 'undefined' && path.startsWith('/admin')
      ? localStorage.getItem('sniff_co_admin_token')
      : null;

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', onExternalAbort, { once: true });
    }
  }

  const start = Date.now();
  let response: Response;

  try {
    response = await fetch(url, {
      ...fetchOptions,
      method,
      credentials: 'include',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(inMemoryCsrfToken ? { 'x-csrf-token': inMemoryCsrfToken } : {}),
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
        ...(fetchOptions.headers ?? {}),
      },
    });
  } catch (err) {
    clearTimeout(timeoutHandle);
    if (externalSignal) externalSignal.removeEventListener('abort', onExternalAbort);

    const isTimeoutOrAbort = err instanceof DOMException && err.name === 'AbortError';
    const duration = Date.now() - start;
    logApiDiagnostic(
      method,
      path,
      isTimeoutOrAbort ? 'TIMEOUT' : 'CONNECTION_RESET',
      duration,
      undefined,
      isTimeoutOrAbort ? 'TIMEOUT' : 'NETWORK_ERROR'
    );

    if (retries > 0 && isIdempotent && !(externalSignal?.aborted)) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return apiRequest<T>(path, options, retries - 1);
    }

    throw new ApiError(
      isTimeoutOrAbort
        ? 'The request timed out while waiting for the server. Please retry.'
        : 'Unable to connect to the server. Please check your connection and try again.',
      0,
      isTimeoutOrAbort ? 'TIMEOUT_ERROR' : 'NETWORK_ERROR'
    );
  } finally {
    clearTimeout(timeoutHandle);
    if (externalSignal) externalSignal.removeEventListener('abort', onExternalAbort);
  }

  const duration = Date.now() - start;
  const reqId = response.headers.get('x-request-id') ?? undefined;

  const headerCsrf = response.headers.get('x-csrf-token');
  if (headerCsrf) {
    setInMemoryCsrfToken(headerCsrf);
  }

  const payload = (await response.json().catch(() => null)) as {
    success?: boolean;
    data?: T;
    error?: { code?: string; message?: string; details?: Record<string, string[]> };
  } | null;

  if (payload?.data && typeof payload.data === 'object') {
    const dataObj = payload.data as Record<string, unknown>;
    if (typeof dataObj.csrfToken === 'string') {
      setInMemoryCsrfToken(dataObj.csrfToken);
    }
  }

  if (
    response.status === 503 &&
    payload?.error?.code === 'PROXY_RESET' &&
    retries > 0 &&
    isIdempotent
  ) {
    logApiDiagnostic(method, path, 503, duration, reqId, 'PROXY_RESET_RETRY');
    await new Promise((resolve) => setTimeout(resolve, 300));
    return apiRequest<T>(path, options, retries - 1);
  }

  if (!response.ok || !payload?.success) {
    const errorCode = payload?.error?.code ?? 'API_ERROR';
    const category =
      response.status >= 500
        ? errorCode === 'DATABASE_UNAVAILABLE'
          ? 'DATABASE_FAILURE'
          : 'HTTP_5XX'
        : response.status === 401 || response.status === 403
          ? 'AUTH_OR_CSRF_ERROR'
          : 'HTTP_4XX';

    logApiDiagnostic(method, path, response.status, duration, reqId, category);

    // Clear stale CSRF token if backend rejected it so next attempt refreshes cleanly
    if (response.status === 403 && errorCode === 'CSRF_TOKEN_INVALID') {
      resetInMemoryCsrfToken();
    }

    throw new ApiError(
      payload?.error?.message ?? `Request failed (${response.status})`,
      response.status,
      errorCode,
      payload?.error?.details
    );
  }

  logApiDiagnostic(method, path, response.status, duration, reqId);
  return payload.data as T;
}
