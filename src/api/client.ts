/// <reference path="../types/api-contract.d.ts" />
import { hc } from 'hono/client';

const API_BASE = import.meta.env.VITE_API_URL || '';

export const rpcClient = hc(API_BASE);

const TOKEN_KEY = 'careguide_jwt_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export class ApiClientError extends Error {
  fields?: Record<string, string>;
  status?: number;
  constructor(message: string, status?: number, fields?: Record<string, string>) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.fields = fields;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiClientError("Can't reach the server.", 0);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && path !== '/api/auth/login') {
      setStoredToken(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('careguide:signed-out'));
      }
    }

    let msg: string;
    if (res.status === 500) {
      msg = 'Something went wrong. Try again.';
    } else if (typeof data?.error === 'string') {
      msg = data.error;
    } else if (data?.error?.issues?.[0]?.message) {
      msg = data.error.issues[0].message;
    } else {
      msg = `Request failed (${res.status})`;
    }

    throw new ApiClientError(msg, res.status, data?.fields);
  }
  return data as T;
}

export const api = {
  auth: {
    login: (body: { email: string; password: string }) =>
      apiFetch<AuthResponseDTO>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    register: (body: { name: string; email: string; password: string; interests?: string[] }) =>
      apiFetch<AuthResponseDTO>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    me: () => apiFetch<{ user: UserDTO }>('/api/auth/me'),
  },
  users: {
    updateMyInterests: (interests: string[]) =>
      apiFetch<{ user: UserDTO }>('/api/users/me/interests', {
        method: 'PATCH',
        body: JSON.stringify({ interests }),
      }),
    list: (page = 1, limit = 10) =>
      apiFetch<PaginatedResponse<UserDTO>>(`/api/users?page=${page}&limit=${limit}`),
    create: (body: {
      name: string;
      email: string;
      password: string;
      role: 'user' | 'admin';
      interests: string[];
    }) =>
      apiFetch<{ user: UserDTO }>('/api/users', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    update: (
      id: string,
      body: Partial<{
        name: string;
        email: string;
        password: string;
        role: 'user' | 'admin';
        interests: string[];
      }>
    ) =>
      apiFetch<{ user: UserDTO }>(`/api/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    remove: (id: string, keepData: boolean) =>
      apiFetch<DeleteUserResponseDTO>(`/api/users/${id}?keepData=${keepData ? 'true' : 'false'}`, {
        method: 'DELETE',
      }),
  },
  notes: {
    listOwn: (page = 1, limit = 10) =>
      apiFetch<PaginatedResponse<NoteDTO>>(`/api/notes?page=${page}&limit=${limit}`),
    listAllAdmin: (page = 1, limit = 10) =>
      apiFetch<PaginatedResponse<NoteDTO>>(`/api/notes/all?page=${page}&limit=${limit}`),
    create: (body: { title: string; content: string }) =>
      apiFetch<{ note: NoteDTO }>('/api/notes', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    update: (id: string, body: { title?: string; content?: string }) =>
      apiFetch<{ note: NoteDTO }>(`/api/notes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    remove: (id: string) =>
      apiFetch<{ deletedId: string }>(`/api/notes/${id}`, {
        method: 'DELETE',
      }),
  },
  posts: {
    list: (page = 1, limit = 10) =>
      apiFetch<PaginatedResponse<PostDTO>>(`/api/posts?page=${page}&limit=${limit}`),
    create: (body: { title: string; body: string }) =>
      apiFetch<{ post: PostDTO }>('/api/posts', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },
  aggregations: {
    usersByInterest: (page = 1, limit = 10) =>
      apiFetch<InterestGroupsPaginatedDTO>(
        `/api/aggregations/users-by-interest?page=${page}&limit=${limit}`
      ),
    userPosts: (userId: string, page = 1, limit = 5) =>
      apiFetch<UserPostsAggregationResponseDTO>(
        `/api/aggregations/user-posts/${userId}?page=${page}&limit=${limit}`
      ),
  },
};
