import { createSignal, onSettled, Show, For } from 'solid-js';
import { api, ApiClientError } from '../api/client';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../components/Icon';
import { showToast } from '../components/Toast';

export function PostsPage() {
  const [posts, setPosts] = createSignal<PostDTO[]>([]);
  const [page, setPage] = createSignal(1);
  const [totalPages, setTotalPages] = createSignal(1);
  const [total, setTotal] = createSignal(0);
  const [isLoading, setIsLoading] = createSignal(true);

  // Create post modal state
  const [isEditorOpen, setIsEditorOpen] = createSignal(false);
  const [formTitle, setFormTitle] = createSignal('');
  const [formBody, setFormBody] = createSignal('');
  const [isPublishing, setIsPublishing] = createSignal(false);
  const [formError, setFormError] = createSignal<string | null>(null);
  const [fieldErrors, setFieldErrors] = createSignal<Record<string, string>>({});

  const fetchPosts = async (pageNum = 1) => {
    setIsLoading(true);
    try {
      const res = await api.posts.list(pageNum, 10);
      setPosts(res.items);
      setPage(res.page);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch (err: any) {
      showToast(err.message || 'Failed to load posts', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  onSettled(() => {
    fetchPosts(1);
  });

  const openCreateDialog = () => {
    setFormTitle('');
    setFormBody('');
    setFormError(null);
    setFieldErrors({});
    setIsEditorOpen(true);
  };

  const handleCreatePost = async (e: Event) => {
    e.preventDefault();
    setIsPublishing(true);
    setFormError(null);
    setFieldErrors({});

    try {
      await api.posts.create({
        title: formTitle().trim(),
        body: formBody().trim(),
      });
      showToast('Post published');
      setIsEditorOpen(false);
      fetchPosts(1);
    } catch (err: any) {
      if (err instanceof ApiClientError && err.fields) {
        setFieldErrors(err.fields);
      }
      setFormError(err.message || 'Failed to publish post');
    } finally {
      setIsPublishing(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '—';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <div>
      <PageHeader
        title="Posts"
        description="Updates everyone can read."
        actions={
          <button type="button" onClick={openCreateDialog} class="btn btn-primary">
            <Icon name="plus" size={16} />
            <span>New post</span>
          </button>
        }
      />

      <Show
        when={!isLoading()}
        fallback={
          <div class="flex flex-col gap-4">
            <div class="card p-6 h-32 animate-pulse bg-slate-100" />
            <div class="card p-6 h-32 animate-pulse bg-slate-100" />
          </div>
        }
      >
        <Show
          when={posts().length > 0}
          fallback={
            <EmptyState
              icon="posts"
              title="No posts yet"
              description="Share an update with everyone."
              action={
                <button type="button" onClick={openCreateDialog} class="btn btn-primary">
                  <Icon name="plus" size={16} />
                  <span>New post</span>
                </button>
              }
            />
          }
        >
          <div class="flex flex-col gap-4">
            <For each={posts()}>
              {(post) => (
                <article class="card p-6">
                  {/* Author Header */}
                  <div class="flex items-center gap-3 mb-3">
                    <div class="w-8 h-8 rounded-full bg-[rgba(51,99,255,0.1)] text-[#2849c8] font-semibold text-xs flex items-center justify-center shrink-0">
                      {getInitials(post.author?.name)}
                    </div>
                    <div class="flex items-center gap-2 min-w-0">
                      <Show
                        when={post.author}
                        fallback={<span class="text-xs font-medium text-slate-400">Deleted user</span>}
                      >
                        {(author) => (
                          <a
                            href={`/insights?person=${author()._id}`}
                            class="font-semibold text-sm text-slate-900 hover:text-[#3363FF] hover:underline truncate"
                          >
                            {author().name}
                          </a>
                        )}
                      </Show>
                      <span class="text-xs text-slate-400 shrink-0">
                        · {formatDate(post.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Post Content */}
                  <h2 class="font-semibold text-base text-slate-900 mb-2">{post.title}</h2>
                  <p class="text-sm text-slate-600 whitespace-pre-wrap break-words">{post.body}</p>
                </article>
              )}
            </For>

            <div class="card p-4">
              <Pagination
                page={page()}
                totalPages={totalPages()}
                total={total()}
                itemLabel="posts"
                onPageChange={(p) => fetchPosts(p)}
              />
            </div>
          </div>
        </Show>
      </Show>

      {/* New Post Dialog */}
      <Show when={isEditorOpen()}>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="post-dialog-title"
            class="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-slate-200/80 animate-in fade-in duration-150"
          >
            <h2 id="post-dialog-title" class="text-lg font-semibold text-slate-900 mb-4">
              New post
            </h2>

            <Show when={formError()}>
              <div
                role="alert"
                class="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700"
              >
                {formError()}
              </div>
            </Show>

            <form onSubmit={handleCreatePost} class="flex flex-col gap-4">
              <div>
                <label for="post-title" class="form-label">
                  Title
                </label>
                <input
                  id="post-title"
                  type="text"
                  value={formTitle()}
                  onInput={(e) => setFormTitle(e.currentTarget.value)}
                  placeholder="What's this about?"
                  required
                  class="form-input"
                />
                <Show when={fieldErrors().title}>
                  <p class="text-xs text-red-600 mt-1">{fieldErrors().title}</p>
                </Show>
              </div>

              <div>
                <label for="post-body" class="form-label">
                  Message
                </label>
                <textarea
                  id="post-body"
                  rows={6}
                  value={formBody()}
                  onInput={(e) => setFormBody(e.currentTarget.value)}
                  placeholder="Share details with the community..."
                  required
                  class="form-textarea"
                />
                <Show when={fieldErrors().body}>
                  <p class="text-xs text-red-600 mt-1">{fieldErrors().body}</p>
                </Show>
              </div>

              <div class="flex items-center justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  class="btn btn-secondary"
                  disabled={isPublishing()}
                >
                  Cancel
                </button>
                <button type="submit" disabled={isPublishing()} class="btn btn-primary">
                  {isPublishing() ? 'Publishing…' : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Show>
    </div>
  );
}
