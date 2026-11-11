import { createSignal, createEffect, Show } from 'solid-js';
import { api, ApiClientError } from '../api/client';
import { currentUser, setCurrentUser, signOut } from '../state/session';
import { showToast } from '../components/Toast';
import { PageHeader } from '../components/PageHeader';
import { Icon } from '../components/Icon';
import { formatDate } from '../lib/formatDate';

export function AccountPage() {
  const user = () => currentUser();

  const [interestsText, setInterestsText] = createSignal('');
  const [savingInterests, setSavingInterests] = createSignal(false);
  const [interestsError, setInterestsError] = createSignal<string | null>(null);

  // Sync initial interests
  createEffect(
    () => user()?.interests,
    (interests) => {
      if (interests) {
        setInterestsText(interests.join(', '));
      }
    }
  );

  const handleSaveInterests = async (e: Event) => {
    e.preventDefault();
    setInterestsError(null);
    setSavingInterests(true);

    try {
      const interestsArray = interestsText()
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      const res = await api.users.updateMyInterests(interestsArray);
      setCurrentUser(res.user);
      showToast('Interests updated successfully', 'success');
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : 'Failed to update interests';
      setInterestsError(msg);
      showToast(msg, 'error');
    } finally {
      setSavingInterests(false);
    }
  };

  return (
    <div class="space-y-6 max-w-3xl">
      <PageHeader
        crumb="Account"
        title="Account"
        description="View your profile details and update your preferences."
      />

      {/* Profile Card */}
      <div class="card p-6 space-y-6">
        <div>
          <h2 class="text-base font-semibold text-slate-900">Personal Information</h2>
          <p class="text-xs text-slate-500 mt-0.5">Your personal credentials and role.</p>
        </div>

        <div class="flex items-center gap-4 pb-4 border-b border-slate-100">
          <div class="w-14 h-14 rounded-full bg-slate-900 text-white font-semibold text-lg flex items-center justify-center shrink-0">
            {user()?.name ? user()!.name.charAt(0).toUpperCase() : '?'}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="font-medium text-slate-900 text-base">{user()?.name}</h3>
              <span class={user()?.role === 'admin' ? 'badge badge-accent' : 'badge badge-neutral'}>
                {user()?.role === 'admin' ? 'Administrator' : 'Member'}
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">{user()?.email}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span class="text-slate-400 block mb-1">Email</span>
            <span class="font-medium text-slate-800">{user()?.email}</span>
          </div>
          <div>
            <span class="text-slate-400 block mb-1">Account Role</span>
            <span class="font-medium text-slate-800 capitalize">
              {user()?.role === 'admin' ? 'Administrator' : 'Member'}
            </span>
          </div>
          <div>
            <span class="text-slate-400 block mb-1">Member Since</span>
            <span class="font-medium text-slate-800">
              {formatDate(user()?.createdAt, { fallback: '—' })}
            </span>
          </div>
        </div>
      </div>

      {/* Interests Card */}
      <div class="card p-6 space-y-4">
        <div>
          <h2 class="text-base font-semibold text-slate-900">Interests & Topics</h2>
          <p class="text-xs text-slate-500 mt-0.5">
            Topics you are interested in. Used to discover and group peers in Insights.
          </p>
        </div>

        <Show when={interestsError()}>
          <div class="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {interestsError()}
          </div>
        </Show>

        <form onSubmit={handleSaveInterests} class="space-y-4">
          <div>
            <label for="account-interests" class="form-label">
              Interests (comma-separated)
            </label>
            <input
              id="account-interests"
              type="text"
              value={interestsText()}
              onInput={(e) => setInterestsText(e.currentTarget.value)}
              class="form-input"
              placeholder="e.g. chess, coding, photography, reading"
            />
            <p class="text-xs text-slate-400 mt-1.5">
              Separate individual topics with a comma. They will be saved in lowercase.
            </p>
          </div>

          <div class="flex items-center justify-end">
            <button type="submit" class="btn btn-primary" disabled={savingInterests()}>
              {savingInterests() ? 'Saving...' : 'Save interests'}
            </button>
          </div>
        </form>
      </div>

      {/* Sign Out Card */}
      <div class="card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-rose-100 bg-rose-50/20">
        <div>
          <h2 class="text-sm font-semibold text-slate-900">Sign out of session</h2>
          <p class="text-xs text-slate-500 mt-0.5">End your current session on this device.</p>
        </div>
        <button
          onClick={() => signOut()}
          class="btn btn-secondary text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
        >
          <Icon name="logout" size={16} />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}
