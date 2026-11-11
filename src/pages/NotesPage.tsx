import { createSignal, onSettled, Show, For } from 'solid-js';
import { api, ApiClientError } from '../api/client';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { EmptyState } from '../components/EmptyState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Icon } from '../components/Icon';
import { showToast } from '../components/Toast';

export function NotesPage() {
  const [notes, setNotes] = createSignal<NoteDTO[]>([]);
  const [page, setPage] = createSignal(1);
  const [totalPages, setTotalPages] = createSignal(1);
  const [total, setTotal] = createSignal(0);
  const [isLoading, setIsLoading] = createSignal(true);

  // Edit/Create Modal state
  const [isEditorOpen, setIsEditorOpen] = createSignal(false);
  const [editingNote, setEditingNote] = createSignal<NoteDTO | null>(null);
  const [formTitle, setFormTitle] = createSignal('');
  const [formContent, setFormContent] = createSignal('');
  const [isSaving, setIsSaving] = createSignal(false);
  const [formError, setFormError] = createSignal<string | null>(null);
  const [fieldErrors, setFieldErrors] = createSignal<Record<string, string>>({});

  // Delete Confirm Dialog state
  const [noteToDelete, setNoteToDelete] = createSignal<NoteDTO | null>(null);
  const [isDeleting, setIsDeleting] = createSignal(false);

  const fetchNotes = async (pageNum = 1) => {
    setIsLoading(true);
    try {
      const res = await api.notes.listOwn(pageNum, 10);
      setNotes(res.items);
      setPage(res.page);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch (err: any) {
      showToast(err.message || 'Failed to load notes', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  onSettled(() => {
    fetchNotes(1);
  });

  const openCreateDialog = () => {
    setEditingNote(null);
    setFormTitle('');
    setFormContent('');
    setFormError(null);
    setFieldErrors({});
    setIsEditorOpen(true);
  };

  const openEditDialog = (note: NoteDTO) => {
    setEditingNote(note);
    setFormTitle(note.title);
    setFormContent(note.content);
    setFormError(null);
    setFieldErrors({});
    setIsEditorOpen(true);
  };

  const handleSaveNote = async (e: Event) => {
    e.preventDefault();
    setIsSaving(true);
    setFormError(null);
    setFieldErrors({});

    const titleVal = formTitle().trim();
    const contentVal = formContent().trim();

    try {
      const current = editingNote();
      if (current) {
        await api.notes.update(current._id, { title: titleVal, content: contentVal });
        showToast('Note updated');
      } else {
        await api.notes.create({ title: titleVal, content: contentVal });
        showToast('Note saved');
      }
      setIsEditorOpen(false);
      fetchNotes(page());
    } catch (err: any) {
      if (err instanceof ApiClientError && err.fields) {
        setFieldErrors(err.fields);
      }
      setFormError(err.message || 'Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeleteNote = async () => {
    const target = noteToDelete();
    if (!target) return;

    setIsDeleting(true);
    try {
      await api.notes.remove(target._id);
      showToast('Note deleted');
      setNoteToDelete(null);
      fetchNotes(page());
    } catch (err: any) {
      showToast(err.message || 'Failed to delete note', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <div>
      <PageHeader
        title="My notes"
        description="Private notes only you can see."
        actions={
          <button type="button" onClick={openCreateDialog} class="btn btn-primary">
            <Icon name="plus" size={16} />
            <span>New note</span>
          </button>
        }
      />

      <Show
        when={!isLoading()}
        fallback={
          <div class="card p-6 flex flex-col gap-4">
            <div class="h-6 w-48 bg-slate-100 rounded-lg animate-pulse" />
            <div class="h-16 w-full bg-slate-100 rounded-xl animate-pulse" />
            <div class="h-16 w-full bg-slate-100 rounded-xl animate-pulse" />
          </div>
        }
      >
        <Show
          when={notes().length > 0}
          fallback={
            <EmptyState
              icon="notes"
              title="No notes yet"
              description="Write your first note. Only you can see it."
              action={
                <button type="button" onClick={openCreateDialog} class="btn btn-primary">
                  <Icon name="plus" size={16} />
                  <span>New note</span>
                </button>
              }
            />
          }
        >
          <div class="card p-6 divide-y divide-slate-100">
            <For each={notes()}>
              {(note) => (
                <div class="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <h3 class="font-semibold text-[15px] text-slate-900 truncate">
                        {note.title}
                      </h3>
                      <span class="text-xs text-slate-400 shrink-0">
                        {formatDate(note.updatedAt || note.createdAt)}
                      </span>
                    </div>
                    <p class="text-sm text-slate-600 line-clamp-2 break-words whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </div>
                  <div class="flex items-center gap-2 shrink-0 self-end sm:self-start pt-1">
                    <button
                      type="button"
                      onClick={() => openEditDialog(note)}
                      class="btn btn-secondary px-3 py-1.5 text-xs min-h-[32px]"
                    >
                      <Icon name="pencil" size={14} />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNoteToDelete(note)}
                      class="btn btn-danger-ghost px-3 py-1.5 text-xs min-h-[32px]"
                    >
                      <Icon name="trash" size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              )}
            </For>

            <Pagination
              page={page()}
              totalPages={totalPages()}
              total={total()}
              itemLabel="notes"
              onPageChange={(p) => fetchNotes(p)}
            />
          </div>
        </Show>
      </Show>

      {/* Create / Edit Note Dialog */}
      <Show when={isEditorOpen()}>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="note-dialog-title"
            class="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-slate-200/80 animate-in fade-in duration-150"
          >
            <h2 id="note-dialog-title" class="text-lg font-semibold text-slate-900 mb-4">
              {editingNote() ? 'Edit note' : 'New note'}
            </h2>

            <Show when={formError()}>
              <div
                role="alert"
                class="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700"
              >
                {formError()}
              </div>
            </Show>

            <form onSubmit={handleSaveNote} class="flex flex-col gap-4">
              <div>
                <label for="note-title" class="form-label">
                  Title
                </label>
                <input
                  id="note-title"
                  type="text"
                  value={formTitle()}
                  onInput={(e) => setFormTitle(e.currentTarget.value)}
                  placeholder="Note title"
                  required
                  class="form-input"
                />
                <Show when={fieldErrors().title}>
                  <p class="text-xs text-red-600 mt-1">{fieldErrors().title}</p>
                </Show>
              </div>

              <div>
                <label for="note-content" class="form-label">
                  Content
                </label>
                <textarea
                  id="note-content"
                  rows={6}
                  value={formContent()}
                  onInput={(e) => setFormContent(e.currentTarget.value)}
                  placeholder="Write your note..."
                  required
                  class="form-textarea"
                />
                <Show when={fieldErrors().content}>
                  <p class="text-xs text-red-600 mt-1">{fieldErrors().content}</p>
                </Show>
              </div>

              <div class="flex items-center justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  class="btn btn-secondary"
                  disabled={isSaving()}
                >
                  Cancel
                </button>
                <button type="submit" disabled={isSaving()} class="btn btn-primary">
                  {isSaving() ? 'Saving…' : 'Save note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Show>

      {/* Confirm Delete Note Dialog */}
      <ConfirmDialog
        isOpen={Boolean(noteToDelete())}
        title="Delete this note?"
        description={`'${noteToDelete()?.title}' will be deleted. You can't undo this.`}
        confirmLabel="Delete note"
        isDestructive={true}
        isLoading={isDeleting()}
        onConfirm={confirmDeleteNote}
        onCancel={() => setNoteToDelete(null)}
      />
    </div>
  );
}
