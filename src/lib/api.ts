import type { ApiEnvelope } from '../types';
import { getToken, useAuth } from './auth';

// api.uniesales.com's nginx prepends /api upstream, so the base excludes it.
const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'https://api.uniesales.com';

export class ApiError extends Error {
  readonly errors: { field?: string; reason: string }[];
  readonly status: number;
  constructor(message: string, errors: { field?: string; reason: string }[] = [], status = 0) {
    super(message);
    this.name = 'ApiError';
    this.errors = errors;
    this.status = status;
  }
}

interface CallOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  anonymous?: boolean;
}

async function call<T>(path: string, opts: CallOptions = {}): Promise<T> {
  const { body, anonymous, headers, ...rest } = opts;
  const token = anonymous ? null : getToken();

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(headers as Record<string, string> | undefined),
  };

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...rest,
      headers: finalHeaders,
      body: body == null ? undefined : JSON.stringify(body),
    });
  } catch (err) {
    throw new ApiError(
      `Network error: ${err instanceof Error ? err.message : String(err)}`,
      [],
      0,
    );
  }

  let env: ApiEnvelope<T> | null = null;
  const text = await res.text();
  if (text) {
    try {
      env = JSON.parse(text) as ApiEnvelope<T>;
    } catch {
      throw new ApiError(`Bad response from server (${res.status})`, [], res.status);
    }
  }
  if (!env) throw new ApiError(`Empty response from server (${res.status})`, [], res.status);

  if (!env.success) {
    if (res.status === 401) {
      // Token expired / invalid — wipe the session; the App auth-gate reacts.
      void useAuth.getState().logout();
    }
    throw new ApiError(env.message, env.errors, res.status);
  }
  return env.data;
}

export const api = {
  get: <T>(path: string, opts?: CallOptions) => call<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts?: CallOptions) =>
    call<T>(path, { ...opts, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, opts?: CallOptions) =>
    call<T>(path, { ...opts, method: 'PATCH', body }),
  delete: <T>(path: string, opts?: CallOptions) => call<T>(path, { ...opts, method: 'DELETE' }),
};
