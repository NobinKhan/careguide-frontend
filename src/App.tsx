import { onSettled, Show, createEffect } from 'solid-js';
import { createRouter, useNavigate } from '@solidjs/router';
import { currentUser, isAdmin, isInitializing, initSession } from './state/session';
import { Shell } from './components/Shell';
import { Toast } from './components/Toast';

// Pages
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { NotesPage } from './pages/NotesPage';
import { PostsPage } from './pages/PostsPage';
import { InsightsPage } from './pages/InsightsPage';
import { AccountPage } from './pages/AccountPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminNotesPage } from './pages/AdminNotesPage';

function RedirectToNotes() {
  const navigate = useNavigate();
  onSettled(() => {
    navigate('/notes', { replace: true });
  });
  return null;
}

function AdminGuard(props: { children?: any }) {
  const navigate = useNavigate();

  createEffect(
    () => isAdmin(),
    (admin) => {
      if (!admin) {
        navigate('/notes', { replace: true });
      }
    }
  );

  return <Show when={isAdmin()}>{props.children}</Show>;
}

function AuthenticatedLayout(props: { children?: any }) {
  const navigate = useNavigate();

  createEffect(
    () => !isInitializing() && !currentUser(),
    (shouldRedirect) => {
      if (shouldRedirect) {
        navigate('/signin', { replace: true });
      }
    }
  );

  return (
    <Show when={currentUser()}>
      <Shell>{props.children}</Shell>
    </Show>
  );
}

const AppRouter = createRouter({
  routes: [
    {
      path: '/signin',
      component: SignIn,
    },
    {
      path: '/signup',
      component: SignUp,
    },
    {
      path: '/',
      component: AuthenticatedLayout,
      children: [
        {
          path: '/',
          component: RedirectToNotes,
        },
        {
          path: '/notes',
          component: NotesPage,
        },
        {
          path: '/posts',
          component: PostsPage,
        },
        {
          path: '/insights',
          component: InsightsPage,
        },
        {
          path: '/account',
          component: AccountPage,
        },
        {
          path: '/admin/users',
          component: () => (
            <AdminGuard>
              <AdminUsersPage />
            </AdminGuard>
          ),
        },
        {
          path: '/admin/notes',
          component: () => (
            <AdminGuard>
              <AdminNotesPage />
            </AdminGuard>
          ),
        },
        {
          path: '*404',
          component: RedirectToNotes,
        },
      ],
    },
  ],
});

export function App() {
  onSettled(() => {
    initSession();
  });

  return (
    <Show
      when={!isInitializing()}
      fallback={
        <div class="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500">
          <div class="w-8 h-8 rounded-full border-2 border-slate-300 border-t-slate-800 animate-spin mb-3" />
          <span class="text-xs font-medium">Loading Care Guide...</span>
        </div>
      }
    >
      <AppRouter />
      <Toast />
    </Show>
  );
}
