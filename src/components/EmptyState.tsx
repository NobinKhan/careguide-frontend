import { Show } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { Icon, type IconName } from './Icon';

export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  action?: JSX.Element;
}

export function EmptyState(props: EmptyStateProps) {
  const icon = () => props.icon || 'notes';

  return (
    <div class="card p-12 text-center flex flex-col items-center justify-center">
      <div class="w-14 h-14 rounded-xl bg-blue-50 text-[#3363FF] flex items-center justify-center mb-4">
        <Icon name={icon()} size={28} />
      </div>
      <h3 class="text-[17px] font-semibold text-slate-900 mb-1">{props.title}</h3>
      <Show when={props.description}>
        <p class="text-sm text-slate-500 max-w-sm mb-4">{props.description}</p>
      </Show>
      <Show when={props.action}>{props.action}</Show>
    </div>
  );
}
