import { Show } from 'solid-js';
import type { JSX } from '@solidjs/web';

export interface PageHeaderProps {
  crumb?: string;
  title: string;
  description?: string;
  actions?: JSX.Element;
  action?: JSX.Element;
}

export function PageHeader(props: PageHeaderProps) {
  const actionsSlot = () => props.actions || props.action;

  return (
    <div class="mb-6">
      <Show when={props.crumb}>
        <div class="text-xs font-medium text-slate-400 mb-1 tracking-wide uppercase">
          {props.crumb}
        </div>
      </Show>
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 class="page-title text-slate-900">{props.title}</h1>
          <Show when={props.description}>
            <p class="text-sm text-slate-500 mt-1 max-w-2xl">{props.description}</p>
          </Show>
        </div>
        <Show when={actionsSlot()}>
          <div class="flex items-center gap-3 shrink-0 self-start sm:self-auto">
            {actionsSlot()}
          </div>
        </Show>
      </div>
    </div>
  );
}
