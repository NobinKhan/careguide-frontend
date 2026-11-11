import { createSignal, createEffect, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { api, setStoredToken, ApiClientError } from '../api/client';
import { currentUser, setCurrentUser } from '../state/session';
import { showToast } from '../components/Toast';
import { AuthShell } from '../components/AuthShell';

export function SignUp() {
  const navigate = useNavigate();

  createEffect(
    () => currentUser(),
    (u) => {
      if (u) {
        navigate('/notes', { replace: true });
      }
    }
  );
  const [name, setName] = createSignal('');
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [interests, setInterests] = createSignal('');
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [errorMsg, setErrorMsg] = createSignal<string | null>(null);
  const [fieldErrors, setFieldErrors] = createSignal<Record<string, string>>({});

  const handleRegister = async (e: Event) => {
    e.preventDefault();
    setErrorMsg(null);
    setFieldErrors({});
    setIsSubmitting(true);

    const interestList = interests()
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await api.auth.register({
        name: name().trim(),
        email: email().trim(),
        password: password(),
        interests: interestList,
      });
      setStoredToken(res.token);
      setCurrentUser(res.user);
      showToast('Account created successfully');
      navigate('/notes');
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (err.fields) {
          setFieldErrors(err.fields);
        }
        setErrorMsg(err.message || 'Could not create account');
      } else {
        setErrorMsg(err instanceof Error ? err.message : 'Could not create account');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create account"
      subtitle="Get started with your private workspace."
      error={errorMsg()}
      footer={
        <>
          Already have an account?{' '}
          <a href="/signin" class="text-[#3363FF] font-semibold hover:underline">
            Sign in
          </a>
        </>
      }
    >
      <form onSubmit={handleRegister} class="flex flex-col gap-4">
        <div>
          <label for="signup-name" class="form-label">
            Full name
          </label>
          <input
            id="signup-name"
            type="text"
            value={name()}
            onInput={(e) => setName(e.currentTarget.value)}
            placeholder="Jane Doe"
            required
            class="form-input"
          />
          <Show when={fieldErrors().name}>
            <p class="text-xs text-red-600 mt-1">{fieldErrors().name}</p>
          </Show>
        </div>

        <div>
          <label for="signup-email" class="form-label">
            Email
          </label>
          <input
            id="signup-email"
            type="email"
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
          <label for="signup-password" class="form-label">
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            value={password()}
            onInput={(e) => setPassword(e.currentTarget.value)}
            placeholder="At least 6 characters"
            required
            class="form-input"
          />
          <Show when={fieldErrors().password}>
            <p class="text-xs text-red-600 mt-1">{fieldErrors().password}</p>
          </Show>
        </div>

        <div>
          <label for="signup-interests" class="form-label">
            Interests <span class="text-xs text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            id="signup-interests"
            type="text"
            value={interests()}
            onInput={(e) => setInterests(e.currentTarget.value)}
            placeholder="chess, coding, reading"
            class="form-input"
          />
          <p class="text-xs text-slate-400 mt-1">Separate with commas</p>
          <Show when={fieldErrors().interests}>
            <p class="text-xs text-red-600 mt-1">{fieldErrors().interests}</p>
          </Show>
        </div>

        <button type="submit" disabled={isSubmitting()} class="btn btn-primary w-full mt-2">
          {isSubmitting() ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  );
}
