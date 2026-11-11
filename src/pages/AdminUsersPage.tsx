import { createSignal, createEffect, For, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { api, ApiClientError } from '../api/client';
import { currentUser } from '../state/session';
import { showToast } from '../components/Toast';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { EmptyState } from '../components/EmptyState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { AddMemberDialog } from '../components/AddMemberDialog';
import { EditMemberDialog } from '../components/EditMemberDialog';
import { Icon } from '../components/Icon';
import { formatDate } from '../lib/formatDate';

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
  const [deleting, setDeleting] = createSignal(false);

  const loadUsers = async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await api.users.list(pageNum, 10);
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
    (pageNum) => {
      loadUsers(pageNum);
    }
  );

  const handleDelete = async () => {
    const u = deleteTarget();
    if (!u) return;
    setDeleting(true);

    try {
      const res = await api.users.remove(u._id, deleteKeepData());
      const msg = deleteKeepData()
        ? 'Account deleted. Notes and posts were kept.'
        : `Account deleted with ${res.deletedNotesCount} notes and ${res.deletedPostsCount} posts.`;
      showToast(msg, 'success');
      setDeleteTarget(null);
      loadUsers(page());
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : 'Failed to delete member';
      showToast(msg, 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div class="space-y-6">
      <PageHeader
        crumb="Admin"
        title="Members"
        description="Manage team member accounts, roles, and workspace access."
        action={
          <button onClick={() => setCreateOpen(true)} class="btn btn-primary">
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
                              u.role === 'admin' ? 'badge badge-accent' : 'badge badge-neutral'
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
                          {formatDate(u.createdAt, { fallback: '—' })}
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
                              onClick={() => setEditUser(u)}
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
      <AddMemberDialog
        open={createOpen()}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false);
          loadUsers(page());
        }}
      />

      {/* Edit Member Modal */}
      <EditMemberDialog
        user={editUser()}
        onClose={() => setEditUser(null)}
        onSuccess={() => {
          setEditUser(null);
          loadUsers(page());
        }}
      />

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
              <span class="font-medium text-rose-900 block">Delete notes and posts too</span>
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
