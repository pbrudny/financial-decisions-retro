export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getUserId(): string | null {
  return localStorage.getItem('userId');
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const userId = getUserId();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(userId ? { 'X-User-Id': userId } : {}),
    ...(options?.headers as Record<string, string> ?? {}),
  };

  const res = await fetch(`/api${path}`, {
    ...options,
    headers,
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(res.status, data.error ?? 'Błąd serwera', data.details);
  }

  return data;
}
