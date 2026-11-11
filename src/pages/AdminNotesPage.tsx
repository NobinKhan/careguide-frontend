import { createSignal, createEffect, For, Show } from 'solid-js';
import { api, ApiClientError } from '../api/client';
import { showToast } from '../components/Toast';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { EmptyState } from '../components/EmptyState';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function AdminNotesPage() {
  const [notes, setNotes] = createSignal<NoteDTO[]>([]);
  const [page, setPage] = createSignal(1);
  const [totalPages, setTotalPages] = createSignal(1);
  const [totalItems, setTotalItems] = createSignal(0);
  const [loading, setLoading] = createSignal(true);

  // Delete state
  const [deleteTarget, setDeleteTarget] = createSignal<NoteDTO | null>(null);
  const [deleting, setDeleting] = createSignal(false);

  // View note preview modal
  const [previewNote, setPreviewNote] = createSignal<NoteDTO | null>(null);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const res = await api.notes.listAllAdmin(page(), 10);
      setNotes(res.items);
      setTotalPages(res.totalPages);
      setTotalItems(res.total);
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : 'Failed to load notes';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  createEffect(
    () => page(),
    () => {
      loadNotes();
    }
  );

  const handleDelete = async () => {
    const target = deleteTarget();
    if (!target) return;
    setDeleting(true);

    try {
      await api.notes.remove(target._id);
      showToast('Note deleted', 'success');
      setDeleteTarget(null);
      loadNotes();
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : 'Failed to delete note';
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
        title="All Notes"
        description="Workspace-wide private notes across all members for administration."
      />

      <div class="card overflow-hidden">
        <Show
          when={!loading() && notes().length > 0}
          fallback={
            <Show when={loading()} fallback={<EmptyState title="No notes found" />}>
              <div class="p-8 text-center text-sm text-slate-500">Loading notes...</div>
            </Show>
          }
        >
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th class="w-2/5">Note</th>
                  <th class="w-1/4">Owner</th>
                  <th>Created</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <For each={notes()}>
                  {(note) => {
                    return (
                      <tr>
                        <td data-label="Note">
                          <button
                            type="button"
                            onClick={() => setPreviewNote(note)}
                            class="text-left group block w-full"
                          >
                            <span class="font-medium text-slate-900 group-hover:text-slate-600 block truncate">
                              {note.title}
                            </span>
                            <span class="text-xs text-slate-500 line-clamp-1 mt-0.5">
                              {note.content}
                            </span>
                          </button>
                        </td>
                        <td data-label="Owner">
                          <Show
                            when={note.author}
                            fallback={
                              <span class="italic text-slate-400 text-xs">
                                Deleted user
                              </span>
                            }
                          >
                            {(author) => (
                              <div>
                                <div class="font-medium text-xs text-slate-900 truncate">
                                  {author().name}
                                </div>
                                <div class="text-xs text-slate-500 truncate">
                                  {author().email}
                                </div>
                              </div>
                            )}
                          </Show>
                        </td>
                        <td data-label="Created" class="text-xs text-slate-500">
                          {formatDate(note.createdAt)}
                        </td>
                        <td data-label="Actions" class="text-right">
                          <div class="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setPreviewNote(note)}
                              class="btn btn-ghost text-xs px-2 py-1"
                            >
                              View
                            </button>
                            <button
                              onClick={() => setDeleteTarget(note)}
                              class="btn btn-ghost text-xs px-2 py-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            >
                              Delete
                            </button>
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
            label="notes"
            onPageChange={setPage}
          />
        </Show>
      </div>

      {/* Note Preview Modal */}
      <Show when={previewNote()}>
        {(note) => (
          <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setPreviewNote(null)}
            />
            <div class="relative w-full max-w-lg bg-white rounded-xl shadow-xl border border-slate-200 p-6 z-10 space-y-4">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <h3 class="font-semibold text-slate-900 text-lg">{note().title}</h3>
                  <div class="text-xs text-slate-500 mt-1">
                    Owned by:{' '}
                    {note().author ? (
                      <span class="font-medium text-slate-700">
                        {note().author?.name} ({note().author?.email})
                      </span>
                    ) : (
                      <span class="italic text-slate-400">Deleted user</span>
                    )}{' '}
                    · {formatDate(note().createdAt)}
                  </div>
                </div>
                <button
                  onClick={() => setPreviewNote(null)}
                  class="text-slate-400 hover:text-slate-600 p-1"
                >
                  ✕
                </button>
              </div>

              <div class="p-4 rounded-lg bg-slate-50 border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                {note().content}
              </div>

              <div class="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = note();
                    setPreviewNote(null);
                    setDeleteTarget(target);
                  }}
                  class="btn btn-ghost text-rose-600 hover:bg-rose-50"
                >
                  Delete note
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewNote(null)}
                  class="btn btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </Show>

      {/* Delete Note Confirmation Dialog (FE-09) */}
      <ConfirmDialog
        open={deleteTarget() !== null}
        title="Delete note"
        description={
          deleteTarget()
            ? `Are you sure you want to permanently delete "${deleteTarget()?.title}"? This action cannot be undone.`
            : ''
        }
        confirmLabel={deleting() ? 'Deleting...' : 'Delete note'}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
