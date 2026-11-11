import { createSignal, Show, For } from 'solid-js';
import { useLocation } from '@solidjs/router';
import type { JSX } from '@solidjs/web';
import { currentUser, isAdmin, signOut } from '../state/session';
import { Icon, type IconName } from './Icon';

export function Shell(props: { children?: JSX.Element }) {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = createSignal(false);
  const [isMoreSheetOpen, setIsMoreSheetOpen] = createSignal(false);

  const getInitials = (name?: string) => {
    if (!name) return 'CG';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const navItems = () => [
    { label: 'My notes', href: '/notes', icon: 'notes' as IconName },
    { label: 'Posts', href: '/posts', icon: 'posts' as IconName },
    { label: 'People & interests', href: '/insights', icon: 'insights' as IconName },
  ];

  const adminNavItems = () => [
    { label: 'Users', href: '/admin/users', icon: 'users' as IconName },
    { label: 'All notes', href: '/admin/notes', icon: 'shield' as IconName },
  ];

  return (
    <div class="min-h-screen flex flex-col md:flex-row bg-[#f3f5fa] text-[#1a2233]">
      {/* Desktop Sidebar (260px fixed) */}
      <aside class="hidden md:flex flex-col w-[260px] shrink-0 border-r border-[rgba(20,30,50,0.06)] bg-[rgba(255,255,255,0.85)] p-5 min-h-screen fixed top-0 left-0 bottom-0 z-30">
        {/* Brand */}
        <div class="flex items-center gap-3 px-3 py-2 mb-6">
          <div class="w-8 h-8 rounded-lg bg-[#3363FF] text-white flex items-center justify-center font-bold text-sm shadow-sm">
            CG
          </div>
          <span class="font-semibold text-lg tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
            Care Guide
          </span>
        </div>

        {/* Navigation list */}
        <nav class="flex-1 flex flex-col gap-1" aria-label="Main navigation">
          <For each={navItems()}>
            {(item) => {
              const active = () => location.pathname === item.href;
              return (
                <a
                  href={item.href}
                  aria-current={active() ? 'page' : undefined}
                  class={`flex items-center gap-3 px-3 py-2 rounded-[10px] text-sm font-medium transition-colors ${
                    active()
                      ? 'bg-[rgba(51,99,255,0.1)] text-[#2849c8] font-semibold'
                      : 'text-[#3c4759] hover:bg-[rgba(20,30,50,0.04)]'
                  }`}
                >
                  <Icon name={item.icon} class={active() ? 'text-[#3363FF]' : 'text-[#566275]'} />
                  <span>{item.label}</span>
                </a>
              );
            }}
          </For>

          <Show when={isAdmin()}>
            <div class="text-[11px] font-semibold tracking-wider uppercase text-[#566275] px-3 pt-5 pb-2">
              Admin
            </div>
            <For each={adminNavItems()}>
              {(item) => {
                const active = () => location.pathname === item.href;
                return (
                  <a
                    href={item.href}
                    aria-current={active() ? 'page' : undefined}
                    class={`flex items-center gap-3 px-3 py-2 rounded-[10px] text-sm font-medium transition-colors ${
                      active()
                        ? 'bg-[rgba(51,99,255,0.1)] text-[#2849c8] font-semibold'
                        : 'text-[#3c4759] hover:bg-[rgba(20,30,50,0.04)]'
                    }`}
                  >
                    <Icon name={item.icon} class={active() ? 'text-[#3363FF]' : 'text-[#566275]'} />
                    <span>{item.label}</span>
                  </a>
                );
              }}
            </For>
          </Show>

          <div class="mt-4 pt-4 border-t border-[rgba(20,30,50,0.06)]">
            <a
              href="/account"
              aria-current={location.pathname === '/account' ? 'page' : undefined}
              class={`flex items-center gap-3 px-3 py-2 rounded-[10px] text-sm font-medium transition-colors ${
                location.pathname === '/account'
                  ? 'bg-[rgba(51,99,255,0.1)] text-[#2849c8] font-semibold'
                  : 'text-[#3c4759] hover:bg-[rgba(20,30,50,0.04)]'
              }`}
            >
              <Icon
                name="account"
                class={location.pathname === '/account' ? 'text-[#3363FF]' : 'text-[#566275]'}
              />
              <span>Account</span>
            </a>
          </div>
        </nav>

        {/* User Card at bottom of sidebar */}
        <div class="pt-4 border-t border-[rgba(20,30,50,0.06)] flex items-center justify-between">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-8 h-8 rounded-full bg-[rgba(51,99,255,0.1)] text-[#2849c8] font-semibold text-xs flex items-center justify-center shrink-0">
              {getInitials(currentUser()?.name)}
            </div>
            <div class="min-w-0 leading-tight">
              <div class="text-xs font-semibold text-[#1a2233] truncate">{currentUser()?.name}</div>
              <div class="text-[11px] text-[#566275] truncate">{currentUser()?.email}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => signOut()}
            class="text-[#566275] hover:text-[#a3241d] p-1.5 rounded-lg hover:bg-[rgba(20,30,50,0.04)] transition-colors shrink-0"
            title="Sign out"
            aria-label="Sign out"
          >
            <Icon name="logout" size={16} />
          </button>
        </div>
      </aside>

      {/* Main Layout Area */}
      <div class="flex-1 flex flex-col md:pl-[260px] min-h-screen min-w-0">
        {/* Top bar */}
        <header class="h-16 px-4 md:px-8 border-b border-[rgba(20,30,50,0.06)] bg-[rgba(255,255,255,0.8)] backdrop-blur-md sticky top-0 z-20 flex items-center justify-between md:justify-end">
          {/* Mobile brand header */}
          <div class="flex items-center gap-2.5 md:hidden">
            <div class="w-7 h-7 rounded-lg bg-[#3363FF] text-white flex items-center justify-center font-bold text-xs">
              CG
            </div>
            <span class="font-semibold text-base font-['Plus_Jakarta_Sans',sans-serif]">
              Care Guide
            </span>
          </div>

          {/* User profile dropdown trigger */}
          <div class="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen())}
              class="flex items-center gap-2 p-1.5 rounded-full hover:bg-[rgba(20,30,50,0.04)] transition-colors"
              aria-expanded={isMenuOpen() ? 'true' : 'false'}
              aria-haspopup="true"
              aria-label="Account menu"
            >
              <div class="w-9 h-9 rounded-full bg-[rgba(51,99,255,0.1)] text-[#2849c8] font-semibold text-xs flex items-center justify-center">
                {getInitials(currentUser()?.name)}
              </div>
            </button>

            {/* Dropdown Menu */}
            <Show when={isMenuOpen()}>
              <div
                class="absolute right-0 mt-2 w-56 bg-white rounded-xl p-2 shadow-xl border border-[rgba(20,30,50,0.08)] z-50 animate-in fade-in duration-100"
                onClick={() => setIsMenuOpen(false)}
              >
                <div class="px-3 py-2 border-b border-[rgba(20,30,50,0.06)]">
                  <div class="font-semibold text-sm text-[#1a2233] truncate">
                    {currentUser()?.name}
                  </div>
                  <div class="text-xs text-[#566275] truncate mb-1">{currentUser()?.email}</div>
                  <span class={isAdmin() ? 'badge badge-accent' : 'badge badge-neutral'}>
                    {isAdmin() ? 'Admin' : 'Member'}
                  </span>
                </div>
                <div class="pt-1">
                  <a
                    href="/account"
                    class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#3c4759] hover:bg-[rgba(20,30,50,0.04)]"
                  >
                    <Icon name="account" size={16} />
                    <span>Account</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => signOut()}
                    class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#a3241d] hover:bg-[#f8e6e5] text-left"
                  >
                    <Icon name="logout" size={16} />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            </Show>
          </div>
        </header>

        {/* Content View Container */}
        <main class="flex-1 max-w-[1180px] w-full mx-auto px-4 sm:px-6 md:px-8 py-6 pb-24 md:pb-8 min-w-0">
          {props.children}
        </main>

        {/* Mobile Bottom Bar (<=900px) */}
        <nav
          class="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-[rgba(20,30,50,0.08)] z-40 flex items-center justify-around px-2"
          aria-label="Mobile navigation"
        >
          <a
            href="/notes"
            class={`flex flex-col items-center gap-1 text-[11px] font-medium p-1 ${
              location.pathname === '/notes' ? 'text-[#3363FF]' : 'text-[#566275]'
            }`}
          >
            <Icon name="notes" size={20} />
            <span>Notes</span>
          </a>
          <a
            href="/posts"
            class={`flex flex-col items-center gap-1 text-[11px] font-medium p-1 ${
              location.pathname === '/posts' ? 'text-[#3363FF]' : 'text-[#566275]'
            }`}
          >
            <Icon name="posts" size={20} />
            <span>Posts</span>
          </a>
          <a
            href="/insights"
            class={`flex flex-col items-center gap-1 text-[11px] font-medium p-1 ${
              location.pathname === '/insights' ? 'text-[#3363FF]' : 'text-[#566275]'
            }`}
          >
            <Icon name="insights" size={20} />
            <span>People</span>
          </a>
          <button
            type="button"
            onClick={() => setIsMoreSheetOpen(true)}
            class="flex flex-col items-center gap-1 text-[11px] font-medium text-[#566275] p-1"
          >
            <Icon name="menu" size={20} />
            <span>More</span>
          </button>
        </nav>

        {/* Mobile More Sheet */}
        <Show when={isMoreSheetOpen()}>
          <div
            class="md:hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsMoreSheetOpen(false);
            }}
          >
            <div class="w-full bg-white rounded-t-2xl p-5 shadow-2xl animate-in slide-in-from-bottom duration-200">
              <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <span class="font-semibold text-base text-slate-900">Menu</span>
                <button
                  type="button"
                  onClick={() => setIsMoreSheetOpen(false)}
                  class="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <Icon name="x" size={20} />
                </button>
              </div>

              <div class="flex flex-col gap-1 pb-4">
                <Show when={isAdmin()}>
                  <div class="text-[11px] font-semibold tracking-wider uppercase text-slate-400 px-3 pt-2 pb-1">
                    Admin
                  </div>
                  <a
                    href="/admin/users"
                    onClick={() => setIsMoreSheetOpen(false)}
                    class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Icon name="users" />
                    <span>Users</span>
                  </a>
                  <a
                    href="/admin/notes"
                    onClick={() => setIsMoreSheetOpen(false)}
                    class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Icon name="shield" />
                    <span>All notes</span>
                  </a>
                </Show>

                <div class="pt-2 border-t border-slate-100">
                  <a
                    href="/account"
                    onClick={() => setIsMoreSheetOpen(false)}
                    class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Icon name="account" />
                    <span>Account</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreSheetOpen(false);
                      signOut();
                    }}
                    class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 text-left"
                  >
                    <Icon name="logout" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
}
