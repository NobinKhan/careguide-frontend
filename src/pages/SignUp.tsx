import { createSignal, createEffect, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { api, setStoredToken, ApiClientError } from '../api/client';
import { currentUser, setCurrentUser } from '../state/session';
import { showToast } from '../components/Toast';

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
    } catch (err: any) {
      if (err instanceof ApiClientError && err.fields) {
        setFieldErrors(err.fields);
      }
      setErrorMsg(err.message || 'Could not create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div class="min-h-screen flex flex-col items-center justify-center p-4 bg-[#f3f5fa]">
      <div class="w-full max-w-[400px]">
        {/* Brand Header */}
        <div class="flex items-center justify-center gap-3 mb-6">
          <div class="w-9 h-9 rounded-xl bg-[#3363FF] text-white flex items-center justify-center font-bold text-base shadow-sm">
            CG
          </div>
          <span class="font-bold text-2xl tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
            Care Guide
          </span>
        </div>

        {/* Card */}
        <div class="card p-8">
          <h2 class="text-xl font-bold text-slate-900 mb-1">Create account</h2>
          <p class="text-sm text-slate-500 mb-6">Get started with your private workspace.</p>

          <Show when={errorMsg()}>
            <div
              role="alert"
              class="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2"
            >
              <span>{errorMsg()}</span>
            </div>
          </Show>

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

          <div class="text-center text-sm text-slate-500 mt-6 pt-5 border-t border-slate-100">
            Already have an account?{' '}
            <a href="/signin" class="text-[#3363FF] font-semibold hover:underline">
              Sign in
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
