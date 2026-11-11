import { createSignal, createEffect, For, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { api, ApiClientError } from '../api/client';
import { currentUser } from '../state/session';
import { showToast } from '../components/Toast';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { EmptyState } from '../components/EmptyState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Icon } from '../components/Icon';

export function AdminUsersPage() {
  const navigate = useNavigate();

  const [users, setUsers] = createSignal<UserDTO[]>([]);
  const [page, setPage] = createSignal(1);
  const [totalPages, setTotalPages] = createSignal(1);
  const [totalItems, setTotalItems] = createSignal(0);
  const [loading, setLoading] = createSignal(true);

  // Dialog states
  const [createOpen, setCreateOpen] = createSignal(false);
  const [editUser, setEditUser] = createSignal<UserDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = createSignal<UserDTO | null>(null);
  const [deleteKeepData, setDeleteKeepData] = createSignal(true);

  // Form states - Create
  const [createName, setCreateName] = createSignal('');
  const [createEmail, setCreateEmail] = createSignal('');
  const [createPassword, setCreatePassword] = createSignal('');
  const [createRole, setCreateRole] = createSignal<'user' | 'admin'>('user');
  const [createInterests, setCreateInterests] = createSignal('');
  const [createError, setCreateError] = createSignal<string | null>(null);
  const [creating, setCreating] = createSignal(false);

  // Form states - Edit
  const [editName, setEditName] = createSignal('');
  const [editEmail, setEditEmail] = createSignal('');
  const [editRole, setEditRole] = createSignal<'user' | 'admin'>('user');
  const [editInterests, setEditInterests] = createSignal('');
  const [editError, setEditError] = createSignal<string | null>(null);
  const [saving, setSaving] = createSignal(false);
  const [deleting, setDeleting] = createSignal(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.users.list(page(), 10);
      setUsers(res.items);
      setTotalPages(res.totalPages);
      setTotalItems(res.total);
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : 'Failed to load users';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  createEffect(
    () => page(),
    () => {
      loadUsers();
    }
  );

  const openCreateDialog = () => {
    setCreateName('');
    setCreateEmail('');
    setCreatePassword('');
    setCreateRole('user');
    setCreateInterests('');
    setCreateError(null);
    setCreateOpen(true);
  };

  const handleCreateUser = async (e: Event) => {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);

    try {
      const interestsArray = createInterests()
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      await api.users.create({
        name: createName().trim(),
        email: createEmail().trim(),
        password: createPassword(),
        role: createRole(),
        interests: interestsArray,
      });

      showToast('Member created successfully', 'success');
      setCreateOpen(false);
      loadUsers();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setCreateError(err.message);
      } else {
        setCreateError('Failed to create member');
      }
    } finally {
      setCreating(false);
    }
  };

  const openEditDialog = (u: UserDTO) => {
    setEditUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditInterests((u.interests || []).join(', '));
    setEditError(null);
  };

  const handleSaveEdit = async (e: Event) => {
    e.preventDefault();
    const u = editUser();
    if (!u) return;
    setEditError(null);
    setSaving(true);

    try {
      const interestsArray = editInterests()
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      const isSelf = currentUser()?._id === u._id;
      const payload: Parameters<typeof api.users.update>[1] = {
        name: editName().trim(),
        email: editEmail().trim(),
        interests: interestsArray,
      };

      // Disallow self-demotion from UI
      if (!isSelf) {
        payload.role = editRole();
      }

      await api.users.update(u._id, payload);
      showToast('Member updated', 'success');
      setEditUser(null);
      loadUsers();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setEditError(err.message);
      } else {
        setEditError('Failed to update member');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const u = deleteTarget();
    if (!u) return;
    setDeleting(true);

    try {
      const res = await api.users.remove(u._id, deleteKeepData());
      const msg = deleteKeepData()
        ? `Account deleted. Notes and posts were kept.`
        : `Account deleted with ${res.deletedNotesCount} notes and ${res.deletedPostsCount} posts.`;
      showToast(msg, 'success');
      setDeleteTarget(null);
      loadUsers();
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : 'Failed to delete member';
      showToast(msg, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  return (
    <div class="space-y-6">
      <PageHeader
        title="Members"
        description="Manage team member accounts, roles, and workspace access."
        action={
          <button onClick={openCreateDialog} class="btn btn-primary">
            <Icon name="plus" size={16} />
            <span>Add member</span>
          </button>
        }
      />

      <div class="card overflow-hidden">
        <Show
          when={!loading() && users().length > 0}
          fallback={
            <Show when={loading()} fallback={<EmptyState title="No members found" />}>
              <div class="p-8 text-center text-sm text-slate-500">Loading members...</div>
            </Show>
          }
        >
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th class="w-1/3">Member</th>
                  <th>Role</th>
                  <th>Interests</th>
                  <th>Joined</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <For each={users()}>
                  {(u) => {
                    const isSelf = () => currentUser()?._id === u._id;
                    const initial = () => (u.name ? u.name.charAt(0).toUpperCase() : '?');

                    return (
                      <tr>
                        <td data-label="Member">
                          <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-slate-900 text-white font-medium text-xs flex items-center justify-center shrink-0">
                              {initial()}
                            </div>
                            <div class="min-w-0">
                              <div class="flex items-center gap-2">
                                <span class="font-medium text-slate-900 truncate">{u.name}</span>
                                <Show when={isSelf()}>
                                  <span class="badge badge-accent">You</span>
                                </Show>
                              </div>
                              <div class="text-xs text-slate-500 truncate">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td data-label="Role">
                          <span
                            class={
                              u.role === 'admin'
                                ? 'badge badge-accent'
                                : 'badge badge-neutral'
                            }
                          >
                            {u.role === 'admin' ? 'Admin' : 'Member'}
                          </span>
                        </td>
                        <td data-label="Interests">
                          <Show
                            when={u.interests && u.interests.length > 0}
                            fallback={<span class="text-xs text-slate-400">None</span>}
                          >
                            <div class="flex flex-wrap gap-1">
                              <For each={u.interests.slice(0, 3)}>
                                {(tag) => (
                                  <span class="inline-block px-1.5 py-0.5 rounded text-xs bg-slate-100 text-slate-600">
                                    {tag}
                                  </span>
                                )}
                              </For>
                              <Show when={u.interests.length > 3}>
                                <span class="text-xs text-slate-400">
                                  +{u.interests.length - 3}
                                </span>
                              </Show>
                            </div>
                          </Show>
                        </td>
                        <td data-label="Joined" class="text-slate-500 text-xs">
                          {formatDate(u.createdAt)}
                        </td>
                        <td data-label="Actions" class="text-right">
                          <div class="flex items-center justify-end gap-1">
                            <button
                              onClick={() => navigate(`/insights?user=${u._id}`)}
                              class="btn btn-ghost text-xs px-2 py-1"
                              title="View posts"
                            >
                              Posts
                            </button>
                            <button
                              onClick={() => openEditDialog(u)}
                              class="btn btn-ghost text-xs px-2 py-1"
                            >
                              Edit
                            </button>
                            <Show when={!isSelf()}>
                              <button
                                onClick={() => {
                                  setDeleteKeepData(true);
                                  setDeleteTarget(u);
                                }}
                                class="btn btn-ghost text-xs px-2 py-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              >
                                Delete
                              </button>
                            </Show>
                          </div>
                        </td>
                      </tr>
                    );
                  }}
                </For>
              </tbody>
            </table>
          </div>

          <Pagination
            page={page()}
            totalPages={totalPages()}
            totalItems={totalItems()}
            label="members"
            onPageChange={setPage}
          />
        </Show>
      </div>

      {/* Add Member Modal */}
      <Show when={createOpen()}>
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setCreateOpen(false)}
          />
          <div class="relative w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 p-6 z-10 space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-slate-900 text-lg">Add new member</h3>
              <button
                onClick={() => setCreateOpen(false)}
                class="text-slate-400 hover:text-slate-600 p-1"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <Show when={createError()}>
              <div class="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {createError()}
              </div>
            </Show>

            <form onSubmit={handleCreateUser} class="space-y-4">
              <div>
                <label class="label">Full Name</label>
                <input
                  type="text"
                  required
                  value={createName()}
                  onInput={(e) => setCreateName(e.currentTarget.value)}
                  class="input"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <label class="label">Email address</label>
                <input
                  type="email"
                  required
                  value={createEmail()}
                  onInput={(e) => setCreateEmail(e.currentTarget.value)}
                  class="input"
                  placeholder="member@careguide.bd"
                />
              </div>

              <div>
                <label class="label">Temporary password</label>
                <input
                  type="password"
                  required
                  value={createPassword()}
                  onInput={(e) => setCreatePassword(e.currentTarget.value)}
                  class="input"
                  placeholder="At least 6 characters"
                />
              </div>

              <div>
                <label class="label">Role</label>
                <select
                  value={createRole()}
                  onChange={(e) =>
                    setCreateRole(e.currentTarget.value as 'user' | 'admin')
                  }
                  class="input"
                >
                  <option value="user">Member</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div>
                <label class="label">Interests (comma separated)</label>
                <input
                  type="text"
                  value={createInterests()}
                  onInput={(e) => setCreateInterests(e.currentTarget.value)}
                  class="input"
                  placeholder="reading, coding, chess"
                />
              </div>

              <div class="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
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
          </div>
        </div>
      </Show>

      {/* Edit Member Modal */}
      <Show when={editUser()}>
        {(u) => {
          const isSelf = () => currentUser()?._id === u()._id;

          return (
            <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={() => setEditUser(null)}
              />
              <div class="relative w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 p-6 z-10 space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="font-semibold text-slate-900 text-lg">Edit member</h3>
                  <button
                    onClick={() => setEditUser(null)}
                    class="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <Icon name="x" size={18} />
                  </button>
                </div>

                <Show when={editError()}>
                  <div class="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                    {editError()}
                  </div>
                </Show>

                <form onSubmit={handleSaveEdit} class="space-y-4">
                  <div>
                    <label class="label">Full Name</label>
                    <input
                      type="text"
                      required
                      value={editName()}
                      onInput={(e) => setEditName(e.currentTarget.value)}
                      class="input"
                    />
                  </div>

                  <div>
                    <label class="label">Email address</label>
                    <input
                      type="email"
                      required
                      value={editEmail()}
                      onInput={(e) => setEditEmail(e.currentTarget.value)}
                      class="input"
                    />
                  </div>

                  <div>
                    <label class="label">Role</label>
                    <select
                      value={editRole()}
                      onChange={(e) =>
                        setEditRole(e.currentTarget.value as 'user' | 'admin')
                      }
                      disabled={isSelf()}
                      class="input disabled:bg-slate-50 disabled:text-slate-500"
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
                    <label class="label">Interests (comma separated)</label>
                    <input
                      type="text"
                      value={editInterests()}
                      onInput={(e) => setEditInterests(e.currentTarget.value)}
                      class="input"
                      placeholder="reading, coding, chess"
                    />
                  </div>

                  <div class="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditUser(null)}
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
              </div>
            </div>
          );
        }}
      </Show>

      {/* Delete User Confirmation Dialog (FE-03, FE-09) */}
      <ConfirmDialog
        open={deleteTarget() !== null}
        title="Delete member account"
        description={
          deleteTarget()
            ? `Are you sure you want to delete ${deleteTarget()?.name}'s account? Choose how their existing content should be handled.`
            : ''
        }
        confirmLabel={deleting() ? 'Deleting...' : 'Delete member'}
        cancelLabel="Keep member"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      >
        <div class="space-y-2 pt-1">
          <label class="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
            <input
              type="radio"
              name="keepData"
              checked={deleteKeepData()}
              onChange={() => setDeleteKeepData(true)}
              class="mt-0.5 text-slate-900 focus:ring-slate-900"
            />
            <div class="text-xs">
              <span class="font-medium text-slate-900 block">Keep notes and posts</span>
              <span class="text-slate-500 block">
                Preserve their created content in the workspace (labeled as Deleted user).
              </span>
            </div>
          </label>

          <label class="flex items-start gap-2.5 p-3 rounded-lg border border-rose-200 hover:bg-rose-50/50 cursor-pointer transition-colors">
            <input
              type="radio"
              name="keepData"
              checked={!deleteKeepData()}
              onChange={() => setDeleteKeepData(false)}
              class="mt-0.5 text-rose-600 focus:ring-rose-600"
            />
            <div class="text-xs">
              <span class="font-medium text-rose-900 block">
                Delete notes and posts too
              </span>
              <span class="text-rose-600 block">
                Permanently delete all notes and posts created by this member.
              </span>
            </div>
          </label>
        </div>
      </ConfirmDialog>
    </div>
  );
}
