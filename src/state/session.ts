import { createSignal, createMemo } from 'solid-js';
import { api, getStoredToken, setStoredToken } from '../api/client';
import { showToast } from '../components/Toast';

export const [currentUser, setCurrentUser] = createSignal<UserDTO | null>(null);
export const [isInitializing, setIsInitializing] = createSignal<boolean>(true);

export const isAdmin = createMemo(() => currentUser()?.role === 'admin');

export function signOut(message?: string) {
  setStoredToken(null);
  setCurrentUser(null);
  if (message) {
    showToast(message, 'info');
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('careguide:signed-out', () => {
    signOut('Your session ended. Please sign in again.');
  });
}

export async function initSession(): Promise<void> {
  const token = getStoredToken();
  if (!token) {
    setIsInitializing(false);
    return;
  }

  try {
    const res = await api.auth.me();
    setCurrentUser(res.user);
  } catch {
    setStoredToken(null);
    setCurrentUser(null);
  } finally {
    setIsInitializing(false);
  }
}
