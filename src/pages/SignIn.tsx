import { createSignal, createEffect, Show, For } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { api, setStoredToken, ApiClientError } from '../api/client';
import { currentUser, setCurrentUser } from '../state/session';
import { showToast } from '../components/Toast';
import { AuthShell } from '../components/AuthShell';

export function SignIn() {
  const navigate = useNavigate();

  createEffect(
    () => currentUser(),
    (u) => {
      if (u) {
        navigate('/notes', { replace: true });
      }
    }
  );
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [errorMsg, setErrorMsg] = createSignal<string | null>(null);
  const [fieldErrors, setFieldErrors] = createSignal<Record<string, string>>({});

  const isDemo = import.meta.env.DEV || import.meta.env.VITE_DEMO === 'true';

  const demoAccounts = [
    { name: 'System Admin', email: 'admin@careguide.bd', role: 'admin', pass: 'Admin@123' },
    { name: 'Kazi Nazrul', email: 'nazrul@careguide.bd', role: 'user', pass: 'User@123' },
    { name: 'Abdur Rahim', email: 'rahim@careguide.bd', role: 'user', pass: 'User@123' },
    { name: 'Abdul Karim', email: 'karim@careguide.bd', role: 'user', pass: 'User@123' },
  ];

  const handleLogin = async (e: Event) => {
    e.preventDefault();
    setErrorMsg(null);
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const res = await api.auth.login({
        email: email().trim(),
        password: password(),
      });
      setStoredToken(res.token);
      setCurrentUser(res.user);
      showToast('Signed in successfully');
      navigate('/notes');
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (err.fields) {
          setFieldErrors(err.fields);
        }
        setErrorMsg(err.message || 'Invalid email or password');
      } else {
        setErrorMsg(err instanceof Error ? err.message : 'Invalid email or password');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseDemo = async (demo: (typeof demoAccounts)[0]) => {
    setErrorMsg(null);
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const res = await api.auth.login({
        email: demo.email,
        password: demo.pass,
      });
      setStoredToken(res.token);
      setCurrentUser(res.user);
      showToast(`Signed in as ${demo.name}`);
      navigate('/notes');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not sign in with demo account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="Welcome back. Sign in to see your notes."
      error={errorMsg()}
      footer={
        <>
          New here?{' '}
          <a href="/signup" class="text-[#3363FF] font-semibold hover:underline">
            Create an account
          </a>
        </>
      }
      belowCard={
        <Show when={isDemo}>
          <details class="mt-4 p-4 rounded-xl border border-slate-200 bg-white/70 text-xs text-slate-600 shadow-sm">
            <summary class="font-medium text-slate-700 cursor-pointer select-none">
              Demo accounts
            </summary>
            <div class="mt-3 flex flex-col gap-2 pt-2 border-t border-slate-100">
              <For each={demoAccounts}>
                {(acc) => (
                  <div class="flex items-center justify-between py-1">
                    <div>
                      <span class="font-semibold text-slate-800">{acc.name}</span>
                      <span class="text-slate-400 ml-1.5 font-mono">{acc.email}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUseDemo(acc)}
                      disabled={isSubmitting()}
                      class="btn btn-secondary px-2.5 py-1 text-xs min-h-[28px]"
                    >
                      Use this account
                    </button>
                  </div>
                )}
              </For>
            </div>
          </details>
        </Show>
      }
    >
      <form onSubmit={handleLogin} class="flex flex-col gap-4">
        <div>
          <label for="signin-email" class="form-label">
            Email
          </label>
          <input
            id="signin-email"
            type="email"
            autocomplete="email"
            value={email()}
            onInput={(e) => setEmail(e.currentTarget.value)}
            placeholder="you@example.com"
            required
            class="form-input"
          />
          <Show when={fieldErrors().email}>
            <p class="text-xs text-red-600 mt-1">{fieldErrors().email}</p>
          </Show>
        </div>

        <div>
          <label for="signin-password" class="form-label">
            Password
          </label>
          <input
            id="signin-password"
            type="password"
            autocomplete="current-password"
            value={password()}
            onInput={(e) => setPassword(e.currentTarget.value)}
            required
            class="form-input"
          />
          <Show when={fieldErrors().password}>
            <p class="text-xs text-red-600 mt-1">{fieldErrors().password}</p>
          </Show>
        </div>

        <button type="submit" disabled={isSubmitting()} class="btn btn-primary w-full mt-2">
          {isSubmitting() ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthShell>
  );
}
