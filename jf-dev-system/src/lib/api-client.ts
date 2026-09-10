import type { ApiError } from '@/types';

export class ApiRequestError extends Error {
  fieldErrors?: Record<string, string>;
  status: number;

  constructor(message: string, status: number, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

/** Wrapper fino sobre `fetch` para rotas internas — padroniza erros em português. */
export async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiError | null;
    throw new ApiRequestError(
      body?.message || 'Não foi possível concluir a operação. Tente novamente.',
      response.status,
      body?.fieldErrors
    );
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
