import { createSignal, onSettled, Show, For, createEffect } from 'solid-js';
import { useSearchParams } from '@solidjs/router';
import { api } from '../api/client';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { currentUser } from '../state/session';
import { showToast } from '../components/Toast';
import { formatDate } from '../lib/formatDate';

export function InsightsPage() {
  const [searchParams] = useSearchParams();

  // Scenario 1: Interests state
  const [interestGroups, setInterestGroups] = createSignal<InterestGroupDTO[]>([]);
  const [isLoadingInterests, setIsLoadingInterests] = createSignal(true);

  // Scenario 2: Selected person posts state
  const [selectedUserId, setSelectedUserId] = createSignal<string | null>(null);
  const [selectedUser, setSelectedUser] = createSignal<UserWithPostsDTO | null>(null);
  const [postsPage, setPostsPage] = createSignal(1);
  const [postsTotalPages, setPostsTotalPages] = createSignal(1);
  const [postsTotal, setPostsTotal] = createSignal(0);
  const [isLoadingPosts, setIsLoadingPosts] = createSignal(false);

  const fetchInterests = async () => {
    setIsLoadingInterests(true);
    try {
      const res = await api.aggregations.usersByInterest(1, 100);
      setInterestGroups(res.items);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load interest groups', 'error');
    } finally {
      setIsLoadingInterests(false);
    }
  };

  const fetchUserPosts = async (userId: string, pageNum = 1) => {
    if (!userId || userId === 'null') return;
    setIsLoadingPosts(true);
    try {
      const res = await api.aggregations.userPosts(userId, pageNum, 5);
      setSelectedUser(res.user);
      setPostsPage(res.page);
      setPostsTotalPages(res.totalPages);
      setPostsTotal(res.total);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to load user posts', 'error');
    } finally {
      setIsLoadingPosts(false);
    }
  };

  onSettled(() => {
    fetchInterests();
    const queryPerson = searchParams.person;
    if (queryPerson && typeof queryPerson === 'string') {
      setSelectedUserId(queryPerson);
      fetchUserPosts(queryPerson, 1);
    } else if (currentUser()) {
      const meId = currentUser()!._id;
      setSelectedUserId(meId);
      fetchUserPosts(meId, 1);
    }
  });

  createEffect(
    () => searchParams.person,
    (person) => {
      if (person && typeof person === 'string' && person !== selectedUserId()) {
        setSelectedUserId(person);
        fetchUserPosts(person, 1);
      }
    }
  );

  const selectPerson = (userId: string) => {
    setSelectedUserId(userId);
    fetchUserPosts(userId, 1);
  };

  return (
    <div>
      <PageHeader
        crumb="Workspace"
        title="People & interests"
        description="See which interests people share, and read anyone's posts."
      />

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 min-w-0">
        {/* Card 1: Popular Interests */}
        <section class="card p-6 min-w-0 flex flex-col">
          <div class="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <h2 class="card-title text-base">Popular interests</h2>
            <button
              type="button"
              onClick={fetchInterests}
              class="btn btn-secondary text-xs px-3 py-1.5 min-h-[30px]"
              disabled={isLoadingInterests()}
            >
              Refresh
            </button>
          </div>

          <Show
            when={!isLoadingInterests()}
            fallback={
              <div class="flex flex-col gap-3">
                <div class="h-10 bg-slate-100 rounded-xl animate-pulse" />
                <div class="h-10 bg-slate-100 rounded-xl animate-pulse" />
              </div>
            }
          >
            <Show
              when={interestGroups().length > 0}
              fallback={
                <p class="text-sm text-slate-400 py-6 text-center">No interest groups found.</p>
              }
            >
              <div class="flex flex-col divide-y divide-slate-100">
                <For each={interestGroups()}>
                  {(group) => (
                    <div class="py-3.5 first:pt-0 last:pb-0 flex flex-col gap-2">
                      <div class="flex items-center justify-between">
                        <span class="font-semibold text-sm text-slate-900 capitalize">
                          {group.interest}
                        </span>
                        <span class="badge-neutral text-xs">
                          {group.totalUsers} {group.totalUsers === 1 ? 'person' : 'people'}
                        </span>
                      </div>
                      <div class="flex flex-wrap gap-1.5">
                        <For each={group.users}>
                          {(u) => (
                            <button
                              type="button"
                              onClick={() => selectPerson(u._id)}
                              class={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                                selectedUserId() === u._id
                                  ? 'bg-[#3363FF] text-white border-[#3363FF]'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80'
                              }`}
                            >
                              {u.name}
                            </button>
                          )}
                        </For>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </Show>
        </section>

        {/* Card 2: Selected Person Posts */}
        <section class="card p-6 min-w-0 flex flex-col">
          <div class="pb-4 mb-4 border-b border-slate-100">
            <h2 class="card-title text-base">
              {selectedUser() ? `Posts by ${selectedUser()?.name}` : 'Posts'}
            </h2>
            <Show when={selectedUser()?.interests && selectedUser()!.interests.length > 0}>
              <div class="flex flex-wrap gap-1.5 mt-2">
                <For each={selectedUser()!.interests}>
                  {(interest) => (
                    <span class="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full capitalize">
                      {interest}
                    </span>
                  )}
                </For>
              </div>
            </Show>
          </div>

          <Show
            when={!isLoadingPosts()}
            fallback={
              <div class="flex flex-col gap-3">
                <div class="h-16 bg-slate-100 rounded-xl animate-pulse" />
                <div class="h-16 bg-slate-100 rounded-xl animate-pulse" />
              </div>
            }
          >
            <Show
              when={selectedUser()}
              fallback={
                <p class="text-sm text-slate-400 py-12 text-center">
                  Pick a person above to see their posts.
                </p>
              }
            >
              {(user) => (
                <Show
                  when={user().posts.length > 0}
                  fallback={
                    <p class="text-sm text-slate-500 py-12 text-center">
                      {user().name} hasn't posted yet.
                    </p>
                  }
                >
                  <div class="flex flex-col divide-y divide-slate-100">
                    <For each={user().posts}>
                      {(post) => (
                        <div class="py-3.5 first:pt-0 last:pb-0">
                          <div class="flex items-center justify-between gap-2 mb-1">
                            <h3 class="font-semibold text-sm text-slate-900 truncate">
                              {post.title}
                            </h3>
                            <span class="text-xs text-slate-400 shrink-0">
                              {formatDate(post.createdAt)}
                            </span>
                          </div>
                          <p class="text-xs text-slate-600 line-clamp-2 break-words">{post.body}</p>
                        </div>
                      )}
                    </For>

                    <Pagination
                      page={postsPage()}
                      totalPages={postsTotalPages()}
                      total={postsTotal()}
                      itemLabel="posts"
                      onPageChange={(p) => {
                        if (selectedUserId()) fetchUserPosts(selectedUserId()!, p);
                      }}
                    />
                  </div>
                </Show>
              )}
            </Show>
          </Show>
        </section>
      </div>
    </div>
  );
}
