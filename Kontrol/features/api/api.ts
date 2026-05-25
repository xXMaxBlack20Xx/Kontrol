export type ApiErrorShape = {
  code: string;
  message: string;
  details?: unknown;
  status: number;
};

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  auth?: boolean;
  skipAuthRefresh?: boolean;
  query?: Record<string, string | undefined>;
};

let accessToken: string | null = null;
let refreshHandler: (() => Promise<string | null>) | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function getConfiguredApiBaseUrl(): string {
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(/\/$/, '');

  if (!baseUrl) {
    throw new ApiError({
      code: 'API_BASE_URL_MISSING',
      message: 'No está configurada la URL del backend.',
      status: 0,
    });
  }

  return baseUrl;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${getConfiguredApiBaseUrl()}${normalizedPath}`);

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}

async function safeReadJson(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function normalizeError(status: number, payload: unknown): ApiErrorShape {
  if (payload && typeof payload === 'object') {
    const data = payload as Record<string, unknown>;
    const code = typeof data.error === 'string'
      ? data.error
      : typeof data.code === 'string'
        ? data.code
        : `HTTP_${status}`;
    const message = typeof data.message === 'string' ? data.message : 'No se pudo completar la solicitud.';

    return {
      code,
      message,
      details: data.details,
      status,
    };
  }

  return {
    code: `HTTP_${status}`,
    message: 'No se pudo completar la solicitud.',
    status,
  };
}

export class ApiError extends Error implements ApiErrorShape {
  code: string;
  details?: unknown;
  status: number;

  constructor(error: ApiErrorShape) {
    super(error.message);
    this.code = error.code;
    this.details = error.details;
    this.status = error.status;
  }
}

export function setApiAccessToken(token: string | null): void {
  accessToken = token;
}

export function getApiAccessToken(): string | null {
  return accessToken;
}

export function setApiRefreshHandler(handler: (() => Promise<string | null>) | null): void {
  refreshHandler = handler;
}

async function refreshAccessTokenOnce(): Promise<string | null> {
  if (!refreshHandler) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = refreshHandler().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

async function requestOnce<T>(path: string, options: RequestOptions): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  if (options.auth !== false && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let response: Response;

  try {
    response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch (error) {
    throw new ApiError({
      code: 'NETWORK_ERROR',
      message: 'No se pudo conectar con el backend. Revisa tu conexión e intenta nuevamente.',
      details: error instanceof Error ? error.message : undefined,
      status: 0,
    });
  }

  const payload = await safeReadJson(response);

  if (!response.ok) {
    throw new ApiError(normalizeError(response.status, payload));
  }

  return payload as T;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  try {
    return await requestOnce<T>(path, options);
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.status === 401 &&
      options.auth !== false &&
      !options.skipAuthRefresh &&
      refreshHandler
    ) {
      const refreshedAccessToken = await refreshAccessTokenOnce();

      if (refreshedAccessToken) {
        setApiAccessToken(refreshedAccessToken);
        return requestOnce<T>(path, { ...options, skipAuthRefresh: true });
      }
    }

    throw error;
  }
}

export function apiGet<T>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
  return apiRequest<T>(path, { ...options, method: 'GET' });
}

export function apiPost<T>(path: string, body?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
  return apiRequest<T>(path, { ...options, body, method: 'POST' });
}

export function apiPut<T>(path: string, body?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
  return apiRequest<T>(path, { ...options, body, method: 'PUT' });
}

export function apiDelete<T>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
  return apiRequest<T>(path, { ...options, method: 'DELETE' });
}
