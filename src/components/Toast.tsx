import { createSignal, Show } from 'solid-js';
import { Portal } from '@solidjs/web';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

const [toast, setToast] = createSignal<ToastMessage | null>(null);
let timeoutId: ReturnType<typeof setTimeout> | null = null;

export function showToast(text: string, type: 'success' | 'error' | 'info' = 'success') {
  if (timeoutId) clearTimeout(timeoutId);
  setToast({ id: Math.random().toString(), text, type });
  timeoutId = setTimeout(() => {
    setToast(null);
  }, 3000);
}

export function Toast() {
  return (
    <Show when={toast()}>
      {(t) => (
        <Portal>
          <div
            role="status"
            class={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg border text-sm font-medium transition-all animate-in fade-in slide-in-from-bottom-2 duration-200 ${
              t().type === 'error'
                ? 'bg-rose-600 text-white border-rose-700'
                : 'bg-slate-900 text-white border-slate-800'
            }`}
          >
            <span>{t().text}</span>
          </div>
        </Portal>
      )}
    </Show>
  );
}
