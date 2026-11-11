import { Show } from 'solid-js';
import type { JSX } from '@solidjs/web';

export interface AuthShellProps {
  title: string;
  subtitle: string;
  error?: string | null;
  footer: JSX.Element;
  belowCard?: JSX.Element;
  children: JSX.Element;
}

export function AuthShell(props: AuthShellProps) {
  return (
    <div class="min-h-screen flex flex-col items-center justify-center p-4 bg-[#f3f5fa]">
      <div class="w-full max-w-[400px]">
        {/* Brand Header */}
        <div class="flex items-center justify-center gap-3 mb-6">
          <div class="w-9 h-9 rounded-xl bg-[#3363FF] text-white flex items-center justify-center font-bold text-base shadow-sm">
            CG
          </div>
          <span class="font-bold text-2xl tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
            Care Guide
          </span>
        </div>

        {/* Card */}
        <div class="card p-8">
          <h2 class="text-xl font-bold text-slate-900 mb-1">{props.title}</h2>
          <p class="text-sm text-slate-500 mb-6">{props.subtitle}</p>

          <Show when={props.error}>
            <div
              role="alert"
              class="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2"
            >
              <span>{props.error}</span>
            </div>
          </Show>

          {props.children}

          <div class="text-center text-sm text-slate-500 mt-6 pt-5 border-t border-slate-100">
            {props.footer}
          </div>
        </div>

        {props.belowCard}
      </div>
    </div>
  );
}
