/// <reference path="./types/api-contract.d.ts" />
import { createSignal, createMemo, onSettled, For, Show } from 'solid-js';
import { api, getStoredToken, setStoredToken } from './api/client';

interface DemoAccount {
  label: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  interests: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    label: 'Admin',
    email: 'admin@careguide.bd',
    password: 'Admin@123',
    role: 'admin',
    interests: 'architecture, chess, reading',
  },
  {
    label: 'User 1 (Nazrul)',
    email: 'nazrul@careguide.bd',
    password: 'User@123',
    role: 'user',
    interests: 'chess, coding, motorcycles',
  },
  {
    label: 'User 2 (Rahim)',
    email: 'rahim@careguide.bd',
    password: 'User@123',
    role: 'user',
    interests: 'reading, coding, photography',
  },
  {
    label: 'User 3 (Karim)',
    email: 'karim@careguide.bd',
    password: 'User@123',
    role: 'user',
    interests: 'chess, reading, travel',
  },
];

function PaginationControls(props: {
  page: number;
  totalPages: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div class="flex items-center justify-between border-t border-slate-200 pt-3 mt-3 text-sm text-slate-600">
      <span>
        Page <strong>{props.page}</strong> of <strong>{props.totalPages}</strong> ({props.total} total)
      </span>
      <div class="flex gap-2">
        <button
          type="button"
          disabled={props.page <= 1}
          onClick={() => props.onPrev()}
          class="px-3 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={props.page >= props.totalPages}
          onClick={() => props.onNext()}
          class="px-3 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function App() {
  // Auth & Navigation State
  const [currentUser, setCurrentUser] = createSignal<UserDTO | null>(null);
  const [authMode, setAuthMode] = createSignal<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = createSignal<'notes' | 'posts' | 'aggregations' | 'admin'>('notes');
  const [statusBanner, setStatusBanner] = createSignal<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = createSignal(false);

  // Auth Form Inputs
  const [authName, setAuthName] = createSignal('');
  const [authEmail, setAuthEmail] = createSignal('admin@careguide.bd');
  const [authPassword, setAuthPassword] = createSignal('Admin@123');
  const [authInterests, setAuthInterests] = createSignal('chess, coding');

  // Profile Interests Input
  const [myInterestsDraft, setMyInterestsDraft] = createSignal('');

  // Own Notes State
  const [myNotes, setMyNotes] = createSignal<NoteDTO[]>([]);
  const [myNotesPage, setMyNotesPage] = createSignal(1);
  const [myNotesTotalPages, setMyNotesTotalPages] = createSignal(1);
  const [myNotesTotal, setMyNotesTotal] = createSignal(0);
  const [noteTitle, setNoteTitle] = createSignal('');
  const [noteContent, setNoteContent] = createSignal('');
  const [editingNoteId, setEditingNoteId] = createSignal<string | null>(null);
  const [editNoteTitle, setEditNoteTitle] = createSignal('');
  const [editNoteContent, setEditNoteContent] = createSignal('');

  // Public Posts State
  const [posts, setPosts] = createSignal<PostDTO[]>([]);
  const [postsPage, setPostsPage] = createSignal(1);
  const [postsTotalPages, setPostsTotalPages] = createSignal(1);
  const [postsTotal, setPostsTotal] = createSignal(0);
  const [postTitle, setPostTitle] = createSignal('');
  const [postBody, setPostBody] = createSignal('');

  // Aggregations State (Scenario 1 & Scenario 2)
  const [interestGroups, setInterestGroups] = createSignal<InterestGroupDTO[]>([]);
  const [lookupUserId, setLookupUserId] = createSignal('');
  const [lookupResult, setLookupResult] = createSignal<UserPostsAggregationResponseDTO | null>(null);
  const [lookupPage, setLookupPage] = createSignal(1);

  // Admin State (Users CRUD & All Notes)
  const [adminUsers, setAdminUsers] = createSignal<UserDTO[]>([]);
  const [adminUsersPage, setAdminUsersPage] = createSignal(1);
  const [adminUsersTotalPages, setAdminUsersTotalPages] = createSignal(1);
  const [adminUsersTotal, setAdminUsersTotal] = createSignal(0);

  const [newUserName, setNewUserName] = createSignal('');
  const [newUserEmail, setNewUserEmail] = createSignal('');
  const [newUserPassword, setNewUserPassword] = createSignal('');
  const [newUserRole, setNewUserRole] = createSignal<'user' | 'admin'>('user');
  const [newUserInterests, setNewUserInterests] = createSignal('');

  const [editingUserId, setEditingUserId] = createSignal<string | null>(null);
  const [editUserName, setEditUserName] = createSignal('');
  const [editUserRole, setEditUserRole] = createSignal<'user' | 'admin'>('user');
  const [editUserInterests, setEditUserInterests] = createSignal('');

  // Admin User Delete Confirmation Prompt Modal (keepData option)
  const [pendingDeleteUser, setPendingDeleteUser] = createSignal<UserDTO | null>(null);

  const [allNotes, setAllNotes] = createSignal<NoteDTO[]>([]);
  const [allNotesPage, setAllNotesPage] = createSignal(1);
  const [allNotesTotalPages, setAllNotesTotalPages] = createSignal(1);
  const [allNotesTotal, setAllNotesTotal] = createSignal(0);

  const isAdmin = createMemo(() => currentUser()?.role === 'admin');

  const notify = (type: 'ok' | 'err', text: string) => {
    setStatusBanner({ type, text });
  };

  async function loadMyNotes(page = 1) {
    const res = await api.notes.listOwn(page, 5);
    setMyNotes(res.items);
    setMyNotesPage(res.page);
    setMyNotesTotalPages(res.totalPages);
    setMyNotesTotal(res.total);
  }

  async function loadPosts(page = 1) {
    const res = await api.posts.list(page, 5);
    setPosts(res.items);
    setPostsPage(res.page);
    setPostsTotalPages(res.totalPages);
    setPostsTotal(res.total);
  }

  async function loadScenario1() {
    const res = await api.aggregations.usersByInterest();
    setInterestGroups(res.items);
  }

  async function loadScenario2(targetUserId: string, page = 1) {
    if (!targetUserId) return;
    const res = await api.aggregations.userPosts(targetUserId, page, 5);
    setLookupUserId(targetUserId);
    setLookupPage(res.page);
    setLookupResult(res);
  }

  async function loadAdminUsers(page = 1) {
    const res = await api.users.list(page, 8);
    setAdminUsers(res.items);
    setAdminUsersPage(res.page);
    setAdminUsersTotalPages(res.totalPages);
    setAdminUsersTotal(res.total);
  }

  async function loadAdminAllNotes(page = 1) {
    const res = await api.notes.listAllAdmin(page, 5);
    setAllNotes(res.items);
    setAllNotesPage(res.page);
    setAllNotesTotalPages(res.totalPages);
    setAllNotesTotal(res.total);
  }

  async function refreshAllForUser(user: UserDTO) {
    setCurrentUser(user);
    setMyInterestsDraft(user.interests.join(', '));
    await Promise.all([
      loadMyNotes(1),
      loadPosts(1),
      loadScenario1(),
      loadScenario2(user._id, 1),
    ]);
    if (user.role === 'admin') {
      await Promise.all([loadAdminUsers(1), loadAdminAllNotes(1)]);
    }
  }

  // Solid 2.0 lifecycle primitive: onSettled runs once after initial render settles
  onSettled(() => {
    const token = getStoredToken();
    if (token) {
      api.auth
        .me()
        .then((res) => refreshAllForUser(res.user))
        .catch(() => {
          setStoredToken(null);
          setCurrentUser(null);
        });
    }
  });

  async function handleLoginSubmit(e: Event) {
    e.preventDefault();
    setBusy(true);
    setStatusBanner(null);
    try {
      if (authMode() === 'login') {
        const res = await api.auth.login({
          email: authEmail(),
          password: authPassword(),
        });
        setStoredToken(res.token);
        await refreshAllForUser(res.user);
        notify('ok', `Logged in as ${res.user.name} (${res.user.role})`);
      } else {
        const interests = authInterests()
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        const res = await api.auth.register({
          name: authName(),
          email: authEmail(),
          password: authPassword(),
          interests,
        });
        setStoredToken(res.token);
        await refreshAllForUser(res.user);
        notify('ok', `Registered and logged in as ${res.user.name}`);
      }
    } catch (err: any) {
      notify('err', err.message || 'Authentication failed');
    } finally {
      setBusy(false);
    }
  }

  async function quickDemoLogin(account: DemoAccount) {
    setBusy(true);
    setStatusBanner(null);
    try {
      const res = await api.auth.login({
        email: account.email,
        password: account.password,
      });
      setStoredToken(res.token);
      if (res.user.role !== 'admin' && activeTab() === 'admin') {
        setActiveTab('notes');
      }
      await refreshAllForUser(res.user);
      notify('ok', `Switched to demo account: ${res.user.name} (${res.user.role})`);
    } catch (err: any) {
      notify('err', err.message || 'Demo login failed');
    } finally {
      setBusy(false);
    }
  }

  function handleLogout() {
    setStoredToken(null);
    setCurrentUser(null);
    setActiveTab('notes');
    notify('ok', 'Logged out');
  }

  async function handleSaveMyInterests(e: Event) {
    e.preventDefault();
    const list = myInterestsDraft()
      .split(',')
      .map((i) => i.trim())
      .filter(Boolean);
    try {
      const res = await api.users.updateMyInterests(list);
      setCurrentUser(res.user);
      setMyInterestsDraft(res.user.interests.join(', '));
      await loadScenario1();
      notify('ok', 'Updated your interests and refreshed Scenario 1 aggregation');
    } catch (err: any) {
      notify('err', err.message);
    }
  }

  async function handleCreateNote(e: Event) {
    e.preventDefault();
    try {
      await api.notes.create({ title: noteTitle(), content: noteContent() });
      setNoteTitle('');
      setNoteContent('');
      await loadMyNotes(1);
      if (isAdmin()) await loadAdminAllNotes(allNotesPage());
      notify('ok', 'Note created');
    } catch (err: any) {
      notify('err', err.message);
    }
  }

  async function handleSaveEditNote(id: string) {
    try {
      await api.notes.update(id, {
        title: editNoteTitle(),
        content: editNoteContent(),
      });
      setEditingNoteId(null);
      await loadMyNotes(myNotesPage());
      if (isAdmin()) await loadAdminAllNotes(allNotesPage());
      notify('ok', 'Note updated');
    } catch (err: any) {
      notify('err', err.message);
    }
  }

  async function handleDeleteNote(id: string) {
    try {
      await api.notes.remove(id);
      await loadMyNotes(myNotesPage());
      if (isAdmin()) await loadAdminAllNotes(allNotesPage());
      notify('ok', 'Note deleted');
    } catch (err: any) {
      notify('err', err.message);
    }
  }

  async function handleCreatePost(e: Event) {
    e.preventDefault();
    try {
      await api.posts.create({ title: postTitle(), body: postBody() });
      setPostTitle('');
      setPostBody('');
      await loadPosts(1);
      if (lookupUserId() === currentUser()?._id) {
        await loadScenario2(lookupUserId(), 1);
      }
      notify('ok', 'Public post published');
    } catch (err: any) {
      notify('err', err.message);
    }
  }

  async function inspectUserPostsInScenario2(userId: string) {
    setActiveTab('aggregations');
    await loadScenario2(userId, 1);
  }

  async function handleAdminCreateUser(e: Event) {
    e.preventDefault();
    try {
      const interests = newUserInterests()
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      await api.users.create({
        name: newUserName(),
        email: newUserEmail(),
        password: newUserPassword(),
        role: newUserRole(),
        interests,
      });
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('user');
      setNewUserInterests('');
      await Promise.all([loadAdminUsers(1), loadScenario1()]);
      notify('ok', 'New user created by Admin');
    } catch (err: any) {
      notify('err', err.message);
    }
  }

  async function handleAdminSaveUser(id: string) {
    try {
      const interests = editUserInterests()
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      await api.users.update(id, {
        name: editUserName(),
        role: editUserRole(),
        interests,
      });
      setEditingUserId(null);
      await Promise.all([loadAdminUsers(adminUsersPage()), loadScenario1()]);
      notify('ok', 'User updated by Admin');
    } catch (err: any) {
      notify('err', err.message);
    }
  }

  async function confirmAdminDeleteUser(keepData: boolean) {
    const target = pendingDeleteUser();
    if (!target) return;
    try {
      const res = await api.users.remove(target._id, keepData);
      setPendingDeleteUser(null);
      await Promise.all([
        loadAdminUsers(adminUsersPage()),
        loadAdminAllNotes(allNotesPage()),
        loadPosts(postsPage()),
        loadScenario1(),
      ]);
      notify(
        'ok',
        keepData
          ? `Deleted user "${target.name}" while keeping their notes & posts intact.`
          : `Deleted user "${target.name}" along with ${res.deletedNotesCount} notes and ${res.deletedPostsCount} posts.`
      );
    } catch (err: any) {
      notify('err', err.message);
    }
  }

  return (
    <div class="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Bar */}
      <header class="bg-white border-b border-slate-200 px-6 py-4">
        <div class="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 class="text-lg font-bold text-slate-900">
              Care Guide BD — Role-Based Notes, Posts & MongoDB Aggregations
            </h1>
            <p class="text-xs text-slate-500">
              Hono + Bun + Mongoose (4 Explicit ESR Indexes) • SolidJS v2 + Tailwind CSS
            </p>
          </div>

          <Show when={currentUser()}>
            {(user) => (
              <div class="flex flex-wrap items-center gap-3">
                <div class="text-right">
                  <div class="text-sm font-semibold text-slate-800">{user().name}</div>
                  <div class="text-xs text-slate-500">
                    {user().email} •{' '}
                    <span
                      class={[
                        'inline-block px-2 py-0.5 rounded font-semibold uppercase text-[10px]',
                        {
                          'bg-amber-100 text-amber-800': user().role === 'admin',
                          'bg-blue-100 text-blue-800': user().role === 'user',
                        },
                      ]}
                    >
                      {user().role}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  class="px-3 py-1.5 rounded border border-slate-300 text-xs font-medium hover:bg-slate-100"
                >
                  Log Out
                </button>
              </div>
            )}
          </Show>
        </div>

        {/* Always-accessible 1-click Live Interview Role Switcher */}
        <div class="max-w-6xl mx-auto mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            1-Click Demo Switcher:
          </span>
          <For each={DEMO_ACCOUNTS}>
            {(acct) => (
              <button
                type="button"
                disabled={busy()}
                onClick={() => quickDemoLogin(acct)}
                class={[
                  'px-2.5 py-1 rounded text-xs font-medium border transition-colors',
                  {
                    'bg-slate-900 text-white border-slate-900':
                      currentUser()?.email === acct.email,
                    'bg-white text-slate-700 border-slate-300 hover:bg-slate-100':
                      currentUser()?.email !== acct.email,
                  },
                ]}
              >
                {acct.label} ({acct.email})
              </button>
            )}
          </For>
        </div>
      </header>

      <main class="max-w-6xl mx-auto p-6">
        <Show when={statusBanner()}>
          {(banner) => (
            <div
              class={[
                'mb-4 px-4 py-2.5 rounded border text-sm flex items-center justify-between',
                {
                  'bg-emerald-50 border-emerald-300 text-emerald-900': banner().type === 'ok',
                  'bg-rose-50 border-rose-300 text-rose-900': banner().type === 'err',
                },
              ]}
            >
              <span>{banner().text}</span>
              <button
                type="button"
                onClick={() => setStatusBanner(null)}
                class="text-xs underline ml-4"
              >
                Dismiss
              </button>
            </div>
          )}
        </Show>

        <Show
          when={currentUser()}
          fallback={
            <div class="grid md:grid-cols-2 gap-6">
              {/* Login / Register Card */}
              <section class="bg-white rounded-lg border border-slate-200 p-6">
                <div class="flex gap-2 mb-4 border-b border-slate-200 pb-3">
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    class={[
                      'px-3 py-1.5 rounded text-sm font-medium',
                      {
                        'bg-blue-600 text-white': authMode() === 'login',
                        'text-slate-600 hover:bg-slate-100': authMode() !== 'login',
                      },
                    ]}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('register')}
                    class={[
                      'px-3 py-1.5 rounded text-sm font-medium',
                      {
                        'bg-blue-600 text-white': authMode() === 'register',
                        'text-slate-600 hover:bg-slate-100': authMode() !== 'register',
                      },
                    ]}
                  >
                    Create Account
                  </button>
                </div>

                <form onSubmit={handleLoginSubmit} class="space-y-4">
                  <Show when={authMode() === 'register'}>
                    <div>
                      <label for="auth-name" class="block text-xs font-semibold text-slate-700 mb-1">
                        Full Name
                      </label>
                      <input
                        id="auth-name"
                        type="text"
                        required
                        value={authName()}
                        onInput={(e) => setAuthName(e.currentTarget.value)}
                        class="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                        placeholder="Your name"
                      />
                    </div>
                  </Show>

                  <div>
                    <label for="auth-email" class="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      id="auth-email"
                      type="email"
                      required
                      value={authEmail()}
                      onInput={(e) => setAuthEmail(e.currentTarget.value)}
                      class="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label
                      for="auth-password"
                      class="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Password
                    </label>
                    <input
                      id="auth-password"
                      type="password"
                      required
                      value={authPassword()}
                      onInput={(e) => setAuthPassword(e.currentTarget.value)}
                      class="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <Show when={authMode() === 'register'}>
                    <div>
                      <label
                        for="auth-interests"
                        class="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Interests (comma-separated)
                      </label>
                      <input
                        id="auth-interests"
                        type="text"
                        value={authInterests()}
                        onInput={(e) => setAuthInterests(e.currentTarget.value)}
                        class="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                        placeholder="chess, coding, reading"
                      />
                    </div>
                  </Show>

                  <button
                    type="submit"
                    disabled={busy()}
                    class="w-full rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {authMode() === 'login' ? 'Sign In' : 'Register'}
                  </button>
                </form>
              </section>

              {/* Demo Accounts Reference Card */}
              <section class="bg-white rounded-lg border border-slate-200 p-6">
                <h2 class="text-base font-bold text-slate-900 mb-2">
                  Live Interview Demo Credentials
                </h2>
                <p class="text-xs text-slate-600 mb-4">
                  Click any row below to sign in immediately with pre-seeded data (15 private notes & 12 public posts).
                </p>
                <div class="overflow-x-auto">
                  <table class="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr class="border-b border-slate-200 text-slate-500">
                        <th class="py-2 pr-2">Account</th>
                        <th class="py-2 pr-2">Email / Password</th>
                        <th class="py-2 pr-2">Interests</th>
                        <th class="py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <For each={DEMO_ACCOUNTS}>
                        {(acct) => (
                          <tr class="border-b border-slate-100">
                            <td class="py-2.5 pr-2 font-semibold">{acct.label}</td>
                            <td class="py-2.5 pr-2 font-mono">
                              {acct.email}
                              <br />
                              <span class="text-slate-500">{acct.password}</span>
                            </td>
                            <td class="py-2.5 pr-2 text-slate-600">{acct.interests}</td>
                            <td class="py-2.5">
                              <button
                                type="button"
                                onClick={() => quickDemoLogin(acct)}
                                class="px-2.5 py-1 rounded bg-slate-900 text-white hover:bg-slate-700"
                              >
                                Login
                              </button>
                            </td>
                          </tr>
                        )}
                      </For>
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          }
        >
          {/* Navigation Tabs */}
          <nav class="flex flex-wrap gap-2 mb-6 border-b border-slate-200 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab('notes')}
              class={[
                'px-4 py-2 rounded text-sm font-semibold',
                {
                  'bg-blue-600 text-white': activeTab() === 'notes',
                  'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100':
                    activeTab() !== 'notes',
                },
              ]}
            >
              My Notes & Interests ({myNotesTotal()})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('posts')}
              class={[
                'px-4 py-2 rounded text-sm font-semibold',
                {
                  'bg-blue-600 text-white': activeTab() === 'posts',
                  'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100':
                    activeTab() !== 'posts',
                },
              ]}
            >
              Public Posts ({postsTotal()})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('aggregations')}
              class={[
                'px-4 py-2 rounded text-sm font-semibold',
                {
                  'bg-blue-600 text-white': activeTab() === 'aggregations',
                  'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100':
                    activeTab() !== 'aggregations',
                },
              ]}
            >
              MongoDB Aggregations (Scenario 1 & 2)
            </button>
            <Show when={isAdmin()}>
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                class={[
                  'px-4 py-2 rounded text-sm font-semibold',
                  {
                    'bg-amber-600 text-white': activeTab() === 'admin',
                    'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100':
                      activeTab() !== 'admin',
                  },
                ]}
              >
                Admin Panel (Users & All Notes)
              </button>
            </Show>
          </nav>

          {/* TAB 1: MY NOTES & INTERESTS */}
          <Show when={activeTab() === 'notes'}>
            <div class="grid md:grid-cols-3 gap-6">
              <div class="space-y-6">
                {/* Update Interests */}
                <section class="bg-white rounded-lg border border-slate-200 p-5">
                  <h2 class="text-sm font-bold text-slate-900 mb-2">My Interests</h2>
                  <p class="text-xs text-slate-500 mb-3">
                    Indexed by Multikey Index 2 (<code>{'{ interests: 1 }'}</code>) for Scenario 1 aggregation.
                  </p>
                  <form onSubmit={handleSaveMyInterests} class="space-y-3">
                    <div>
                      <label
                        for="my-interests-input"
                        class="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Interests (comma-separated)
                      </label>
                      <input
                        id="my-interests-input"
                        type="text"
                        value={myInterestsDraft()}
                        onInput={(e) => setMyInterestsDraft(e.currentTarget.value)}
                        class="w-full rounded border border-slate-300 px-3 py-1.5 text-sm"
                      />
                    </div>
                    <button
                      type="submit"
                      class="w-full rounded bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      Save Interests
                    </button>
                  </form>
                </section>

                {/* Create Note */}
                <section class="bg-white rounded-lg border border-slate-200 p-5">
                  <h2 class="text-sm font-bold text-slate-900 mb-2">Create Private Note</h2>
                  <form onSubmit={handleCreateNote} class="space-y-3">
                    <div>
                      <label
                        for="new-note-title"
                        class="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Note Title
                      </label>
                      <input
                        id="new-note-title"
                        type="text"
                        required
                        value={noteTitle()}
                        onInput={(e) => setNoteTitle(e.currentTarget.value)}
                        class="w-full rounded border border-slate-300 px-3 py-1.5 text-sm"
                        placeholder="Enter note title"
                      />
                    </div>
                    <div>
                      <label
                        for="new-note-content"
                        class="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Content
                      </label>
                      <textarea
                        id="new-note-content"
                        required
                        rows={3}
                        value={noteContent()}
                        onInput={(e) => setNoteContent(e.currentTarget.value)}
                        class="w-full rounded border border-slate-300 px-3 py-1.5 text-sm"
                        placeholder="Write private note content..."
                      />
                    </div>
                    <button
                      type="submit"
                      class="w-full rounded bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      Create Note
                    </button>
                  </form>
                </section>
              </div>

              {/* Paginated My Notes List */}
              <section class="md:col-span-2 bg-white rounded-lg border border-slate-200 p-5">
                <div class="flex items-center justify-between mb-3">
                  <div>
                    <h2 class="text-base font-bold text-slate-900">My Private Notes</h2>
                    <p class="text-xs text-slate-500">
                      Queried via ESR Index 3: <code>{'{ userId: 1, _id: -1 }'}</code>
                    </p>
                  </div>
                </div>

                <div class="space-y-3">
                  <For each={myNotes()} fallback={<p class="text-sm text-slate-500">No notes found.</p>}>
                    {(note) => (
                      <div class="rounded border border-slate-200 p-4">
                        <Show
                          when={editingNoteId() === note._id}
                          fallback={
                            <div>
                              <div class="flex items-start justify-between gap-2">
                                <h3 class="text-sm font-bold text-slate-900">{note.title}</h3>
                                <div class="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingNoteId(note._id);
                                      setEditNoteTitle(note.title);
                                      setEditNoteContent(note.content);
                                    }}
                                    class="text-xs text-blue-600 hover:underline"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteNote(note._id)}
                                    class="text-xs text-rose-600 hover:underline"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                              <p class="text-sm text-slate-700 mt-1">{note.content}</p>
                              <div class="text-[11px] text-slate-400 mt-2 font-mono">
                                ID: {note._id}
                              </div>
                            </div>
                          }
                        >
                          <div class="space-y-2">
                            <label
                              for={`edit-note-title-${note._id}`}
                              class="block text-xs font-semibold text-slate-700"
                            >
                              Edit Title
                            </label>
                            <input
                              id={`edit-note-title-${note._id}`}
                              type="text"
                              value={editNoteTitle()}
                              onInput={(e) => setEditNoteTitle(e.currentTarget.value)}
                              class="w-full rounded border border-slate-300 px-2.5 py-1 text-sm"
                            />
                            <label
                              for={`edit-note-content-${note._id}`}
                              class="block text-xs font-semibold text-slate-700"
                            >
                              Edit Content
                            </label>
                            <textarea
                              id={`edit-note-content-${note._id}`}
                              rows={2}
                              value={editNoteContent()}
                              onInput={(e) => setEditNoteContent(e.currentTarget.value)}
                              class="w-full rounded border border-slate-300 px-2.5 py-1 text-sm"
                            />
                            <div class="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleSaveEditNote(note._id)}
                                class="px-3 py-1 rounded bg-blue-600 text-white text-xs font-semibold"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingNoteId(null)}
                                class="px-3 py-1 rounded border border-slate-300 text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </Show>
                      </div>
                    )}
                  </For>
                </div>

                <PaginationControls
                  page={myNotesPage()}
                  totalPages={myNotesTotalPages()}
                  total={myNotesTotal()}
                  onPrev={() => loadMyNotes(myNotesPage() - 1)}
                  onNext={() => loadMyNotes(myNotesPage() + 1)}
                />
              </section>
            </div>
          </Show>

          {/* TAB 2: PUBLIC POSTS */}
          <Show when={activeTab() === 'posts'}>
            <div class="grid md:grid-cols-3 gap-6">
              <section class="bg-white rounded-lg border border-slate-200 p-5 h-fit">
                <h2 class="text-sm font-bold text-slate-900 mb-2">Create Public Post</h2>
                <form onSubmit={handleCreatePost} class="space-y-3">
                  <div>
                    <label
                      for="new-post-title"
                      class="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Post Title
                    </label>
                    <input
                      id="new-post-title"
                      type="text"
                      required
                      value={postTitle()}
                      onInput={(e) => setPostTitle(e.currentTarget.value)}
                      class="w-full rounded border border-slate-300 px-3 py-1.5 text-sm"
                      placeholder="Post headline"
                    />
                  </div>
                  <div>
                    <label
                      for="new-post-body"
                      class="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Post Body
                    </label>
                    <textarea
                      id="new-post-body"
                      required
                      rows={4}
                      value={postBody()}
                      onInput={(e) => setPostBody(e.currentTarget.value)}
                      class="w-full rounded border border-slate-300 px-3 py-1.5 text-sm"
                      placeholder="Share an update with everyone..."
                    />
                  </div>
                  <button
                    type="submit"
                    class="w-full rounded bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    Publish Post
                  </button>
                </form>
              </section>

              <section class="md:col-span-2 bg-white rounded-lg border border-slate-200 p-5">
                <h2 class="text-base font-bold text-slate-900">All Public Posts</h2>
                <p class="text-xs text-slate-500 mb-4">
                  Sorted chronologically via built-in <code>_id_</code> index (<code>{'sort({ _id: -1 })'}</code>). Click any author to run Scenario 2 <code>$lookup</code>.
                </p>

                <div class="space-y-3">
                  <For each={posts()} fallback={<p class="text-sm text-slate-500">No posts yet.</p>}>
                    {(post) => (
                      <article class="rounded border border-slate-200 p-4">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                          <h3 class="text-sm font-bold text-slate-900">{post.title}</h3>
                          <button
                            type="button"
                            onClick={() => inspectUserPostsInScenario2(post.userId)}
                            class="text-xs px-2.5 py-1 rounded bg-slate-100 hover:bg-blue-50 text-blue-700 font-medium"
                          >
                            {post.author ? `Author: ${post.author.name} ($lookup)` : `User ID: ${post.userId} ($lookup)`}
                          </button>
                        </div>
                        <p class="text-sm text-slate-700 mt-1.5">{post.body}</p>
                        <div class="text-[11px] text-slate-400 mt-2 font-mono">
                          Post _id: {post._id}
                        </div>
                      </article>
                    )}
                  </For>
                </div>

                <PaginationControls
                  page={postsPage()}
                  totalPages={postsTotalPages()}
                  total={postsTotal()}
                  onPrev={() => loadPosts(postsPage() - 1)}
                  onNext={() => loadPosts(postsPage() + 1)}
                />
              </section>
            </div>
          </Show>

          {/* TAB 3: MONGODB AGGREGATIONS */}
          <Show when={activeTab() === 'aggregations'}>
            <div class="grid md:grid-cols-2 gap-6">
              {/* Scenario 1: Group Users by Interests */}
              <section class="bg-white rounded-lg border border-slate-200 p-5">
                <div class="flex items-center justify-between mb-2">
                  <h2 class="text-base font-bold text-slate-900">
                    Scenario 1: Group Users by Interests
                  </h2>
                  <button
                    type="button"
                    onClick={() => loadScenario1()}
                    class="px-2.5 py-1 rounded border border-slate-300 text-xs hover:bg-slate-50"
                  >
                    Refresh
                  </button>
                </div>
                <p class="text-xs text-slate-500 mb-4">
                  Single <code>UserModel.aggregate()</code> pipeline (<code>$match</code> → <code>$unwind</code> → <code>$group</code> → <code>$sort</code> → <code>$project</code>) backed by Index 2 (<code>{'{ interests: 1 }'}</code>).
                </p>

                <div class="space-y-3">
                  <For each={interestGroups()}>
                    {(group) => (
                      <div class="rounded border border-slate-200 p-3">
                        <div class="flex items-center justify-between mb-2">
                          <span class="font-bold text-sm text-slate-900 uppercase tracking-wide">
                            #{group.interest}
                          </span>
                          <span class="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                            {group.totalUsers} {group.totalUsers === 1 ? 'user' : 'users'}
                          </span>
                        </div>
                        <div class="flex flex-wrap gap-2">
                          <For each={group.users}>
                            {(u) => (
                              <button
                                type="button"
                                onClick={() => loadScenario2(u._id, 1)}
                                class={[
                                  'px-2.5 py-1 rounded border text-xs text-left transition-colors',
                                  {
                                    'bg-blue-600 text-white border-blue-600':
                                      lookupUserId() === u._id,
                                    'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100':
                                      lookupUserId() !== u._id,
                                  },
                                ]}
                              >
                                <span class="font-semibold">{u.name}</span> ({u.email})
                              </button>
                            )}
                          </For>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </section>

              {/* Scenario 2: User Posts via $lookup */}
              <section class="bg-white rounded-lg border border-slate-200 p-5">
                <h2 class="text-base font-bold text-slate-900 mb-1">
                  Scenario 2: User Posts via <code>$lookup</code>
                </h2>
                <p class="text-xs text-slate-500 mb-4">
                  Single <code>UserModel.aggregate()</code> call matching user <code>_id</code> and executing paginated <code>$lookup</code> on <code>posts</code> via Index 4 (<code>{'{ userId: 1, _id: -1 }'}</code>). Click any user in Scenario 1 to inspect.
                </p>

                <Show
                  when={lookupResult()}
                  fallback={
                    <p class="text-sm text-slate-500">
                      Select any user from Scenario 1 on the left to run the <code>$lookup</code> pipeline.
                    </p>
                  }
                >
                  {(res) => (
                    <div>
                      <div class="rounded bg-slate-100 p-3 mb-4 text-xs">
                        <div class="font-bold text-sm text-slate-900">
                          {res().user.name} ({res().user.email})
                        </div>
                        <div class="text-slate-600 mt-0.5">
                          Role: <strong>{res().user.role}</strong> • Interests:{' '}
                          {res().user.interests.join(', ') || 'None'}
                        </div>
                        <div class="text-slate-400 font-mono mt-0.5">
                          User _id: {res().user._id}
                        </div>
                      </div>

                      <div class="space-y-2.5">
                        <For
                          each={res().user.posts}
                          fallback={
                            <p class="text-sm text-slate-500">
                              No posts on page {res().page} for this user.
                            </p>
                          }
                        >
                          {(post) => (
                            <div class="rounded border border-slate-200 p-3">
                              <div class="font-semibold text-sm text-slate-900">{post.title}</div>
                              <p class="text-xs text-slate-700 mt-1">{post.body}</p>
                              <div class="text-[11px] font-mono text-slate-400 mt-1">
                                Post _id: {post._id}
                              </div>
                            </div>
                          )}
                        </For>
                      </div>

                      <div class="flex items-center justify-between border-t border-slate-200 pt-3 mt-3 text-xs text-slate-600">
                        <span>Page {lookupPage()} (Limit: 5)</span>
                        <div class="flex gap-2">
                          <button
                            type="button"
                            disabled={lookupPage() <= 1}
                            onClick={() => loadScenario2(lookupUserId(), lookupPage() - 1)}
                            class="px-2.5 py-1 rounded border border-slate-300 disabled:opacity-40"
                          >
                            Prev Page
                          </button>
                          <button
                            type="button"
                            disabled={res().user.posts.length < 5}
                            onClick={() => loadScenario2(lookupUserId(), lookupPage() + 1)}
                            class="px-2.5 py-1 rounded border border-slate-300 disabled:opacity-40"
                          >
                            Next Page
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </Show>
              </section>
            </div>
          </Show>

          {/* TAB 4: ADMIN PANEL */}
          <Show when={activeTab() === 'admin' && isAdmin()}>
            <div class="space-y-6">
              {/* Admin Users Management */}
              <div class="grid md:grid-cols-3 gap-6">
                <section class="bg-white rounded-lg border border-slate-200 p-5 h-fit">
                  <h2 class="text-sm font-bold text-slate-900 mb-3">Admin: Create User</h2>
                  <form onSubmit={handleAdminCreateUser} class="space-y-3">
                    <div>
                      <label
                        for="admin-new-name"
                        class="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Name
                      </label>
                      <input
                        id="admin-new-name"
                        type="text"
                        required
                        value={newUserName()}
                        onInput={(e) => setNewUserName(e.currentTarget.value)}
                        class="w-full rounded border border-slate-300 px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label
                        for="admin-new-email"
                        class="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Email
                      </label>
                      <input
                        id="admin-new-email"
                        type="email"
                        required
                        value={newUserEmail()}
                        onInput={(e) => setNewUserEmail(e.currentTarget.value)}
                        class="w-full rounded border border-slate-300 px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label
                        for="admin-new-password"
                        class="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Password
                      </label>
                      <input
                        id="admin-new-password"
                        type="password"
                        required
                        value={newUserPassword()}
                        onInput={(e) => setNewUserPassword(e.currentTarget.value)}
                        class="w-full rounded border border-slate-300 px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label
                        for="admin-new-role"
                        class="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Role
                      </label>
                      <select
                        id="admin-new-role"
                        value={newUserRole()}
                        onChange={(e) =>
                          setNewUserRole(e.currentTarget.value === 'admin' ? 'admin' : 'user')
                        }
                        class="w-full rounded border border-slate-300 px-3 py-1.5 text-sm bg-white"
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </div>
                    <div>
                      <label
                        for="admin-new-interests"
                        class="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Interests (comma-separated)
                      </label>
                      <input
                        id="admin-new-interests"
                        type="text"
                        value={newUserInterests()}
                        onInput={(e) => setNewUserInterests(e.currentTarget.value)}
                        class="w-full rounded border border-slate-300 px-3 py-1.5 text-sm"
                        placeholder="chess, reading"
                      />
                    </div>
                    <button
                      type="submit"
                      class="w-full rounded bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700"
                    >
                      Create User
                    </button>
                  </form>
                </section>

                <section class="md:col-span-2 bg-white rounded-lg border border-slate-200 p-5">
                  <h2 class="text-base font-bold text-slate-900">
                    Admin: All Users ({adminUsersTotal()})
                  </h2>
                  <p class="text-xs text-slate-500 mb-3">
                    Paginated via built-in <code>_id_</code> index. Clicking Delete prompts whether to keep or remove the user's notes and posts.
                  </p>

                  <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr class="border-b border-slate-200 text-slate-500">
                          <th class="py-2 pr-2">Name / Email</th>
                          <th class="py-2 pr-2">Role</th>
                          <th class="py-2 pr-2">Interests</th>
                          <th class="py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <For each={adminUsers()}>
                          {(u) => (
                            <tr class="border-b border-slate-100">
                              <td class="py-2.5 pr-2">
                                <Show
                                  when={editingUserId() === u._id}
                                  fallback={
                                    <div>
                                      <div class="font-semibold text-slate-900">{u.name}</div>
                                      <div class="text-slate-500 font-mono">{u.email}</div>
                                    </div>
                                  }
                                >
                                  <input
                                    aria-label="Edit user name"
                                    type="text"
                                    value={editUserName()}
                                    onInput={(e) => setEditUserName(e.currentTarget.value)}
                                    class="rounded border border-slate-300 px-2 py-1 text-xs w-full"
                                  />
                                </Show>
                              </td>
                              <td class="py-2.5 pr-2">
                                <Show
                                  when={editingUserId() === u._id}
                                  fallback={
                                    <span
                                      class={[
                                        'px-2 py-0.5 rounded font-semibold uppercase text-[10px]',
                                        {
                                          'bg-amber-100 text-amber-800': u.role === 'admin',
                                          'bg-blue-100 text-blue-800': u.role === 'user',
                                        },
                                      ]}
                                    >
                                      {u.role}
                                    </span>
                                  }
                                >
                                  <select
                                    aria-label="Edit user role"
                                    value={editUserRole()}
                                    onChange={(e) =>
                                      setEditUserRole(
                                        e.currentTarget.value === 'admin' ? 'admin' : 'user'
                                      )
                                    }
                                    class="rounded border border-slate-300 px-2 py-1 text-xs bg-white"
                                  >
                                    <option value="user">user</option>
                                    <option value="admin">admin</option>
                                  </select>
                                </Show>
                              </td>
                              <td class="py-2.5 pr-2">
                                <Show
                                  when={editingUserId() === u._id}
                                  fallback={
                                    <span class="text-slate-600">
                                      {u.interests.join(', ') || '—'}
                                    </span>
                                  }
                                >
                                  <input
                                    aria-label="Edit user interests"
                                    type="text"
                                    value={editUserInterests()}
                                    onInput={(e) => setEditUserInterests(e.currentTarget.value)}
                                    class="rounded border border-slate-300 px-2 py-1 text-xs w-full"
                                  />
                                </Show>
                              </td>
                              <td class="py-2.5">
                                <Show
                                  when={editingUserId() === u._id}
                                  fallback={
                                    <div class="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingUserId(u._id);
                                          setEditUserName(u.name);
                                          setEditUserRole(u.role);
                                          setEditUserInterests(u.interests.join(', '));
                                        }}
                                        class="text-blue-600 hover:underline font-medium"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => inspectUserPostsInScenario2(u._id)}
                                        class="text-slate-600 hover:underline"
                                      >
                                        Posts
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setPendingDeleteUser(u)}
                                        class="text-rose-600 hover:underline font-medium"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  }
                                >
                                  <div class="flex gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleAdminSaveUser(u._id)}
                                      class="px-2 py-1 rounded bg-blue-600 text-white"
                                    >
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingUserId(null)}
                                      class="px-2 py-1 rounded border border-slate-300"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </Show>
                              </td>
                            </tr>
                          )}
                        </For>
                      </tbody>
                    </table>
                  </div>

                  <PaginationControls
                    page={adminUsersPage()}
                    totalPages={adminUsersTotalPages()}
                    total={adminUsersTotal()}
                    onPrev={() => loadAdminUsers(adminUsersPage() - 1)}
                    onNext={() => loadAdminUsers(adminUsersPage() + 1)}
                  />
                </section>
              </div>

              {/* Admin: View Everyone's Notes */}
              <section class="bg-white rounded-lg border border-slate-200 p-5">
                <h2 class="text-base font-bold text-slate-900">
                  Admin: Everyone's Private Notes ({allNotesTotal()})
                </h2>
                <p class="text-xs text-slate-500 mb-3">
                  Paginated via built-in <code>_id_</code> index (<code>GET /api/notes/all</code>).
                </p>

                <div class="overflow-x-auto">
                  <table class="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr class="border-b border-slate-200 text-slate-500">
                        <th class="py-2 pr-2">Author</th>
                        <th class="py-2 pr-2">Title</th>
                        <th class="py-2 pr-2">Content</th>
                        <th class="py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <For each={allNotes()}>
                        {(note) => (
                          <tr class="border-b border-slate-100">
                            <td class="py-2.5 pr-2">
                              {note.author ? (
                                <div>
                                  <span class="font-semibold">{note.author.name}</span>
                                  <div class="text-slate-400 font-mono">{note.author.email}</div>
                                </div>
                              ) : (
                                <span class="text-amber-700 italic">
                                  Deleted User (kept data • ID: {note.userId})
                                </span>
                              )}
                            </td>
                            <td class="py-2.5 pr-2 font-semibold">{note.title}</td>
                            <td class="py-2.5 pr-2 text-slate-700">{note.content}</td>
                            <td class="py-2.5">
                              <button
                                type="button"
                                onClick={() => handleDeleteNote(note._id)}
                                class="text-rose-600 hover:underline font-medium"
                              >
                                Delete Note
                              </button>
                            </td>
                          </tr>
                        )}
                      </For>
                    </tbody>
                  </table>
                </div>

                <PaginationControls
                  page={allNotesPage()}
                  totalPages={allNotesTotalPages()}
                  total={allNotesTotal()}
                  onPrev={() => loadAdminAllNotes(allNotesPage() - 1)}
                  onNext={() => loadAdminAllNotes(allNotesPage() + 1)}
                />
              </section>
            </div>
          </Show>
        </Show>

        {/* ADMIN DELETE USER PROMPT MODAL (keepData=true vs keepData=false) */}
        <Show when={pendingDeleteUser()}>
          {(target) => (
            <div class="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
              <div class="bg-white rounded-lg border border-slate-200 max-w-md w-full p-6 shadow-xl">
                <h3 class="text-base font-bold text-slate-900">
                  Delete User: {target().name} ({target().email})
                </h3>
                <p class="text-sm text-slate-600 mt-2">
                  Would you like to <strong>keep</strong> this user's data (Notes & Posts) in the database, or <strong>delete all</strong> of their associated Notes and Posts as well?
                </p>

                <div class="mt-5 flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => confirmAdminDeleteUser(true)}
                    class="w-full px-4 py-2.5 rounded bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold text-left"
                  >
                    1. Keep User's Data (Delete user account only — keepData=true)
                  </button>
                  <button
                    type="button"
                    onClick={() => confirmAdminDeleteUser(false)}
                    class="w-full px-4 py-2.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold text-left"
                  >
                    2. Delete User & All Their Notes/Posts (Cascade delete — keepData=false)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDeleteUser(null)}
                    class="w-full px-4 py-2 rounded border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </Show>
      </main>
    </div>
  );
}
