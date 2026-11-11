import { createSignal, createEffect, Show } from 'solid-js';
import { api, ApiClientError } from '../api/client';
import { showToast } from './Toast';
import { Dialog } from './Dialog';

export interface AddMemberDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddMemberDialog(props: AddMemberDialogProps) {
  const [name, setName] = createSignal('');
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [role, setRole] = createSignal<'user' | 'admin'>('user');
  const [interests, setInterests] = createSignal('');
  const [error, setError] = createSignal<string | null>(null);
  const [creating, setCreating] = createSignal(false);

  createEffect(
    () => props.open,
    (isOpen) => {
      if (isOpen) {
        setName('');
        setEmail('');
        setPassword('');
        setRole('user');
        setInterests('');
        setError(null);
      }
    }
  );

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError(null);
    setCreating(true);

    try {
      const interestsArray = interests()
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      await api.users.create({
        name: name().trim(),
        email: email().trim(),
        password: password(),
        role: role(),
        interests: interestsArray,
      });

      showToast('Member created successfully', 'success');
      props.onSuccess();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to create member');
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog
      open={props.open}
      title="Add new member"
      titleId="add-member-dialog-title"
      onClose={props.onClose}
    >
      <Show when={error()}>
        <div class="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {error()}
        </div>
      </Show>

      <form onSubmit={handleSubmit} class="space-y-4">
        <div>
          <label for="create-member-name" class="form-label">
            Full Name
          </label>
          <input
            id="create-member-name"
            type="text"
            required
            value={name()}
            onInput={(e) => setName(e.currentTarget.value)}
            class="form-input"
            placeholder="e.g. John Doe"
          />
        </div>

        <div>
          <label for="create-member-email" class="form-label">
            Email address
          </label>
          <input
            id="create-member-email"
            type="email"
            required
            value={email()}
            onInput={(e) => setEmail(e.currentTarget.value)}
            class="form-input"
            placeholder="member@careguide.bd"
          />
        </div>

        <div>
          <label for="create-member-password" class="form-label">
            Temporary password
          </label>
          <input
            id="create-member-password"
            type="password"
            required
            value={password()}
            onInput={(e) => setPassword(e.currentTarget.value)}
            class="form-input"
            placeholder="At least 6 characters"
          />
        </div>

        <div>
          <label for="create-member-role" class="form-label">
            Role
          </label>
          <select
            id="create-member-role"
            value={role()}
            onChange={(e) => setRole(e.currentTarget.value as 'user' | 'admin')}
            class="form-input"
          >
            <option value="user">Member</option>
            <option value="admin">Administrator</option>
          </select>
        </div>

        <div>
          <label for="create-member-interests" class="form-label">
            Interests (comma separated)
          </label>
          <input
            id="create-member-interests"
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
            disabled={creating()}
          >
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" disabled={creating()}>
            {creating() ? 'Creating...' : 'Create member'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
