import { createSignal, createEffect, Show } from 'solid-js';
import { api, ApiClientError } from '../api/client';
import { currentUser } from '../state/session';
import { showToast } from './Toast';
import { Dialog } from './Dialog';

export interface EditMemberDialogProps {
  user: UserDTO | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditMemberDialog(props: EditMemberDialogProps) {
  const [name, setName] = createSignal('');
  const [email, setEmail] = createSignal('');
  const [role, setRole] = createSignal<'user' | 'admin'>('user');
  const [interests, setInterests] = createSignal('');
  const [error, setError] = createSignal<string | null>(null);
  const [saving, setSaving] = createSignal(false);

  createEffect(
    () => props.user,
    (u) => {
      if (u) {
        setName(u.name);
        setEmail(u.email);
        setRole(u.role);
        setInterests((u.interests || []).join(', '));
        setError(null);
      }
    }
  );

  const isSelf = () => currentUser()?._id === props.user?._id;

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const u = props.user;
    if (!u) return;

    setError(null);
    setSaving(true);

    try {
      const interestsArray = interests()
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      const payload: Parameters<typeof api.users.update>[1] = {
        name: name().trim(),
        email: email().trim(),
        interests: interestsArray,
      };

      // Disallow self-demotion from UI
      if (!isSelf()) {
        payload.role = role();
      }

      await api.users.update(u._id, payload);
      showToast('Member updated', 'success');
      props.onSuccess();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to update member');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={Boolean(props.user)}
      title="Edit member"
      titleId="edit-member-dialog-title"
      onClose={props.onClose}
    >
      <Show when={props.user}>
        <Show when={error()}>
          <div class="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error()}
          </div>
        </Show>

        <form onSubmit={handleSubmit} class="space-y-4">
          <div>
            <label for="edit-member-name" class="form-label">
              Full Name
            </label>
            <input
              id="edit-member-name"
              type="text"
              required
              value={name()}
              onInput={(e) => setName(e.currentTarget.value)}
              class="form-input"
            />
          </div>

          <div>
            <label for="edit-member-email" class="form-label">
              Email address
            </label>
            <input
              id="edit-member-email"
              type="email"
              required
              value={email()}
              onInput={(e) => setEmail(e.currentTarget.value)}
              class="form-input"
            />
          </div>

          <div>
            <label for="edit-member-role" class="form-label">
              Role
            </label>
            <select
              id="edit-member-role"
              value={role()}
              onChange={(e) => setRole(e.currentTarget.value as 'user' | 'admin')}
              disabled={isSelf()}
              class="form-input disabled:bg-slate-50 disabled:text-slate-500"
            >
              <option value="user">Member</option>
              <option value="admin">Administrator</option>
            </select>
            <Show when={isSelf()}>
              <p class="text-xs text-slate-500 mt-1">
                You cannot change your own role to prevent losing administrator access.
              </p>
            </Show>
          </div>

          <div>
            <label for="edit-member-interests" class="form-label">
              Interests (comma separated)
            </label>
            <input
              id="edit-member-interests"
              type="text"
              value={interests()}
              onInput={(e) => setInterests(e.currentTarget.value)}
              class="form-input"
              placeholder="reading, coding, chess"
            />
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => props.onClose()}
              class="btn btn-secondary"
              disabled={saving()}
            >
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" disabled={saving()}>
              {saving() ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </Show>
    </Dialog>
  );
}
